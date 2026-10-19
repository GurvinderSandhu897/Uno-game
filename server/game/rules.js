import { COLORS, createDeck, shuffle, isNumberCard } from './deck.js';

const HAND_SIZE = 7;
const fail = (msg) => { throw new Error(msg); };

export function createGame({ humanName = 'You', allBots = false } = {}) {
  const names = [humanName, 'Bot 1', 'Bot 2', 'Bot 3'];
  const players = names.map((name, i) => ({
    name,
    isBot: allBots || i !== 0,
    hand: [],
    unoCalled: false,
  }));

  const drawPile = shuffle(createDeck());
  for (let r = 0; r < HAND_SIZE; r++) {
    players.forEach((p) => p.hand.push(drawPile.pop()));
  }

  // Starting card must be a plain number card
  let first = drawPile.pop();
  while (!isNumberCard(first)) {
    drawPile.unshift(first); // put it at the bottom
    first = drawPile.pop();
  }

  return {
    players,
    drawPile,
    discardPile: [first],
    currentPlayer: 0,
    direction: 1,            // 1 = clockwise, -1 = counter-clockwise
    currentColor: first.color,
    pendingDraw: 0,          // accumulated +2 / +4 penalty
    pendingType: null,       // 'draw2' | 'wild4' | null
    drawnCardId: null,       // set when a player drew a playable card
    winner: null,
    log: [`Game started. Top card: ${first.color} ${first.value}`],
  };
}

export const topCard = (s) => s.discardPile[s.discardPile.length - 1];

export function canPlay(s, card) {
  // Under a draw penalty you may only stack the same kind of card
  if (s.pendingDraw > 0) return card.value === s.pendingType;
  if (card.color === 'wild') return true;
  return card.color === s.currentColor || card.value === topCard(s).value;
}

const nextIndex = (s, steps = 1) => {
  const n = s.players.length;
  return (((s.currentPlayer + s.direction * steps) % n) + n) % n;
};

const addLog = (s, msg) => {
  s.log.push(msg);
  if (s.log.length > 40) s.log.shift();
};

function refillDrawPile(s) {
  if (s.drawPile.length === 0 && s.discardPile.length > 1) {
    const top = s.discardPile.pop();
    s.drawPile = shuffle(s.discardPile);
    s.discardPile = [top];
  }
}

