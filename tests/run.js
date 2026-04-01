const { Player } = require('../src/models/player')
const { Season } = require('../src/models/season')
const { Match } = require('../src/models/match')
const {
  calculatePoints,
  calculateRank,
  getLeaderboard,
  applyPoints
} = require('../src/services/scoring')
const { checkAchievements } = require('../src/services/achievements')
const { formatDuration, formatNumber } = require('../src/utils/format')

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

// --- Player tests ---

test('Player has correct defaults', () => {
  const p = new Player('testuser', 'Test User')
  assert(p.username === 'testuser', `Expected testuser, got ${p.username}`)
  assert(p.points === 0, 'Points should be 0')
  assert(p.rank === 'Bronze', `Expected Bronze, got ${p.rank}`)
  assert(p.wins === 0, 'Wins should be 0')
})

test('Player.totalGames sums correctly', () => {
  const p = new Player('test')
  p.wins = 5
  p.losses = 3
  p.draws = 2
  assert(p.totalGames === 10, `Expected 10, got ${p.totalGames}`)
})

test('Player.winRate calculates correctly', () => {
  const p = new Player('test')
  p.wins = 7
  p.losses = 3
  p.draws = 0
  assert(p.winRate === 70, `Expected 70, got ${p.winRate}`)
})

test('Player.toPublic hides internal fields', () => {
  const p = new Player('test', 'Test')
  const pub = p.toPublic()
  assert(pub.username === 'test', 'Should have username')
  assert(!pub.createdAt, 'Should not have createdAt')
  assert(!pub.lastActiveAt, 'Should not have lastActiveAt')
})

// --- Season tests ---

test('Season starts active', () => {
  const s = new Season('Season 1')
  assert(s.active === true, 'Should be active')
  assert(s.endDate === null, 'Should have no end date')
})

test('Season.end() deactivates', () => {
  const s = new Season('Season 1')
  s.end()
  assert(s.active === false, 'Should be inactive')
  assert(s.endDate !== null, 'Should have end date')
})

// --- Match tests ---

test('Match has correct structure', () => {
  const m = new Match('p1', 'p2', 'player1')
  assert(m.player1Id === 'p1', 'Should have player1Id')
  assert(m.result === 'player1', 'Should have result')
  assert(m.timestamp, 'Should have timestamp')
})

// --- Scoring tests ---

test('Win gives positive points', () => {
  const result = calculatePoints('win', 0)
  assert(result.points > 0, `Expected positive, got ${result.points}`)
  assert(result.newStreak === 1, `Expected streak 1, got ${result.newStreak}`)
})

test('Loss gives negative points and resets streak', () => {
  const result = calculatePoints('loss', 5)
  assert(result.points < 0, `Expected negative, got ${result.points}`)
  assert(result.newStreak === 0, `Expected streak 0, got ${result.newStreak}`)
})

test('Streak bonus applies after 3 wins', () => {
  const noStreak = calculatePoints('win', 0)
  const withStreak = calculatePoints('win', 5)
  assert(withStreak.points > noStreak.points, 'Streak should give more points')
})

test('calculateRank returns correct rank', () => {
  assert(calculateRank(0) === 'Bronze', 'Should be Bronze')
  assert(calculateRank(100) === 'Silver', 'Should be Silver')
  assert(calculateRank(300) === 'Gold', 'Should be Gold')
  assert(calculateRank(2000) === 'Master', 'Should be Master')
})

test('getLeaderboard sorts by points descending', () => {
  const players = [
    {
      points: 50,
      wins: 1,
      losses: 0,
      draws: 0,
      totalGames: 1,
      username: 'a',
      displayName: 'A',
      rank: 'Bronze',
      winRate: 100,
      currentStreak: 0
    },
    {
      points: 200,
      wins: 5,
      losses: 0,
      draws: 0,
      totalGames: 5,
      username: 'b',
      displayName: 'B',
      rank: 'Silver',
      winRate: 100,
      currentStreak: 0
    },
    {
      points: 100,
      wins: 3,
      losses: 1,
      draws: 0,
      totalGames: 4,
      username: 'c',
      displayName: 'C',
      rank: 'Silver',
      winRate: 75,
      currentStreak: 0
    }
  ]
  const lb = getLeaderboard(players)
  assert(lb[0].username === 'b', `Expected b first, got ${lb[0].username}`)
  assert(lb[0].position === 1, 'First should be position 1')
})

// --- Achievement tests ---

test('First win achievement triggers', () => {
  const player = { wins: 1, currentStreak: 0, achievements: [] }
  const earned = checkAchievements(player)
  assert(earned.length === 1, `Expected 1 achievement, got ${earned.length}`)
  assert(earned[0].id === 'firstWin', `Expected firstWin, got ${earned[0].id}`)
})

test('No duplicate achievements', () => {
  const player = { wins: 1, currentStreak: 0, achievements: [{ id: 'firstWin' }] }
  const earned = checkAchievements(player)
  assert(earned.length === 0, `Expected 0, got ${earned.length}`)
})

// --- Format tests ---

test('formatDuration handles various ranges', () => {
  assert(formatDuration(5000) === '5s', 'Should format seconds')
  assert(formatDuration(125000) === '2m 5s', 'Should format minutes')
  assert(formatDuration(7200000) === '2h 0m', 'Should format hours')
})

test('formatNumber abbreviates large numbers', () => {
  assert(formatNumber(500) === '500', 'Should keep small numbers')
  assert(formatNumber(1500) === '1.5K', 'Should abbreviate thousands')
  assert(formatNumber(2500000) === '2.5M', 'Should abbreviate millions')
})

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
