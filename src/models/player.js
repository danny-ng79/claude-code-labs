class Player {
  constructor(username, displayName) {
    this.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    this.username = username
    this.displayName = displayName || username
    this.points = 0
    this.wins = 0
    this.losses = 0
    this.draws = 0
    this.currentStreak = 0
    this.bestStreak = 0
    this.achievements = []
    this.rank = 'Bronze'
    this.seasonId = null
    this.createdAt = new Date().toISOString()
    this.lastActiveAt = new Date().toISOString()
  }

  get totalGames() {
    return this.wins + this.losses + this.draws
  }

  // BUG: winRate returns NaN when totalGames is 0
  get winRate() {
    return Math.round((this.wins / this.totalGames) * 100)
  }

  toPublic() {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      points: this.points,
      rank: this.rank,
      wins: this.wins,
      losses: this.losses,
      winRate: this.winRate,
      achievements: this.achievements,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak
    }
  }
}

module.exports = { Player }
