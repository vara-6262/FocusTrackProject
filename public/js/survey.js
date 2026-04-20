/**
 * survey.js
 * Gestisce il sondaggio profilo (6 domande) e le schermate
 * di login / signup con switch tra tab.
 */

/* ══════════════════════════════════════════════
   AUTH HANDLERS
   ══════════════════════════════════════════════ */

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (i === 0) === (tab === 'login'))
  );
  document.getElementById('form-login').classList.toggle('hidden',  tab !== 'login');
  document.getElementById('form-signup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('login-error').textContent  = '';
  document.getElementById('signup-error').textContent = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Accesso…';

  try {
    await auth.login(
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
    const me = await auth.fetchMe();
    await onAuthSuccess(me);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Accedi →';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const errEl = document.getElementById('signup-error');
  errEl.textContent = '';
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Creazione…';

  try {
    // signup senza profilo: il sondaggio arriva dopo
    await auth.signup(
      document.getElementById('signup-email').value,
      document.getElementById('signup-password').value,
      null
    );
    const me = await auth.fetchMe();
    await onAuthSuccess(me);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Crea account →';
  }
}

/* ══════════════════════════════════════════════
   SURVEY STATE
   ══════════════════════════════════════════════ */

const TOTAL_QUESTIONS = 6;
let _surveyStep    = 1;
const _surveyData  = {
  situazione:              null,
  struttura_giornata:      null,
  tipo_lavoro:             null,
  stamina_min:             45,
  distraction_sensitivity: 50,
  variabilita:             null,
};

/* descrizioni testi per gli slider */
function staminaDesc(val) {
  if (val < 20)  return 'Meno di 20 minuti';
  if (val < 40)  return '20–40 minuti';
  if (val < 70)  return '30–60 minuti';
  if (val < 100) return '1–2 ore';
  return 'Oltre 2 ore';
}
function distractionDesc(val) {
  if (val < 25)  return 'Quasi mai';
  if (val < 50)  return 'Raramente';
  if (val < 75)  return 'Abbastanza facilmente';
  return 'Molto facilmente';
}

function updateSurveySlider(el, valId, descId, descFn) {
  const v   = parseInt(el.value);
  const pct = ((v - parseInt(el.min)) / (parseInt(el.max) - parseInt(el.min))) * 100;
  el.style.setProperty('--pct', `${pct}%`);

  const unit = el.id === 'stamina-slider' ? ' min' : '';
  document.getElementById(valId).textContent  = v + unit;
  document.getElementById(descId).textContent = descFn(v);

  // aggiorna surveyData
  if (el.id === 'stamina-slider')      _surveyData.stamina_min             = v;
  if (el.id === 'distraction-slider')  _surveyData.distraction_sensitivity = v;
}

/* ── ENUM SELECTION ─────────────────────────────────────────── */

function selectEnum(btn) {
  // deseleziona tutti i fratelli nella stessa domanda
  btn.closest('.enum-opts').querySelectorAll('.enum-opt')
     .forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // salva nel profilo
  _surveyData[btn.dataset.field] = btn.dataset.val;
}

/* ── NAVIGATION ─────────────────────────────────────────────── */

function _surveyValidate(step) {
  if (step === 1) return !!_surveyData.situazione;
  if (step === 2) return !!_surveyData.struttura_giornata;
  if (step === 3) return !!_surveyData.tipo_lavoro;
  if (step === 4) return true;  // slider ha sempre un valore
  if (step === 5) return true;
  if (step === 6) return !!_surveyData.variabilita;
  return true;
}

function _surveyUpdateUI() {
  // mostra/nasconde domande
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const el = document.getElementById(`sq-${i}`);
    if (el) el.classList.toggle('active', i === _surveyStep);
  }
  // progress bar
  const pct = (_surveyStep / TOTAL_QUESTIONS) * 100;
  document.getElementById('survey-progress-fill').style.width = `${pct}%`;
  // step label
  document.getElementById('survey-step-label').textContent =
    `Domanda ${_surveyStep} di ${TOTAL_QUESTIONS}`;
  // bottoni
  document.getElementById('survey-back').style.display =
    _surveyStep > 1 ? 'block' : 'none';
  document.getElementById('survey-next').textContent =
    _surveyStep === TOTAL_QUESTIONS ? 'Inizia →' : 'Avanti →';
  // reset errore
  document.getElementById('survey-error').textContent = '';
}

async function surveyNext() {
  if (!_surveyValidate(_surveyStep)) {
    document.getElementById('survey-error').textContent =
      'Seleziona un\'opzione per continuare';
    return;
  }

  if (_surveyStep < TOTAL_QUESTIONS) {
    _surveyStep++;
    _surveyUpdateUI();
    return;
  }

  // ultima domanda — salva profilo
  const btn = document.getElementById('survey-next');
  btn.disabled = true; btn.textContent = 'Salvataggio…';

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: auth.headers(),
      body: JSON.stringify(_surveyData),
    });
    if (!res.ok) throw new Error('Errore salvataggio profilo');
    const me = await auth.fetchMe();
    await bootApp(me);
  } catch (err) {
    document.getElementById('survey-error').textContent = err.message;
    btn.disabled = false; btn.textContent = 'Inizia →';
  }
}

function surveyBack() {
  if (_surveyStep > 1) { _surveyStep--; _surveyUpdateUI(); }
}

// Inizializza slider survey al caricamento
window.addEventListener('DOMContentLoaded', () => {
  const ss = document.getElementById('stamina-slider');
  const ds = document.getElementById('distraction-slider');
  if (ss) updateSurveySlider(ss, 'stamina-val', 'stamina-desc', staminaDesc);
  if (ds) updateSurveySlider(ds, 'distraction-val', 'distraction-desc', distractionDesc);
});
