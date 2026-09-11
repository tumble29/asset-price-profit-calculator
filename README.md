# iKhobau

> **The product is called iKhobau.** Decided in
> [issue #2](https://github.com/tumble29/asset-price-profit-calculator/issues/2), which records
> the reasoning and the 34 candidates rejected before it.
> `asset-price-profit-calculator` is still the repository name, not the app name; renaming the
> repository is cosmetic and can wait.

Track the gold and silver you actually own, and see what it is worth today — valued at the
price you could actually sell it for, not the one that flatters.

---

## What this is

A free web app for people who hold physical precious metals and want an honest answer to one
question: **am I up or down, and by how much?**

You record what you bought — which instrument, how much, when, and at what price — and the app
keeps a price series running in the background so your position is always valued against a
current, real quote. No spreadsheets, no manual price lookups, no arithmetic.

It is built Vietnam-first. Domestic Vietnamese gold does not trade at the international spot
price, so an app that values an SJC bar off XAU is simply wrong. This one treats each tradeable
thing — SJC bar, vàng nhẫn, international spot — as its own instrument with its own quote, its
own unit, and its own currency. That design is also what lets the app work outside Vietnam
without a rewrite.

## Who it is for

- People holding physical gold or silver who currently track it in a spreadsheet, or not at all.
- Vietnamese users first: `lượng`, `chỉ`, VND, and domestic dealer quotes are first-class, not
  an afterthought.
- International users second: the same app, different instruments.

It is free, and there is no monetization plan. There is also no plan to ever take custody of
anyone's assets or money — the app stores records of what you say you own, and nothing else.

## Status

**Scaffolded, no features yet.** The repository builds, tests and deploys; it does not do
anything a user would want. 0.1 landed the toolchain — see [Getting started](#getting-started).
The first feature issue is 1.1 (the `instruments` table).

Live progress, the current roadmap, and every technical decision (made or deferred) are tracked
in the project's driver issue — see [Project tracking](#project-tracking).

---

## Features

### Core

**Portfolio and P&L**
- Record purchases: instrument, quantity, unit, price paid, and date.
- Enter a historical purchase with the date and price you actually paid, or mark a purchase as
  happening *now* and let the app fill in the current market price.
- Don't remember what you paid? Estimate the cost basis from the app's own price history for
  that date. Estimated figures are flagged as estimated, permanently and visibly.
- Record sales, including partial ones, so realized profit is a real number and not a guess.
- See unrealized P&L, realized P&L, and total portfolio value — reported separately, because
  they mean different things.

**Price data**
- Prices are fetched on a schedule and stored, building a history the app owns.
- Historical prices are backfilled from before launch, so the app is useful on day one rather
  than a year in.
- Quotes are stored two-sided where the source provides it. Precious metals dealers quote a buy
  price and a sell price, and the gap between them is not cosmetic — a position is worth what
  you could sell it for, not what you would pay for it.

**Dashboard**
- One screen answering "what do I have and what is it worth" without scrolling or clicking.
- Additional tabs for history, individual transactions, and per-instrument detail.
- Every valuation carries the timestamp of the price behind it, so a stale price looks stale
  instead of looking wrong.

**Public price pages**
- Current and historical gold and silver prices, readable by anyone, no account needed.
- Built to be the fastest and clearest way to check a price: fresh data, a visible timestamp,
  real charts, and unit conversion between `lượng`, `chỉ`, gram and troy ounce.
- Visitors are shown, without being nagged, that the same prices can track and value what they
  already own.

**Accounts**
- Sign up, sign in, and keep your holdings private to you.
- Export your data. Delete your account and have the data actually go away.

### AI market analysis

A scheduled job runs daily for the tracked metals and does two things:

- **Research** — surveys current news that could move the price, weighted toward sources that
  actually matter for the Vietnamese market, and publishes a **direction** (up / flat / down)
  over a stated horizon. It does not predict a price, and it is not given price history to
  extrapolate from. It reads the news and calls the direction.
- **Review** — revisits the previous prediction and explains what it got right or wrong.
  Whether the call was correct is computed from the stored price series, not asserted by the
  model, so the review is reviewing a fact.

This is a market-commentary feature, not advice. See [Disclaimer](#disclaimer).

### Under consideration

Not decided, listed so they are not forgotten:

- **Price alerts** — notify me when an instrument crosses a target.
- **Break-even display** — the sell-side price at which a position returns to zero.
- **Demo mode** — a seeded sample portfolio, for screenshots and for evaluating the app without
  signing up.

### Explicitly not planned

- **In-app social.** No feeds, no following, no comments, no leaderboards, no community, no
  seeing anybody else's portfolio. Sharing a screenshot or a figure from the app to your own
  social media is expected and welcome — the app simply will not grow a social network inside
  itself.
- **Monetization.** No ads, no subscriptions, no paid tiers.
- **Brokerage or third-party account linking.** Vietnamese gold dealers do not expose APIs or
  OAuth. If that ever changes, it is a much later conversation.
- **Custody or transactions.** The app never holds assets and never executes a trade.

---

## How it works

```
  Price source (API)
         |
         v
  Scheduled fetch  ------>  Price history  <------  Portfolio valuation
         |                        |                          ^
         v                        v                          |
  AI research job  ------>  Predictions  ---->  scored against actual prices
                                                             |
                                              Your transactions (what you own)
```

Four moving parts:

1. **A scheduled fetcher** pulls quotes from the price source and appends them to a history.
2. **A transaction ledger** records what you bought and sold. Holdings are derived from it
   rather than stored, so a partial sale is just another row.
3. **A valuation layer** joins the two: your holdings, priced at the latest quote.
4. **A scheduled AI job** produces and then reviews directional calls, scored against the same
   price history.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Scheduled jobs | Supabase cron |
| Hosting | Vercel |
| Analytics | Vercel |
| Price data | FHSC API *(to be confirmed)* |
| Transactional email | AWS SES *(to be confirmed)* |
| Bot protection | Cloudflare Turnstile |
| Internationalization | English and Vietnamese |
| AI provider | To be decided |
| ORM | Drizzle — with `supabase/migrations` as the single source of truth for schema |
| Styling | Sass + CSS Modules, with Tailwind consumed only through `@apply` |
| Lint and format | Biome |
| Tests | Vitest (unit), Playwright (end-to-end) |

Items marked *(to be confirmed)* and "to be decided" are tracked in the driver issue with the
reasoning behind each.

### Internationalization

The app ships in **English and Vietnamese** from the start. No user-facing string is hardcoded
in a component — all UI text goes through the i18n layer, and all numbers, currencies, and dates
are formatted per the user's locale. This is a hard rule, not a preference, because retrofitting
it is far more expensive than following it.

---

## Repository layout

Single repository, pnpm workspace.

```
.
├── apps/
│   └── web/              # the Next.js application
│       ├── e2e/          # Playwright specs
│       ├── src/
│       │   ├── app/      # App Router, plus the one global stylesheet
│       │   ├── components/
│       │   ├── i18n/
│       │   └── lib/
│       └── tests/        # Vitest specs
├── db/                   # database artifacts the Supabase CLI does not own
│   └── schema/           # Drizzle schema, generated by `pnpm db:pull`
├── scripts/              # repository checks run by `pnpm lint`
└── supabase/             # CLI-owned: config.toml and migrations
    └── migrations/       # the single source of truth for schema
```

Three notes on this:

- **`supabase/` is named that way because the Supabase CLI requires it**, not as a preference.
  `--workdir` cannot relocate it: it is a plain `chdir`, after which the CLI looks for
  `supabase/config.toml` relative to the new directory. Migrations in particular cannot move.
- **`db/` holds what the CLI does not own** — the generated Drizzle schema, and later pgTAP
  tests and SQL helpers. `db/README.md` explains the boundary, and the row-level-security trap
  to understand before pointing Drizzle at user data.
- **There is no `packages/`**, and there will not be until something genuinely has two
  consumers. Premature package boundaries are harder to remove than to add.

---

## Getting started

You need **Node 24** (the version in `.nvmrc`), **pnpm 10**, and **Docker** running for the
local Supabase stack.

```bash
git clone https://github.com/tumble29/asset-price-profit-calculator.git
cd asset-price-profit-calculator
pnpm install

pnpm supabase start            # local Postgres, auth and Studio; needs Docker
cp .env.example .env.local     # then paste in the values `supabase start` printed

pnpm dev                       # http://localhost:3000
```

The app refuses to start if a required environment variable is missing, and the error names it.
`.env.example` lists every one. No real credential ever belongs in the repository.

### The checks

Each must exit 0. Run them; do not assume they pass.

| Command | What it does |
|---|---|
| `pnpm dev` | Serves the app on `http://localhost:3000` |
| `pnpm build` | Production build, on Turbopack |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome, plus the stylesheet and migration checks Biome cannot do |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright, against the dev server. Needs `pnpm exec playwright install chromium` once |
| `pnpm supabase start` / `stop` | Brings the local stack up and down. Needs Docker |
| `pnpm db:pull` | Regenerates `db/schema/` from the database, after a migration lands |

`pnpm lint` enforces two things no off-the-shelf tool here can. Biome does not parse SCSS at
all, so component stylesheets would otherwise go unchecked; and a missing Tailwind `@reference`
does **not** reliably fail the build — a module using only theme-independent utilities compiles
byte-identically without one, then breaks the first pull request that adds a themed utility.
`scripts/check-stylesheets.mjs` explains each rule where it is enforced.

**Never pass `--webpack` to `next build`.** It fails on every `*.module.scss` that uses a common
utility. `apps/web/next.config.ts` records why.

---

## Project tracking

This README describes **what the app is**. It deliberately does not describe how it is built.

Architecture, schema decisions, deferred choices, and per-feature specifications live in the
project's **driver issue** — a single tracking issue that indexes every feature issue and
records every decision along with the reasoning behind it. That is the place to look for
current state; this file will go stale faster than that one does.

> **Driver issue:** [#1 — Project Driver](https://github.com/tumble29/asset-price-profit-calculator/issues/1)

---

## Open questions

- **Repository name.** Still `asset-price-profit-calculator`. Renaming it to match the product
  name is cosmetic and can wait.
- **Price data source.** FHSC API is the current intent, pending a look at its coverage,
  terms, and whether it provides both sides of the dealer quote.
- **Whether prices can be shown publicly.** Depends on the data provider's terms, and gates the
  public price pages idea.

---

## License

MIT. Fork it, learn from it, contribute to it.

## Disclaimer

This application is an informational tool for tracking assets you already own. It is **not**
financial, investment, or tax advice.

The AI market analysis is automatically generated commentary. It is frequently wrong, it is not
a forecast you should act on, and it should not be treated as a recommendation to buy or sell
anything.

Prices are sourced from third parties and may be delayed, incomplete, or incorrect. Always
verify against your dealer before making a decision involving real money.
