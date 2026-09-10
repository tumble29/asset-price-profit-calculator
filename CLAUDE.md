# CLAUDE.md

How to write code in this repository. Read it before you write any.

Rules, with a line of reasoning each. Where a rule needs more than a line, it links to the issue
that argued it.

---

## Where to look for what

| Document | Answers |
|---|---|
| `README.md` | What is this product? |
| Issue #1 | What is the state of the project, and what has been decided? |
| `.github/ISSUE_AUTHORING.md` | How is work picked up, and how is an issue written? |
| `AGENTS.md` | The same entry point, for tools that do not read this file |
| **This file** | **How do I write code here?** |

**Issue #1 is the source of truth for decisions.** If this file disagrees with it, #1 wins and
this file is stale — fix it in the pull request that noticed.

This file does not restate #1's decision log. Decisions change; conventions should not.

---

## Where things live

Provisional until 0.1 (#3) lands the scaffold. Its *Proposed defaults* section describes the
layout it will create; treat that as the current answer, and this section as stale the moment
#3 merges.

- `apps/web` — the Next.js application.
- `supabase/` — migrations and local stack configuration.
- No `packages/` directory until something genuinely has two consumers.

Component styles are co-located with their component:
`apps/web/src/components/HoldingRow/HoldingRow.module.scss` sits next to `HoldingRow.tsx`.

---

## How to run things

These arrive with 0.1 (#3). Until it merges there is nothing to run — the repository is
documents only.

| Command | What it does |
|---|---|
| `pnpm install && pnpm dev` | Serves the app on `http://localhost:3000` |
| `pnpm supabase start` / `pnpm supabase stop` | Brings the local Supabase stack up and down |
| `pnpm typecheck` | Types. Must exit 0 |
| `pnpm lint` | Biome. Must exit 0 |
| `pnpm test` | Vitest unit tests. Must exit 0 |
| `pnpm test:e2e` | Playwright, against the dev server. Must exit 0 |
| `pnpm build` | Production build. Must exit 0 |

Run them. Do not assume they pass.

---

## Security

This is the one class of mistake here that a later pull request cannot quietly fix: it exposes
one user's financial records to another.

- **Every migration creating a table in `public` must, in the same file, run
  `alter table x enable row level security;` and declare at least one policy.** Row level
  security is off by default on tables created by SQL migration — the dashboard's table editor
  turns it on, a migration does not. PostgREST auto-exposes everything in `public`, and the anon
  key ships in the JS bundle by design, so a policy is the only thing standing in the way.
- **User-owned tables key their policies on `auth.uid() = user_id`.** INSERT needs `WITH CHECK`.
- **Quote and instrument tables get a SELECT policy and no write policy at all.** Only
  `service_role` writes them.
- **Definition of done for any migration: run the Supabase advisor.** Any
  `rls_disabled_in_public` finding is a failed issue, not a follow-up.

---

## The price series cannot be rebuilt

No vendor sells you yesterday's dealer quote.

- **No migration may `DROP` or `TRUNCATE` `quotes`.**
- **Never run `supabase db reset` against the linked remote.**
- **The fetcher writes one row per poll attempt. Never dedupe.** Collapse identical consecutive
  prices and a missed poll becomes indistinguishable from a flat market, permanently.

---

## Styling

- **No colour literal anywhere.** No hex, no `rgb()`, no `hsl()`, no colour utility such as
  `text-red-500`. Every colour resolves to a token defined once in the theme layer.
- **Tokens are named semantically, never descriptively.** `--color-price-up`, not
  `--color-green`. A descriptive name is wrong the moment the palette moves.
- **No raw utility strings in markup.** A `.tsx` file must never carry
  `className="flex items-center gap-4 text-sm"`. Classes come from a stylesheet.
- **Global styles live in one global stylesheet; component styles in a co-located
  `*.module.scss`**, named for what the element is rather than how it looks.
- **Tailwind is consumed through `@apply` inside those stylesheets, never inline.** The stack
  this rule assumes is settled in #3, and 0.5 (#7) builds the token layer it names.
- **Dark mode is a token swap**, not `dark:` variants scattered through markup.
- **Never encode meaning by colour alone.** A gain or a loss carries a sign, an arrow or a label
  as well as its colour.

---

## Code

- **No user-facing string hardcoded in a component.** Everything goes through the i18n layer —
  placeholder pages included, because a placeholder gets copied.
- **Numbers, currencies and dates are formatted per locale.** `82.450.000 ₫` and `$82,450.00`
  are the same value, and only one of them is right on the page you are writing.
- **No type assertion and no `!` to silence a type error.** Genuinely unknown input is typed
  `unknown`, then narrowed. A cast is a claim you are accountable for.
- **No swallowed errors.** No empty `catch`, no `catch { return null }` that erases the cause.
  If you cannot handle it meaningfully, let it propagate with its context.
- **Never weaken a test to make it pass.** No loosened assertion, no added retry, no quiet
  deletion. Fix the code, or say the test's premise is wrong.
- **Match the surrounding code's idiom** even where you would choose differently on a blank
  page. Two idioms in one file cost more than the one you dislike.

---

## Process

- **`main` is the trunk, and nothing is committed directly to it** — not a one-line fix, not a
  doc typo. Review is where a wrong assumption gets caught.
- **A branch per issue, named `issue-<number>-<short-slug>`, arriving through one pull request.**
  If your tooling designated a branch for you, use that one and name the issue in the pull
  request instead.
- **Commit messages reference their issue** as `tumble29/asset-price-profit-calculator#N`.
- **Do not rewrite history on a branch you have already pushed.** Add a commit instead.
- **On merge, the code, the issue's status label and #1's board row all move together.** Not
  before: an issue marked done while its pull request is still open lets the next agent build
  against code that is not on `main` yet.
- **Explore widely, report freely, change narrowly.** The limit is on what you change unasked —
  never on what you may read, notice or propose.
- **Raise what you spot in the session, and propose the fix — do not just point at it.** Small,
  and in code this issue already touches: say what you would do, and ask whether to fold it into
  this change. Anything with its own acceptance criteria: propose it as a new issue. The owner
  decides. Never silently fix it and never silently skip it — a silent fix buries the real change
  in review noise, a silent skip means only you ever knew.
- **Before finishing, write down anything raised and still unanswered.** The session is where the
  owner reads it; a comment on the issue is what survives the session ending.
- **If something is ambiguous, or reality does not match the issue** — a tool behaves
  differently, a version has moved on, a documented step does not work — say so and stop.
  Guessing is the expensive option here.
- **Open decisions in #1 are not yours to settle.** Post a recommendation with your reasoning
  and wait. When one does get answered, write it into the issue and #1's decision log before any
  code is written; an answer that lives only in a transcript evaporates.

---

## Proposing a new convention

Do not add a rule here because it seemed sensible while you were writing code. Comment on the
issue you are working, say what happened and what you would write, and wait for the repository
owner.

This file only stays worth reading while it stays short and everything in it was paid for.
