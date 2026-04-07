# Quiz Arena — Implementation Plan

> **Audience:** Students taking the *Agentic Coding with Claude Code* training, working on the take-home homework at [`labs/homework-quiz-arena.md`](../labs/homework-quiz-arena.md).
>
> **Hard rule from the homework:** All code must be written by Claude Code. You may not write code by hand. This document is your *spec*; your job is to feed each phase to Claude as a prompt and review the result.
>
> **Score target:** This plan locks in **95/100** through Phase 5 alone. Phase 6 picks up the remaining 5 creativity points and any extra polish.
>
> **Repo strategy:** Build the quiz **inside this existing repo**, repurposing the Express + JSON-store infrastructure that already lives in `src/`. The leaderboard-specific routes/models/services are deleted in Phase 0; everything else (server bootstrap, error middleware, JSON store, lint/format/test config) is reused as-is. This is faster than starting from scratch *and* it gives you a real client-server architecture instead of a single-file static page.

---

## 1. Recommended Stack

**Backend:** Node + Express (already wired up in `src/server.js`).
**Persistence:** JSON files in `data/`, written exclusively through the existing `src/services/store.js`. No database.
**Frontend:** Vanilla HTML/CSS/JS served from `public/` by Express's static middleware. No build step, no framework.
**Test runner:** the hand-rolled `tests/run.js` (already wired to `npm test`). Add new tests next to it.

**Run command:** `npm start`, then open `http://localhost:3000`.

**Why reuse this repo:** `server.js`, `store.js`, `errorHandler.js`, the eslint/prettier config, and the test runner are all the right shape for this project. Recreating them from scratch would burn 30 minutes of prompts on infra you already have. The leaderboard domain code (players, matches, seasons) gets deleted because it's irrelevant — we keep the *infrastructure*, replace the *domain*.

---

## 2. Files: Keep / Delete / Create

### Keep & reuse (do not modify in Phase 0)

| Path | Why |
|---|---|
| `src/server.js` | Express bootstrap; you'll re-mount routes in Phase 0 |
| `src/services/store.js` | JSON-file CRUD — perfect fit for questions, games, scores |
| `src/middleware/errorHandler.js` | Already has the `{ error: ... }` shape; **fix the stack-trace leak as part of Phase 0** |
| `src/middleware/validate.js` | Replace its functions with quiz-specific validators in Phase 1 |
| `config/settings.js` | Replace contents (port stays, scoring/ranks/achievements get rewritten for quiz) |
| `package.json` | Update `name` and `description` only; scripts stay |
| `tests/run.js` | Replace test bodies; keep the runner harness |
| `eslint.config.js`, `.prettierrc` | Conventions stay (`===`, single quotes, no semis) |
| `public/index.html` | Rewrite content; keep the file |

### Delete in Phase 0

```
src/routes/players.js
src/routes/matches.js
src/routes/leaderboard.js
src/routes/seasons.js
src/models/player.js
src/models/match.js
src/models/season.js
src/services/scoring.js
src/services/achievements.js
src/services/matchmaking.js
src/utils/seed.js
src/utils/format.js
data/                    # if it exists from prior runs
```

### Create across Phases 1–5

```
src/models/question.js          # Question class
src/models/game.js              # Game session class (server-side state)
src/models/score.js             # Leaderboard entry
src/services/quiz.js            # startGame, submitAnswer, scoring, streak
src/services/leaderboard.js     # getTopScores, addScore (uses store.js)
src/routes/questions.js         # GET /api/questions
src/routes/games.js             # POST /api/games, POST /api/games/:id/answer
src/routes/scores.js            # GET /api/scores, POST /api/scores
data/questions.json             # Static question bank (10+ items, hand-authored)
public/styles.css               # Theme, layout, button states
public/quiz.js                  # Frontend state machine, fetch wrappers, rendering
```

After all phases, the repo's `src/` will look like this:

```
src/
├── server.js
├── routes/
│   ├── questions.js
│   ├── games.js
│   └── scores.js
├── models/
│   ├── question.js
│   ├── game.js
│   └── score.js
├── services/
│   ├── store.js          # unchanged
│   ├── quiz.js
│   └── leaderboard.js
└── middleware/
    ├── errorHandler.js   # stack leak fixed
    └── validate.js       # quiz validators
```

---

## 3. Architecture: client-server split

This is a real client-server app, not a single-file SPA. Where each concern lives:

