import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Named `.mts` so Vitest loads it as ESM without the CJS/ESM configLoader
 * warning, and without changing how Next resolves `next.config.ts`.
 *
 * `environment: 'node'` because nothing here touches the DOM yet. The issue
 * that needs a DOM adds jsdom then; installing it unused now would pin a
 * dependency with no consumer.
 */
export default defineConfig({
  test: {
    environment: 'node',
    // Both directories, both extensions, both suffixes. A narrower glob is
    // silent rather than loud: a `.test.tsx`, or a test colocated under src/,
    // simply never runs and `pnpm test` still reports green. The glob is scoped
    // to these two directories so Playwright's `e2e/*.spec.ts` stays out —
    // Vitest's defaults would pick those up and fail.
    include: ['{src,tests}/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      // fileURLToPath, not URL.pathname: pathname is percent-encoded, so a
      // checkout under "~/My Projects/" resolves to a path with %20 in it and
      // the alias fails with a misleading "Cannot find package" error.
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
})
