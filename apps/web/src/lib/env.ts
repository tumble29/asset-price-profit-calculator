/**
 * Environment validation.
 *
 * Imported by the root layout so a missing variable fails at startup, naming
 * every variable that is absent, rather than surfacing as an `undefined` at
 * the first query. `.env.example` is the list; keep the two in step.
 *
 * Only variables the application actually reads are validated here.
 * `DATABASE_URL` is deliberately absent: it belongs to the database tooling in
 * `db/`, not to the app. `SUPABASE_SECRET_KEY` is validated on first use
 * instead of at startup, because it must never be required in a browser build.
 */

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const

type PublicVar = (typeof REQUIRED_PUBLIC)[number]

/**
 * `NEXT_PUBLIC_*` values are inlined at build time, so they must be read as
 * literal member expressions rather than through a computed key.
 */
const publicEnv: Record<PublicVar, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}

function readPublicEnv(): Record<PublicVar, string> {
  const missing = REQUIRED_PUBLIC.filter((name) => {
    const value = publicEnv[name]
    return value === undefined || value === ''
  })

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill them in; `pnpm supabase start` prints the values.',
    )
  }

  const entries = REQUIRED_PUBLIC.map((name) => {
    const value = publicEnv[name]
    if (value === undefined) {
      // Unreachable: `missing` above has already thrown. Kept so the narrowing
      // is a real check rather than a non-null assertion, which #1 forbids.
      throw new Error(`Environment variable ${name} became undefined after validation.`)
    }
    return [name, value] as const
  })

  return Object.fromEntries(entries) as Record<PublicVar, string>
}

export const env = readPublicEnv()

/**
 * Server-only. Validated on first use so that requiring it never blocks a
 * browser build. It bypasses row level security, so it must not be imported
 * from a client component.
 */
export function supabaseSecretKey(): string {
  const value = process.env.SUPABASE_SECRET_KEY
  if (value === undefined || value === '') {
    throw new Error('Missing required environment variable: SUPABASE_SECRET_KEY. See .env.example.')
  }
  return value
}
