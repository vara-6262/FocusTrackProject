/**
 * tiredness.js
 * Salvataggio o scarto della sessione al termine, con il tiredness score.
 */

async function saveSession() {
  const fatigue = parseFloat(document.getElementById('tiredness-slider').value);
  await api.updateSession(state.sessionId, {
    timestamp_end: new Date().toISOString(),
    fatigue_score: fatigue,
    slip_count:    state.slipCount,
    discarded:     0,
  });
  startBreak();
}

async function discardSession() {
  await api.updateSession(state.sessionId, {
    discarded:  1,
    slip_count: state.slipCount,
  });
  startBreak();
}
