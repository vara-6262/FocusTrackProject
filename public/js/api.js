/**
 * api.js
 * Wrapper per tutte le chiamate HTTP al backend.
 * Ogni richiesta include automaticamente il JWT via auth.headers().
 */

const API_BASE =  process.env.REACT_APP_API_URL || '';

const api = {

  /* ── SESSIONS ──────────────────────────────────────────────────────── */

  async createSession({ timestamp_start, categoria, start_cost }) {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST', headers: auth.headers(),
      body: JSON.stringify({ timestamp_start, categoria, start_cost }),
    });
    return res.json();
  },

  async updateSession(id, payload) {
    const res = await fetch(`${API_BASE}/api/sessions/${id}`, {
      method: 'PUT', headers: auth.headers(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getSessions() {
    const res = await fetch(`${API_BASE}/api/sessions`, { headers: auth.headers() });
    return res.json();
  },

  /* ── DISTRACTIONS ──────────────────────────────────────────────────── */

  async addDistraction({ session_id, ts }) {
    return fetch(`${API_BASE}/api/distractions`, {
      method: 'POST', headers: auth.headers(),
      body: JSON.stringify({ session_id, ts }),
    });
  },

  /* ── SETTINGS ──────────────────────────────────────────────────────── */

  async getSettings() {
    const res = await fetch(`${API_BASE}/api/settings`, { headers: auth.headers() });
    return res.json();
  },

  async saveSettings(items) {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT', headers: auth.headers(),
      body: JSON.stringify(items),
    });
    return res.json();
  },

  /* ── STATS ─────────────────────────────────────────────────────────── */

  async getStats() {
    const res = await fetch(`${API_BASE}/api/stats`, { headers: auth.headers() });
    return res.json();
  },
};
