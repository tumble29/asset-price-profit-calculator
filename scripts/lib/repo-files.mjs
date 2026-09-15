/**
 * The file list both repository checks walk.
 *
 * Driven by git rather than a hand-maintained skip list. The first version kept
 * its own denylist and missed the generated directories `.gitignore` already
 * anticipates — `playwright-report/report.css` is real: Playwright's HTML
 * reporter writes it whenever assets are not inlined, and `pnpm lint` then
 * failed pointing at generated output nobody can fix. The natural remedy would
 * have been to relax the colour rule. biome.json avoids the whole class with
 * `vcs.useIgnoreFile`; this is the same idea for the two hand-written checks.
 *
 * `cwd: ROOT` is required, not incidental: both scripts are deliberately
 * cwd-independent, and without it a run from apps/web would silently check a
 * subset — a guard failing open, which is worse than no guard.
 *
 * The trade-off is that this needs a git work tree. It fails loudly when there
 * is none rather than falling back to checking nothing.
 */

import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

export function repoFiles(root) {
  let stdout
  try {
    stdout = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    })
  } catch (cause) {
    throw new Error(
      `Could not list files with git in ${root}. These checks read the file list from git so ` +
        'that .gitignore decides what is generated. Run them inside a git work tree.',
      { cause },
    )
  }

  return stdout
    .split('\0')
    .filter((relative) => relative !== '')
    .map((relative) => join(root, relative))
}
