const settings = require('../../config/settings')

function checkAchievements(player) {
  const newAchievements = []
  const earned = player.achievements.map((a) => a.id)

  // Check win-based achievements
  if (player.wins >= settings.achievements.firstWin.threshold && !earned.includes('firstWin')) {
    newAchievements.push({
      id: 'firstWin',
      ...settings.achievements.firstWin,
      earnedAt: new Date().toISOString()
    })
  }

  if (player.wins >= settings.achievements.tenWins.threshold && !earned.includes('tenWins')) {
    newAchievements.push({
      id: 'tenWins',
      ...settings.achievements.tenWins,
      earnedAt: new Date().toISOString()
    })
  }

  if (
    player.wins >= settings.achievements.hundredWins.threshold &&
    !earned.includes('hundredWins')
  ) {
    newAchievements.push({
      id: 'hundredWins',
      ...settings.achievements.hundredWins,
      earnedAt: new Date().toISOString()
    })
  }

  // Check streak achievements
  if (
    player.currentStreak >= settings.achievements.winStreak5.threshold &&
    !earned.includes('winStreak5')
  ) {
    newAchievements.push({
      id: 'winStreak5',
      ...settings.achievements.winStreak5,
      earnedAt: new Date().toISOString()
    })
  }

  if (
    player.currentStreak >= settings.achievements.winStreak10.threshold &&
    !earned.includes('winStreak10')
  ) {
    newAchievements.push({
      id: 'winStreak10',
      ...settings.achievements.winStreak10,
      earnedAt: new Date().toISOString()
    })
  }

  return newAchievements
}

// TODO: add achievement progress tracking (e.g., "7/10 wins for Veteran")
// TODO: add rare achievements (win 10 games without losing)

function getAchievementSummary(player) {
  const total = Object.keys(settings.achievements).length
  const earned = player.achievements.length
  return {
    earned,
    total,
    percentage: Math.round((earned / total) * 100),
    achievements: player.achievements
  }
}

module.exports = { checkAchievements, getAchievementSummary }
