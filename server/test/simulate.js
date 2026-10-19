import { createGame } from '../game/rules.js';
import { runBots } from '../game/bot.js';

const s = createGame({ allBots: true });
for (let i = 0; i < 50 && s.winner === null; i++) runBots(s);

const total =
  s.drawPile.length +
  s.discardPile.length +
  s.players.reduce((n, p) => n + p.hand.length, 0);

console.log('Winner:', s.winner !== null ? s.players[s.winner].name : 'none (unfinished)');
console.log('Card count (should be 108):', total);
console.log('Last log lines:\n' + s.log.slice(-6).join('\n'));