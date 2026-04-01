const express = require('express')
const router = express.Router()
const { Player } = require('../models/player')
const { loadCollection, saveCollection, findById, findByField } = require('../services/store')
const { validateUsername } = require('../middleware/validate')
const { getAchievementSummary } = require('../services/achievements')

// GET /api/players
router.get('/', (req, res) => {
  const players = loadCollection('players')
  res.json(
    players.map((p) =>
      new Player(p.username, p.displayName).toPublic
        ? {
            id: p.id,
            username: p.username,
            displayName: p.displayName,
            points: p.points,
            rank: p.rank,
            wins: p.wins,
            losses: p.losses
          }
        : p
    )
  )
})

// GET /api/players/:id
router.get('/:id', (req, res) => {
  const players = loadCollection('players')
  const player = findById(players, req.params.id)
  if (!player) {
    return res.status(404).json({ error: 'Player not found' })
  }
  res.json({
    ...player,
    achievementSummary: getAchievementSummary(player)
  })
})

// POST /api/players
router.post('/', validateUsername, (req, res) => {
  const players = loadCollection('players')
  const { username, displayName } = req.body

  // Check duplicate
  const existing = findByField(players, 'username', username)
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' })
  }

  const player = new Player(username, displayName)
  players.push(player)
  saveCollection('players', players)

  res.status(201).json(player)
})

// GET /api/players/:id/matches
router.get('/:id/matches', (req, res) => {
  const { getMatchHistory } = require('../services/matchmaking')
  const limit = parseInt(req.query.limit) || 20
  const matches = getMatchHistory(req.params.id, limit)
  res.json(matches)
})

module.exports = router
