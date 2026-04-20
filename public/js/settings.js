/**
 * settings.js
 * Caricamento, rendering e salvataggio delle impostazioni per categoria.
 */

async function loadSettings() {
  try {
    const arr = await api.getSettings();
    arr.forEach(s => { state.settings[s.categoria] = s; });
  } catch {
    // fallback offline: valori di default
    CATEGORIES.forEach(c => {
      state.settings[c] = { session_min: 25, break_min: 5 };
    });
  }
  buildSettingsRows();
  applyCategorySettings(state.categoria);
}

/** Aggiorna totalSecs e breakSecs in base alla categoria selezionata */
function applyCategorySettings(categoria) {
  const s = state.settings[categoria] || { session_min: 25, break_min: 5 };
  state.totalSecs = s.session_min * 60;
  state.breakSecs = s.break_min  * 60;
}

function buildSettingsRows() {
  const el = document.getElementById('settings-rows');
  el.innerHTML = CATEGORIES.map(cat => {
    const s = state.settings[cat] || { session_min: 25, break_min: 5 };
    return `
      <div class="settings-row" data-cat="${cat}">
        <label>${cat}</label>
        <input type="number" min="5" max="120" value="${s.session_min}" class="s-session">
        <input type="number" min="1" max="60"  value="${s.break_min}"   class="s-break">
      </div>`;
  }).join('');
}

async function saveSettings() {
  const rows   = document.querySelectorAll('#settings-rows .settings-row');
  const payload = Array.from(rows).map(row => ({
    categoria:   row.dataset.cat,
    session_min: parseInt(row.querySelector('.s-session').value),
    break_min:   parseInt(row.querySelector('.s-break').value),
  }));
  await api.saveSettings(payload);
  await loadSettings();
  closeSettings();
}

function openSettings()  { document.getElementById('modal-settings').classList.add('open'); }
function closeSettings() { document.getElementById('modal-settings').classList.remove('open'); }
