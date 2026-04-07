const crypto = require('crypto')

class Game {
  constructor({ questionIds, totalQuestions }) {
    this.id = crypto.randomUUID()
    this.status = 'playing'
    this.questionIds = questionIds
    this.totalQuestions = totalQuestions
    this.currentIndex = 0
    this.score = 0
    this.streak = 0
    this.maxStreak = 0
    this.correctCount = 0
    this.startedAt = new Date().toISOString()
    this.finishedAt = null
    this.locked = false
  }
}

module.exports = { Game }
