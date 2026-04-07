;(function () {
  'use strict'

  const app = document.getElementById('app')

  // --- State ---
  let state = 'idle' // idle | playing | results
  let gameId = null
  let currentQuestion = null
  let totalQuestions = 0
  let currentIndex = 0
  let score = 0
  let streak = 0
  let startTime = null
  let myScoreId = null // id of the entry just submitted

  // --- Timer module ---
  const Timer = (function () {
    let intervalId = null
    let remaining = 0

    function start(durationMs, onTick, onExpire) {
      stop()
      remaining = Math.ceil(durationMs / 1000)
      onTick(remaining)
      intervalId = setInterval(function () {
        remaining--
        onTick(remaining)
        if (remaining <= 0) {
          stop()
          onExpire()
        }
      }, 1000)
    }

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    return { start, stop }
  })()

  // --- Render functions ---

  function renderIdle() {
    state = 'idle'
    Timer.stop()
    app.innerHTML = ''
    var h1 = document.createElement('h1')
    h1.textContent = 'Quiz Arena'
    app.appendChild(h1)

    var card = document.createElement('div')
    card.className = 'card'
    card.style.textAlign = 'center'

    var p = document.createElement('p')
    p.textContent = 'Test your knowledge with 10 timed trivia questions!'
    p.style.marginBottom = '1.5rem'
    card.appendChild(p)

    var btn = document.createElement('button')
    btn.className = 'start-btn'
    btn.textContent = 'Start Quiz'
    btn.addEventListener('click', startGame)
    card.appendChild(btn)

    app.appendChild(card)

    // Leaderboard section below start card
    var lbCard = document.createElement('div')
    lbCard.className = 'card'

    var lbHeader = document.createElement('h2')
    lbHeader.textContent = 'Leaderboard'
    lbHeader.style.marginBottom = '0.75rem'
    lbCard.appendChild(lbHeader)

    var lbContainer = document.createElement('div')
    lbContainer.id = 'leaderboard'
    lbContainer.textContent = 'Loading...'
    lbCard.appendChild(lbContainer)

    app.appendChild(lbCard)

    loadLeaderboard()
  }

  function renderQuestion() {
    app.innerHTML = ''
    var h1 = document.createElement('h1')
    h1.textContent = 'Quiz Arena'
    app.appendChild(h1)

    // Progress bar
    var progressContainer = document.createElement('div')
    progressContainer.className = 'progress-container'
    var progressBar = document.createElement('div')
    progressBar.className = 'progress-bar'
    progressBar.style.width = ((currentIndex + 1) / totalQuestions * 100) + '%'
    progressContainer.appendChild(progressBar)
    app.appendChild(progressContainer)

    // Score bar
    var scoreBar = document.createElement('div')
    scoreBar.className = 'score-bar'
    scoreBar.setAttribute('aria-live', 'polite')

    var scoreEl = document.createElement('span')
    scoreEl.className = 'score'
    scoreEl.textContent = 'Score: ' + score
    scoreBar.appendChild(scoreEl)

    var streakEl = document.createElement('span')
    streakEl.className = 'streak'
    streakEl.textContent = streak > 0 ? 'Streak: ' + streak : ''
    scoreBar.appendChild(streakEl)

    var timerEl = document.createElement('span')
    timerEl.className = 'timer'
    timerEl.textContent = ''
    scoreBar.appendChild(timerEl)

    app.appendChild(scoreBar)

    // Timer countdown bar
    var timerBarContainer = document.createElement('div')
    timerBarContainer.className = 'timer-bar-container'
    var timerBar = document.createElement('div')
    timerBar.className = 'timer-bar'
    timerBar.style.width = '100%'
    timerBarContainer.appendChild(timerBar)
    app.appendChild(timerBarContainer)

    // Question card
    var card = document.createElement('div')
    card.className = 'card'

    var cat = document.createElement('div')
    cat.className = 'category'
    cat.textContent = currentQuestion.category + ' — Q' + (currentIndex + 1) + '/' + totalQuestions
    card.appendChild(cat)

    var prompt = document.createElement('div')
    prompt.className = 'prompt'
    prompt.textContent = currentQuestion.prompt
    card.appendChild(prompt)

    var choices = document.createElement('div')
    choices.className = 'choices'

    currentQuestion.choices.forEach(function (choice, i) {
      var btn = document.createElement('button')
      btn.className = 'choice-btn'
      btn.textContent = (i + 1) + '. ' + choice
      btn.setAttribute('data-index', i)
      btn.addEventListener('click', function () {
        submitAnswer(i)
      })
      choices.appendChild(btn)
    })

    card.appendChild(choices)
    app.appendChild(card)

    // Start timer
    var totalSec = 15
    Timer.start(15000, function (sec) {
      timerEl.textContent = sec + 's'
      timerBar.style.width = ((sec / totalSec) * 100) + '%'
      if (sec <= 5) {
        timerEl.className = 'timer warning'
        timerBar.className = 'timer-bar warning'
      } else {
        timerEl.className = 'timer'
        timerBar.className = 'timer-bar'
      }
    }, function () {
      submitAnswer(null)
    })
  }

  function renderResults(results) {
    state = 'results'
    Timer.stop()
    app.innerHTML = ''

    var h1 = document.createElement('h1')
    h1.textContent = 'Quiz Arena'
    app.appendChild(h1)

    var card = document.createElement('div')
    card.className = 'card results'

    var h2 = document.createElement('h2')
    h2.textContent = 'Game Over!'
    card.appendChild(h2)

    var stats = [
      { label: 'Score', value: results.score },
      { label: 'Correct', value: results.correctCount + '/' + results.totalQuestions },
      {
        label: 'Accuracy',
        value: Math.round((results.correctCount / results.totalQuestions) * 100) + '%'
      },
      { label: 'Best Streak', value: results.maxStreak },
      { label: 'Time', value: Math.round(results.durationMs / 1000) + 's' }
    ]

    stats.forEach(function (s) {
      var div = document.createElement('div')
      div.className = 'stat'
      var strong = document.createElement('strong')
      strong.textContent = s.label + ': '
      div.appendChild(strong)
      div.appendChild(document.createTextNode(s.value))
      card.appendChild(div)
    })

    // Name input for leaderboard
    var nameLabel = document.createElement('div')
    nameLabel.className = 'stat'
    nameLabel.style.marginTop = '1rem'
    nameLabel.textContent = 'Enter your name for the leaderboard:'
    card.appendChild(nameLabel)

    var nameInput = document.createElement('input')
    nameInput.className = 'name-input'
    nameInput.type = 'text'
    nameInput.maxLength = 12
    nameInput.placeholder = 'Your name'
    nameInput.value = 'Anon'
    card.appendChild(nameInput)

    var submitBtn = document.createElement('button')
    submitBtn.className = 'submit-score-btn'
    submitBtn.textContent = 'Submit Score'
    submitBtn.style.marginBottom = '0.75rem'
    submitBtn.addEventListener('click', function () {
      submitScore(results.gameId, nameInput.value || 'Anon')
    })
    card.appendChild(submitBtn)

    var btn = document.createElement('button')
    btn.className = 'play-again-btn'
    btn.textContent = 'Play Again'
    btn.addEventListener('click', startGame)
    card.appendChild(btn)

    // Leaderboard section
    var lbHeader = document.createElement('h2')
    lbHeader.textContent = 'Leaderboard'
    lbHeader.style.marginTop = '1.5rem'
    card.appendChild(lbHeader)

    var lbContainer = document.createElement('div')
    lbContainer.id = 'leaderboard'
    lbContainer.textContent = 'Loading...'
    card.appendChild(lbContainer)

    app.appendChild(card)

    loadLeaderboard()
  }

  function renderLeaderboard(entries, highlightId) {
    var container = document.getElementById('leaderboard')
    if (!container) return
    container.innerHTML = ''

    if (!entries || entries.length === 0) {
      container.textContent = 'No scores yet. Be the first!'
      return
    }

    var table = document.createElement('table')
    table.className = 'leaderboard-table'

    var thead = document.createElement('thead')
    var headerRow = document.createElement('tr')
    ;['#', 'Name', 'Score', 'Accuracy', 'Streak'].forEach(function (text) {
      var th = document.createElement('th')
      th.textContent = text
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    var tbody = document.createElement('tbody')
    entries.forEach(function (entry, i) {
      var tr = document.createElement('tr')
      if (entry.id && entry.id === highlightId) {
        tr.className = 'my-score'
      }
      var values = [
        i + 1,
        entry.name,
        entry.score,
        Math.round(entry.accuracy * 100) + '%',
        entry.maxStreak
      ]
      values.forEach(function (val) {
        var td = document.createElement('td')
        td.textContent = val
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    container.appendChild(table)
  }

  // --- API calls ---

  function startGame() {
    Timer.stop()
    fetch('/api/games', { method: 'POST' })
      .then(function (r) { return r.json() })
      .then(function (data) {
        state = 'playing'
        gameId = data.gameId
        currentQuestion = data.question
        totalQuestions = data.totalQuestions
        currentIndex = 0
        score = 0
        streak = 0
        startTime = Date.now()
        renderQuestion()
      })
  }

  let submitting = false

  function submitAnswer(choiceIndex) {
    if (state !== 'playing' || submitting) return
    submitting = true
    Timer.stop()

    // Flash feedback
    var buttons = document.querySelectorAll('.choice-btn')
    buttons.forEach(function (btn) { btn.disabled = true })

    fetch('/api/games/' + gameId + '/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceIndex: choiceIndex })
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        // Flash correct/wrong
        if (choiceIndex !== null) {
          var chosen = buttons[choiceIndex]
          if (chosen) {
            chosen.classList.add(data.correct ? 'correct' : 'wrong')
          }
        }
        // Show correct answer
        if (data.correctIndex !== undefined) {
          var correctBtn = buttons[data.correctIndex]
          if (correctBtn) correctBtn.classList.add('correct')
        }

        score = data.score
        streak = data.streak || 0
        var multiplier = data.multiplier || 1

        // Show multiplier badge on streak element
        var streakDisplay = document.querySelector('.score-bar .streak')
        if (streakDisplay) {
          if (streak > 0) {
            streakDisplay.textContent = 'Streak: ' + streak
            if (multiplier > 1) {
              var badge = document.createElement('span')
              badge.className = 'multiplier-badge'
              badge.textContent = 'x' + multiplier + '!'
              streakDisplay.appendChild(badge)
            }
          } else {
            streakDisplay.textContent = ''
          }
        }

        setTimeout(function () {
          submitting = false
          if (data.results) {
            data.results.gameId = gameId
            renderResults(data.results)
          } else {
            currentQuestion = data.nextQuestion
            currentIndex++
            renderQuestion()
          }
        }, 300)
      })
      .catch(function () {
        submitting = false
      })
  }

  function submitScore(gId, name) {
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: gId, name: name })
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.entries) {
          // Find the id of the entry we just added (latest playedAt with matching name)
          var sanitized = name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 12)
          var match = data.entries.slice().sort(function (a, b) {
            return new Date(b.playedAt) - new Date(a.playedAt)
          }).find(function (e) { return e.name === sanitized })
          myScoreId = match ? match.id : null
          renderLeaderboard(data.entries, myScoreId)
        }
      })
  }

  function loadLeaderboard() {
    fetch('/api/scores')
      .then(function (r) { return r.json() })
      .then(function (data) {
        renderLeaderboard(data.entries || [], myScoreId)
      })
      .catch(function () {
        var container = document.getElementById('leaderboard')
        if (container) container.textContent = 'Could not load leaderboard.'
      })
  }

  // --- Keyboard navigation ---
  document.addEventListener('keydown', function (e) {
    if (state !== 'playing' || submitting) return
    var key = e.key
    if (key >= '1' && key <= '4') {
      var index = parseInt(key, 10) - 1
      submitAnswer(index)
    }
  })

  // --- Initialize ---
  renderIdle()
})()
