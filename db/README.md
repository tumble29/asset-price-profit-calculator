# `db/`

Database artifacts the Supabase CLI does **not** own.

The split between this directory and `supabase/` is decision **D1 = option C** in
[#3](https://github.com/tumble29/asset-price-profit-calculator/issues/3). #1's decision log is
the source of truth if the two ever disagree.

| Path | Holds | Who owns it |
|---|---|---|
| `supabase/config.toml` | Local stack configuration | Supabase CLI |
| `supabase/migrations/` | **The single source of truth for schema.** Hand-authored SQL | Supabase CLI |
| `db/schema/` | Drizzle schema, **generated** from the database | `pnpm db:pull` |
| `db/` (anything else later) | pgTAP tests, SQL helpers the CLI never reads | us |

## Two things the CLI will not let you do

Both verified against Supabase CLI 2.117.0 by running it, not by reading about it.

**Never pass `--workdir` to relocate anything.** It is a plain `chdir`, after which the CLI looks
for `supabase/config.toml` *relative* to it. In a directory holding only `db/config.toml`,
`supabase --workdir db migration new foo` wrote `db/supabase/migrations/…` and never read the
config at all. Migrations cannot move: `path.join(workdir, "supabase", "migrations")` is literal
at roughly seventeen non-test call sites, and
[supabase/cli#2139](https://github.com/supabase/cli/issues/2139) asking for a configurable root
has been open since 2024-04-10 with no linked pull request.

**Never create `supabase/config.json`.** The TypeScript config loader accepts it and silently
prefers it over `config.toml`, but the Go-side project-root walk-up probes only `config.toml`,
and several command families are `tomlOnly`. A JSON-only project is therefore visible to some
commands and invisible to others — reproduced, `supabase migration new` run from a subdirectory
created a *second* `supabase/migrations` tree. That is exactly the "one source of truth" failure
this layout exists to prevent.

## Migrations are SQL. Drizzle's schema is derived from them

Decision **D2 = Drizzle**, with `supabase/migrations` authoritative:

```
supabase/migrations/*.sql   ->  supabase db push   ->  database
database                    ->  pnpm db:pull       ->  db/schema/
```

- Write migrations as **hand-authored SQL** in `supabase/migrations/`.
- Regenerate the typed layer with `pnpm db:pull` after a migration lands.
- **`drizzle-kit generate` and `drizzle-kit push` are forbidden.** They would make Drizzle a
  second source of truth, and the drift is silent. `pnpm lint` fails if either appears in a
  package script.

## Before you point Drizzle at user data

This is the part that leaks one user's financial records to another if it is got wrong, so it is
written here rather than left to be rediscovered.

**The credential Supabase hands you bypasses row level security two independent ways.**

1. `postgres` holds the `BYPASSRLS` attribute. PostgreSQL's own documentation: *"Superusers and
   roles with the `BYPASSRLS` attribute always bypass the row security system when accessing a
   table."*
2. Separately, `check_enable_rls()` returns `RLS_NONE_ENV` for the **table owner** — and every
   table a CLI migration creates is owned by `postgres`.

Two fixes that look correct and are not:

- `alter role postgres nobypassrls` removes only the first mechanism. Ownership still bypasses.
- `create role app_rw; grant postgres to app_rw;` produces a `NOBYPASSRLS` role that **still**
  bypasses, because `object_ownercheck()` ends in `has_privs_of_role()`, which traverses role
  inheritance. It would pass a naive audit.

PostgREST — and therefore `supabase-js` with a user's JWT — is exposed to neither: it connects as
`authenticator`, which has no `BYPASSRLS` and owns nothing, then switches role per request.

**So any Drizzle connection that must respect RLS needs a role that is neither a member of
`postgres` nor an owner of the tables, holding explicit grants, plus a per-transaction
`set local role` and `set_config('request.jwt.claims', …, true)` wrapper on every path.** The
failure mode is silent and asymmetric: a forgotten wrapper leaks one user's ledger on a read and
corrupts another's on a write, with no type error and no failing test.

`DATABASE_URL` in `.env.example` points at the local stack as `postgres` **for schema
introspection only** (`pnpm db:pull`). Establishing the application role is 0.4 (#6)'s ground,
alongside auth.

## Nothing is here yet

`db/schema/` is empty, and correctly so — the first table is 1.1 (#10). `pnpm db:pull` needs a
running local stack, which needs Docker.
