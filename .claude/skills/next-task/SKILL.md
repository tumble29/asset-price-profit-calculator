---
name: next-task
description: Find and start the next piece of work in this repository by querying GitHub issue labels. Use this whenever the user asks what to work on next, says "next task", "next issue", "pick up the next one", "what's ready", "what needs my decision", "what's blocking", or otherwise wants work dispatched rather than naming a specific issue — and also when they hand you an open-ended "keep going" or "carry on with the project" with no target. Prefer this over guessing which issue to open or reading the roadmap by eye; the labels are the source of truth and this skill knows how to read them.
---

# Finding the next task

Work in this repository is dispatched by **GitHub issue label**, not by reading a roadmap
document. Labels are authoritative because a label change is atomic, while editing a shared
tracking document replaces the whole thing and can silently lose someone else's work.

**Repository:** `tumble29/asset-price-profit-calculator`
**Driver issue:** #1 — the project's decision log and a human-readable mirror of the labels.

## Read these first

The procedure is documented in the repository, not in this skill. This file exists so you do
not have to be told the path every time.

1. **`.github/ISSUE_AUTHORING.md`**, section **Picking up work** — the authoritative algorithm
   and the label vocabulary.
2. **Issue #1** — decisions already made (do not relitigate them), decisions still open, and the
   engineering rules every issue is held to.

If this skill and those documents ever disagree, **they win**. This is a pointer, not a copy.

## The five status labels

Exactly one per actionable issue. Each maps to one action.

| Label | What you do |
|---|---|
| `status-ready` | Take it |
| `status-needs-decision` | Post recommendations as a comment, then stop. **Do not build.** |
| `status-blocked` | Skip |
| `status-in-progress` | Skip — someone has claimed it |
| `status-done` | Skip |

## The order

**Service un-serviced decisions before taking ready work.** Reading an issue and posting
recommendations is cheap and unblocks whatever is waiting behind it; building a ready feature is
expensive and unblocks nothing anyone is waiting on. Getting the decision queue in front of the
owner means they can answer a batch in one sitting instead of answer-one, wait, answer-one.

Then take the lowest-numbered `status-ready` issue. Issue numbers track phase order, which
approximates dependency order.

## One issue per session

Service **every** un-serviced decision — that pass is plural and read-only, and the point is
getting the whole queue in front of the owner at once.

Then build **exactly one** `status-ready` issue. When it is finished, stop and report what you
did and what is now ready.

**Do not pick up a second issue.** Three exceptions, and only these:

- The owner explicitly asks you to take another one.
- Two issues turn out to be genuinely entangled — the same migration, the same component, work
  that cannot be split into two reviewable pull requests. **In that case ask** rather than
  deciding for yourself. Say which issues, why they cannot be separated, and wait.
- Your issue turns out to be already done, or a no-op. Say so and stop; do not fill the session
  with substitute work.

This is not caution for its own sake. One issue per pull request keeps review tractable. These
issues carry decisions the owner still has to make, so rolling into a second one compounds any
wrong assumption from the first before anyone has seen it. And a second feature built on the
tail of a long session is built on degraded context — the part of the work most likely to be
subtly wrong in a way that still passes its tests.

Being asked to do another costs one sentence. Untangling two half-understood features costs an
afternoon.

## Name the session

A session called "Next task" is useless in a list of ten. Rename it so the owner can see at a
glance what each session is doing and, more importantly, **which ones are waiting on them.**

**Rename once you have read the issue and understand it** — not before. A name guessed from the
label alone is barely better than the default.

**Format:**

```
({status}) #{number} - {brief description}
```

Examples:

```
(reading)  #9 - Price data terms review
(building) #13 - Transactions ledger
(asking)   #11 - Quotes schema
(review)   #4 - CLAUDE.md conventions
(done)     #4 - CLAUDE.md conventions
```

Keep the description short enough to survive truncation in a session list. The status and the
number are the parts that must always be visible.

**The five statuses:**

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

**Sessions that are not working an issue** — setup, discussion, research with no issue attached —
get a plain descriptive title with a parenthetical that fits, and no issue number. For example:
`(setup) Project driver, issues, and agent workflow`.

**How:** call `get_session` with no arguments to get this session's own id, then
`set_session_title`. If neither tool exists in your environment, skip renaming and say so once —
it is a convenience, not a requirement, and not every tool exposes it.

## Commands

Either the `gh` CLI or the GitHub MCP tools work. Use whichever this session has — check before
assuming; some environments have MCP tools and no `gh`.

**Find decisions awaiting the owner:**

```bash
gh issue list --repo tumble29/asset-price-profit-calculator \
  --label status-needs-decision --state open \
  --json number,title --jq 'sort_by(.number)'
```

**Check whether one has already been serviced** — if a previous agent already posted
recommendations, skip it. A second set is noise, not diligence.

```bash
gh issue view <N> --repo tumble29/asset-price-profit-calculator --json comments
```

**Find ready work:**

```bash
gh issue list --repo tumble29/asset-price-profit-calculator \
  --label status-ready --state open \
  --json number,title --jq 'sort_by(.number)'
```

**Claim an issue — before writing any code**, because an unclaimed task can be picked up twice:

```bash
gh issue edit <N> --repo tumble29/asset-price-profit-calculator \
  --remove-label status-ready --add-label status-in-progress
```

Then comment with your pull request link so the claim is visible in the timeline.

## Verify dependencies before building

Every issue lists `Depends on`. Each of those must be `status-done`. If one is not, the label
you followed is stale — comment on that issue saying so, then move to the next ready candidate.

**Do not halt the whole queue over one wrong label.** One stale row should cost you one
candidate, not the session.

## When nothing is ready

Report the `status-needs-decision` queue and what has already been recommended for each, then
stop. Do not go looking for work outside the labels, and do not answer the open decisions
yourself — those are the repository owner's to make, and an agent quietly deciding one is how a
schema ends up wrong in a way nobody can trace.

## On finishing

Swap the label to `status-done`, close the issue, and refresh #1's status board — all in the
same pull request as the code, so the record and the work land together.

**If a decision got made along the way** — in conversation, in a comment thread, anywhere —
write it into the issue and into #1's decision log **before** any code is written. A decision
that lives only in a session transcript is a decision that evaporates, which is the failure the
whole issue structure exists to prevent.

## For agents that are not Claude

This file is plain markdown and nothing in it is Claude-specific. If you are working through a
tool that does not auto-discover `.claude/skills/`, you have been pointed here manually and that
is fine — read `.github/ISSUE_AUTHORING.md` and issue #1 as instructed above and proceed
identically.
