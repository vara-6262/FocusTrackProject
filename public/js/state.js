/**
 * state.js
 * Stato globale condiviso. Tutti i moduli leggono e scrivono qui.
 * Nessuna logica — solo dati.
 */
const CATEGORIES = ['Creativity', 'Passive', 'Problem Solving', 'Repetition', 'Reading'];

const state = {
  // sessione corrente
  sessionId:        null,
  sessionNum:       0,
  categoria:        CATEGORIES[0],
  frictionVal:      0,
  slipCount:        0,
  slipTimestamps:   [],

  // timer
  timerInterval:    null,
  breakInterval:    null,
  totalSecs:        25 * 60,
  breakSecs:        5  * 60,
  elapsed:          0,
  breakElapsed:     0,

  // impostazioni caricate dal server
  settings:         {},   // { [categoria]: { session_min, break_min } }
};
