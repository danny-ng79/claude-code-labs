const express = require('express')
const path = require('path')
const settings = require('../config/settings')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Routes
app.use('/api/questions', require('./routes/questions'))
app.use('/api/games', require('./routes/games'))
app.use('/api/scores', require('./routes/scores'))

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
    console.log(`Quiz Arena running on http://localhost:${settings.port}`)
  })
}

module.exports = app
