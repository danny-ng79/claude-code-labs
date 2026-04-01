const express = require('express')
const router = express.Router()
const { Season } = require('../models/season')
const { loadCollection, saveCollection, findById } = require('../services/store')
const { getLeaderboard } = require('../services/scoring')

// GET /api/seasons
router.get('/', (req, res) => {
  const seasons = loadCollection('seasons')
  res.json(seasons)
})

// POST /api/seasons
router.post('/', (req, res) => {
  const seasons = loadCollection('seasons')
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Season name is required' })
  }

  // Check if there's already an active season
  const activeSeason = seasons.find((s) => s.active)
  if (activeSeason) {
    return res.status(409).json({ error: 'An active season already exists. End it first.' })
  }

  const season = new Season(name)
  seasons.push(season)
  saveCollection('seasons', seasons)

  res.status(201).json(season)
})

// POST /api/seasons/:id/end
router.post('/:id/end', (req, res) => {
  const seasons = loadCollection('seasons')
  const players = loadCollection('players')
  const season = findById(seasons, req.params.id)

  if (!season) {
    return res.status(404).json({ error: 'Season not found' })
  }

  season.active = false
  season.endDate = new Date().toISOString()
  season.topPlayers = getLeaderboard(players, 10)

  saveCollection('seasons', seasons)

  res.json({ message: 'Season ended', season })
})

module.exports = router
