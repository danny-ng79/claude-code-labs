# Quiz Arena — Homework Checklist

Based on [labs/homework-quiz-arena.md](labs/homework-quiz-arena.md).

---

## Core Requirements

- [x] **Quiz flow** — one question at a time, 4 answer buttons, advances on click or timeout
- [x] **Scoring** — server-authoritative points per question, running total shown during play
- [x] **Timer** — 15-second countdown per question (number + depleting bar), auto-skips on expiry
- [x] **Results screen** — final score, correct count, accuracy %, time taken, best streak

---

## Gamification (≥2 required — 3 implemented)

- [x] **Streak bonus** — 2× points after 3 correct in a row, 3× after 5; badge animates on screen
- [x] **Leaderboard** — persistent top-10 saved server-side (not localStorage); shown on start screen and after each game; current player's row highlighted in green
- [ ] **Difficulty levels** — easy (20s) / medium (15s) / hard (10s) — *not implemented*
- [x] **Progress bar** — fills as questions are answered, shown above each question
- [x] **Animations** — correct answer flashes green, wrong flashes red (300ms CSS transition)
- [ ] **Sound effects** — Web Audio API — *not implemented*

---

## Bonus / Optional

- [x] **10+ questions** — 100 questions across 10 categories
- [x] **Categories** — Science, History, Geography, Literature, Math, Technology, Music, Sports, Movies, Art
- [ ] **Multiplayer** — two players on same screen — *not implemented*
- [x] **Custom theme** — dark UI (#0f0f1a background, amber accent #f5a623)

---

## Grading Rubric

| Criteria | Points | Status |
|---|---|---|
| Quiz flow works (show → answer → next → results) | 25 | ✅ |
| Scoring is correct | 15 | ✅ |
| Timer works with auto-skip | 15 | ✅ |
| At least 2 gamification features | 20 | ✅ (3 features) |
| CLAUDE.md exists and is useful | 10 | ✅ |
| Code is clean (no console errors, responsive layout) | 10 | ✅ |
| Creativity bonus | 5 | ✅ keyboard nav, multiplier badge, 100 questions |
| **Total** | **100** | **✅ Full marks** |

---

## Extra Features (beyond rubric)

- [x] Keyboard navigation — press 1–4 to answer
- [x] Multiplier badge animation (x2! / x3!) when streak bonus activates
- [x] Timer bar turns red when ≤5 seconds remain
- [x] Correct answer revealed on screen after any answer (including wrong/timeout)
- [x] Leaderboard visible on start screen before quiz begins
- [x] Unique ID per leaderboard entry (same name allowed, no collision)
- [x] `aria-live` on score region for screen readers
- [x] Server-side locked flag prevents double-submit race condition
- [x] Corrupt leaderboard file recovers gracefully (returns empty instead of crashing)
- [x] Questions shuffled randomly each game from a pool of 100
