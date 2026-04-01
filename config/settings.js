module.exports = {
  port: process.env.PORT || 3000,
  dataDir: process.env.DATA_DIR || './data',

  seasons: {
    durationDays: 30,
    topPlayersCount: 100
  },

  scoring: {
    winPoints: 10,
    lossPoints: -3,
    drawPoints: 2,
    streakBonus: 5,
    maxStreak: 10
  },

  achievements: {
    firstWin: { name: 'First Blood', description: 'Win your first game', threshold: 1 },
    tenWins: { name: 'Veteran', description: 'Win 10 games', threshold: 10 },
    hundredWins: { name: 'Legend', description: 'Win 100 games', threshold: 100 },
    winStreak5: { name: 'On Fire', description: '5 wins in a row', threshold: 5 },
    winStreak10: { name: 'Unstoppable', description: '10 wins in a row', threshold: 10 },
    topTen: { name: 'Elite', description: 'Reach top 10 in a season', threshold: 10 }
  },

  ranks: [
    { name: 'Bronze', minPoints: 0 },
    { name: 'Silver', minPoints: 100 },
    { name: 'Gold', minPoints: 300 },
    { name: 'Platinum', minPoints: 600 },
    { name: 'Diamond', minPoints: 1000 },
    { name: 'Master', minPoints: 2000 }
  ]
}
