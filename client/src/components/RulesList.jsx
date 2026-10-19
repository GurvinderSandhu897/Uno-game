export default function RulesList() {
  return (
    <ul className="rules">
      <li>
        <strong>Players:</strong> you against 3 computer opponents. Everyone starts with 7 cards.
      </li>
      <li>
        <strong>Your turn:</strong> play a card that matches the top card's colour, number or symbol.
        Wild cards can be played at any time.
      </li>
      <li>
        <strong>Same number, one turn:</strong> number cards with the same number (any colour) can be
        played together in a single turn. The first must match the top card, and the last card you
        play sets the colour.
      </li>
      <li>
        <strong>Action cards:</strong> Skip jumps over the next player, Reverse flips the direction,
        +2 makes the next player draw 2.
      </li>
      <li>
        <strong>Wild and +4:</strong> choose the new colour. +4 also makes the next player draw 4.
      </li>
      <li>
        <strong>Stacking:</strong> a +2 can be stacked only on a +2 (any colour), and a +4 only on a
        +4. If you can't stack, you draw the whole pile and miss your turn.
      </li>
      <li>
        <strong>Nothing to play?</strong> Draw one card. If it can be played you may play it or pass.
      </li>
       <li>
        <strong>UNO!</strong> When you're one play away from your last card, an UNO! button appears.
        Press it before you play down to one card. If you forget, you draw 2 cards.
      </li>
      <li>
        <strong>Winning:</strong> the first player to get rid of all their cards wins.
      </li>
    </ul>
  );
}