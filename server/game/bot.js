import { COLORS, isNumberCard } from './deck.js';
import { canPlay, playCards, drawAction, passTurn, callUno, canDropToOne } from './rules.js';

function bestColor(hand) {
  const counts = Object.fromEntries(COLORS.map((c) => [c, 0]));
  hand.forEach((c) => { if (c.color !== 'wild') counts[c.color]++; });
  const max = Math.max(...Object.values(counts));
  const top = COLORS.filter((c) => counts[c] === max);
  return top[Math.floor(Math.random() * top.length)];
}

/** One bot action (a play, a draw, or a pass). */
export function botStep(s) {
  const idx = s.currentPlayer;
  const bot = s.players[idx];
  if (!bot.unoCalled && canDropToOne(bot.hand)) callUno(s, idx);
  const n = s.players.length;
  const nextHand = s.players[(((idx + s.direction) % n) + n) % n].hand.length;

  const options = bot.hand.filter(
    (c) => (s.drawnCardId === null || c.id === s.drawnCardId) && canPlay(s, c)
  );

  if (options.length === 0) {
    if (s.drawnCardId !== null) passTurn(s, idx);
    else drawAction(s, idx);
    return;
  }

  const pressure = nextHand <= 2; // next player is close to winning
  let best = null;

  for (const c of options) {
    // Dump every card with the same number in one turn
    const group =
      isNumberCard(c) && s.drawnCardId === null
        ? bot.hand.filter((x) => isNumberCard(x) && x.value === c.value)
        : [c];
    const ordered = [c, ...group.filter((x) => x.id !== c.id)];

    let score = ordered.length * 2;
    if (['skip', 'reverse', 'draw2'].includes(c.value)) score += pressure ? 8 : 2;
    if (c.value === 'wild4') score += pressure ? 6 : -3;
    if (c.value === 'wild') score -= 4;
    if (c.value === 'draw2' && s.pendingDraw > 0) score += 10;
    score += Math.random();

    if (!best || score > best.score) best = { score, cards: ordered };
  }

  const remaining = bot.hand.filter((c) => !best.cards.some((b) => b.id === c.id));
  playCards(s, idx, best.cards.map((c) => c.id), bestColor(remaining));
}

/** Run bot turns until it is a human's turn (or the game ends). */
export function runBots(s) {
  let guard = 0;
  while (s.winner === null && s.players[s.currentPlayer].isBot && guard++ < 500) {
    botStep(s);
  }
  return s;
}