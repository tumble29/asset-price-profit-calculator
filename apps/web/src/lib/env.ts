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
 *
 * The completeness check is a type guard rather than a cast. #1 forbids a type
 * assertion to silence a type error, and a cast here would be exactly that: it
 * would let the runtime check be deleted while `tsc` stayed green. With the
 * guard, deleting the check fails to compile, so the type and the check cannot
 * drift apart.
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

function missingFrom(raw: Record<PublicVar, string | undefined>): PublicVar[] {
  return REQUIRED_PUBLIC.filter((name) => {
    const value = raw[name]
    return value === undefined || value === ''
  })
}

function isComplete(raw: Record<PublicVar, string | undefined>): raw is Record<PublicVar, string> {
  return missingFrom(raw).length === 0
}

function readPublicEnv(): Record<PublicVar, string> {
  if (!isComplete(publicEnv)) {
    throw new Error(
      `Missing required environment variable(s): ${missingFrom(publicEnv).join(', ')}. ` +
        'Copy .env.example to .env.local and fill them in; `pnpm supabase start` prints the values.',
    )
  }
  return { ...publicEnv }
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
