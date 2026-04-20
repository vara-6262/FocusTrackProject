/**
 * session.js
 * Avvio sessione, countdown timer, contatore distrazioni (slip), stop.
 */

async function startSession() {
  // legge friction dal DOM
  state.frictionVal     = parseFloat(document.getElementById('friction-slider').value);
  state.slipCount       = 0;
  state.slipTimestamps  = [];
  state.elapsed         = 0;
  state.sessionNum++;

  applyCategorySettings(state.categoria);

  const { id } = await api.createSession({
    timestamp_start: new Date().toISOString(),
    categoria:       state.categoria,
    start_cost:      state.frictionVal,
  });
  state.sessionId = id;

  document.getElementById('sess-label').textContent = `Session ${state.sessionNum}`;
  showScreen('screen-session');
  notify.sessionStarted(state.categoria, Math.round(state.totalSecs / 60));
  _startTimer();
}

/* ── TIMER ─────────────────────────────────────────────────────────────── */

function _startTimer() {
  updateTimerDisplay(state.elapsed, state.totalSecs, state.slipCount);
  state.timerInterval = setInterval(() => {
    state.elapsed++;
    if (state.elapsed >= state.totalSecs) {
      clearInterval(state.timerInterval);
      _sessionDone();
    } else {
      updateTimerDisplay(state.elapsed, state.totalSecs, state.slipCount);
    }
  }, 1000);
}

function stopSession() {
  if (!confirm('Interrompere la sessione?')) return;
  clearInterval(state.timerInterval);
  _sessionDone();
}

function _sessionDone() {
  notify.sessionEnded(state.categoria, state.slipCount);
  // reset tiredness slider
  const slider = document.getElementById('tiredness-slider');
  slider.value = 0;
  updateSlider(slider, 'tiredness-val');
  showScreen('screen-tiredness');
}

/* ── SLIP ───────────────────────────────────────────────────────────────── */

async function addSlip() {
  state.slipCount++;
  const ts = new Date().toISOString();
  state.slipTimestamps.push(ts);

  updateTimerDisplay(state.elapsed, state.totalSecs, state.slipCount);

  // feedback visivo sul bottone
  const btn = document.querySelector('.add-slip-btn');
  btn.style.background = 'rgba(255,255,255,.4)';
  setTimeout(() => btn.style.background = 'rgba(255,255,255,.15)', 200);

  // salva nel DB in background
  api.addDistraction({ session_id: state.sessionId, ts });
}
