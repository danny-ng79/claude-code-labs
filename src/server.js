const express = require('express')
const path = require('path')
const settings = require('../config/settings')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Routes
app.use('/api/players', require('./routes/players'))
app.use('/api/matches', require('./routes/matches'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/seasons', require('./routes/seasons'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start server
if (require.main === module) {
  app.listen(settings.port, () => {
    console.log(`Game Leaderboard API running on http://localhost:${settings.port}`)
  })
}

module.exports = app
