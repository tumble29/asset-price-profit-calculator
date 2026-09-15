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
import { join, relative } from 'node:path'
import { repoFiles } from './lib/repo-files.mjs'

// `import.meta.dirname`, not `new URL(...).pathname`: URL.pathname is percent-
// encoded, so a checkout under "~/My Projects/" yields a root with %20 in it and
// every read fails with ENOENT.
const ROOT = join(import.meta.dirname, '..')

/** The one `@reference` form that resolves project tokens from any directory depth. */
const REQUIRED_REFERENCE = '@reference "#globals.css";'

const failures = []
const fail = (file, line, message) =>
  failures.push(`${relative(ROOT, file)}${line ? `:${line}` : ''}: ${message}`)

const lineAt = (source, index) => source.slice(0, index).split('\n').length

/**
 * Blanks comments to spaces, preserving every newline and the exact length, so
 * offsets and line numbers still refer to the original source.
 *
 * Length-preserving matters: the first version replaced block comments with '',
 * newlines included, and every finding below a comment was reported short by the
 * comment's length — a literal at globals.css:35 was reported as line 11, inside
 * the file's own header prose.
 *
 * String-aware in both directions: a comment opener inside a string must not
 * start a comment, and an apostrophe inside prose ("this project's tokens") must
 * not open a string. Comment-open is therefore tested before string-open.
 */
function blankComments(source) {
  const out = source.split('')
  let i = 0
  let quote = null

  while (i < source.length) {
    const two = source.slice(i, i + 2)

    if (quote === null && two === '/*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      for (let k = i; k < stop; k++) if (out[k] !== '\n') out[k] = ' '
      i = stop
      continue
    }

    // `//` only after start-of-line or whitespace, so url(//cdn.example.com/x.png)
    // survives.
    if (quote === null && two === '//' && (i === 0 || /\s/.test(source[i - 1]))) {
      let stop = source.indexOf('\n', i)
      if (stop === -1) stop = source.length
      for (let k = i; k < stop; k++) out[k] = ' '
      i = stop
      continue
    }

    const ch = source[i]
    if (quote !== null) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === quote || ch === '\n') quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    }
    i++
  }

  return out.join('')
}

/** Blanks quoted strings and url(...) payloads, same length-preserving contract. */
function blankStringsAndUrls(source) {
  const out = source.split('')
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      let k = i + 1
      while (k < source.length && source[k] !== ch && source[k] !== '\n') {
        k += source[k] === '\\' ? 2 : 1
      }
      for (let j = i + 1; j < Math.min(k, source.length); j++) if (out[j] !== '\n') out[j] = ' '
      i = k + 1
      continue
    }
    if (source.slice(i, i + 4).toLowerCase() === 'url(') {
      const end = source.indexOf(')', i)
      const stop = end === -1 ? source.length : end
      for (let j = i + 4; j < stop; j++) if (out[j] !== '\n') out[j] = ' '
      i = stop
      continue
    }
    i++
  }
  return out.join('')
}

const files = repoFiles(ROOT)
const stylesheets = files.filter((f) => f.endsWith('.scss') || f.endsWith('.css'))
const markup = files.filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx'))
const sources = files.filter((f) => /\.(?:ts|tsx|js|jsx|mts|mjs)$/.test(f))

