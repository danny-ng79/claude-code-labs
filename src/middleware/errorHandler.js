function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`)
  console.error(err.stack)

  // BUG: leaks stack trace to client in production
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: err.stack
  })
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}

module.exports = { errorHandler, notFound }
