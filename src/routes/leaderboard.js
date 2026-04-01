const express = require('express')
const router = express.Router()
const { loadCollection } = require('../services/store')
const { getLeaderboard } = require('../services/scoring')

// GET /api/leaderboard
router.get('/', (req, res) => {
  const players = loadCollection('players')
  const limit = parseInt(req.query.limit) || 100
  const leaderboard = getLeaderboard(players, limit)
  res.json(leaderboard)
})

// GET /api/leaderboard/rank/:rank
router.get('/rank/:rank', (req, res) => {
  const players = loadCollection('players')
  const rank = req.params.rank.charAt(0).toUpperCase() + req.params.rank.slice(1).toLowerCase()
  const filtered = players.filter((p) => p.rank === rank)
  const leaderboard = getLeaderboard(filtered)
  res.json(leaderboard)
})

module.exports = router
