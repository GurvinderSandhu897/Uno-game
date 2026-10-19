import { useEffect, useState } from 'react';
import * as api from './api.js';
import Card, { CardBack } from './components/Card.jsx';
import ColorPicker from './components/ColorPicker.jsx';
import RulesList from './components/RulesList.jsx';
import './App.css';

const BOT_DELAY = 1000; // milliseconds between bot moves
const isNumber = (c) => /^[0-9]$/.test(c.value);

export default function App() {
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [game, setGame] = useState(null);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState([]);
  const [pickColorFor, setPickColorFor] = useState(null); // card ids waiting for a colour
  const [showRules, setShowRules] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onStartScreen = game === null;

  // Load win/loss stats whenever the start screen is showing
  useEffect(() => {
    if (!onStartScreen) return;
    api.getStats().then(setStats).catch(() => {});
  }, [onStartScreen]);

  // Bots move one at a time, with a short pause so the game is easy to follow
  useEffect(() => {
    if (!game || game.winner !== null || !game.players[game.currentPlayer].isBot) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await api.botStep(gameId);
        if (!cancelled) setGame(data.state);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }, BOT_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [game, gameId]);

  // Runs an API call, then stores the new game state
  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      const data = await fn();
      setGame(data.state);
      setSelected([]);
      setPickColorFor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const startGame = () =>
    run(async () => {
      const data = await api.newGame(name.trim() || 'You');
      setGameId(data.gameId);
      return data;
    });

  function backToMenu() {
    setGame(null);
    setGameId(null);
    setSelected([]);
    setPickColorFor(null);
    setError('');
  }

  async function quitGame() {
    setConfirmQuit(false);
    try {
      await api.quitGame(gameId);
    } catch {
      /* the game is abandoned either way */
    }
    backToMenu();
  }

  // UNO call keeps the current card selection, so it doesn't use run()
  async function callUno() {
    setBusy(true);
    setError('');
    try {
      const data = await api.callUno(gameId);
      setGame(data.state);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- start screen ----------
  if (!game) {
    const rate = stats && stats.played > 0 ? Math.round((stats.humanWins / stats.played) * 100) : 0;
    return (
      <div className="start">
        <div className="start-main">
          <h1 className="logo">UNO</h1>
          <p className="tagline">You vs 3 computer players</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && startGame()}
          />
          <button className="btn big" onClick={startGame} disabled={busy}>
            {busy ? 'Starting…' : 'Start game'}
          </button>
          {error && <p className="error">{error}</p>}

          {stats && (
            <div className="stats">
              <div className="stat"><b>{stats.played}</b>Played</div>
              <div className="stat"><b>{stats.humanWins}</b>Won</div>
              <div className="stat"><b>{rate}%</b>Win rate</div>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>How to play</h2>
          <RulesList />
        </div>
      </div>
    );
  }

  // ---------- game screen ----------
  const me = game.players[0];
  const isMyTurn = game.currentPlayer === 0 && game.winner === null;
  const firstSelected = selected.length ? me.hand.find((c) => c.id === selected[0]) : null;
  const canCallUno = game.canCallUno && !busy;

  const playNow = (ids, color) => run(() => api.playCards(gameId, ids, color));

  const isClickable = (c) =>
    isMyTurn &&
    !busy &&
    (firstSelected
      ? selected.includes(c.id) || (isNumber(c) && c.value === firstSelected.value)
      : game.playableIds.includes(c.id));

  function handleCardClick(card) {
    if (!isClickable(card)) return;

    // Building a same-number group
    if (selected.length > 0) {
      setSelected(
        selected.includes(card.id) ? selected.filter((id) => id !== card.id) : [...selected, card.id]
      );
      return;
    }

    if (card.color === 'wild') return setPickColorFor([card.id]);

    // Number card with twins in hand: let the player build a group
    const hasTwins =
      isNumber(card) &&
      game.drawnCardId === null &&
      me.hand.filter((c) => isNumber(c) && c.value === card.value).length > 1;
    if (hasTwins) return setSelected([card.id]);

    playNow([card.id]);
  }

  let status;
  if (game.winner !== null) status = `${game.players[game.winner].name} won!`;
  else if (!isMyTurn) status = `${game.players[game.currentPlayer].name} is playing…`;
  else if (game.drawnCardId !== null) status = 'Play the card you drew, or pass';
  else if (game.pendingDraw > 0)
    status = `Stack a ${game.pendingType === 'draw2' ? '+2' : '+4'} or take ${game.pendingDraw} cards`;
  else status = 'Your turn';

  return (
    <div className="app">
      <div className="topbar">
        <h2 className="logo-small">UNO</h2>
        <div className="right">
          <button className="btn secondary" onClick={() => setShowRules(true)}>Rules</button>
          <button className="btn danger" onClick={() => setConfirmQuit(true)}>Quit game</button>
        </div>
      </div>

      <div className="opponents">
        {game.players.slice(1).map((p, i) => (
          <div key={p.name} className={`opp ${game.currentPlayer === i + 1 ? 'active' : ''}`}>
            {p.cardCount === 1 && <span className="tag-uno">UNO!</span>}
            <strong>{p.name}</strong>
            <div>{p.cardCount} cards</div>
            <div className="mini-backs">
              {Array.from({ length: Math.min(p.cardCount, 10) }).map((_, k) => (
                <span key={k} className="mini" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="table">
        <button
          type="button"
          className="pile"
          onClick={() => run(() => api.drawCard(gameId))}
          disabled={!isMyTurn || busy || game.drawnCardId !== null}
        >
          <CardBack />
          <span>{game.pendingDraw > 0 ? `Take +${game.pendingDraw}` : 'Draw'}</span>
          <small>{game.drawPileCount} left</small>
        </button>

        <div className="discard">
          <Card key={game.topCard.id} card={game.topCard} />
          <div className="current-color">
            <span className={`dot ${game.currentColor}`} /> {game.currentColor}
          </div>
          <small>{game.direction === 1 ? '↻ clockwise' : '↺ counter-clockwise'}</small>
        </div>
      </div>

      <p className="status">{status}</p>
      {error && <p className="error">{error}</p>}

      <div className="actions">
        {canCallUno && (
          <button className="btn uno" onClick={callUno}>UNO!</button>
        )}
        {me.unoCalled && <span className="uno-badge">UNO called ✓</span>}
        {selected.length > 0 && (
          <>
            <button className="btn" onClick={() => playNow(selected)} disabled={busy}>
              Play selected ({selected.length})
            </button>
            <button className="btn secondary" onClick={() => setSelected([])}>Clear</button>
          </>
        )}
        {game.drawnCardId !== null && isMyTurn && (
          <button className="btn secondary" onClick={() => run(() => api.passTurn(gameId))} disabled={busy}>
            Pass
          </button>
        )}
      </div>

      <div className="hand">
        {me.hand.map((c) => {
          const clickable = isClickable(c);
          return (
            <Card
              key={c.id}
              card={c}
              playable={clickable}
              selected={selected.includes(c.id)}
              dim={!clickable && game.winner === null}
              onClick={() => handleCardClick(c)}
            />
          );
        })}
      </div>

      <div className="log">
        {game.log.slice(-8).map((line, i, arr) => (
          <div key={i} className={i === arr.length - 1 ? 'last' : ''}>{line}</div>
        ))}
      </div>

      {pickColorFor && (
        <ColorPicker onPick={(color) => playNow(pickColorFor, color)} onCancel={() => setPickColorFor(null)} />
      )}

      {showRules && (
        <div className="overlay" onClick={() => setShowRules(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h2>How to play</h2>
            <RulesList />
            <button className="btn" onClick={() => setShowRules(false)}>Close</button>
          </div>
        </div>
      )}

      {confirmQuit && (
        <div className="overlay">
          <div className="modal">
            <h3>Quit this game?</h3>
            <p>Your progress will be lost and the game won't count in your stats.</p>
            <div className="actions center">
              <button className="btn secondary" onClick={() => setConfirmQuit(false)}>Keep playing</button>
              <button className="btn danger" onClick={quitGame}>Quit</button>
            </div>
          </div>
        </div>
      )}

      {game.winner !== null && (
        <div className="overlay">
          <div className="modal">
            <h2>{game.winner === 0 ? '🎉 You win!' : `${game.players[game.winner].name} wins`}</h2>
            <div className="actions center">
              <button className="btn" onClick={startGame} disabled={busy}>Play again</button>
              <button className="btn secondary" onClick={backToMenu}>Main menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}