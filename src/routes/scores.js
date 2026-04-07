const express = require('express')
const { getTopScores, addScore } = require('../services/leaderboard')
const { getGame } = require('../services/quiz')
const { Score } = require('../models/score')
const { validateScoreSubmission } = require('../middleware/validate')

const router = express.Router()

router.get('/', (req, res) => {
  const scores = getTopScores()
  res.json(scores)
})

router.post('/', validateScoreSubmission, (req, res) => {
  const { gameId, name } = req.body
  const game = getGame(gameId)

  if (!game) {
    return res.status(404).json({ error: 'Game not found' })
  }

  if (game.status !== 'finished') {
    return res.status(400).json({ error: 'Game is not finished' })
  }

  const accuracy = game.totalQuestions > 0 ? game.correctCount / game.totalQuestions : 0
  const durationMs = new Date(game.finishedAt) - new Date(game.startedAt)

  const scoreEntry = new Score({
    name,
    score: game.score,
    accuracy,
    durationMs,
    maxStreak: game.maxStreak
  })

  const updated = addScore(scoreEntry)
  res.json(updated)
})

module.exports = router
