# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository. For other AI agents (Codex, Gemini, Copilot, etc.) see `AGENTS.md` — conventions are identical.

## Project Context

Quiz Arena — an Express-based timed trivia game with streak scoring and a persistent leaderboard. See `AGENTS.md` for the full architecture reference, data shapes, and NEVER list.

## Commands

See `AGENTS.md` for the full command reference. Quick summary:

```bash
npm start     # node src/server.js (port 3000), open http://localhost:3000
npm run dev   # node --watch src/server.js
npm test      # node tests/run.js (NOT jest/mocha)
npm run lint  # eslint src/
```

## Verification

After **any** code change, run both — no exceptions:
1. `npm test` — all tests must pass (zero failures)
2. `npm run lint` — zero errors (warnings are ok)

## Claude-Specific Notes

- Prefer reading large file ranges over many small reads.
- Use the existing `store.js` I/O layer — never `fs` directly in services or routes.
- When adding a tunable value, put it in `config/settings.js`, not inline.
- Keep HTTP handlers thin — business logic belongs in `services/`.
