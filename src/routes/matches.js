const express = require('express')
const router = express.Router()
const { recordMatch } = require('../services/matchmaking')
const { validateMatchResult } = require('../middleware/validate')
const { loadCollection } = require('../services/store')

// POST /api/matches
router.post('/', validateMatchResult, (req, res) => {
  const { player1Id, player2Id, result } = req.body
  const outcome = recordMatch(player1Id, player2Id, result)

  if (outcome.error) {
    return res.status(400).json({ error: outcome.error })
  }

  res.status(201).json(outcome)
})

// GET /api/matches
router.get('/', (req, res) => {
  const matches = loadCollection('matches')
  const limit = parseInt(req.query.limit) || 50
  const recent = matches
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
  res.json(recent)
})

module.exports = router
