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
import { dirname, join, relative } from 'node:path'
import { repoFiles } from './lib/repo-files.mjs'

// import.meta.dirname, not new URL(...).pathname — see scripts/lib/repo-files.mjs.
const ROOT = join(import.meta.dirname, '..')
const FILES = repoFiles(ROOT)

const failures = []

// 1. Nothing may invoke the forbidden drizzle-kit subcommands — not a package
//    script, and not a workflow step, Makefile, shell script or git hook. The
//    first version read package.json `scripts` only, which left every other
//    place it can be called from invisible.
//
//    `--config <path>` between the binary and the subcommand is matched too: it
//    is a working invocation, and the naive `drizzle-kit\s+(generate|push)`
//    missed it.
const FORBIDDEN = /drizzle-kit(?:\s+--?[\w-]+(?:[= ][^\s]+)?)*\s+(generate|push|migrate)\b/

const SEARCHABLE = /\.(?:json|ya?ml|mjs|cjs|js|ts|mts|sh|bash|mk)$|^(?:Makefile|Justfile)$/

for (const file of FILES) {
  const name = file.split('/').pop() ?? ''
  if (!SEARCHABLE.test(file) && !SEARCHABLE.test(name)) continue

  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue // a listed-but-unreadable path (a broken symlink) is not our concern
  }

  text.split('\n').forEach((line, i) => {
    const hit = line.match(FORBIDDEN)
    if (hit) {
      failures.push(
        `${relative(ROOT, file)}:${i + 1}: runs \`drizzle-kit ${hit[1]}\`. ` +
          'Migrations are hand-authored SQL in supabase/migrations (#3, D2); ' +
          'the typed layer is derived with `pnpm db:pull`.',
      )
    }
  })
}

// 2. `supabase/migrations` must be the only migrations directory in the tree.
//    Derived from the git file list, so a symlinked tree cannot slip past a
//    directory walk that skips symlinks, and generated output cannot trip it.
const expected = join(ROOT, 'supabase/migrations')
const found = new Set()
for (const file of FILES) {
  for (let dir = dirname(file); dir.startsWith(ROOT) && dir !== ROOT; dir = dirname(dir)) {
    if (dir.endsWith('/migrations')) found.add(dir)
  }
}

for (const dir of [...found].sort()) {
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
