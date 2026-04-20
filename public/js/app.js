/**
 * app.js
 * Entry point. Controlla auth, gestisce navigazione tra schermate,
 * inizializza i moduli dopo il login.
 */

/* ── BOOT ────────────────────────────────────────────────────────────── */

async function init() {
  if (!auth.isLoggedIn()) {
    showScreen('screen-login');
    return;
  }
  const me = await auth.fetchMe();
  if (!me) { showScreen('screen-login'); return; }

  // fetchMe ritorna { user, profile } oppure null
  const profile = me.profile ?? null;
  if (!profile || !profile.situazione) {
    showScreen('screen-survey');
    return;
  }
  await bootApp(me);
}

async function bootApp(meOrUser) {
  // accetta sia { user, profile } che oggetto user diretto
  const user = meOrUser?.user ?? meOrUser;
  if (!user || !user.email) {
    console.error('bootApp: oggetto utente non valido', meOrUser);
    showScreen('screen-login');
    return;
  }

  await notify.requestPermission();

  renderUserBadge(user);
  renderCategoryChips(CATEGORIES, state.categoria, onCategorySelect);
  await loadSettings();

  updateSlider(document.getElementById('friction-slider'),  'friction-val');
  updateSlider(document.getElementById('tiredness-slider'), 'tiredness-val');

  await loadTodayData();
  showScreen('screen-friction');
}

/* ── USER BADGE ──────────────────────────────────────────────── */

function renderUserBadge(user) {
  const badge = document.getElementById('user-badge');
  if (!badge || !user) return;
  const initial = (user.email || '?')[0].toUpperCase();

  // aggiorna solo il primo text node (non il .user-menu)
  const textNode = Array.from(badge.childNodes)
    .find(n => n.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = initial;

  // aggiorna voce email nel menu
  const emailBtn = badge.querySelector('.user-menu button:first-child');
  if (emailBtn) emailBtn.textContent = user.email;
}

/* ── CATEGORY SELECT ─────────────────────────────────────────── */

function onCategorySelect(cat) {
  state.categoria = cat;
  setActiveCategoryChip(cat);
  applyCategorySettings(cat);
}

/* ── TODAY DATA ──────────────────────────────────────────────── */

async function loadTodayData() {
  try {
    const sessions = await api.getSessions();
    renderTodayStats(sessions);
    renderHistory(sessions);
  } catch { /* offline */ }
}

/* ── LOGOUT ──────────────────────────────────────────────────── */

function logout() {
  auth.logout();
  state.sessionId  = null;
  state.sessionNum = 0;
  clearInterval(state.timerInterval);
  clearInterval(state.breakInterval);
}

/* ── DOPO LOGIN/SIGNUP ───────────────────────────────────────── */

async function onAuthSuccess(me) {
  const profile = me?.profile ?? null;
  if (!profile || !profile.situazione) {
    showScreen('screen-survey');
  } else {
    await bootApp(me);
  }
}

init();
