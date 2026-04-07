const crypto = require('crypto')

class Score {
  constructor({ name, score, accuracy, durationMs, maxStreak }) {
    this.id = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex')
    this.name = name
    this.score = score
    this.accuracy = accuracy
    this.durationMs = durationMs
    this.maxStreak = maxStreak
    this.playedAt = new Date().toISOString()
  }
}

module.exports = { Score }
