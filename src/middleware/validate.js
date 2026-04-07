function validateAnswerSubmission(req, res, next) {
  const { choiceIndex } = req.body
  if (choiceIndex === null) {
    return next()
  }
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) {
    return res.status(400).json({ error: 'choiceIndex must be an integer 0-3 or null' })
  }
  next()
}

function validateScoreSubmission(req, res, next) {
  const { gameId, name } = req.body
  if (!gameId || typeof gameId !== 'string') {
    return res.status(400).json({ error: 'gameId is required' })
  }
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' })
  }
  next()
}

module.exports = { validateAnswerSubmission, validateScoreSubmission }
