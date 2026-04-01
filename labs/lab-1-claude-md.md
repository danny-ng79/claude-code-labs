# Lab 1: Write a CLAUDE.md

**Module:** 2 — CLAUDE.md: Collaboration Contract
**Duration:** 15 minutes
**Prerequisites:** `sample-project/` provided in this repo

---

## Objective

Write a CLAUDE.md from scratch, then watch Claude use it to find and fix a real bug — following your rules.

---

## Step 1: Reset and Initialize (3 min)

Delete the existing CLAUDE.md and start fresh:

```bash
cd sample-project
rm CLAUDE.md
claude
```

Type `/init` — Claude scans the project and generates a starter CLAUDE.md.

Read through the output. It's a starting point, not the final version.

---

## Step 2: Edit to Match the Template (5 min)

Open `CLAUDE.md` and edit it to include these sections. Remove any fluff Claude added.

```markdown
# Game Leaderboard API

## Build & Test
- Install: `npm install`
- Start: `npm start`
- Test: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`
- Seed data: `node src/utils/seed.js`

## Architecture
- src/server.js — Express entry, mounts routes
- src/routes/ — API endpoints (players, matches, leaderboard, seasons)
- src/models/ — Data classes (Player, Match, Season)
- src/services/ — Business logic (store, scoring, achievements, matchmaking)
- src/middleware/ — Validation and error handling
- config/settings.js — Game constants (points, ranks, achievements)

## Coding Conventions
- Strict equality (===), never loose (==)
- Single quotes, no semicolons (Prettier)
- Routes return JSON: `{ error: "message" }` for errors
- Game constants in config/settings.js, not hardcoded

## NEVER
- Do not modify data/*.json directly — use services/store.js
- Do not add dependencies without asking
- Do not expose stack traces in API responses

## Verification
1. `npm test` — all tests must pass
2. `npm run lint` — no errors
```

---

## Step 3: Watch Claude Fix a Real Bug (7 min)

Open a **new** Claude Code session and ask:

```
The errorHandler middleware is leaking stack traces to API clients.
This violates our security rules. Find and fix it.
```

Watch what Claude does:
- Does it read CLAUDE.md first? (loads automatically)
- Does it find `src/middleware/errorHandler.js`? (from Architecture)
- Does it remove the stack trace leak? (from NEVER list)
- Does it run `npm test` after fixing? (from Verification)
- Does it run `npm run lint`? (from Verification)

**This is the power of CLAUDE.md:** one file turns Claude from "generic AI" into a team member who knows your rules.

---

## Completion Criteria

- [ ] CLAUDE.md created from scratch with `/init` + manual editing
- [ ] Claude found and fixed the stack trace bug following your rules
- [ ] Claude ran verification steps automatically
