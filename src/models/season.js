class Season {
  constructor(name) {
    this.id = 'season_' + Date.now().toString(36)
    this.name = name
    this.startDate = new Date().toISOString()
    this.endDate = null
    this.active = true
    this.playerCount = 0
    this.topPlayers = []
  }

  end() {
    this.active = false
    this.endDate = new Date().toISOString()
  }

  // BUG: doesn't check if season is already ended
  isActive() {
    return this.active
  }
}

module.exports = { Season }
