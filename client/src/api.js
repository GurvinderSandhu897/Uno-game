const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const newGame = (name) =>
  request('/games', { method: 'POST', body: JSON.stringify({ name }) });

export const playCards = (id, cardIds, color) =>
  request(`/games/${id}/play`, { method: 'POST', body: JSON.stringify({ cardIds, color }) });

export const drawCard = (id) => request(`/games/${id}/draw`, { method: 'POST' });
export const passTurn = (id) => request(`/games/${id}/pass`, { method: 'POST' });
export const callUno = (id) => request(`/games/${id}/uno`, { method: 'POST' });
export const botStep = (id) => request(`/games/${id}/bot`, { method: 'POST' });
export const quitGame = (id) => request(`/games/${id}`, { method: 'DELETE' });
export const getStats = () => request('/stats');