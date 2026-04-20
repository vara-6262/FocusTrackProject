/**
 * break.js
 * Gestione del countdown di pausa tra una sessione e la successiva.
 */

function startBreak() {
  state.breakElapsed = 0;
  showScreen('screen-break');
  updateBreakDisplay(state.breakElapsed, state.breakSecs);
  notify.breakStarted(Math.round(state.breakSecs / 60));

  state.breakInterval = setInterval(() => {
    state.breakElapsed++;
    if (state.breakElapsed >= state.breakSecs) {
      clearInterval(state.breakInterval);
      endBreak();
    } else {
      updateBreakDisplay(state.breakElapsed, state.breakSecs);
    }
  }, 1000);
}

function endBreak() {
  clearInterval(state.breakInterval);
  notify.breakEnded();

  // aggiorna storico nella home
  loadTodayData();

  // reset friction slider
  const slider = document.getElementById('friction-slider');
  slider.value = 0;
  updateSlider(slider, 'friction-val');

  showScreen('screen-friction');
}