| Concern | Where | Why |
|---|---|---|
| Question bank | `data/questions.json` via `store.js` | Lets you add questions without touching code |
| Scoring + streak math | `src/services/quiz.js` | Server-authoritative — client can't fake scores |
| Game session state | `src/models/game.js` + `data/games.json` | Server tracks `index`, `score`, `streak`, `locked` per game |
| Leaderboard persistence | `src/services/leaderboard.js` + `data/scores.json` | Top-10 sort, sanitization, schema versioning |
| 15s timer | `public/quiz.js` (client-side) | Timer is UX; server only knows "this answer was a timeout" |
| Progress bar, color flash, keyboard nav | `public/quiz.js` + `public/styles.css` | Pure UI |

**Request flow** for the hot path:

```
Browser                       Express                        store.js
  │                              │                              │
  │── POST /api/games ──────────▶│                              │
  │                              │── loadCollection('questions')│
  │                              │◀─────────────────────────────│
  │                              │── createGame(questions) ─────│
  │                              │── saveCollection('games',...)│
  │◀── { gameId, question } ─────│                              │
  │                              │                              │
  │── POST /api/games/:id/answer ▶                              │
  │                              │── submitAnswer(gameId, idx) ─│
  │                              │── (score + streak math) ─────│
  │                              │── saveCollection('games',...)│
  │◀── { correct, nextQuestion } │                              │
  │   …or { results }            │                              │
```

The client never trusts itself. The server returns "correct/wrong" — the client just renders.

---

## 4. State Machine (server-side game session)

```
   ┌──────────┐  startGame   ┌──────────┐
   │ (no game)│─────────────▶│ PLAYING  │
   └──────────┘              └────┬─────┘
                                  │
                                  │ submitAnswer / timeout
                                  │
                ┌─────────────────┴──────────────┐
                │                                │
                ▼ (more questions)               ▼ (last question)
           ┌──────────┐                     ┌──────────┐
           │ PLAYING  │                     │ FINISHED │
           └──────────┘                     └──────────┘
```

**Game model shape** (`src/models/game.js`, persisted via `store.js`):

```js
{
  id: string,                // generated like Player.id was
  status: 'playing' | 'finished',
  questionIds: string[],     // shuffled at startGame, frozen
  currentIndex: number,
  score: number,
  streak: number,
  maxStreak: number,
  correctCount: number,
  startedAt: string,         // ISO
  finishedAt: string | null,
  locked: boolean            // race guard, set true during submitAnswer
}
```

Client-side state in `public/quiz.js` is much smaller — just `{ gameId, currentQuestion, timer }`. Everything else lives on the server.

---

## 5. Data Schemas

### Question (`data/questions.json`, loaded via `store.js`)

```js
{
  id: string,                          // stable, e.g. "q-001"
  category: string,
  prompt: string,
  choices: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation?: string
}
```

> Note: `correctIndex` is **never sent to the client**. The client only receives `{ id, prompt, choices }`. The server checks the answer.

### Game (`data/games.json`) — see §4.

### Score (`data/scores.json`)

Wrapper object so the schema can evolve:

```js
{
  version: 1,
  entries: [
    {
      name: string,           // 1-12 chars, sanitized
      score: number,
      accuracy: number,       // 0..1
      durationMs: number,
      maxStreak: number,
      playedAt: string        // ISO
    }
  ]
}
```

`leaderboard.js` caps `entries.length` at 10 and trims before writing.

---

## 6. Recommended Gamification (pick 3, not 2)

