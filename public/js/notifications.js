/**
 * notifications.js
 * Gestisce i permessi per le Web Notifications e invia gli avvisi
 * agli eventi chiave del timer (inizio/fine sessione e pausa).
 *
 * Dipendenze: nessuna (modulo autonomo).
 */

const notify = (() => {

  const ICON = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#0a0a0a"/>
      <circle cx="32" cy="32" r="18" fill="none" stroke="white" stroke-width="5"/>
      <line x1="32" y1="14" x2="32" y2="32" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <line x1="32" y1="32" x2="42" y2="38" stroke="white" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `);

  /* ── PERMESSI ──────────────────────────────────────────────────────────── */

  /**
   * Richiede il permesso al browser (chiamato una volta all'avvio).
   * Risolve con true se concesso, false altrimenti.
   */
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  function isGranted() {
    return ('Notification' in window) && Notification.permission === 'granted';
  }

  /* ── INVIO ─────────────────────────────────────────────────────────────── */

  function send(title, body, tag) {
    if (!isGranted()) return;
    const n = new Notification(title, { body, icon: ICON, tag, silent: false });
    // chiude da sola dopo 6 secondi
    setTimeout(() => n.close(), 6000);
  }

  /* ── EVENTI PUBBLICI ───────────────────────────────────────────────────── */

  function sessionStarted(categoria, durationMin) {
    send(
      '🎯 Sessione iniziata',
      `${categoria} · ${durationMin} min — in bocca al lupo!`,
      'session-start'
    );
  }

  function sessionEnded(categoria, slipCount) {
    const slipText = slipCount === 0
      ? 'Zero distrazioni 🔥'
      : `${slipCount} distrazione${slipCount > 1 ? 'i' : ''} registrata${slipCount > 1 ? '' : ''}`;
    send(
      '✅ Sessione completata',
      `${categoria} — ${slipText}`,
      'session-end'
    );
  }

  function breakStarted(breakMin) {
    send(
      '☕ Pausa iniziata',
      `Hai ${breakMin} minut${breakMin === 1 ? 'o' : 'i'} — stacca dalla scrivania.`,
      'break-start'
    );
  }

  function breakEnded() {
    send(
      '⚡ Pausa terminata',
      'È ora di ricominciare. Pronto?',
      'break-end'
    );
  }

  return { requestPermission, sessionStarted, sessionEnded, breakStarted, breakEnded };

})();
