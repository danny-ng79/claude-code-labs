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
