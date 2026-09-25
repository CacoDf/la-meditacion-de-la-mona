// Piezas de interfaz compartidas entre pantallas.

import { MOODS } from './content.js';
import { state, setSessionMood, checkNewBadges } from './store.js';
import { openSheet, toast, esc, formatMinutes, $ } from './util.js';

export function applyTheme() {
  const t = state.settings.theme;
  document.documentElement.dataset.theme = t === 'auto' ? '' : t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#1B1E19' : '#F4EFE6');
}

export const refresh = () => window.dispatchEvent(new Event('calma:refresh'));
export const go = (hash) => { if (location.hash === hash) refresh(); else location.hash = hash; };

export function announceBadges() {
  const fresh = checkNewBadges();
  fresh.forEach((b, i) => setTimeout(() => toast(`${b.emoji} Nuevo logro: ${b.name}`), 600 + i * 2800));
}

// Después de una práctica: celebrar y preguntar suavemente cómo se siente.
export function afterSession(session) {
  if (!session) return;
  const s = openSheet({
    title: 'Práctica completada',
    html: `
      <div class="center stack">
        <div class="big-emoji">🌿</div>
        <p class="lead">${esc(formatMinutes(session.minutes))} para ti. Bien hecho.</p>
        <p class="muted">¿Cómo te sientes ahora?</p>
        <div class="mood-row">
          ${MOODS.map((m) => `<button type="button" class="mood-btn" data-v="${m.v}"><span>${m.emoji}</span><small>${m.label}</small></button>`).join('')}
        </div>
        <button type="button" class="btn ghost" data-skip>Ahora no</button>
      </div>`,
    onClose: announceBadges,
  });
  s.body.addEventListener('click', (e) => {
    const b = e.target.closest('.mood-btn');
    if (b) { setSessionMood(session.id, Number(b.dataset.v)); s.close(); toast('Guardado 💛'); }
    if (e.target.closest('[data-skip]')) s.close();
  });
}

export function emptyState(emoji, text) {
  return `<div class="empty"><div class="big-emoji">${emoji}</div><p>${text}</p></div>`;
}

export function progressRing(value, { size = 56, stroke = 5, label = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--line)" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--accent)" stroke-width="${stroke}" fill="none"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    ${label ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-label">${label}</text>` : ''}
  </svg>`;
}

export const bar = (value) => `<div class="bar"><span style="width:${Math.round(Math.max(0, Math.min(1, value)) * 100)}%"></span></div>`;
