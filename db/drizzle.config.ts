import { defineConfig } from 'drizzle-kit'

/**
 * Introspection only.
 *
 * `supabase/migrations` is the single source of truth for schema (#3, D2), so
 * `drizzle-kit pull` writes into `db/schema/` and `generate`/`push` are
 * forbidden — `pnpm lint` fails if either appears in a package script.
 *
 * See db/README.md before pointing an application query path at this URL: the
 * `postgres` role bypasses row level security two different ways.
 */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (url === undefined || url === '') {
    throw new Error(
      'Missing required environment variable: DATABASE_URL. ' +
        'Copy .env.example to .env.local; `pnpm supabase start` prints the value.',
    )
  }
  return url
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema/*.ts',
  out: './db/schema',
  dbCredentials: { url: databaseUrl() },
  // Only the schemas we own. `auth` and `storage` belong to Supabase.
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
})