| Feature | Why |
|---|---|
| **Streak bonus** (#5) | Trivial extension of `quiz.js` scoring; reuses the same code path. |
| **Progress bar** (#8) | Pure UI in `public/quiz.js`; one DOM element + one CSS rule. |
| **Leaderboard** (#6) | Marquee feature; ties to the parent training's leaderboard theme; forces real persistence + sanitization work via `store.js`. |

Skip animations / sound / difficulty for core scope. Reserve as Phase 6 creativity bonus only if time allows.

---

## 7. `config/settings.js` — replacement contents

In Phase 0 you replace the leaderboard config with quiz config. Suggested shape:

```js
module.exports = {
  port: process.env.PORT || 3000,
  dataDir: process.env.DATA_DIR || './data',

  quiz: {
    questionsPerGame: 10,
    timerSeconds: 15
  },

  scoring: {
    basePoints: 10,
    streakMultipliers: [
      { minStreak: 0, multiplier: 1 },
      { minStreak: 3, multiplier: 2 },
      { minStreak: 5, multiplier: 3 }
    ]
  },

  leaderboard: {
    topN: 10,
    nameMaxLength: 12
  }
}
```

All tunables live here — never hardcode in services. Same convention as the original repo.

---

## 8. Phased Implementation TODO

> Each phase is **one Claude Code prompt**. Do not bundle phases.

### Phase 0 — Repurpose the repo  *(Rubric: 10 pts via CLAUDE.md)*

- [ ] **Goal:** Strip leaderboard domain code, rewrite `CLAUDE.md` for the quiz project, fix the stack-trace leak in `errorHandler.js`, replace `config/settings.js` contents, get `npm start` returning 200 on `/api/health`.
- [ ] **Files touched:** delete the files listed in §2; modify `src/server.js`, `src/middleware/errorHandler.js`, `config/settings.js`, `package.json`, `tests/run.js`, `public/index.html`, `CLAUDE.md`, `README.md`.
- [ ] **Suggested prompt:**
  > Repurpose this repo into a quiz arena project per documentation/quiz-arena-implementation-plan.md §2. Delete every file listed under "Delete in Phase 0". Update src/server.js to remove the deleted route mounts (leave only the health check and the error/notFound middleware for now). Fix the stack-trace leak in src/middleware/errorHandler.js — never include `err.stack` in the response body. Replace the contents of config/settings.js with the quiz config in §7 of the plan. Update package.json `name` to "quiz-arena" and `description` accordingly. Empty out tests/run.js (leave only the runner harness, no test cases). Replace public/index.html with a minimal page that has `<main id="app">Quiz Arena loading…</main>`. Update CLAUDE.md to describe the new project (run `npm start`, open localhost:3000; conventions: ===, single quotes, no semis; NEVER list: never write to data/*.json directly — use store.js, never expose stack traces, never trust client-side scoring). Update README.md to describe the quiz project. Run `npm start` and `npm test` and `npm run lint` to confirm everything still works.
- [ ] **Acceptance check:** `npm start` boots without error, `curl http://localhost:3000/api/health` returns `{"status":"ok",...}`, `npm test` passes (zero tests is fine), `npm run lint` reports zero errors.

### Phase 1 — Question API + frontend skeleton

- [ ] **Goal:** Hand-author 10 questions, expose them via `GET /api/questions/:id`, render the first one on the page (no flow yet).
- [ ] **Files touched:** `data/questions.json`, `src/models/question.js`, `src/services/quiz.js`, `src/routes/questions.js`, `src/server.js`, `public/quiz.js`, `public/styles.css`, `public/index.html`, `tests/run.js`.
- [ ] **Suggested prompt:**
  > Following the schemas in documentation/quiz-arena-implementation-plan.md §5, create data/questions.json containing 10 hand-written questions on a topic of your choice. Create src/models/question.js with a Question class and a `toPublic()` method that omits `correctIndex` (the client must never see the answer). Create src/services/quiz.js with `loadQuestions()` and `getQuestion(id)` — both must use src/services/store.js, never read the JSON file directly. Create src/routes/questions.js exposing GET /api/questions (returns all public questions) and GET /api/questions/:id. Mount it in src/server.js. Update public/index.html with a card layout, write public/styles.css for a centered responsive card (works at 375px and 1280px), and write public/quiz.js to fetch /api/questions and render the first one's prompt + 4 answer buttons using `textContent` only (never innerHTML). Add tests for the Question model (toPublic must not leak correctIndex) and for quiz.loadQuestions.
- [ ] **Acceptance check:** `curl http://localhost:3000/api/questions` returns the 10 questions with no `correctIndex` field; opening localhost:3000 shows the first question with 4 buttons; `npm test` passes; `npm run lint` clean.

### Phase 2 — Game flow + scoring  *(Rubric: 25 + 15 = 40 pts)*

- [ ] **Goal:** Server-side game sessions. Click an answer → POST to server → server checks answer, awards 10 points if correct, returns next question or final results. Full state machine implemented.
- [ ] **Files touched:** `src/models/game.js`, `src/services/quiz.js`, `src/routes/games.js`, `src/server.js`, `src/middleware/validate.js`, `public/quiz.js`, `tests/run.js`.
- [ ] **Suggested prompt:**
  > Implement the server-side state machine from documentation/quiz-arena-implementation-plan.md §4. Create src/models/game.js with the Game class (shape per §4). Extend src/services/quiz.js with `startGame()` (shuffles question IDs once, persists a Game via store.js, returns gameId + first public question), `submitAnswer(gameId, choiceIndex)` (loads game, checks `locked` flag, scores against the stored question, increments index, persists, returns `{ correct, score, nextQuestion }` or `{ correct, score, results }` on the last question). Award 10 points per correct answer, 0 for wrong. Use the `locked` flag to prevent double-submits. Replace src/middleware/validate.js exports with `validateAnswerSubmission` (checks `choiceIndex` is 0-3 integer). Create src/routes/games.js: POST /api/games (calls startGame) and POST /api/games/:id/answer (calls submitAnswer, validated). Mount it. Update public/quiz.js with a client state machine: idle → playing → results, "Start" button posts to /api/games, click handler posts to /api/games/:id/answer, results screen shows score + accuracy + duration + "Play again" button. Add tests for quiz.submitAnswer covering: correct answer, wrong answer, double-submit (must be rejected), and end-of-game transition.
- [ ] **Acceptance check:** Full play-through of 10 questions ends on results screen; score is `10 × correctCount`; clicking the same answer twice fast does not double-score (server rejects via `locked`); `npm test` passes; `npm run lint` clean; inspecting `data/games.json` shows persisted sessions.

### Phase 3 — Timer + auto-skip  *(Rubric: 15 pts)*

- [ ] **Goal:** 15-second client-side countdown per question. On expiry, the client sends a "timeout" answer to the server, which scores it as wrong and advances. Timer cleans up on every transition path.
- [ ] **Files touched:** `src/services/quiz.js`, `src/routes/games.js`, `public/quiz.js`, `public/styles.css`, `tests/run.js`.
- [ ] **Suggested prompt:**
  > Add timer support per documentation/quiz-arena-implementation-plan.md. In quiz.js (server), allow `submitAnswer(gameId, choiceIndex)` to accept `choiceIndex === null` meaning "timeout" — this scores as wrong (0 points, streak resets) and advances. In public/quiz.js, implement a client-side Timer module with `start(durationMs, onTick, onExpire)` and `stop()`. The intervalId must live in module-private state and `stop()` must be idempotent. Read the duration from the server's response (or hardcode 15s for now and refactor later). On expiry, POST `{ choiceIndex: null }` to /api/games/:id/answer. On every transition (answer click, timer expiry, results, play-again), call `stop()` BEFORE making the next request. Render the remaining seconds in the UI as a number. Add a server-side test that submitAnswer with null choiceIndex scores as wrong.
- [ ] **Acceptance check:** Sit on a question for 15s without clicking → it auto-advances and is scored wrong; play 3 games back-to-back → DevTools Performance tab shows no growing interval handles (timer leak detector); clicking before expiry does not cause a double-advance; `npm test` passes.

### Phase 4 — Streak bonus + Progress bar  *(Rubric: 10 pts of gamification)*

- [ ] **Goal:** Server tracks streak; awards `basePoints × multiplier` based on `config/settings.js` thresholds (1× for 0-2, 2× for 3-4, 3× for 5+). Client renders a progress bar above the question.
- [ ] **Files touched:** `src/services/quiz.js`, `src/models/game.js`, `public/quiz.js`, `public/styles.css`, `tests/run.js`.
- [ ] **Suggested prompt:**
  > Extend src/services/quiz.js submitAnswer so that on a correct answer, points = `config.scoring.basePoints × multiplierForStreak(currentStreak + 1)`, where multiplier comes from `config.scoring.streakMultipliers` (find the highest matching threshold). Track `streak` and `maxStreak` on the Game model; reset `streak` to 0 on any wrong/timeout answer. Return the current streak and multiplier in the response so the UI can show "x2!" feedback. In public/quiz.js, render a progress bar above the question that fills as `(currentIndex + 1) / totalQuestions`. Show current streak count next to the score. Add tests for: streak of 3 awards 2× points, streak of 5 awards 3× points, wrong answer resets streak, maxStreak tracks correctly across a game.
- [ ] **Acceptance check:** Manually answer 5 in a row correct → 5th awards 30 pts (10 × 3); one wrong answer resets streak to 0; progress bar fills predictably; results screen shows `maxStreak`; `npm test` passes.

### Phase 5 — Leaderboard  *(Rubric: 10 pts of gamification)*

- [ ] **Goal:** Persist scores via `store.js`. New endpoints to read top-10 and submit a score. Frontend prompts for a name on the results screen and renders the leaderboard.
- [ ] **Files touched:** `src/models/score.js`, `src/services/leaderboard.js`, `src/routes/scores.js`, `src/middleware/validate.js`, `src/server.js`, `public/quiz.js`, `tests/run.js`.
- [ ] **Suggested prompt:**
  > Following the schema in documentation/quiz-arena-implementation-plan.md §5, create src/models/score.js with a Score class. Create src/services/leaderboard.js exporting `getTopScores()` and `addScore(entry)`. Both must go through src/services/store.js (never read/write data/scores.json directly). Use the wrapper object `{ version: 1, entries: [...] }` and migrate gracefully if the file is missing or version mismatched (return empty list, do not crash). Sanitize names: trim, slice to 12 chars, strip control characters. Sort entries by score desc and cap at `config.leaderboard.topN` BEFORE writing. Add `validateScoreSubmission` to src/middleware/validate.js. Create src/routes/scores.js: GET /api/scores returns top 10, POST /api/scores accepts `{ gameId, name }`, looks up the finished game, builds a Score from it, calls addScore, returns the updated leaderboard. Mount it in server.js. Update public/quiz.js results screen to prompt for a name (default "Anon"), POST it, then render the top-10 table using `textContent` only. Add tests: leaderboard sort order, top-10 cap, name sanitization (12 chars + control char strip), corrupt-file recovery.
- [ ] **Acceptance check:** Play 3 games with different scores → top-10 shows them sorted desc; manually corrupting `data/scores.json` and reloading shows empty leaderboard without crashing; entering a 100-character name only stores the first 12 chars; `data/scores.json` matches the §5 schema exactly; `npm test` passes.

### Phase 6 — Polish & creativity  *(Rubric: 10 + 5 = 15 pts)*

- [ ] **Goal:** Keyboard navigation (1-4 keys), focus management, color flash feedback on correct/wrong, README + retro note.
- [ ] **Files touched:** `public/quiz.js`, `public/styles.css`, `README.md`.
- [ ] **Suggested prompt:**
  > In public/quiz.js, add keyboard support: pressing 1, 2, 3, or 4 selects the corresponding answer button on the playing screen. When a new question renders, auto-focus the first answer button so keyboard users aren't stranded; add `aria-live="polite"` to the score region. On answer submit, briefly flash the chosen button green (correct) or red (wrong) before advancing — use a 300ms CSS transition, no JS animation libraries. Update README.md to document how to run the project (`npm install`, `npm start`, open localhost:3000), list the implemented features, and include a 2-3 sentence retro TODO comment for the student to fill in about what was easy and hard about directing Claude Code.
- [ ] **Acceptance check:** Tab through buttons works; pressing 1-4 answers the question; correct answers flash green, wrong flash red; no console warnings; `npm run lint` clean; README documents how to run.

---

## 9. Verification Checklist (run after EVERY phase)

1. [ ] `npm test` — must pass (zero failures)
2. [ ] `npm run lint` — must report zero errors
3. [ ] `npm start` — server boots without errors
4. [ ] Hard-reload the browser at `http://localhost:3000` (Cmd+Shift+R)
5. [ ] DevTools console — **zero errors and zero warnings**
6. [ ] Run the phase's acceptance check (above)
7. [ ] Resize browser to **375px width** — no horizontal overflow
8. [ ] **Phases 3+:** play 3 games back-to-back, confirm no growing interval handles in DevTools Performance tab
9. [ ] **Phases 2+:** inspect `data/*.json` files — schemas must match §4 / §5 exactly
10. [ ] `curl` the API endpoints introduced in this phase — responses must NOT contain `err.stack`, `correctIndex`, or any other field marked as server-only above

If any check fails, do not move to the next phase. Tell Claude exactly what's broken — paste the console error or the failing test output — and let it fix.

---

## 10. Architectural Risks & Footguns

These are the bugs that will bite you. Mention them to Claude *preemptively* in the relevant phase prompt.

- **Never write to `data/*.json` directly.** Always go through `src/services/store.js`. This is in the existing codebase's CLAUDE.md NEVER list; preserve it. Direct writes break the existing layering and the existing tests.

- **Never send `correctIndex` to the client.** The Question model needs a `toPublic()` method (mirroring how `Player.toPublic()` works in the original repo). The client never sees the answer; the server always checks. If the client could see the answer, the rubric's "scoring" item is hollow.

- **Stack-trace leak in `errorHandler.js`.** The existing `src/middleware/errorHandler.js` ships with `err.stack` in the response body — this is a known training bug from the original repo. Phase 0 must fix it. Otherwise your `npm run lint` will pass but you'll fail any rubric audit looking for prod-safe error responses.

- **Server-side `locked` flag for race conditions.** A user click and a timer expiry can race. Set `game.locked = true` at the top of `submitAnswer`, persist, do the work, set `locked = false`, persist again. Reject incoming calls when `locked === true`.

- **Timer leaks (client side).** Every `setInterval` needs a paired `clearInterval` on **all four** exit paths: answer click, timer expiry, results transition, play-again. Centralize teardown in a Timer module inside `public/quiz.js` with an idempotent `stop()`.

- **Question shuffling determinism.** Shuffle the question ID list exactly once in `startGame`, persist it on the Game, and never re-shuffle. If you re-shuffle on each request, `currentIndex` points to a different question every call.

- **localStorage is NOT used in this version.** All persistence is server-side via `store.js`. Don't let Claude reach for localStorage out of habit — that would split state between client and server and create the kind of bugs the homework rubric will dock you for.

- **Scope creep.** The rubric tops out at 100 points. Don't burn prompts on sound effects or animations until Phase 6 — they don't move the score, and the homework explicitly warns against feature overload.

- **Strict equality (`===`) and prettier formatting.** The existing `eslint.config.js` has `eqeqeq: warn` and `.prettierrc` enforces single quotes + no semis. The lint check will catch loose equality; the format check will catch the rest. Set up [Lab 3's auto-format hook](../labs/lab-3-hooks.md) before Phase 2 for compounding gains.

- **Game session cleanup.** `data/games.json` will accumulate finished games forever. Acceptable for a homework, but worth a one-line comment. Don't burn a phase on this.

---

## 11. How to Use This Plan with Claude Code

1. **Start in this repo** (`claude-code-labs/`). You are repurposing it, not creating a new project.
2. **Run `claude`** from the repo root.
3. **Open this document in your editor**, side by side with the terminal.
4. **For each phase**, copy the suggested prompt verbatim (or paraphrase), paste into Claude, then watch what it does.
5. **Phase 0 is non-negotiable.** It deletes the leaderboard domain, fixes the stack-trace leak, and rewrites CLAUDE.md. Skipping it leaves stale code that confuses every later prompt.
6. **Set up the auto-format hook from [Lab 3](../labs/lab-3-hooks.md) before Phase 2.** Compounding gains: every later phase gets free formatting.
7. **After each phase**, run the verification checklist (§9). Don't move on until all checks pass.
8. **If something breaks**, don't try to fix it yourself — describe the bug to Claude and let it fix.
9. **Before submitting**, run a [Lab 4 subagent audit](../labs/lab-4-subagents.md) of `src/` to catch anything you missed.

---

## 12. Rubric Coverage Map

| Phase | Rubric Item | Points |
|---|---|---|
| Phase 0 | CLAUDE.md exists and is useful | 10 |
| Phase 1 | *(foundation, no points yet)* | — |
| Phase 2 | Quiz flow works (show → answer → next → results) | 25 |
| Phase 2 | Scoring is correct | 15 |
| Phase 3 | Timer works with auto-skip | 15 |
| Phase 4 | Gamification feature 1 (streak) + 2 (progress bar) | 10 |
| Phase 5 | Gamification feature 3 (leaderboard) | 10 |
| Phase 6 | Code is clean (no console errors, lint clean, responsive) | 10 |
| Phase 6 | Creativity bonus (keyboard nav, focus mgmt, color flash) | 5 |
| | **Total** | **100** |

Phases 0-5 alone deliver **95/100**. Phase 6 closes out the remaining 5.

---

## 13. References

- Homework spec: [`labs/homework-quiz-arena.md`](../labs/homework-quiz-arena.md)
- CLAUDE.md template + workflow: [`labs/lab-1-claude-md.md`](../labs/lab-1-claude-md.md)
- Auto-format hook setup: [`labs/lab-3-hooks.md`](../labs/lab-3-hooks.md)
- Subagent audits (use one before submitting): [`labs/lab-4-subagents.md`](../labs/lab-4-subagents.md)
- Existing infrastructure being reused:
  - [`src/server.js`](../src/server.js) — Express bootstrap
  - [`src/services/store.js`](../src/services/store.js) — JSON file CRUD
  - [`src/middleware/errorHandler.js`](../src/middleware/errorHandler.js) — error middleware (fix the stack leak in Phase 0)
  - [`config/settings.js`](../config/settings.js) — replace contents in Phase 0
  - [`tests/run.js`](../tests/run.js) — test runner harness
