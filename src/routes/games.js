const express = require('express')
const { startGame, submitAnswer } = require('../services/quiz')
const { validateAnswerSubmission } = require('../middleware/validate')

const router = express.Router()

router.post('/', (req, res) => {
  const result = startGame()
  res.json(result)
})

router.post('/:id/answer', validateAnswerSubmission, (req, res, next) => {
  try {
    const { choiceIndex } = req.body
    const result = submitAnswer(req.params.id, choiceIndex !== undefined ? choiceIndex : null)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

module.exports = router
