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
| `CLAUDE.md` | Code conventions — how to write code in this repository |

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

## Branching

`main` is the trunk. **Never commit directly to it** — not even for a one-line fix. Review is
where a wrong assumption gets caught, and a direct commit skips it silently.

Work on a branch per issue, named `issue-<number>-<short-slug>` (`issue-11-quotes-schema`), and
open a pull request against `main`. One pull request per issue.

*Exception:* if your session was launched with a branch already designated for you, use that one
and name the issue in the pull request instead.

The pull request carries the code, issue #1's board row, and any decision that got made — all in
the same change. Put `Closes #N` in the body. **Do not merge it yourself and do not swap the
label to `status-done` when it opens** — that happens on merge, once the owner has said so.
An issue marked done while its pull request is still open lets the next agent build against code
that is not on `main` yet.

Do not rewrite history on a branch you have already pushed; add a commit instead. Delete the
branch after merge.

Full detail in `.github/ISSUE_AUTHORING.md` under *Branching and pull requests*.

---

## Working conventions

- **Explore widely, report freely, change narrowly.** The limit is on what you change unasked —
  never on what you may read, notice or propose.
- **Raise what you spot in the session, and propose the fix — do not just point at it.** Small,
  and in code this issue already touches: say what you would do, and ask whether to fold it in.
  Anything with its own acceptance criteria: propose it as a new issue. The owner decides. Never
  silently fix it and never silently skip it — a silent fix buries the real change in review
  noise, and a silent skip means only you ever knew.
- **Before finishing, write down anything raised and still unanswered.** The session is where the
  owner reads it; a comment on the issue is what survives the session ending.
- **If something is ambiguous, or reality does not match the issue** — a tool behaves
  differently, a version has moved on, a documented step does not work — say so and stop.
  Guessing is the expensive option here.
- **Decisions marked DEFERRED in #1 are not yours to make.** Post a recommendation with your
  reasoning and wait.
- **When a decision does get made**, write it into the issue and #1's decision log *before* any
  code is written. A decision that lives only in a session transcript is a decision that
  evaporates.
- **Commit messages reference their issue** as `tumble29/asset-price-profit-calculator#N`.

The rest — the styling rules, the type and error-handling rules, the design brief convention —
is in #1 under *Engineering non-negotiables* and *Workflows*.
