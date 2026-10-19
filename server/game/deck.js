export const COLORS = ['red', 'yellow', 'green', 'blue'];

export const isNumberCard = (card) => /^[0-9]$/.test(card.value);

export function createDeck() {
  const deck = [];
  let id = 0;
  const add = (color, value) => deck.push({ id: id++, color, value });

  for (const color of COLORS) {
    add(color, '0');
    for (let n = 1; n <= 9; n++) {
      add(color, String(n));
      add(color, String(n));
    }
    for (const action of ['skip', 'reverse', 'draw2']) {
      add(color, action);
      add(color, action);
    }
  }
  for (let i = 0; i < 4; i++) {
    add('wild', 'wild');
    add('wild', 'wild4');
  }
  return deck; // 108 cards
}

// Fisher-Yates shuffle
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}