// ---------------------------------------------------------------------------
// 1. Every stylesheet containing @apply must carry the depth-invariant
//    @reference — .css included, because `*.module.css` is Next's out-of-the-box
//    idiom and the build fails on it identically.
//
//    Partials are included deliberately. Sass expands an @include into the
//    consuming file before Tailwind sees it, so a mixin body carrying @apply
//    arrives in a module that may have neither directive of its own. Keeping
//    @reference next to the @apply means it travels with the expansion.
// ---------------------------------------------------------------------------
for (const file of stylesheets) {
  const raw = readFileSync(file, 'utf8')
  const code = blankComments(raw)
  if (!/@apply\b/.test(code)) continue

  // The Tailwind entry point resolves @apply on its own and must NOT carry a
  // reference to itself. Detected by content rather than by hardcoding the path,
  // so it survives the file moving.
  if (/@import\s+["']tailwindcss["']/.test(code)) continue

  const bare = code.match(/@reference\s+["']tailwindcss["']/)
  if (!code.includes(REQUIRED_REFERENCE) && !bare) {
    // Single quotes, a stray double space and a relative path all compile and
    // resolve the token, so "not present" would be a misleading thing to say.
    const message = /@reference\b/.test(code)
      ? `has an @reference, but not in the required form. Write exactly ${REQUIRED_REFERENCE}`
      : `contains @apply but not ${REQUIRED_REFERENCE}`
    fail(file, 0, message)
  }
  if (bare) {
    fail(
      file,
      lineAt(raw, bare.index),
      'uses bare @reference "tailwindcss", which resolves none of this project\'s tokens. ' +
        `Use ${REQUIRED_REFERENCE}`,
    )
  }
}

// ---------------------------------------------------------------------------
// 2. No raw utility strings in markup. Classes come from a stylesheet.
//
//    Scans the className VALUE in every form, not just a quoted literal on one
//    line: `className={'grid p-4'}`, a template literal, clsx(...), a ternary and
//    a multi-line attribute were all invisible to the first version — and the
//    miss landed on the house idiom, since every component here writes
//    `className={styles.x}`.
// ---------------------------------------------------------------------------
const UTILITY = new RegExp(
  '^(?:' +
    '(?:hover|focus|focus-visible|active|disabled|dark|motion-safe|motion-reduce|group-hover|sm|md|lg|xl|2xl):)*' +
    '(?:flex|grid|block|inline|inline-block|hidden|contents|table|absolute|relative|fixed|sticky' +
    '|[pm][xytrbl]?-\\d|gap(?:-[xy])?-\\d|space-[xy]-\\d|[wh]-(?:\\d|full|screen|auto)' +
    '|text-|bg-|border(?:-|$)|rounded(?:-|$)|shadow(?:-|$)|ring(?:-|$)|opacity-\\d' +
    '|items-|justify-|self-|content-|place-|order-\\d|z-\\d|overflow-|truncate|underline|uppercase' +
    '|font-|leading-|tracking-|divide-|outline-|max-w-|min-w-|max-h-|min-h-' +
    ')',
)

/** Collects every string/template literal inside a balanced {...} expression. */
function literalsInExpression(source, openIndex) {
  const found = []
  let depth = 0
  let i = openIndex
  while (i < source.length) {
    const ch = source[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return { literals: found, end: i }
    } else if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      let k = i + 1
      let text = ''
      while (k < source.length && source[k] !== quote) {
        if (source[k] === '\\') {
          k += 2
          continue
        }
        // Skip an interpolated ${...} span — styles.x belongs to the code, not the class list.
        if (quote === '`' && source.slice(k, k + 2) === '${') {
          let d = 0
          while (k < source.length) {
            if (source[k] === '{') d++
            else if (source[k] === '}') {
              d--
              if (d === 0) {
                k++
                break
              }
            }
            k++
          }
          continue
        }
        text += source[k]
        k++
      }
      found.push({ text, index: i })
      i = k
    }
    i++
  }
  return { literals: found, end: source.length }
}

for (const file of markup) {
  const source = readFileSync(file, 'utf8')
  const code = blankComments(source)

  for (const match of code.matchAll(/className\s*=\s*/g)) {
    const at = match.index + match[0].length
    const literals = []

    if (code[at] === '"' || code[at] === "'") {
      const quote = code[at]
      const end = code.indexOf(quote, at + 1)
      literals.push({ text: source.slice(at + 1, end === -1 ? source.length : end), index: at })
    } else if (code[at] === '{') {
      literals.push(...literalsInExpression(source, at).literals)
    }

    for (const literal of literals) {
      const offenders = literal.text.split(/\s+/).filter((t) => t !== '' && UTILITY.test(t))
      if (offenders.length > 0) {
        fail(
          file,
          lineAt(source, literal.index),
          `raw utility string in markup (${offenders.join(' ')}). Move it into a *.module.scss`,
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. No colour literal anywhere.
//
//    Nothing in this repository defines a colour yet — 0.5 (#7) builds the token
//    layer. When it does, it will need one blessed literal syntax in the global
//    stylesheet to define the tokens themselves; that is a deliberate amendment
//    to this check, made in #7, not a reason to weaken it now.
//
//    Named colours are matched only in declaration VALUES. Matching them as bare
//    identifiers false-fails on `.gold-tier`, `tan(45deg)` and `--color-gold`.
// ---------------------------------------------------------------------------
// The lookahead skips id selectors (`#feed {`, `#face {`). Requiring a ':' on
// the same line instead would miss every continuation line of a multi-line
// linear-gradient(...), which is where real colours hide.
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b(?![^;{}]*\{)/
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\s*\(/i
const COLOUR_UTILITY =
  /\b(?:text|bg|border|ring|outline|decoration|divide|accent|caret|shadow|fill|stroke|placeholder|from|via|to)-(?:[a-z]+-\d{2,3}|black|white)\b/
const NAMED = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet ' +
    'brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue ' +
    'darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange ' +
    'darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise ' +
    'darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia ' +
    'gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ' +
    'ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue ' +
    'lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon ' +
    'mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue ' +
    'mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin ' +
    'navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen ' +
    'paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red ' +
    'rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue ' +
    'slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white ' +
    'whitesmoke yellow yellowgreen'
  ).split(' '),
)

for (const file of stylesheets) {
  const raw = readFileSync(file, 'utf8')
  const code = blankStringsAndUrls(blankComments(raw))

  code.split('\n').forEach((line, i) => {
    if (HEX.test(line) || COLOUR_FN.test(line) || COLOUR_UTILITY.test(line)) {
      fail(file, i + 1, 'colour literal. Every colour resolves to a semantic token')
      return
    }
    // Declaration values only, and never an identifier that is a function call:
    // `tan(45deg)` is legal maths, `.gold-tier` is a legal class name.
    if (!line.includes(':')) return
    const value = line.slice(line.indexOf(':') + 1)
    for (const [, word] of value.matchAll(/\b([a-z]+)\b(?!\s*\()/gi)) {
      if (NAMED.has(word.toLowerCase())) {
        fail(file, i + 1, `named colour "${word}". Every colour resolves to a semantic token`)
        return
      }
    }
  })
}

// Source files too: a chart palette or an inline style is exactly where #7's
// token layer gets broken first. Narrower pattern — reusing the stylesheet regex
// flags realistic strings like 'Lô #1234' and href="#add".
const COLOUR_IN_SOURCE =
  /(["'`])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1|\b(?:rgba?|hsla?|oklch|lab)\s*\(/

for (const file of sources) {
  if (file.startsWith(join(ROOT, 'scripts'))) continue // this file names colours to detect them
  const raw = readFileSync(file, 'utf8')
  blankComments(raw)
    .split('\n')
    .forEach((line, i) => {
      if (COLOUR_IN_SOURCE.test(line)) {
        fail(file, i + 1, 'colour literal. Every colour resolves to a semantic token')
      }
    })
}

// ---------------------------------------------------------------------------
// 4. @theme must be top level and static.
//
//    Bare @theme tree-shakes a token out of :root when only module-side var()
//    consumes it — globals.css and each module are separate Tailwind compilation
//    units, so the globals pass cannot see that usage. And @theme nested inside a
//    selector builds exit 0 with no warning, discards the selector, hoists the
//    variable to :root, and silently overwrites the light value.
// ---------------------------------------------------------------------------
for (const file of stylesheets) {
  const raw = readFileSync(file, 'utf8')
  const code = blankComments(raw)
  if (!/@theme\b/.test(code)) continue

  for (const match of code.matchAll(/@theme\b([^{]*)\{/g)) {
    const modifiers = match[1].trim()
    const line = lineAt(raw, match.index)

    if (modifiers !== 'static') {
      fail(
        file,
        line,
        `@theme must be "@theme static"${modifiers ? ` (found "@theme ${modifiers}")` : ''}. ` +
          'Bare @theme tree-shakes tokens out of :root',
      )
    }
    // Depth is measured over the code before this @theme, so a nested one is
    // caught even when it shares a line with its enclosing brace.
    const before = code.slice(0, match.index)
    const depth = (before.match(/\{/g) ?? []).length - (before.match(/\}/g) ?? []).length
    if (depth > 0) {
      fail(file, line, '@theme nested inside a selector. It hoists to :root silently')
    }
  }
}

if (failures.length > 0) {
  console.error('Stylesheet checks failed:\n')
  for (const f of failures.sort()) console.error(`  ${f}`)
  console.error(`\n${failures.length} problem(s). Rules are in issue #1 and CLAUDE.md.`)
  process.exit(1)
}

const scss = stylesheets.filter((f) => f.endsWith('.scss')).length
console.log(
  `Stylesheet checks passed: ${scss} scss, ${stylesheets.length - scss} css, ` +
    `${markup.length} markup, ${sources.length} source file(s).`,
)
