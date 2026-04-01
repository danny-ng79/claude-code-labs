# Game Leaderboard API

A game leaderboard system with rankings, achievements, seasons, and a live dashboard. Used as the sample project for **Agentic Coding with Claude Code** training.

## Setup

```bash
npm install
```

## Usage

```bash
# Start the server
npm start

# Start with auto-reload (development)
npm run dev

# Seed sample data (16 players, ~50 matches)
node src/utils/seed.js

# Open dashboard
open http://localhost:3000
```

## API Endpoints

```
GET    /api/health                  Health check
GET    /api/players                 List all players
GET    /api/players/:id             Get player details + achievements
POST   /api/players                 Create player { username, displayName }
GET    /api/players/:id/matches     Get player match history

POST   /api/matches                 Record match { player1Id, player2Id, result }
GET    /api/matches                 Recent matches

GET    /api/leaderboard             Top 100 players
GET    /api/leaderboard/rank/:rank  Filter by rank (bronze, silver, gold...)

GET    /api/seasons                 List all seasons
POST   /api/seasons                 Create season { name }
POST   /api/seasons/:id/end         End a season
```

## Development

```bash
npm test          # Run tests
npm run lint      # ESLint
npm run format    # Prettier
```

## Architecture

```
src/
├── server.js              # Express app entry
├── routes/                # API route handlers
│   ├── players.js
│   ├── matches.js
│   ├── leaderboard.js
│   └── seasons.js
├── models/                # Data models
│   ├── player.js
│   ├── match.js
│   └── season.js
├── services/              # Business logic
│   ├── store.js           # JSON file storage
│   ├── scoring.js         # Points, ranks, leaderboard
│   ├── achievements.js    # Achievement checking
│   └── matchmaking.js     # Match recording + stat updates
├── middleware/             # Express middleware
│   ├── validate.js        # Input validation
│   └── errorHandler.js    # Error handling
└── utils/
    ├── format.js          # Display formatting
    └── seed.js            # Database seeder
```

## Known Issues

This project has intentional bugs and TODOs for training exercises:

- `player.js` — `winRate` returns NaN when no games played
- `store.js` — `findByField` uses `==` instead of `===`
- `scoring.js` — `applyPoints` allows negative total points
- `errorHandler.js` — leaks stack trace to client
- `season.js` — `isActive()` doesn't check end date
- Missing: rate limiting, authentication, rank demotion protection
