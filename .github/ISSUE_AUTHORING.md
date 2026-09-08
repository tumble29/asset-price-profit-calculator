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

### Finding an issue to work on

This is the part that differs depending on how you arrived. If the owner named an issue, skip
straight to *Working an issue* below.

1. Query `label:status-needs-decision`, ascending by issue number. For each that has **no
   recommendations comment yet**: read it, post recommendations, move on. **Never change its
   label** — only the repository owner clears `status-needs-decision`. Servicing one is not
   claiming it; there is nothing to hold, because the agent cannot resolve it.
2. Query `label:status-ready`, ascending by issue number. Take the topmost. Issue numbers track
   phase order, which approximates dependency order, so this is usually right.
3. If nothing is ready: report the `status-needs-decision` queue and what has already been
   recommended. Stop.

**Why decisions come first, and why they are plural.** Servicing a decision is cheap and
read-only, and getting the whole queue in front of the owner in one pass is the point — they can
answer a batch in one sitting instead of answer-one, wait, answer-one. Building is expensive and
unblocks nothing anyone is waiting on.

### Working an issue

Once you know which issue you are on — whether you found it or were handed it — this is the
procedure. It is the same either way.

1. **Read the issue start to finish.** It carries its own binding constraints, scope and
   acceptance criteria. Do not skim to the first actionable line.
2. **Verify its `Depends on` list.** Every dependency must be `status-done`. If one is not, say
   so and stop; if you were choosing your own work, move to the next candidate instead. **Do not
   halt the whole queue over one bad label** — one stale row should cost you one candidate, not
   the session.
3. **Claim it before writing any code.** Swap `status-ready` to `status-in-progress` and comment
   on the issue. An unclaimed task can be picked up twice.
4. **Branch.** See *Branching and pull requests* below. Nothing is committed directly to `main`.
5. **Name your session.** See *Naming your session* below.
6. **Build only that issue**, and stop when it is done. Report what you did and what is now
   ready.
7. **Finish in one pull request:** the code, the label swapped to `status-done`, issue #1's
   board row updated, and any decision that got made. Then close the issue.

**One issue per session.** Do not pick up a second. Three exceptions, and only these:

- The owner explicitly asks for another.
- Two issues turn out to be genuinely inseparable — the same migration, the same component, work
  that cannot become two reviewable pull requests. **In that case ask** rather than deciding for
  yourself. Say which issues, why they cannot be separated, and wait.
- The issue turns out to be already done, or a no-op. Say so and stop; do not fill the session
  with substitute work.

One issue per pull request keeps review tractable. These issues carry decisions the owner still
has to make, so rolling into a second compounds any wrong assumption from the first before
anyone has seen it. And a second feature built on the tail of a long session is built on degraded
context — the part of the work most likely to be subtly wrong in a way that still passes its
tests. Being asked to do another costs one sentence; untangling two half-understood features
costs an afternoon.

**When a decision does get made** — in a session, in a comment thread, anywhere — write it into
the issue and #1's decision log **before** any code is written. A decision that lives only in a
session transcript is a decision that evaporates, which is the failure this whole structure
exists to prevent.

### Naming your session

A session called "Next task" is useless in a list of ten. Rename it so the owner can see at a
glance what each session is doing and, more importantly, **which ones are waiting on them.**

**Rename once you have read the issue and understand it** — not before. A name guessed from the
label alone is barely better than the default.

```
({status}) #{number} - {brief description}
```

```
(reading)  #9 - Price data terms review
(building) #13 - Transactions ledger
(asking)   #11 - Quotes schema
(review)   #4 - CLAUDE.md conventions
(done)     #4 - CLAUDE.md conventions
```

Keep the description short enough to survive truncation in a session list. The status and the
number are the parts that must always be visible.

| Status | You are | Owner needs to act? |
|---|---|---|
| `reading` | Orienting on the issue. Nothing changed yet | No |
| `building` | Implementing. Code in flight | No |
| `asking` | **Stalled on an answer from the owner** | **Yes** |
| `review` | Pull request pushed, awaiting review | **Yes** |
| `done` | Merged or closed | No |

**Rename on every transition**, not just at the start. The status is only useful if it is
current — a session that says `building` while it has actually been waiting three hours for an
answer is worse than no status at all, because it teaches the owner not to trust the list.

`asking` is the important one. It is the only state where nothing will happen until the owner
replies, and it can sit there indefinitely. Use it the moment you post a question and stop
working — including when you post recommendations on a `status-needs-decision` issue.

There is deliberately no `blocked`. A mid-session block is almost always "needs the owner", which
is `asking`; a genuine dependency block should have been caught before you started.

**These are not the GitHub label names.** The labels describe the *issue's* state. These describe
*this session's* state working on it. An issue can be `status-in-progress` while this session
sits in `review`.

**Sessions not working an issue** — setup, discussion, research with no issue attached — get a
plain descriptive title with a parenthetical that fits, and no issue number. For example:
`(setup) Project driver, issues, and agent workflow`.

**How:** call `get_session` with no arguments to get this session's own id, then
`set_session_title`. If neither tool exists in your environment, skip renaming and say so once —
it is a convenience, not a requirement, and not every tool exposes it.

### Commands

Either the `gh` CLI or the GitHub MCP tools work. Check which this session has before assuming;
some environments have MCP tools and no `gh`.

```bash
REPO=tumble29/asset-price-profit-calculator

# decisions awaiting the owner
gh issue list --repo $REPO --label status-needs-decision --state open \
  --json number,title --jq 'sort_by(.number)'

# ready work
gh issue list --repo $REPO --label status-ready --state open \
  --json number,title --jq 'sort_by(.number)'

# one issue, with its comments - to check whether a decision was already serviced
gh issue view <N> --repo $REPO --json title,body,labels,comments

# claim, before writing any code
gh issue edit <N> --repo $REPO \
  --remove-label status-ready --add-label status-in-progress
```

---

## Branching and pull requests

`main` is the trunk. Every issue's work happens on its own branch and arrives through a pull
request.

**Never commit directly to `main`.** Not for a one-line fix, not for a doc typo. The review step
is where a wrong assumption gets caught, and the whole point of writing the issues the way we do
is that someone reads the result against them. A commit straight to `main` skips that silently.

**Branch naming:** `issue-<number>-<short-slug>` — `issue-11-quotes-schema`,
`issue-4-claude-md`. The number is what matters; it makes the branch, the issue, the pull
request and the commit trailers all traceable to each other.

*Exception:* if your session was launched with a branch already designated for you — some
harnesses do this, with names like `claude/some-generated-name` — use the branch you were given
rather than inventing one. An instruction from the session that started you wins over this
convention. Say in the pull request which issue the work belongs to, since the branch name will
not say it.

**One pull request per issue.** This follows from one-issue-per-session: if you are building one
issue, you produce one pull request.

**What the pull request must carry**, all in the same change as the code:

- The code.
- The issue's status label swapped to `status-done`.
- Issue #1's status board row updated.
- Any decision that got made along the way, written into the issue and #1's decision log.

Landing these together is what keeps the record and the work in step. A pull request that ships
code and leaves the label stale means the next agent picks up work that is already done.

**Commit messages reference the issue** as `tumble29/asset-price-profit-calculator#N`.

**Do not rewrite history on a branch you have pushed.** Once it is on the remote someone — or
some CI run — may be looking at it. Add a commit instead. On your own unpushed work, tidy up
freely.

**After merge**, delete the branch. A repository full of merged branches makes it hard to see
what is actually in flight.

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
