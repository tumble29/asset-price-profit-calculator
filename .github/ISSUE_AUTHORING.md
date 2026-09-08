# Writing issues for this project

Notes for whoever writes the next issue — human or agent. These are reminders, not rules.
They exist because each one cost us something the first time.

The goal is simple: **an agent should be able to open one issue, read it start to finish, and
know whether it can begin, what to build, and how to tell when it is finished** — without
reading the codebase first and without chasing links to other issues.

Work is dispatched by **label**. An agent told to "find the next task" queries labels, not
prose — see [Status labels](#status-labels) below. Issue #1's status board is a human-readable
mirror of those labels, not the source of truth.

---

## Adding to this file

If you hit a problem while writing or working an issue that this file does not cover, or you
find a convention that would have saved you time, it belongs here.

**Ask the repository owner before adding it.** Propose the addition — what happened, what you
would write — and wait. This file only stays useful if it stays short and everything in it was
paid for. Do not add speculative advice, and do not restate what is already here in different
words.

---

## Where things live

| What | Where | Why |
|---|---|---|
| Project state, roadmap, decisions | Issue #1 | One place to look after a context reset |
| The reasoning behind a significant decision | Its own issue, closed when decided | Nobody edits a closed issue, so the reasoning survives |
| Code conventions | `CLAUDE.md` | What an agent reads while writing code |
| How to write an issue | This file | You are here |
| What the product is | `README.md` | For people arriving at the repository |

Issue #1 is the source of truth for decisions. Where anything here conflicts with it, #1 wins.

---

## Status labels

**The label is the source of truth for an issue's status.** Not the issue body, and not #1's
status board — both of those are mirrors, kept for humans reading at a glance.

Labels are used this way for one concrete reason: a label change is atomic, while editing an
issue body replaces the whole thing. Two agents updating a shared status board can silently
clobber each other's work with no diff and no review. Two agents changing labels cannot. Label
changes also show up in the issue timeline, so there is an audit trail; body edits hide in an
edit history nobody reads.

Exactly one status label on every issue, at all times.

| Label | Meaning | What an agent does |
|---|---|---|
| `status-ready` | Dependencies met, decisions settled | Take it |
| `status-needs-decision` | Open questions need the repository owner | Post recommendations as a comment, then stop. **Do not build.** A recommendation is not a decision |
| `status-blocked` | Waiting on another issue, or not written yet | Skip |
| `status-in-progress` | Claimed, with a pull request linked | Skip |
| `status-done` | Merged | Skip |

`status-needs-decision` is deliberately separate from `status-blocked` because the action
differs — one means post and stop, the other means skip. Collapsing them makes an agent guess.

`status-done` is kept even though a closed issue implies it, because "every issue carries exactly
one status label" is a trivially checkable invariant, while "carries one unless closed" is not —
and a closed issue still wearing `status-in-progress` is a silent lie.

Hyphens rather than `status: ready` because GitHub search parses `label:status-ready` cleanly.
`label:status:ready` risks being read as `label:status` plus junk, and `label:"status: ready"`
needs quoting that agents get wrong.

### Other label dimensions

- `phase-0` … `phase-5` — see a roadmap slice without opening #1.
- `needs-design` — the issue carries a Design brief. A designer agent's queue is
  `label:needs-design label:status-ready`.
- `type-decision` — records a decision rather than building something, like #2.

### Picking up work

1. Query `label:status-needs-decision`, ascending by issue number. For each that has **no
   recommendations comment yet**: read it, post recommendations, move on. **Never change its
   label** — only the repository owner clears `status-needs-decision`. Servicing one is not
   claiming it; there is nothing to hold, because the agent cannot resolve it.
2. Query `label:status-ready`, ascending by issue number. Take the topmost. Issue numbers track
   phase order, which approximates dependency order, so this is usually right. To override, the
   owner just names an issue directly.
3. Verify its `Depends on` list — every dependency must be `status-done`. If not, comment saying
   the label is wrong and move to the next candidate. Do not halt the whole queue over one bad
   label.
4. **Claim before writing any code:** swap `status-ready` to `status-in-progress` and comment
   with the pull request link.
5. Build only that issue.
6. On merge: swap to `status-done`, close the issue, and refresh #1's board in the same pull
   request.
7. If nothing is ready: report the `status-needs-decision` queue and what has already been
   recommended. Stop.

**When a decision does get made** — in a session, in a comment thread, anywhere — write it into
the issue and #1's decision log **before** any code is written. A decision that lives only in a
session transcript is a decision that evaporates, which is the failure this whole structure
exists to prevent.

---

## The shape of an issue

Not a rigid template. Skip what does not apply, add what does.

```
# 1.4 — Transactions ledger

Status:      restate the label here; the label is authoritative
Phase:       1
Depends on:  1.1 (#7), 1.2 (#8)   <- must match #1's board
Blocks:      1.5, 2.2
Driver:      #1

## Start here
[What to read, whether work can begin, what to do if it cannot]

## Binding constraints
[The rules from #1 that apply to THIS issue, copied out]

## Decisions to settle first
[Open questions, options, a recommendation for each]

## Scope
### In
### Out

## Acceptance criteria
[Checkboxes, each with the command that proves it]

## Design brief
[Only if a user sees something. See #1's Workflows section.]

## Definition of done
```

---

## Notes on each part

### Status

Restate the label's status on the issue's first line, so someone reading the body knows where
they stand without checking the sidebar. **The label is authoritative** — if the two ever
disagree, the label wins and the body is stale.

Say what unblocks it on the same line.

### Start here

An agent may open this issue cold, with no memory of any conversation. The first thing it reads
should tell it whether it may begin.

Three things belong here:

- What to read first, and where.
- Whether work can start now, or what is blocking it.
- **What to do instead of guessing.** Absent this, agents guess. Say it plainly: if something is
  ambiguous or reality does not match this issue, comment on the issue and stop.

### Binding constraints

Copy the rules from #1 that actually apply to this issue. Do not just link to them.

This duplicates content, and duplication drifts. That is a real cost and we are paying it
deliberately: an agent that does not follow a link is far more expensive than a rule written in
two places. Reduce the risk by copying only what applies, and by adding a line saying #1 is the
source of truth if the two ever disagree.

### Decisions to settle first

Where the issue has open questions, put them before the scope, not after.

Give each one options with real tradeoffs, then a recommendation. A recommendation is easier to
react to than an open question — but **a recommendation is not a decision**, and the issue must
say so, or an agent will implement it. That is what `Status: BLOCKED` is for.

Name who decides, and what the agent does meanwhile. An agent cannot "agree something with the
owner"; it can post a comment and stop.

### Scope

The `Out` list is more useful than the `In` list, and it is the one people skip.

For each excluded thing, name the issue that owns it. "Auth is out" invites an agent to wonder
whether it was forgotten. "Auth is out — that is 0.4" closes the question.

### Acceptance criteria

Checkboxes, each concretely verifiable, and where possible carrying the command that verifies
it. `pnpm typecheck` passes is mechanical. "Types are correct" is an opinion.

Where a criterion has no command — no secret committed, copy reads well in both languages — say
how to check it by hand.

### Design brief

Required whenever the issue changes anything a user sees. Issue #1's Workflows section lists the
fields and explains what each is for.

Include it **even when there is no UI**, and say so explicitly. "No design surface, and here is
what not to do" prevents an agent inventing a visual pattern that everything afterwards copies.

### Definition of done

Everything in acceptance criteria, plus the housekeeping that is otherwise forgotten: update
#1's status board in the same pull request as the code, record any decision that got made, and
raise anything noticed outside scope as a comment rather than silently fixing or silently
skipping it.

---

## Things we learned the hard way

**Write for an agent that is not Claude.** Other models will work these issues. Assume less
inference, less link-following, and less tolerance for ambiguity than you would like.

**In normative sections, write short declarative sentences.** Save the subordinate clauses and
the asides for context and rationale. "Do X." beats "It is probably worth considering X, though
there are cases where..." — an agent will act on the first and hedge on the second.

**Give concrete paths, not patterns.** `apps/web/src/components/HoldingRow/HoldingRow.module.scss`
tells an agent where to put the file. "A co-located `*.module.scss`" makes it guess.

**Section anchors into an issue body do not work.** `issues/1#styling` is not a link to
anything — GitHub does not generate anchors for headings inside an issue body. Name the section
in words instead: "see the Styling section of #1".

**Do not write a detailed spec far ahead of the work.** It will be wrong by the time anyone
reads it, and a confidently wrong spec is worse than a stub. Stubs are fine for anything not
being worked soon: a title, a paragraph of intent, and a link to #1.

**Prefer the atomic edit to the shared document.** Status lives in labels rather than in #1's
board because a label change touches one thing, while editing a shared body replaces the whole
document and can silently lose someone else's work. The same reasoning applies to anything else
several agents will update concurrently: find the operation that cannot clobber.

**Interaction happens in the issue thread, not in a session.** An agent's questions go in as
comments, so it does not matter whether a human, a schedule, or a webhook started it — the owner
answers whenever, and the next agent reads the thread and continues. Design around that and
dispatch mechanism stops mattering.

**Real data beats placeholder data in any example.** `82.450.000 ₫` and `2,5 chỉ` are what this
app actually handles. A spec written against `$1,234` produces work that breaks on contact with
a real Vietnamese gold price.
