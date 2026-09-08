# Writing issues for this project

Notes for whoever writes the next issue — human or agent. These are reminders, not rules.
They exist because each one cost us something the first time.

The goal is simple: **an agent should be able to open one issue, read it start to finish, and
know whether it can begin, what to build, and how to tell when it is finished** — without
reading the codebase first and without chasing links to other issues.

Work is dispatched from issue #1. An agent told to "find the next task" reads #1's status board,
takes the topmost `READY` row, and follows that issue. So the board and the issue must agree, and
both must be readable without guesswork.

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

## The shape of an issue

Not a rigid template. Skip what does not apply, add what does.

```
# 1.4 — Transactions ledger

Status:      BLOCKED | READY | IN PROGRESS | DONE
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

Put it on the first line. In a manual workflow this is the field the owner and the agent both
check before anything starts, and it needs to be readable at a glance rather than inferred from
prose buried three headings down.

Use exactly one of these, and use the same word on #1's status board:

| Status | Meaning |
|---|---|
| `READY` | Dependencies met, decisions settled, an agent can start now |
| `NEEDS DECISION` | Open questions need the repository owner. An agent may post recommendations but must not build |
| `BLOCKED` | Waiting on another issue, or the issue is not written yet |
| `IN PROGRESS` | Claimed, with a pull request link |
| `DONE` | Finished and merged |

`NEEDS DECISION` is deliberately separate from `BLOCKED` because the agent's action differs. One
means post recommendations and stop; the other means skip. Collapsing them makes an agent guess.

If `BLOCKED` or `NEEDS DECISION`, say what unblocks it on the same line.

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

**Keep the board and the issue in sync.** An agent picks work by reading #1's board, then
verifies against the issue it links to. If the two disagree about status or dependencies, the
agent is told to stop and report — which is correct, and also means a stale board halts work.
Update both, in the same pull request.

**Real data beats placeholder data in any example.** `82.450.000 ₫` and `2,5 chỉ` are what this
app actually handles. A spec written against `$1,234` produces work that breaks on contact with
a real Vietnamese gold price.
