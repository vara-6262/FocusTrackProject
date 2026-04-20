/**
 * auth.js
 * Gestisce token JWT in localStorage, stato utente corrente,
 * e le chiamate di login / signup / logout.
 *
 * Espone l'oggetto `auth` usato da api.js e app.js.
 */

const auth = (() => {

  const TOKEN_KEY = 'ft_token';
  const USER_KEY  = 'ft_user';

  /* ── TOKEN ─────────────────────────────────────────────────────────── */

  function getToken()       { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t)      { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken()     { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

  function isLoggedIn()     { return !!getToken(); }

  /* ── CACHED USER ────────────────────────────────────────────────────── */

  function getCachedUser()  {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }
  function setCachedUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

  /* ── AUTH HEADER ────────────────────────────────────────────────────── */

  function headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    };
  }

  /* ── API CALLS ──────────────────────────────────────────────────────── */

  async function signup(email, password, profile) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, profile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore signup');
    setToken(data.token);
    return data;
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credenziali non valide');
    setToken(data.token);
    return data;
  }

  async function fetchMe() {
    const res = await fetch('/api/auth/me', { headers: headers() });
    if (res.status === 401) { clearToken(); return null; }
    const data = await res.json();
    setCachedUser(data);
    return data;
  }

  function logout() {
    clearToken();
    showScreen('screen-login');
  }

  return { getToken, isLoggedIn, headers, signup, login, fetchMe, logout, getCachedUser };

})();

window.handleLogin = async function (event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await auth.login(email, password);
    showScreen('screen-survey'); // o friction screen
  } catch (e) {
    document.getElementById('login-error').innerText = e.message;
  }
};

window.handleSignup = async function (event) {
  event.preventDefault();

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    await auth.signup(email, password, null);
    showScreen('screen-survey');
  } catch (e) {
    document.getElementById('signup-error').innerText = e.message;
  }
};

window.logout = function () {
  auth.logout();
};