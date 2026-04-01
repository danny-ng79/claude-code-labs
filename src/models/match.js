class Match {
  constructor(player1Id, player2Id, result) {
    this.id = 'match_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4)
    this.player1Id = player1Id
    this.player2Id = player2Id
    this.result = result // 'player1', 'player2', 'draw'
    this.seasonId = null
    this.timestamp = new Date().toISOString()
    this.pointsAwarded = {}
  }
}

module.exports = { Match }
