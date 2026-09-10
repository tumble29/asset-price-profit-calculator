---
name: start-issue
description: Start work on one specific GitHub issue in this repository that the user has named. Use this whenever the user points at a particular issue rather than asking what to do next — "start issue 11", "work on #4", "do 1.2", "pick up the quotes schema issue", "let's do the transactions ledger", or a bare issue number or URL with an instruction to begin. Also use it when the user says to continue or resume a specific issue. If the user has NOT named an issue and wants work dispatched, use the next-task skill instead.
---

# Starting a named issue

The user has told you which issue to work on, so there is nothing to search for. Your job is to
confirm the issue is actually workable, then follow the standard procedure.

**Repository:** `tumble29/asset-price-profit-calculator`
**Driver issue:** #1 — the project's decision log and a human-readable mirror of the labels.

## Read these first

1. **`.github/ISSUE_AUTHORING.md`** — read *Status labels*, *Working an issue*,
   *Naming your session*, *Commands*, and *Branching and pull requests*. That is the
   authoritative procedure and it covers everything this skill does not.
2. **Issue #1** — decisions already made (do not relitigate them), decisions still open, and the
   engineering rules every issue is held to.

If this skill and those documents ever disagree, **they win**. This is a pointer, not a copy.

## Resolve which issue

The user may name it several ways: an issue number (`#11`, `11`), a phase number from #1's board
(`1.2`), a URL, or a description (`the quotes schema one`). A phase number is **not** an issue
number — `1.2` is issue #11. Resolve it against #1's board and **say which issue you resolved it
to** before doing anything, so a misread gets caught immediately rather than three commits later.

If it is genuinely ambiguous, ask. Working the wrong issue wastes the whole session.

## Check it is workable

Read the issue's label and act on it. This is the step that only exists in this skill — when you
choose your own work you never meet these cases, because the query already filtered them out.

| Label | What to do |
|---|---|
| `status-ready` | Proceed to *Working an issue*. |
| `status-needs-decision` | **Do not build.** Post your recommendations on the open decisions as a comment, set your session status to `asking`, and stop. Never clear the label — only the owner does that. If the owner has just answered the decisions in conversation, record the answers in the issue and #1's decision log **first**, ask them to move the label, and only then build. |
| `status-blocked` | Report which dependencies are not `status-done` and ask before going further. Do not silently proceed — but do not refuse outright either. The owner named this issue deliberately and may know something the label does not, such as having just merged the dependency. |
| `status-in-progress` | Someone or something has already claimed it. Say so, name the pull request if one is linked, and ask before taking over. Two sessions on one issue produce conflicting pull requests. |
| `status-done` | Say so and stop. If the owner wants more, that is a new issue — ask which. |
| no status label | The invariant is one status label per issue, so this is a bug in the tracker. Report it, propose the label you think it should have, and wait. |

**Do not service other `status-needs-decision` issues.** That is `next-task` behaviour. The owner
pointed at one issue; stay on it.

## Then follow the standard procedure

Everything else — verifying dependencies, claiming, branching, naming the session as you move
through it, building, opening the pull request, and merging once the owner says so — is
*Working an issue* in `.github/ISSUE_AUTHORING.md`. Follow it there.

**One issue per session** still applies. Finishing the named issue is the end of the session's
work, not a cue to look for more.

## For agents that are not Claude

This file is plain markdown and nothing in it is Claude-specific. If your tool does not
auto-discover `.claude/skills/`, you have been pointed here manually and that is fine — read
`.github/ISSUE_AUTHORING.md` and issue #1 as instructed above and proceed identically.
