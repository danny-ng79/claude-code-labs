function validateUsername(req, res, next) {
  const { username } = req.body
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res
      .status(400)
      .json({ error: 'Username can only contain letters, numbers, and underscores' })
  }
  next()
}

function validateMatchResult(req, res, next) {
  const { player1Id, player2Id, result } = req.body
  if (!player1Id || !player2Id) {
    return res.status(400).json({ error: 'Both player IDs are required' })
  }
  if (!['player1', 'player2', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Result must be player1, player2, or draw' })
  }
  next()
}

// TODO: add rate limiting middleware
// TODO: add API key authentication

module.exports = { validateUsername, validateMatchResult }
