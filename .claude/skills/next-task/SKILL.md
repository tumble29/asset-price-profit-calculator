---
name: next-task
description: Find and start the next piece of work in this repository by querying GitHub issue labels, when no specific issue has been named. Use this whenever the user asks what to work on next, says "next task", "next issue", "pick up the next one", "what's ready", "what needs my decision", "what's blocking", or otherwise wants work dispatched — and also when they hand you an open-ended "keep going" or "carry on with the project" with no target. If the user named a specific issue number, use the start-issue skill instead. Prefer this over guessing which issue to open or reading the roadmap by eye; the labels are the source of truth and this skill knows how to read them.
---

# Finding the next task

Work in this repository is dispatched by **GitHub issue label**, not by reading a roadmap
document. Labels are authoritative because a label change is atomic, while editing a shared
tracking document replaces the whole thing and can silently lose someone else's work.

**Repository:** `tumble29/asset-price-profit-calculator`
**Driver issue:** #1 — the project's decision log and a human-readable mirror of the labels.

## Read these first

The procedure lives in the repository, not in this skill. This file exists so you do not have to
be told the paths every time.

1. **`.github/ISSUE_AUTHORING.md`** — read *Status labels*, *Finding an issue to work on*,
   *Working an issue*, *Naming your session*, *Commands*, and *Branching and pull requests*.
   That is the authoritative procedure and it covers everything after issue selection.
2. **Issue #1** — decisions already made (do not relitigate them), decisions still open, and the
   engineering rules every issue is held to.

If this skill and those documents ever disagree, **they win**. This is a pointer, not a copy.

## What this skill adds

Only the selection step. Everything from "you know which issue you are on" onwards is
*Working an issue* in `.github/ISSUE_AUTHORING.md` — follow it there rather than improvising.

**1. Service un-serviced decisions first.**

Query `status-needs-decision`, ascending by number. For each with **no recommendations comment
yet**: read it, post recommendations, move on. Never change its label — only the owner clears it.
If it already has recommendations, skip; a second set is noise, not diligence.

Decisions come first because servicing one is cheap and unblocks whatever waits behind it, while
building a ready feature is expensive and unblocks nothing anyone is waiting on.

**2. Then take the lowest-numbered `status-ready` issue**, and follow *Working an issue*.

**3. If nothing is ready**, report the `status-needs-decision` queue and what has already been
recommended for each, then stop. Do not go looking for work outside the labels, and do not answer
the open decisions yourself — those are the owner's to make, and an agent quietly deciding one is
how a schema ends up wrong in a way nobody can trace.

## For agents that are not Claude

This file is plain markdown and nothing in it is Claude-specific. If you are working through a
tool that does not auto-discover `.claude/skills/`, you have been pointed here manually and that
is fine — read `.github/ISSUE_AUTHORING.md` and issue #1 as instructed above and proceed
identically.
