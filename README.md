# UNO (MERN)

A browser UNO game: you against 3 computer players. Built with MongoDB, Express, React (Vite) and Node.

**Live demo:** https://uno-game-rho.vercel.app/
(Hosted on a free plan: the first load can take up to a minute while the server wakes up.)

## Features

- 4-player UNO with house rules (see below)
- Computer opponents that play one move at a time
- UNO! call with a 2-card penalty if you forget
- Win/loss stats saved in MongoDB
- Works without MongoDB (memory-only mode)
- Quit a game at any time; rules shown on the start screen

## Rules implemented

- 7 cards each, 108-card deck
- Match the top card by colour, number or symbol; wild cards can be played any time
- Number cards with the same number (any colour) can be played together in one turn
- Skip, Reverse, +2, Wild, +4
- Stacking: +2 only on +2, +4 only on +4; otherwise draw the whole stack and lose the turn
- Nothing to play: draw one card, then play it (if legal) or pass
- Press UNO! before playing down to your last card, or draw 2
- First player with no cards wins

## Project structure

```
uno-game/
├── server/
│   ├── server.js                 Express app and startup
│   ├── .env                      PORT, MONGO_URI, CLIENT_ORIGIN
│   ├── config/db.js              MongoDB connection (never crashes the app)
│   ├── models/Game.js            Mongoose model (saved games)
│   ├── game/
│   │   ├── deck.js               Deck creation and shuffle
│   │   ├── rules.js              Game engine (all the rules)
│   │   ├── bot.js                Computer player logic
│   │   └── store.js              In-memory games + MongoDB saving
│   ├── controllers/gameController.js
│   ├── routes/gameRoutes.js
│   └── test/                     check.js (tests), simulate.js
└── client/
    └── src/
        ├── App.jsx               Game screen, start screen, bot timing
        ├── App.css, index.css
        ├── api.js                Calls to the server
        └── components/           Card, ColorPicker, RulesList
```

## Requirements

- Node.js 18 or newer
- MongoDB (optional, for saved stats). On macOS:
```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
```

## Setup

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env`:

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/uno
CLIENT_ORIGIN=http://localhost:5173
```

## Run

Use two terminal tabs.

```bash
# Tab 1: API server
cd server
npm run dev
# expect: MongoDB connected / UNO server running on http://localhost:5001

# Tab 2: React client
cd client
npm run dev
# open http://localhost:5173
```

## Tests

```bash
cd server
npm test            # rule checks and 200 simulated bot games
npm run simulate    # one bot-only game
```

## API

| Method | Route | Purpose |
|---|---|---|
| POST | /api/games | Start a game |
| GET | /api/games/:id | Load a game |
| POST | /api/games/:id/play | Play card(s): `{ cardIds, color? }` |
| POST | /api/games/:id/draw | Draw a card or take the penalty |
| POST | /api/games/:id/pass | Pass after drawing a playable card |
| POST | /api/games/:id/uno | Call UNO |
| POST | /api/games/:id/bot | Play one bot move |
| DELETE | /api/games/:id | Quit (delete) a game |
| GET | /api/stats | Games played and won |
| GET | /api/health | Server and database status |

## Troubleshooting

- **`db: false` or "memory-only mode":** MongoDB isn't running. Start it
  (`brew services start mongodb-community`) and restart the server. The game still works, but stats aren't saved.
- **`ERR_MODULE_NOT_FOUND`:** a file name doesn't match its import exactly (for example `Games.js` vs `Game.js`).
- **Reset stats:**
```bash
  mongosh uno --quiet --eval "db.games.deleteMany({})"
```
- **Bot speed:** change `BOT_DELAY` (milliseconds) at the top of `client/src/App.jsx`.
