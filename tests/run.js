const { Question } = require('../src/models/question')
const { loadQuestions, getQuestion, startGame, submitAnswer, getMultiplier } = require('../src/services/quiz')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  PASS: ${name}`)
    passed++
  } catch (e) {
    console.log(`  FAIL: ${name}`)
    console.log(`        ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

// --- Question model tests ---

test('Question.toPublic omits correctIndex', () => {
  const q = new Question({
    id: 'q-test',
    category: 'Test',
    prompt: 'Test?',
    choices: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
    explanation: 'Because'
  })
  const pub = q.toPublic()
  assert(pub.id === 'q-test', 'Should have id')
  assert(pub.prompt === 'Test?', 'Should have prompt')
  assert(pub.choices.length === 4, 'Should have 4 choices')
  assert(pub.correctIndex === undefined, 'Must not leak correctIndex')
  assert(pub.explanation === undefined, 'Must not leak explanation')
})

test('loadQuestions returns array of Questions', () => {
  const questions = loadQuestions()
  assert(Array.isArray(questions), 'Should be array')
  assert(questions.length >= 10, `Expected >= 10 questions, got ${questions.length}`)
  assert(questions[0] instanceof Question, 'Items should be Question instances')
})

test('getQuestion returns correct question', () => {
  const q = getQuestion('q-001')
  assert(q !== null, 'Should find q-001')
  assert(q.id === 'q-001', 'Id should match')
})

test('getQuestion returns null for unknown id', () => {
  const q = getQuestion('q-nonexistent')
  assert(q === null, 'Should return null')
})

// --- Game flow tests ---

test('startGame returns gameId and first question', () => {
  const result = startGame()
  assert(result.gameId, 'Should have gameId')
  assert(result.question, 'Should have question')
  assert(result.question.prompt, 'Question should have prompt')
  assert(result.question.correctIndex === undefined, 'Question must not leak correctIndex')
  assert(result.totalQuestions === 10, `Expected 10 questions, got ${result.totalQuestions}`)
})

test('submitAnswer correct answer scores points', () => {
  const game = startGame()
  const questionId = 'q-001'
  const question = getQuestion(game.question.id)
  const result = submitAnswer(game.gameId, question.correctIndex)
  assert(result.correct === true, 'Should be correct')
  assert(result.score > 0, `Score should be positive, got ${result.score}`)
})

test('submitAnswer wrong answer scores 0', () => {
  const game = startGame()
  const question = getQuestion(game.question.id)
  const wrongIndex = (question.correctIndex + 1) % 4
  const result = submitAnswer(game.gameId, wrongIndex)
  assert(result.correct === false, 'Should be wrong')
  assert(result.score === 0, `Score should be 0, got ${result.score}`)
})

test('submitAnswer null (timeout) scores as wrong', () => {
  const game = startGame()
  const result = submitAnswer(game.gameId, null)
  assert(result.correct === false, 'Timeout should be wrong')
  assert(result.score === 0, `Score should be 0, got ${result.score}`)
})

test('double-submit is rejected (locked)', () => {
  // Play a full game to verify the locked flag concept
  // The lock is set/unset within a single sync call, so we test
  // that a finished game rejects further answers
  const game = startGame()
  for (let i = 0; i < 10; i++) {
    submitAnswer(game.gameId, 0)
  }
  let threw = false
  try {
    submitAnswer(game.gameId, 0)
  } catch (e) {
    threw = true
    assert(e.status === 400, `Expected 400, got ${e.status}`)
  }
  assert(threw, 'Should throw on finished game')
})

test('end-of-game returns results', () => {
  const game = startGame()
  let result
  for (let i = 0; i < 10; i++) {
    result = submitAnswer(game.gameId, 0)
  }
  assert(result.results, 'Last answer should return results')
  assert(typeof result.results.score === 'number', 'Results should have score')
  assert(typeof result.results.correctCount === 'number', 'Results should have correctCount')
  assert(typeof result.results.maxStreak === 'number', 'Results should have maxStreak')
  assert(typeof result.results.durationMs === 'number', 'Results should have durationMs')
})

// --- Streak + multiplier tests ---

test('getMultiplier returns 1x for streak < 3', () => {
  assert(getMultiplier(0) === 1, 'Streak 0 should be 1x')
  assert(getMultiplier(2) === 1, 'Streak 2 should be 1x')
})

