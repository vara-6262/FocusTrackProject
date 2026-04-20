/**
 * ui.js
 * Funzioni UI pure: non fanno chiamate di rete né modificano state.
 * Ricevono dati come parametri e aggiornano il DOM.
 */

/* ── SCREEN SWITCH ─────────────────────────────────────────────────────── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── SLIDER ────────────────────────────────────────────────────────────── */

const SLIDER_HINTS = ['Molto facile', 'Facile', 'Neutro', 'Difficile', 'Molto difficile'];

function updateSlider(el, valId) {
  const v   = parseFloat(el.value);
  const pct = ((v + 2) / 4) * 100;
  el.style.setProperty('--pct', `${pct}%`);

  document.getElementById(valId).textContent = (v >= 0 ? '+' : '') + v.toFixed(2);

  const hintEl = document.getElementById(valId.replace('-val', '-hint'));
  if (hintEl) {
    const idx = Math.min(Math.round(v + 2), SLIDER_HINTS.length - 1);
    hintEl.textContent = SLIDER_HINTS[idx];
  }
}

/* ── CATEGORY CHIPS ────────────────────────────────────────────────────── */

/**
 * @param {string[]} categories
 * @param {string}   activeCategory
 * @param {function} onSelect  callback(categoria)
 */
function renderCategoryChips(categories, activeCategory, onSelect) {
  const container = document.getElementById('cat-chips');
  container.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'cat-chip' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.onclick     = () => onSelect(cat);
    container.appendChild(btn);
  });
}

function setActiveCategoryChip(categoria) {
  document.querySelectorAll('.cat-chip').forEach(b =>
    b.classList.toggle('active', b.textContent === categoria)
  );
}

/* ── TODAY STATS ────────────────────────────────────────────────────────── */

function renderTodayStats(sessions) {
  const el = document.getElementById('today-stats');
  if (!sessions.length) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  const totalSlips = sessions.reduce((a, s) => a + (s.slip_count  || 0), 0);
  const avgFatigue = sessions.reduce((a, s) => a + (s.fatigue_score || 0), 0) / sessions.length;
  const sign       = avgFatigue >= 0 ? '+' : '';

  el.innerHTML = `
    <div class="stat-pill"><div class="val">${sessions.length}</div><div class="lbl">Sessioni</div></div>
    <div class="stat-pill"><div class="val">${totalSlips}</div><div class="lbl">Distrazioni totali</div></div>
    <div class="stat-pill"><div class="val">${sign}${avgFatigue.toFixed(1)}</div><div class="lbl">Fatica media</div></div>
  `;
}

/* ── SESSION HISTORY ────────────────────────────────────────────────────── */

function renderHistory(sessions) {
  const card = document.getElementById('hist-card');
  const list = document.getElementById('hist-list');
  if (!sessions.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const fmt = ts => new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  list.innerHTML = sessions.slice(0, 10).map(s => {
    const start   = fmt(s.timestamp_start);
    const end     = s.timestamp_end ? fmt(s.timestamp_end) : '–';
    const fatigue = s.fatigue_score != null
      ? (s.fatigue_score >= 0 ? '+' : '') + s.fatigue_score.toFixed(1)
      : '–';
    const friction = (s.start_cost >= 0 ? '+' : '') + (s.start_cost || 0).toFixed(1);

    return `
      <div class="hist-item">
        <div>
          <div class="hist-cat">${s.categoria || '–'}</div>
          <div class="hist-meta">${start} → ${end} &nbsp;·&nbsp; Attrito: ${friction}</div>
        </div>
        <div class="hist-badge">
          <span class="badge">🧠 ${s.slip_count} slip</span><br>
          <span style="font-size:11px; color:var(--muted)">fatica ${fatigue}</span>
        </div>
      </div>`;
  }).join('');
}

/* ── TIMER DISPLAY ─────────────────────────────────────────────────────── */

const RING_CIRCUMFERENCE = 408.4;

function updateTimerDisplay(elapsed, totalSecs, slipCount) {
  const remaining = totalSecs - elapsed;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  document.getElementById('ring-time').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  const pct = elapsed / totalSecs;
  document.getElementById('ring-arc').style.strokeDashoffset =
    RING_CIRCUMFERENCE * (1 - pct);

  document.getElementById('slip-time-left').textContent =
    Math.ceil(remaining / 60) + ' minutes left';

  document.getElementById('slip-count-display').textContent = slipCount;
}

/* ── BREAK DISPLAY ─────────────────────────────────────────────────────── */

function updateBreakDisplay(breakElapsed, breakSecs) {
  const rem = breakSecs - breakElapsed;
  const m   = Math.floor(rem / 60);
  const s   = rem % 60;
  document.getElementById('break-time').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
