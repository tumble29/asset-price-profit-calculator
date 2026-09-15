# For AI agents working in this repository

A vendor-neutral entry point. If your tool auto-discovers this file, you are in the right
place. If someone pointed you here manually, likewise.

This repository is a free, open-source web app for tracking physical gold and silver holdings
and showing honest profit and loss. Vietnam-first, international-capable. **The product is
called iKhobau** (#2); `asset-price-profit-calculator` is still the repository name, not the
product name.

---

## Read these, in this order

| Document | Answers |
|---|---|
| **Issue #1** — `tumble29/asset-price-profit-calculator#1` | What is the state of the project, what has been decided, and what is still open |
| `README.md` | What the product is, for a human arriving cold |
| `.github/ISSUE_AUTHORING.md` | How work is picked up, and how an issue is written |
| `CLAUDE.md` | Code conventions **and the working process** — how to write code here, and how a change reaches `main` |

**Issue #1 is the source of truth for decisions.** Where anything else disagrees with it, #1
wins and the other document is stale.

---

## How work is dispatched

By **GitHub issue label**, not by reading a roadmap document. Labels are authoritative because
a label change is atomic, while editing a shared tracking document replaces the whole thing and
can silently lose concurrent work.

| Label | What you do |
|---|---|
| `status-ready` | Take it |
| `status-needs-decision` | Post recommendations as a comment, then stop. **Do not build.** A recommendation is not a decision |
| `status-blocked` | Skip |
| `status-in-progress` | Skip — someone has claimed it |
| `status-done` | Skip |

Service un-serviced `status-needs-decision` issues first — reading one and posting
recommendations is cheap and unblocks whatever waits behind it, while building a ready feature
is expensive and unblocks nothing. Then take the lowest-numbered `status-ready` issue.

**Service every decision; build exactly one issue, then stop.** Report what you did and what is
now ready, and do not pick up a second `status-ready` issue unless the owner asks. If two issues
turn out to be genuinely inseparable — the same migration, the same component, work that cannot
become two reviewable pull requests — ask rather than deciding for yourself.

One issue per pull request keeps review tractable, these issues carry decisions the owner still
owes an answer on, and a second feature built at the tail of a long session is built on degraded
context. Being asked to do another costs one sentence; untangling two half-understood features
costs an afternoon.

If your tool can rename its own session, do — the Claude Code skill in `.claude/skills/next-task`
documents the convention (`(status) #N - description`, where the status tells the owner whether
the session is waiting on them). Skip it if your tool has no such concept.

**The full algorithm** — dependency verification, claiming, what to do when nothing is ready —
is in `.github/ISSUE_AUTHORING.md` under *Picking up work*. Read it before starting.

Claude Code users: two skills in `.claude/skills/` wrap this — `next-task` when no issue has been
named, `start-issue` when one has. Both defer to `.github/ISSUE_AUTHORING.md` for everything
after issue selection, so the procedure exists in one place.

---

## If you read nothing else, read this

Two rules where a mistake is not recoverable. Everything else in #1 can be fixed in a later
pull request; these two cannot.

**1. Row level security is off by default on tables created by SQL migration.**

The Supabase dashboard's table editor enables it. A migration does not. PostgREST auto-exposes
every table in `public`, and the anon key ships in the JS bundle by design — so a policy is the
only thing standing between one user and another user's financial records.

Every migration creating a table in `public` must, **in the same file**, run
`alter table x enable row level security;` and declare at least one policy. User-owned tables
key on `auth.uid() = user_id`; INSERT needs `WITH CHECK`. Reference tables get a SELECT policy
and no write policy at all.

Then run the Supabase advisor. Any `rls_disabled_in_public` finding is a failed issue.

**2. The price series cannot be rebuilt.**

No vendor sells you yesterday's dealer quote. So: no migration may `DROP` or `TRUNCATE`
`quotes`; never run `supabase db reset` against the linked remote; and the fetcher writes one
row per poll attempt with **no deduplication** — if identical consecutive prices are collapsed,
a missed poll and a flat market become indistinguishable and the gap is permanent.

---

## Branching and working conventions

Both live in `CLAUDE.md` under *Process*, in full: the trunk rule, a branch per issue, one pull
request per issue with `Closes #N` in the body, who merges it and when, the branch deleted
afterwards, and how to raise what you notice without silently fixing it or silently skipping it.

**Read `CLAUDE.md` before you start.** It is short, and it is the file those rules live in —
they are deliberately not repeated here. Two hand-maintained copies drift silently, and each
tool reads only one of the two files, so nothing catches it (#18).

Full detail — dependency verification, claiming, what to call your session — is in
`.github/ISSUE_AUTHORING.md` under *Working an issue* and *Naming your session*. The rest —
the styling rules, the type and error-handling rules, the design brief convention — is in #1
under *Engineering non-negotiables* and *Workflows*.

**Adding a second agent instruction file?** Do not hand-copy this one — see #18 (D2) for the
mechanism that keeps a file set in sync. Hand-copying is how this repository got here.
