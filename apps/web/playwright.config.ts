import { defineConfig, devices } from '@playwright/test'

/**
 * A dedicated port, and never reuse a server we did not start.
 *
 * `reuseExistingServer` on the shared dev port meant Playwright skipped starting
 * the server whenever anything answered there, without checking it was this app.
 * Against a look-alike page the suite reported "2 passed" without ever building
 * or exercising the working tree — a false green, in a repository whose
 * convention is a branch per issue, so a second checkout on the dev port is
 * plausible. Changing only the port does not help: the hole is the unverified
 * reuse, not the number.
 *
 * The cost is a cold Turbopack start per run, well inside the 120s timeout.
 */
const PORT = 3100
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: BASE_URL,
    // 'on-first-retry' never arms with retries: 0 — it captured nothing.
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
