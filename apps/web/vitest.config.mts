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
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
})
