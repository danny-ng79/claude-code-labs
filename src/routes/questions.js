const express = require('express')
const { loadQuestions, getQuestion } = require('../services/quiz')

const router = express.Router()

router.get('/', (req, res) => {
  const questions = loadQuestions()
  res.json(questions.map((q) => q.toPublic()))
})

router.get('/:id', (req, res) => {
  const question = getQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({ error: 'Question not found' })
  }
  res.json(question.toPublic())
})

module.exports = router
