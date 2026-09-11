#!/usr/bin/env node
/**
 * Enforces the styling rules from issue #1 that no other tool in this repository
 * can enforce.
 *
 * Why this exists rather than a lint rule:
 *
 *  - Biome cannot parse SCSS at all. `biome check` on a `*.module.scss` reports
 *    "could not determine the language for the file extension scss" and
 *    "Checked 0 files", so `pnpm lint` would exit 0 while every component
 *    stylesheet went unchecked.
 *
 *  - A missing `@reference` does NOT reliably fail the build. Verified on
 *    next 16.3.4 / tailwindcss 4.3.3: a module using only theme-independent
 *    utilities (`flex`, `items-center`, `underline`, `hover:underline`)
 *    compiles with no `@reference` at all, byte-identical output, exit 0. It
 *    merges green and then breaks the first unrelated pull request that adds a
 *    themed utility to the same file. Bare `@reference "tailwindcss"` compiles
 *    green too, while silently dropping every project token.
 *
 * Run by `pnpm lint`. Decided in issue #3 (D3).
 */

import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'coverage', '.supabase'])

/** The one form that resolves project tokens from any directory depth. */
const REQUIRED_REFERENCE = '@reference "#globals.css";'

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(join(dir, entry.name), out)
    } else {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

/**
 * Comments must not be searched. Every rule below looks for a directive or a
 * literal that this repository's own stylesheets legitimately *discuss* in
 * prose — the first version of this script failed because a comment explaining
 * `@reference "tailwindcss"` was read as a use of it.
 */
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')
}

const failures = []
const fail = (file, message) => failures.push(`${relative(ROOT, file)}: ${message}`)

const files = await walk(ROOT)
const stylesheets = files.filter((f) => f.endsWith('.scss') || f.endsWith('.css'))
const markup = files.filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx'))

// ---------------------------------------------------------------------------
// 1. Every .scss containing @apply must carry the depth-invariant @reference.
//
// Partials are included deliberately. Sass expands an @include into the
// consuming file before Tailwind sees it, so a mixin body carrying @apply
// arrives in a module that may have neither directive of its own. Keeping
// @reference next to the @apply means it travels with the expansion.
// ---------------------------------------------------------------------------
for (const file of stylesheets.filter((f) => f.endsWith('.scss'))) {
  const source = withoutComments(readFileSync(file, 'utf8'))
  if (!/@apply\b/.test(source)) continue

  if (!source.includes(REQUIRED_REFERENCE)) {
    fail(file, `contains @apply but not ${REQUIRED_REFERENCE}`)
  }
  if (/@reference\s+["']tailwindcss["']/.test(source)) {
    fail(
      file,
      'uses bare @reference "tailwindcss", which resolves none of this project\'s tokens. ' +
        `Use ${REQUIRED_REFERENCE}`,
    )
  }
}

// ---------------------------------------------------------------------------
// 2. No raw utility strings in markup. Classes come from a stylesheet.
//    This is the acceptance-criteria grep from issue #3, made mechanical.
// ---------------------------------------------------------------------------
const UTILITY_IN_MARKUP =
  /className=["'][^"'{]*\b(flex|grid|block|inline|hidden|p-\d|px-\d|py-\d|m-\d|mx-\d|my-\d|gap-\d|w-\d|h-\d|text-(?:xs|sm|base|lg|xl|\d)|bg-[a-z]|border(?:-\d)?|rounded|shadow|items-|justify-)/

for (const file of markup) {
  const source = readFileSync(file, 'utf8')
  source.split('\n').forEach((line, i) => {
    if (UTILITY_IN_MARKUP.test(line)) {
      fail(file, `line ${i + 1}: raw utility string in markup. Move it into a *.module.scss`)
    }
  })
}

// ---------------------------------------------------------------------------
// 3. No colour literal in any stylesheet.
//
// Nothing in this repository defines a colour yet — 0.5 (#7) builds the token
// layer. When it does, it will need one blessed literal syntax in the global
// stylesheet to define the tokens themselves; that is a deliberate amendment
// to this check, made in #7, not a reason to weaken it now.
// ---------------------------------------------------------------------------
const COLOUR_LITERAL = /(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab)\s*\()/

for (const file of stylesheets) {
  withoutComments(readFileSync(file, 'utf8'))
    .split('\n')
    .forEach((line, i) => {
      if (COLOUR_LITERAL.test(line)) {
        fail(file, `line ${i + 1}: colour literal. Every colour resolves to a semantic token`)
      }
    })
}

// ---------------------------------------------------------------------------
// 4. @theme must be top level and static.
//
// Bare @theme tree-shakes a token out of :root when only module-side var()
// consumes it — globals.css and each module are separate Tailwind compilation
// units, so the globals pass cannot see that usage. And @theme nested inside a
// selector builds exit 0 with no warning, discards the selector, hoists the
// variable to :root, and silently overwrites the light value.
// ---------------------------------------------------------------------------
for (const file of stylesheets) {
  const source = withoutComments(readFileSync(file, 'utf8'))
  if (!/@theme\b/.test(source)) continue

  if (/@theme(?!\s+static)\s*\{/.test(source)) {
    fail(file, 'uses bare @theme. Use @theme static so tokens are always emitted to :root')
  }
  // A nested @theme is one preceded, on an unclosed brace, by a selector.
  let depth = 0
  source.split('\n').forEach((line, i) => {
    if (/@theme\b/.test(line) && depth > 0) {
      fail(file, `line ${i + 1}: @theme nested inside a selector. It hoists to :root silently`)
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length
  })
}

const scssCount = stylesheets.filter((f) => f.endsWith('.scss')).length
if (failures.length > 0) {
  console.error('Stylesheet checks failed:\n')
  for (const f of failures) console.error(`  ${f}`)
  console.error(`\n${failures.length} problem(s). Rules are in issue #1 and CLAUDE.md.`)
  process.exit(1)
}

console.log(
  `Stylesheet checks passed: ${scssCount} scss, ` +
    `${stylesheets.length - scssCount} css, ${markup.length} markup file(s).`,
)
