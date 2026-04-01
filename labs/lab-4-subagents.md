# Lab 4: Subagents — Full Bug Audit

**Module:** 7 — Subagents
**Duration:** 10 minutes
**Prerequisites:** `claude-code-labs/` with CLAUDE.md

---

## Objective

Use a subagent to audit the entire codebase for bugs, then fix one directly. See the difference in approach and context usage.

---

## Step 1: Subagent audit (5 min)

Open Claude Code in `claude-code-labs/` and ask:

```
Use a subagent to perform a full code audit of src/.
Find all bugs, security issues, and missing edge cases.
Return a prioritized list with file paths and descriptions.
```

Watch:
- Claude spawns a subagent that reads all 18 source files
- The subagent does the heavy lifting in its own context
- Your main conversation receives only the clean summary
- The audit should find: winRate NaN, negative points, stack trace leak, loose equality, season isActive bug

**This would take you 30+ minutes to do manually** — the subagent does it in seconds across all files.

---

## Step 2: Fix directly from the report (3 min)

Pick one bug from the audit report and ask Claude to fix it directly:

```
Fix the season isActive() bug you found — it should check the end date, not just the active flag.
```

Notice: Claude fixes it immediately without re-reading files — the audit summary gave enough context.

---

## Step 3: When to use which (2 min)

You just saw both patterns:

| Approach | Best for | Example |
|----------|----------|---------|
| **Subagent** | Research across many files | "Audit all 18 files for bugs" |
| **Direct** | Targeted edits | "Fix this specific bug in this file" |

Subagents keep your main context clean. Direct edits are faster for known tasks.

---

## Completion Criteria

- [ ] Subagent found multiple bugs across the codebase in one pass
- [ ] Fixed a bug directly from the subagent's report
- [ ] Understand: subagent = research, direct = action
