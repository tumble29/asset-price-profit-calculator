#!/usr/bin/env node
/**
 * #3 (D2) requires exactly one source of truth for schema migrations, and
 * chose `supabase/migrations` with hand-authored SQL. Drizzle ships its own
 * migration system, so the rule needs a guard rather than a good intention —
 * the drift between two migration systems is silent.
 *
 * Run by `pnpm lint`.
 */

import { existsSync, readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'coverage', '.supabase'])

const failures = []

// 1. No package script may invoke the forbidden drizzle-kit subcommands.
async function packageJsonFiles(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) await packageJsonFiles(join(dir, entry.name), out)
    } else if (entry.name === 'package.json') {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

const FORBIDDEN = /drizzle-kit\s+(generate|push|migrate)\b/

for (const file of await packageJsonFiles(ROOT)) {
  const scripts = JSON.parse(readFileSync(file, 'utf8')).scripts ?? {}
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command === 'string' && FORBIDDEN.test(command)) {
      failures.push(
        `${relative(ROOT, file)}: script "${name}" runs a forbidden drizzle-kit subcommand. ` +
          'Migrations are hand-authored SQL in supabase/migrations (#3, D2); ' +
          'the typed layer is derived with `pnpm db:pull`.',
      )
    }
  }
}

// 2. `supabase/migrations` must be the only migrations directory in the tree.
async function migrationsDirs(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.name === 'migrations') out.push(full)
    await migrationsDirs(full, out)
  }
  return out
}

const expected = join(ROOT, 'supabase/migrations')
for (const dir of await migrationsDirs(ROOT)) {
  if (dir !== expected) {
    failures.push(
      `${relative(ROOT, dir)}: a second migrations directory. ` +
        'Only supabase/migrations may exist (#3, D2). A stray --workdir or a ' +
        'supabase/config.json will create one of these silently.',
    )
  }
}

// 3. config.json must never exist beside config.toml.
if (existsSync(join(ROOT, 'supabase/config.json'))) {
  failures.push(
    'supabase/config.json: must not exist. The TypeScript loader prefers it while the ' +
      'Go-side project-root walk-up probes only config.toml, so the project becomes ' +
      'visible to some CLI commands and invisible to others (#3, D1).',
  )
}

if (failures.length > 0) {
  console.error('Migration single-source checks failed:\n')
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}

console.log('Migration single-source checks passed.')
