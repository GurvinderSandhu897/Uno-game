const SYMBOLS = { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '★', wild4: '+4' };

export default function Card({ card, playable = false, selected = false, dim = false, onClick }) {
  const label = SYMBOLS[card.value] ?? card.value;
  const cls = ['card', card.color, playable && 'playable', selected && 'selected', dim && 'dim']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} onClick={onClick}>
      <span>{label}</span>
    </button>
  );
}

export function CardBack() {
  return (
    <div className="card back">
      <span>UNO</span>
    </div>
  );
}