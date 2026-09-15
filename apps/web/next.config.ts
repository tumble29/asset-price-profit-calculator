import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/**
 * Load the repository-root `.env.local`.
 *
 * Next only reads `.env.local` from the app directory, so the documented setup
 * step — `cp .env.example .env.local` at the root — produced a file nothing
 * read: the dev server started and then returned 500 on every request, and the
 * build failed, both telling the reader to do the step they had just done.
 * One file at the root is the thing being fixed; do not "fix" it by asking for
 * a second copy under apps/web.
 *
 * `fileURLToPath`, not `.pathname`: pathname is percent-encoded, so a checkout
 * path containing a space makes existsSync false and this silently does nothing.
 *
 * `process.loadEnvFile` does not override variables that are already set, so
 * CI's `env:` block and a real deployment's configuration still win.
 */
const rootEnv = fileURLToPath(new URL('../../.env.local', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

/**
 * Turbopack is Next 16's default for both `next dev` and `next build`, and this
 * project depends on that default.
 *
 * `next build --webpack` fails on every `*.module.scss` that reaches for a
 * common utility, with:
 *
 *   Selector "*,:before,:after,::backdrop" is not pure
 *
 * The cause is Tailwind's `@layer properties` `@property` fallback block, which
 * any utility registering a `--tw-*` custom property emits — 18 of 36 everyday
 * utilities do, including `font-medium`, `shadow-sm`, `ring`, `border` and
 * `space-y-4`. Turbopack tolerates that block; nothing documents the tolerance
 * as guaranteed, which is why `next` is pinned to an exact version and CI runs
 * a full `next build`.
 *
 * Do not add a webpack config and do not pass `--webpack`. Decided in #3 (D3).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Playwright drives the dev server over 127.0.0.1, which Next treats as a
  // cross-origin host and blocks for /_next/hmr. Dev-only; no effect on build.
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
