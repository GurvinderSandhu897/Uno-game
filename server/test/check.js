import assert from 'node:assert';
import { createDeck, shuffle, isNumberCard } from '../game/deck.js';
import { createGame, playCards, drawAction, publicState, topCard, callUno } from '../game/rules.js';
import { runBots } from '../game/bot.js';

// helper: an empty, controllable game with a red 5 on top
function fresh() {
  const g = createGame();
  g.players.forEach((p) => (p.hand = []));
  g.discardPile = [{ id: 900, color: 'red', value: '5' }];
  g.currentColor = 'red';
  g.currentPlayer = 0;
  return g;
}
const card = (id, color, value) => ({ id, color, value });

// ---------- deck.js ----------
const deck = createDeck();
assert.equal(deck.length, 108);
assert.equal(new Set(deck.map((c) => c.id)).size, 108, 'ids must be unique');
assert.equal(deck.filter((c) => c.value === 'wild4').length, 4);
assert.equal(shuffle(deck).length, 108);
console.log('✔ deck.js: 108 unique cards, shuffle works');

// ---------- rules.js: setup ----------
const s = createGame();
assert.ok(s.players.every((p) => p.hand.length === 7), 'everyone gets 7 cards');
assert.equal(s.drawPile.length, 108 - 28 - 1);
assert.ok(isNumberCard(topCard(s)), 'first card is a number card');
console.log('✔ rules.js: dealing and starting card');

// ---------- rules.js: skip & reverse ----------
let g = fresh();
g.players[0].hand = [card(1, 'red', 'skip'), card(2, 'red', '1')];
playCards(g, 0, [1]);
assert.equal(g.currentPlayer, 2, 'skip jumps over player 1');

g = fresh();
g.players[0].hand = [card(1, 'red', 'reverse'), card(2, 'red', '1')];
playCards(g, 0, [1]);
assert.equal(g.direction, -1);
assert.equal(g.currentPlayer, 3, 'reverse goes the other way');
console.log('✔ rules.js: skip and reverse');

// ---------- rules.js: +2 stacking ----------
g = fresh();
g.players[0].hand = [card(1, 'red', 'draw2'), card(2, 'blue', '9')];
g.players[1].hand = [card(3, 'green', 'draw2'), card(4, 'wild', 'wild4'), card(5, 'green', '1')];
playCards(g, 0, [1]);
assert.equal(g.pendingDraw, 2);
assert.throws(() => playCards(g, 1, [4], 'red'), /./, '+4 must not stack on +2');
assert.throws(() => playCards(g, 1, [5]), /./, 'number card must not be playable');
playCards(g, 1, [3]); // +2 on +2, different colour is fine
assert.equal(g.pendingDraw, 4);
console.log('✔ rules.js: +2 stacks only on +2');

// ---------- rules.js: +4 stacking and taking the penalty ----------
g = fresh();
g.players[0].hand = [card(1, 'wild', 'wild4'), card(2, 'red', '1')];
g.players[1].hand = [card(3, 'blue', 'draw2'), card(4, 'wild', 'wild4')];
playCards(g, 0, [1], 'blue');
assert.throws(() => playCards(g, 1, [3]), /./, '+2 must not stack on +4');
playCards(g, 1, [4], 'green');
assert.equal(g.pendingDraw, 8);
drawAction(g, 2);
assert.equal(g.players[2].hand.length, 8);
assert.equal(g.pendingDraw, 0);
assert.equal(g.currentPlayer, 3, 'penalty costs the turn');
console.log('✔ rules.js: +4 stacks only on +4, penalty draw works');

// ---------- rules.js: same-number multi-play ----------
g = fresh();
g.players[0].hand = [
  card(1, 'red', '7'), card(2, 'blue', '7'), card(3, 'green', '7'), card(4, 'yellow', '2'),
];
g.players[0].unoCalled = true;
playCards(g, 0, [2, 1, 3]); // blue 7 isn't playable first, engine reorders
assert.equal(g.players[0].hand.length, 1);
assert.equal(topCard(g).value, '7');
assert.equal(g.currentColor, 'green', 'last card played sets the colour');

g = fresh();
g.players[0].hand = [card(1, 'red', '7'), card(2, 'yellow', '2')];
assert.throws(() => playCards(g, 0, [1, 2]), /./, 'different numbers rejected');
console.log('✔ rules.js: multi-play of same number');

// ---------- rules.js: UNO call ----------
g = fresh();
g.players[0].hand = [card(1, 'red', '1'), card(2, 'red', '2')];
playCards(g, 0, [1]);
assert.equal(g.players[0].hand.length, 3, 'forgetting UNO costs 2 cards');

g = fresh();
g.players[0].hand = [card(1, 'red', '1'), card(2, 'red', '2')];
callUno(g, 0);
playCards(g, 0, [1]);
assert.equal(g.players[0].hand.length, 1, 'calling UNO avoids the penalty');

g = fresh();
g.players[0].hand = [card(1, 'red', '1'), card(2, 'red', '2'), card(3, 'red', '3'), card(4, 'red', '4')];
assert.throws(() => callUno(g, 0), /./, 'UNO call needs 3 cards or fewer');
console.log('✔ rules.js: UNO call and penalty');

// ---------- rules.js: hidden hands ----------
const ps = publicState(createGame(), 0);
assert.ok(Array.isArray(ps.players[0].hand));
assert.equal(ps.players[1].hand, undefined, 'bot hands are hidden');
console.log('✔ rules.js: publicState hides opponents');

// ---------- bot.js: 200 full games ----------
for (let i = 0; i < 200; i++) {
  const x = createGame({ allBots: true });
  for (let j = 0; j < 50 && x.winner === null; j++) runBots(x);
  assert.notEqual(x.winner, null, 'game should finish');
  assert.equal(x.players[x.winner].hand.length, 0);
  const total = x.drawPile.length + x.discardPile.length +
    x.players.reduce((n, p) => n + p.hand.length, 0);
  assert.equal(total, 108, 'no cards lost or duplicated');
}
console.log('✔ bot.js: 200 bot-only games finished, card count always 108');

// bot stops when it reaches the human
const h = createGame();
h.currentPlayer = 1;
runBots(h);
assert.equal(h.currentPlayer, 0, 'bots hand control back to the human');
console.log('✔ bot.js: runBots stops at the human player');

console.log('\nAll checks passed.');