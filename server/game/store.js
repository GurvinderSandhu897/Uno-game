import mongoose from 'mongoose';
import Game from '../models/Games.js';

const memory = new Map();
const dbReady = () => mongoose.connection.readyState === 1;

export async function saveGame(id, state) {
  memory.set(id, state);
  if (!dbReady()) return;
  try {
    await Game.updateOne(
      { gameId: id },
      {
        $set: {
          gameId: id,
          state,
          finished: state.winner !== null,
          winner: state.winner,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('DB save failed (continuing in memory):', err.message);
  }
}

export async function loadGame(id) {
  if (memory.has(id)) return memory.get(id);
  if (!dbReady()) return null;
  try {
    const doc = await Game.findOne({ gameId: id }).lean();
    if (doc) {
      memory.set(id, doc.state);
      return doc.state;
    }
  } catch (err) {
    console.warn('DB load failed:', err.message);
  }
  return null;
}

export async function getStats() {
  if (dbReady()) {
    try {
      const [played, humanWins] = await Promise.all([
        Game.countDocuments({ finished: true }),
        Game.countDocuments({ finished: true, winner: 0 }),
      ]);
      return { source: 'mongodb', played, humanWins };
    } catch (err) {
      console.warn('DB stats failed:', err.message);
    }
  }
  const finished = [...memory.values()].filter((s) => s.winner !== null);
  return {
    source: 'memory',
    played: finished.length,
    humanWins: finished.filter((s) => s.winner === 0).length,
  };
}

export async function deleteGame(id) {
  memory.delete(id);
  if (!dbReady()) return;
  try {
    await Game.deleteOne({ gameId: id });
  } catch (err) {
    console.warn('DB delete failed:', err.message);
  }
}