test('getMultiplier returns 2x for streak 3-4', () => {
  assert(getMultiplier(3) === 2, 'Streak 3 should be 2x')
  assert(getMultiplier(4) === 2, 'Streak 4 should be 2x')
})

test('getMultiplier returns 3x for streak >= 5', () => {
  assert(getMultiplier(5) === 3, 'Streak 5 should be 3x')
  assert(getMultiplier(10) === 3, 'Streak 10 should be 3x')
})

test('streak resets on wrong answer', () => {
  const game = startGame()
  // Answer 2 correctly, then 1 wrong
  const q1 = getQuestion(game.question.id)
  const r1 = submitAnswer(game.gameId, q1.correctIndex)
  assert(r1.streak === 1, `Expected streak 1, got ${r1.streak}`)

  const q2 = getQuestion(r1.nextQuestion.id)
  const r2 = submitAnswer(game.gameId, q2.correctIndex)
  assert(r2.streak === 2, `Expected streak 2, got ${r2.streak}`)

  const q3 = getQuestion(r2.nextQuestion.id)
  const wrongIdx = (q3.correctIndex + 1) % 4
  const r3 = submitAnswer(game.gameId, wrongIdx)
  assert(r3.streak === 0, `Expected streak 0 after wrong, got ${r3.streak}`)
})

// --- Leaderboard tests ---

const { getTopScores, addScore, sanitizeName } = require('../src/services/leaderboard')
const { loadCollection, saveCollection } = require('../src/services/store')

// Save real scores before leaderboard tests, restore after
const _savedScores = loadCollection('scores')

test('leaderboard sorts by score descending', () => {
  saveCollection('scores', { version: 1, entries: [] })
  addScore({ name: 'Alice', score: 50, accuracy: 0.5, durationMs: 10000, maxStreak: 2, playedAt: new Date().toISOString() })
  addScore({ name: 'Bob', score: 100, accuracy: 1, durationMs: 8000, maxStreak: 5, playedAt: new Date().toISOString() })
  const data = getTopScores()
  assert(data.entries[0].name === 'Bob', `Expected Bob first, got ${data.entries[0].name}`)
  assert(data.entries[1].name === 'Alice', `Expected Alice second, got ${data.entries[1].name}`)
})

test('leaderboard entry has unique id', () => {
  saveCollection('scores', { version: 1, entries: [] })
  addScore({ name: 'IDTest', score: 10, accuracy: 0.5, durationMs: 5000, maxStreak: 1, playedAt: new Date().toISOString() })
  addScore({ name: 'IDTest', score: 10, accuracy: 0.5, durationMs: 5000, maxStreak: 1, playedAt: new Date().toISOString() })
  const data = getTopScores()
  assert(data.entries.length === 2, 'Should have 2 entries with same name')
  assert(data.entries[0].id, 'Should have an id')
  assert(data.entries[0].id !== data.entries[1].id, 'IDs must be unique')
})

test('leaderboard caps at top 10', () => {
  saveCollection('scores', { version: 1, entries: [] })
  for (let i = 0; i < 15; i++) {
    addScore({ name: 'P' + i, score: i * 10, accuracy: 0.5, durationMs: 10000, maxStreak: 1, playedAt: new Date().toISOString() })
  }
  const data = getTopScores()
  assert(data.entries.length === 10, `Expected 10 entries, got ${data.entries.length}`)
  assert(data.entries[0].score === 140, `Expected top score 140, got ${data.entries[0].score}`)
})

test('sanitizeName truncates to 12 chars', () => {
  const result = sanitizeName('ThisIsAVeryLongPlayerName')
  assert(result.length <= 12, `Expected <= 12 chars, got ${result.length}`)
})

test('sanitizeName strips control characters', () => {
  const result = sanitizeName('test\x00\x01\x02name')
  assert(result === 'testname', `Expected "testname", got "${result}"`)
})

test('corrupt scores file returns empty leaderboard', () => {
  saveCollection('scores', 'garbage')
  const data = getTopScores()
  assert(data.version === 1, 'Should have version 1')
  assert(Array.isArray(data.entries), 'Entries should be array')
  assert(data.entries.length === 0, 'Entries should be empty')
})

// Restore real scores after leaderboard tests
saveCollection('scores', _savedScores || { version: 1, entries: [] })

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
