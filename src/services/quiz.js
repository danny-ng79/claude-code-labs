const { loadCollection, saveCollection, findById } = require('./store')
const { Question } = require('../models/question')
const { Game } = require('../models/game')
const settings = require('../../config/settings')

function loadQuestions() {
  const raw = loadCollection('questions')
  return raw.map((q) => new Question(q))
}

function getQuestion(id) {
  const questions = loadQuestions()
  return questions.find((q) => q.id === id) || null
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getMultiplier(streak) {
  const thresholds = settings.scoring.streakMultipliers
  let multiplier = 1
  for (const t of thresholds) {
    if (streak >= t.minStreak) {
      multiplier = t.multiplier
    }
  }
  return multiplier
}

function startGame() {
  const questions = loadQuestions()
  const count = Math.min(settings.quiz.questionsPerGame, questions.length)
  const shuffled = shuffle(questions)
  const selected = shuffled.slice(0, count)
  const questionIds = selected.map((q) => q.id)

  const game = new Game({ questionIds, totalQuestions: count })

  const games = loadCollection('games')
  games.push(game)
  saveCollection('games', games)

  const firstQuestion = getQuestion(questionIds[0])

  return {
    gameId: game.id,
    question: firstQuestion.toPublic(),
    totalQuestions: count
  }
}

function submitAnswer(gameId, choiceIndex) {
  const games = loadCollection('games')
  const game = findById(games, gameId)

  if (!game) {
    const err = new Error('Game not found')
    err.status = 404
    throw err
  }

  if (game.status === 'finished') {
    const err = new Error('Game already finished')
    err.status = 400
    throw err
  }

  if (game.locked) {
    const err = new Error('Answer already being processed')
    err.status = 409
    throw err
  }

  // Lock
  game.locked = true
  saveCollection('games', games)

  const currentQuestionId = game.questionIds[game.currentIndex]
  const question = getQuestion(currentQuestionId)

  const isCorrect = choiceIndex !== null && choiceIndex === question.correctIndex

  if (isCorrect) {
    game.streak++
    if (game.streak > game.maxStreak) {
      game.maxStreak = game.streak
    }
    const multiplier = getMultiplier(game.streak)
    game.score += settings.scoring.basePoints * multiplier
    game.correctCount++
  } else {
    game.streak = 0
  }

  game.currentIndex++

  const isLast = game.currentIndex >= game.totalQuestions

  if (isLast) {
    game.status = 'finished'
    game.finishedAt = new Date().toISOString()
  }

  // Unlock
  game.locked = false
  saveCollection('games', games)

  const response = {
    correct: isCorrect,
    correctIndex: question.correctIndex,
    score: game.score,
    streak: game.streak,
    multiplier: getMultiplier(game.streak)
  }

  if (isLast) {
    const durationMs = new Date(game.finishedAt) - new Date(game.startedAt)
    response.results = {
      score: game.score,
      correctCount: game.correctCount,
      totalQuestions: game.totalQuestions,
      maxStreak: game.maxStreak,
      durationMs
    }
  } else {
    const nextQuestion = getQuestion(game.questionIds[game.currentIndex])
    response.nextQuestion = nextQuestion.toPublic()
  }

  return response
}

function getGame(gameId) {
  const games = loadCollection('games')
  return findById(games, gameId) || null
}

module.exports = { loadQuestions, getQuestion, startGame, submitAnswer, getGame, getMultiplier }