function drawCards(s, player, count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    refillDrawPile(s);
    if (s.drawPile.length === 0) break;
    const card = s.drawPile.pop();
    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

function assertTurn(s, idx) {
  if (s.winner !== null) fail('Game is over');
  if (idx !== s.currentPlayer) fail('Not your turn');
}

export function canDropToOne(hand) {
  if (hand.length <= 2) return true;
  const counts = {};
  for (const c of hand) {
    if (isNumberCard(c)) counts[c.value] = (counts[c.value] || 0) + 1;
  }
  return Math.max(0, ...Object.values(counts)) >= hand.length - 1;
}

/**
 * Play one or more cards. Multiple cards are allowed only when they are
 * number cards with the same number (any colour).
 */
export function playCards(s, idx, cardIds, chosenColor) {
  assertTurn(s, idx);
  const player = s.players[idx];

  if (!Array.isArray(cardIds) || cardIds.length === 0) fail('Select at least one card');
  if (new Set(cardIds).size !== cardIds.length) fail('Duplicate cards selected');

  const cards = cardIds.map(
    (id) => player.hand.find((c) => c.id === id) ?? fail('Card not in hand')
  );

  if (s.drawnCardId !== null && !(cards.length === 1 && cards[0].id === s.drawnCardId)) {
    fail('You may only play the card you just drew, or pass');
  }

  if (cards.length > 1) {
    const v = cards[0].value;
    if (!cards.every((c) => isNumberCard(c) && c.value === v)) {
      fail('Only number cards with the same number can be played together');
    }
    // Put a legally playable card first; the rest follow
    const i = cards.findIndex((c) => canPlay(s, c));
    if (i > 0) cards.unshift(...cards.splice(i, 1));
  }

  if (!canPlay(s, cards[0])) fail("That card can't be played on the current top card");

  const last = cards[cards.length - 1];
  if (last.color === 'wild' && !COLORS.includes(chosenColor)) {
    fail('Choose a colour for the wild card');
  }

  // Apply the move
  player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
  s.discardPile.push(...cards);
  s.currentColor = last.color === 'wild' ? chosenColor : last.color;
  s.drawnCardId = null;

  addLog(
    s,
    `${player.name} played ${cards.map((c) => `${c.color} ${c.value}`).join(', ')}` +
      (last.color === 'wild' ? ` (colour: ${chosenColor})` : '')
  );

  if (player.hand.length === 0) {
    s.winner = idx;
    addLog(s, `${player.name} wins!`);
    return s;
  }

    if (player.hand.length === 1) {
    if (player.unoCalled) {
      addLog(s, `${player.name} shouts UNO!`);
    } else {
      const got = drawCards(s, player, 2);
      addLog(s, `${player.name} forgot to say UNO and draws ${got.length} cards`);
    }
  }
  if (player.hand.length !== 1) player.unoCalled = false;

  let steps = 1;
  switch (last.value) {
    case 'skip':
      steps = 2;
      break;
    case 'reverse':
      s.direction *= -1;
      break;
    case 'draw2':
      s.pendingDraw += 2;
      s.pendingType = 'draw2';
      break;
    case 'wild4':
      s.pendingDraw += 4;
      s.pendingType = 'wild4';
      break;
  }
  s.currentPlayer = nextIndex(s, steps);
  return s;
}

/** Draw: takes the penalty if one is pending, otherwise draws a single card. */
export function drawAction(s, idx) {
  assertTurn(s, idx);
  const player = s.players[idx];
  if (s.drawnCardId !== null) fail('You already drew. Play that card or pass');
  player.unoCalled = false;  

  if (s.pendingDraw > 0) {
    const got = drawCards(s, player, s.pendingDraw);
    addLog(s, `${player.name} drew ${got.length} cards and lost the turn`);
    s.pendingDraw = 0;
    s.pendingType = null;
    s.currentPlayer = nextIndex(s);
    return s;
  }

  const [card] = drawCards(s, player, 1);
  addLog(s, `${player.name} drew a card`);
  if (card && canPlay(s, card)) {
    s.drawnCardId = card.id; // keep the turn; may play it or pass
  } else {
    s.currentPlayer = nextIndex(s);
  }
  return s;
}

export function passTurn(s, idx) {
  assertTurn(s, idx);
  if (s.drawnCardId === null) fail('You can only pass after drawing');
  s.drawnCardId = null;
  addLog(s, `${s.players[idx].name} passed`);
  s.currentPlayer = nextIndex(s);
  return s;
}

/** Call UNO. Only allowed when you can play down to one card this turn. */
export function callUno(s, idx) {
  assertTurn(s, idx);
  const player = s.players[idx];
  if (!canDropToOne(player.hand)) fail("You can't go down to one card this turn");
  player.unoCalled = true;
  return s;
}

/** What the client is allowed to see (opponent hands are hidden). */
export function publicState(s, viewer = 0) {
  const me = s.players[viewer];
  const myTurn = s.currentPlayer === viewer && s.winner === null;
  return {
    players: s.players.map((p, i) => ({
      name: p.name,
      isBot: p.isBot,
      cardCount: p.hand.length,
      unoCalled: p.unoCalled === true,
      ...(i === viewer && { hand: p.hand }),
    })),
    topCard: topCard(s),
    currentColor: s.currentColor,
    currentPlayer: s.currentPlayer,
    direction: s.direction,
    pendingDraw: s.pendingDraw,
    pendingType: s.pendingType,
    drawnCardId: s.drawnCardId,
    drawPileCount: s.drawPile.length,
    winner: s.winner,
    log: s.log.slice(-15),
    canCallUno: myTurn && !me.unoCalled && canDropToOne(me.hand),
    playableIds: myTurn
      ? me.hand
          .filter((c) => (s.drawnCardId === null || c.id === s.drawnCardId) && canPlay(s, c))
          .map((c) => c.id)
      : [],
  };
}