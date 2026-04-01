const settings = require('../../config/settings')

function calculatePoints(result, currentStreak) {
  const { winPoints, lossPoints, drawPoints, streakBonus, maxStreak } = settings.scoring

  let points = 0
  let newStreak = currentStreak

  switch (result) {
    case 'win':
      points = winPoints
      newStreak = Math.min(currentStreak + 1, maxStreak)
      if (newStreak >= 3) {
        points += streakBonus * Math.floor(newStreak / 3)
      }
      break
    case 'loss':
      points = lossPoints
      newStreak = 0
      break
    case 'draw':
      points = drawPoints
      break
  }

  return { points, newStreak }
}

function calculateRank(totalPoints) {
  const ranks = settings.ranks
  let rank = ranks[0].name

  for (const r of ranks) {
    if (totalPoints >= r.minPoints) {
      rank = r.name
    }
  }

  return rank
}

// TODO: implement rank demotion protection (can't drop more than 1 rank per day)

function getLeaderboard(players, limit = 100) {
  return players
    .filter((p) => p.totalGames > 0 || p.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((p, index) => ({
      position: index + 1,
      username: p.username,
      displayName: p.displayName,
      points: p.points,
      rank: p.rank,
      wins: p.wins,
      winRate: p.winRate,
      streak: p.currentStreak
    }))
}

// BUG: doesn't handle negative points (player points should never go below 0)
function applyPoints(player, points) {
  player.points += points
  player.rank = calculateRank(player.points)
  player.lastActiveAt = new Date().toISOString()
  return player
}

module.exports = { calculatePoints, calculateRank, getLeaderboard, applyPoints }
