const { loadCollection, saveCollection, findById } = require('./store')
const { calculatePoints, applyPoints } = require('./scoring')
const { checkAchievements } = require('./achievements')
const { Match } = require('../models/match')

function recordMatch(player1Id, player2Id, result) {
  const players = loadCollection('players')
  const matches = loadCollection('matches')
  const seasons = loadCollection('seasons')

  const player1 = findById(players, player1Id)
  const player2 = findById(players, player2Id)

  if (!player1 || !player2) {
    return { error: 'Player not found' }
  }

  if (player1Id === player2Id) {
    return { error: 'Cannot play against yourself' }
  }

  // Calculate points for player 1
  const p1Result = result === 'player1' ? 'win' : result === 'player2' ? 'loss' : 'draw'
  const p1Score = calculatePoints(p1Result, player1.currentStreak)

  // Calculate points for player 2
  const p2Result = result === 'player2' ? 'win' : result === 'player1' ? 'loss' : 'draw'
  const p2Score = calculatePoints(p2Result, player2.currentStreak)

  // Apply points
  applyPoints(player1, p1Score.points)
  applyPoints(player2, p2Score.points)

  // Update stats
  if (p1Result === 'win') {
    player1.wins++
    player2.losses++
  } else if (p1Result === 'loss') {
    player1.losses++
    player2.wins++
  } else {
    player1.draws++
    player2.draws++
  }

  // Update streaks
  player1.currentStreak = p1Score.newStreak
  player2.currentStreak = p2Score.newStreak
  player1.bestStreak = Math.max(player1.bestStreak, player1.currentStreak)
  player2.bestStreak = Math.max(player2.bestStreak, player2.currentStreak)

  // Check achievements
  const p1Achievements = checkAchievements(player1)
  const p2Achievements = checkAchievements(player2)
  player1.achievements.push(...p1Achievements)
  player2.achievements.push(...p2Achievements)

  // Create match record
  const match = new Match(player1Id, player2Id, result)
  match.pointsAwarded = {
    [player1Id]: p1Score.points,
    [player2Id]: p2Score.points
  }

  // Find active season
  const activeSeason = seasons.find((s) => s.active)
  if (activeSeason) {
    match.seasonId = activeSeason.id
  }

  matches.push(match)
  saveCollection('players', players)
  saveCollection('matches', matches)

  return {
    match,
    player1: { points: p1Score.points, newAchievements: p1Achievements },
    player2: { points: p2Score.points, newAchievements: p2Achievements }
  }
}

function getMatchHistory(playerId, limit = 20) {
  const matches = loadCollection('matches')
  return matches
    .filter((m) => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

module.exports = { recordMatch, getMatchHistory }
