# AGENTS.md

This file provides guidance to AI coding agents (OpenAI Codex, Gemini, Copilot, etc.) working in this repository. See `CLAUDE.md` for Claude-specific guidance — the conventions are identical.

## Project

**Quiz Arena** — an Express-based timed trivia game with streak scoring and a persistent leaderboard. Node.js + vanilla HTML/CSS/JS, no build step, no framework.

## Commands

```bash
npm install        # install dependencies (first time only)
npm start          # start server on port 3000
npm run dev        # start with auto-reload (node --watch)
npm test           # run tests: node tests/run.js  (NOT jest/mocha)
npm run lint       # eslint src/
npm run format     # prettier --write src/ tests/
```

After **every** code change, run:
1. `npm test` — all tests must pass (zero failures)
2. `npm run lint` — zero errors (warnings are ok)

## Architecture

```
Request: routes/* → services/* → services/store.js → data/*.json
```

| File/Dir | Role |
|---|---|
| `src/server.js` | Express entry; mounts routes + error middleware |
| `src/routes/questions.js` | `GET /api/questions`, `GET /api/questions/:id` |
| `src/routes/games.js` | `POST /api/games`, `POST /api/games/:id/answer` |
| `src/routes/scores.js` | `GET /api/scores`, `POST /api/scores` |
| `src/services/quiz.js` | `startGame`, `submitAnswer`, scoring, streak logic |
| `src/services/leaderboard.js` | `getTopScores`, `addScore` — top-10 persistence |
| `src/services/store.js` | **Only module allowed to touch disk.** `loadCollection(name)` / `saveCollection(name, data)` |
| `src/models/question.js` | `Question` class; `toPublic()` strips `correctIndex` |
| `src/models/game.js` | `Game` class; holds server-side session state |
| `src/models/score.js` | `Score` class; leaderboard entry with unique `id` |
| `config/settings.js` | All tunables: port, timer, scoring multipliers, leaderboard cap |
| `data/questions.json` | 100-question bank (read-only at runtime) |
| `data/games.json` | Active/finished game sessions (written via store.js) |
| `data/scores.json` | Leaderboard `{ version: 1, entries: [] }` (written via store.js) |
| `public/` | Static frontend — `index.html`, `styles.css`, `quiz.js` |
| `tests/run.js` | Hand-rolled test runner; uses `test(name, fn)` + `assert(cond, msg)` |

## Coding Conventions

- **Strict equality only** — `===` / `!==`, never `==` / `!=`. ESLint `eqeqeq` enforces this.
- **Prettier** — single quotes, no semicolons, no trailing commas, 100-char line width.
- **No new npm dependencies** without explicit approval. Only `express` is a runtime dep.
- **All tunables in `config/settings.js`** — never hardcode values in services.
- **Error responses shape** — always `{ error: "message" }`, never include stack trace.

## NEVER Do

| Rule | Why |
|---|---|
| Never write to `data/*.json` directly | Always use `store.js` — it is the only I/O layer |
| Never expose `err.stack` in HTTP responses | Security — leaks internals to clients |
| Never send `correctIndex` to the client | Use `Question.toPublic()` — server checks the answer |
| Never trust client-side score values | Server recalculates everything in `quiz.js` |
| Never re-shuffle questions mid-game | Shuffle once in `startGame`, persist the order |

## Key Data Shapes

**Question** (stored, never sent raw):
```json
{ "id": "q-001", "category": "Science", "prompt": "...", "choices": ["A","B","C","D"], "correctIndex": 2 }
```

**Game session** (`data/games.json`):
```json
{ "id": "uuid", "status": "playing|finished", "questionIds": [], "currentIndex": 0,
  "score": 0, "streak": 0, "maxStreak": 0, "correctCount": 0,
  "startedAt": "ISO", "finishedAt": null, "locked": false }
```

**Score entry** (`data/scores.json` → `entries[]`):
```json
{ "id": "base36ts-hex", "name": "Alice", "score": 90, "accuracy": 0.9,
  "durationMs": 45000, "maxStreak": 5, "playedAt": "ISO" }
```

## Testing Pattern

```js
// tests/run.js style
test('description', () => {
  assert(condition, 'failure message')
})
```

No external test framework. Add new tests in `tests/run.js` adjacent to existing ones.

## Scoring Logic

Points per correct answer = `basePoints × multiplier(streak)`

| Streak | Multiplier |
|---|---|
| 0–2 | 1× |
| 3–4 | 2× |
| 5+ | 3× |

Wrong answer or timeout → score 0, streak resets to 0. Values live in `config/settings.js`.
