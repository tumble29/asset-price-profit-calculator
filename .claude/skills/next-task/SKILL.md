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
