# Lab 2: Context Engineering — Reduce Noise

**Module:** 3 — Context Engineering
**Duration:** 15 minutes
**Prerequisites:** `claude-code-labs/` with CLAUDE.md from Lab 1

---

## Objective

See how prompt precision affects Claude's ability to find bugs, and what happens to knowledge after compaction.

---

## Part A: Vague vs Precise Prompts (7 min)

### Step 1: Open the project

```bash
cd claude-code-labs
claude
```

### Step 2: Vague prompt

```
Are there any bugs in this project?
```

Watch: Claude reads many files, takes a while, and may find some bugs but miss others.

### Step 3: Precise prompt

```
The Player.winRate getter in src/models/player.js crashes when a player has zero games. Find the bug and fix it.
```

Watch: Claude goes straight to the file, finds the division-by-zero bug, and fixes it in seconds.

**Takeaway:** A precise prompt with file path and symptom = Claude fixes it immediately. A vague prompt = Claude wanders through 18 files hoping to spot something.

---

## Part B: What Survives /compact (8 min)

### Step 1: Ask Claude to investigate

```
Explain exactly how the scoring system works — streak bonuses, rank calculation, and point penalties.
```

Claude reads `scoring.js`, `settings.js`, and gives a detailed answer. Good.

### Step 2: Ask about a bug

```
The applyPoints function in scoring.js can make a player's total points go negative. Is that intended?
```

Claude explains the bug. Now you have context about two topics.

### Step 3: Compact and test

Run `/compact`.

Now ask:

```
What are the build commands for this project?
```

Claude answers correctly — from CLAUDE.md (survived).

```
How does the streak bonus calculation work?
```

Claude gives a vague or recalculated answer — the detailed explanation was lost.

**Takeaway:** Anything important should be in CLAUDE.md, not just in conversation. Conversation is temporary.

---

## Completion Criteria

- [ ] Saw vague prompt waste time vs precise prompt fix bug instantly
- [ ] Observed what survives `/compact` vs what gets lost
- [ ] Understand: CLAUDE.md = permanent, conversation = temporary
