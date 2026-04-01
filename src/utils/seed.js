const { Player } = require('../models/player')
const { saveCollection } = require('../services/store')
const { recordMatch } = require('../services/matchmaking')

const SAMPLE_PLAYERS = [
  'DragonSlayer',
  'ShadowNinja',
  'PixelWarrior',
  'CosmicRanger',
  'ThunderBolt',
  'IcePhoenix',
  'FireStorm',
  'NeonKnight',
  'StarHunter',
  'MoonWalker',
  'CyberWolf',
  'GhostRider',
  'BladeRunner',
  'StormBreaker',
  'DarkMatter',
  'LightBringer'
]

function seedDatabase() {
  console.log('Seeding database...')

  // Create players
  const players = SAMPLE_PLAYERS.map((name) => {
    const player = new Player(name.toLowerCase(), name)
    return player
  })
  saveCollection('players', players)
  console.log(`Created ${players.length} players`)

  // Simulate some matches
  let matchCount = 0
  for (let i = 0; i < 50; i++) {
    const p1 = players[Math.floor(Math.random() * players.length)]
    const p2 = players[Math.floor(Math.random() * players.length)]
    if (p1.id === p2.id) continue

    const outcomes = ['player1', 'player2', 'draw']
    const result = outcomes[Math.floor(Math.random() * outcomes.length)]
    recordMatch(p1.id, p2.id, result)
    matchCount++
  }
  console.log(`Recorded ${matchCount} matches`)
  console.log('Seed complete!')
}

if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
