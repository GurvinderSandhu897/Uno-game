import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true, unique: true },
    state: { type: mongoose.Schema.Types.Mixed, required: true }, // full engine state
    finished: { type: Boolean, default: false },
    winner: { type: Number, default: null }, // index of the winning player (0 = human)
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Game', gameSchema);