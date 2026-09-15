#!/usr/bin/env node
/**
 * Runs every repository check and reports ALL of them.
 *
 * `biome check . && node scripts/… && node scripts/…` short-circuits, so the
 * tool with the narrowest coverage gated the two with the project-specific
 * coverage: one unrelated lint error and the output contained zero mentions of
 * "colour literal" or "Migration single-source". On CI that means a red build
 * reports a fraction of what is knowable, and each fix-and-rerun reveals one
 * more layer.
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const windows = process.platform === 'win32'

const CHECKS = [
  ['biome', ['check', '.']],
  ['node', [join(ROOT, 'scripts/check-stylesheets.mjs')]],
  ['node', [join(ROOT, 'scripts/check-migrations-single-source.mjs')]],
]

let failed = 0
for (const [command, args] of CHECKS) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: windows })
  if (result.status !== 0) failed++
}

if (failed > 0) {
  console.error(`\n${failed} of ${CHECKS.length} checks failed.`)
  process.exit(1)
}
