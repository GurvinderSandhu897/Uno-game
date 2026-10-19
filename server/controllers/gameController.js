import crypto from 'node:crypto';
import {
  createGame,
  playCards,
  drawAction,
  passTurn,
  callUno,
  publicState,
} from '../game/rules.js';
import { botStep } from '../game/bot.js';
import { saveGame, loadGame, deleteGame, getStats } from '../game/store.js';

const HUMAN = 0;

export async function newGame(req, res) {
  const name = String(req.body?.name || 'You').trim().slice(0, 20) || 'You';
  const state = createGame({ humanName: name });
  const gameId = crypto.randomUUID();
  await saveGame(gameId, state);
  res.status(201).json({ gameId, state: publicState(state, HUMAN) });
}

export async function getGame(req, res) {
  const state = await loadGame(req.params.id);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  res.json({ gameId: req.params.id, state: publicState(state, HUMAN) });
}

// Shared flow: load game → apply one move → save → respond
const action = (apply) => async (req, res) => {
  const state = await loadGame(req.params.id);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  try {
    apply(state, req.body ?? {});
  } catch (err) {
    return res.status(400).json({ error: err.message }); // rule violations land here
  }

  await saveGame(req.params.id, state);
  res.json({ gameId: req.params.id, state: publicState(state, HUMAN) });
};

export const play = action((s, body) => playCards(s, HUMAN, body.cardIds, body.color));
export const draw = action((s) => drawAction(s, HUMAN));
export const pass = action((s) => passTurn(s, HUMAN));
export const uno = action((s) => callUno(s, HUMAN));

// Plays exactly ONE bot move (does nothing if it's the human's turn)
export const bot = action((s) => {
  if (s.winner === null && s.players[s.currentPlayer].isBot) botStep(s);
});

export async function quit(req, res) {
  await deleteGame(req.params.id);
  res.json({ ok: true });
}

export async function stats(req, res) {
  res.json(await getStats());
}