const COLORS = ['red', 'yellow', 'green', 'blue'];

export default function ColorPicker({ onPick, onCancel }) {
  return (
    <div className="overlay">
      <div className="modal">
        <h3>Choose a colour</h3>
        <div className="color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${c}`}
              aria-label={c}
              onClick={() => onPick(c)}
            />
          ))}
        </div>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}