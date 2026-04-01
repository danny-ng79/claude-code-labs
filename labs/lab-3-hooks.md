# Lab 3: Hooks — Auto-format + Auto-test

**Module:** 5 — Hooks: Deterministic Control
**Duration:** 15 minutes
**Prerequisites:** `sample-project/` (has Prettier and tests configured)

---

## Objective

Set up hooks that automatically format code and run tests after every edit. Watch Claude fix a bug while hooks enforce quality behind the scenes.

---

## Step 1: Create the hook config (3 min)

```bash
mkdir -p sample-project/.claude
```

Create `sample-project/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null",
            "statusMessage": "Auto-formatting..."
          }
        ]
      }
    ]
  }
}
```

---

## Step 2: Watch hooks in action on a real bug fix (8 min)

Open a **new** Claude Code session (hooks load at startup):

```bash
cd sample-project
claude
```

Give Claude a real task:

```
The scoring system allows player points to go negative after losses.
Fix applyPoints in src/services/scoring.js so points never drop below 0.
Add a test case for this fix.
```

Watch closely:
1. Claude edits `scoring.js` → **"Auto-formatting..."** appears → file is formatted
2. Claude edits `tests/run.js` to add a test → **"Auto-formatting..."** again
3. Claude runs `npm test` to verify

**The hook ran automatically each time** — Claude didn't choose to format, the harness enforced it.

---

## Step 3: Verify the hook is working (4 min)

Open the edited files and check:
- Is the code formatted according to `.prettierrc`? (single quotes, no semicolons)
- Did Claude's fix pass the new test?

Now try breaking the format manually — add some messy spacing to a file, then ask Claude:

```
Add a comment to the top of src/services/scoring.js
```

After the edit, the hook reformats the entire file — including your messy spacing.

**Key insight:** Hooks are deterministic. Claude writes code however it wants, the hook enforces your standards every single time. No exceptions.

---

## Completion Criteria

- [ ] Hook auto-formatted files during a real bug fix
- [ ] Saw the hook trigger on every edit, not just once
- [ ] Understand: hooks are enforced by the harness, not by Claude
