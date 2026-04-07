const { loadCollection, saveCollection } = require('./store')
const crypto = require('crypto')
const settings = require('../../config/settings')

function sanitizeName(name) {
  // Strip control characters, trim, truncate
  return name
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
    .slice(0, settings.leaderboard.nameMaxLength)
}

function loadScores() {
  const raw = loadCollection('scores')
  if (raw && raw.version === 1 && Array.isArray(raw.entries)) {
    return raw
  }
  return { version: 1, entries: [] }
}

function getTopScores() {
  return loadScores()
}

function addScore(entry) {
  const data = loadScores()
  const sanitized = {
    id: entry.id || Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex'),
    ...entry,
    name: sanitizeName(entry.name)
  }
  data.entries.push(sanitized)
  data.entries.sort((a, b) => b.score - a.score)
  data.entries = data.entries.slice(0, settings.leaderboard.topN)
  saveCollection('scores', data)
  return data
}

module.exports = { getTopScores, addScore, sanitizeName }
