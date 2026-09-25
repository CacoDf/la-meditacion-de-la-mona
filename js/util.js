// Utilidades compartidas: DOM, fechas, hojas (modales), avisos y wake lock.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/* ---------- Fechas (siempre en hora local) ---------- */

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function daysBetween(fromKey, toKey) {
  return Math.round((parseDay(toKey) - parseDay(fromKey)) / 86400000);
}

export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const weekKey = (d = new Date()) => dayKey(weekStart(d));

export const weekDays = (d = new Date()) => Array.from({ length: 7 }, (_, i) => dayKey(addDays(weekStart(d), i)));

const fmtLong = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const longDate = (d = new Date()) => cap(fmtLong.format(d));
export const shortDate = (d) => fmtShort.format(d).replace('.', '');
export const monthName = (d) => cap(fmtMonth.format(d));
export const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatMinutes(min) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/* ---------- Azar determinista (para "del día") ---------- */

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pickOfDay = (list, salt = '', key = dayKey()) => list[hashStr(key + salt) % list.length];

export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- Avisos ---------- */

let toastTimer;
export function toast(message, { action, onAction, duration = 2600 } = {}) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { el.classList.remove('show'); onAction?.(); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 8000 : duration);
}

/* ---------- Hojas (paneles que suben desde abajo) ---------- */

const openSheets = [];

export function openSheet({ title = '', html = '', full = false, dark = false, onMount, onClose, className = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = `sheet-wrap${full ? ' full' : ''}${dark ? ' dark' : ''} ${className}`;
  wrap.innerHTML = `
    <div class="sheet-backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-head">
        ${full ? '' : '<div class="grabber"></div>'}
        <h2>${esc(title)}</h2>
        <button type="button" class="icon-btn sheet-close" aria-label="Cerrar">✕</button>
      </header>
      <div class="sheet-body">${html}</div>
    </section>`;
  document.body.appendChild(wrap);
  document.body.classList.add('no-scroll');

  let closed = false;
  const api = {
    el: wrap,
    body: wrap.querySelector('.sheet-body'),
    setTitle: (t) => { wrap.querySelector('.sheet-head h2').textContent = t; },
    close() {
      if (closed) return;
      closed = true;
      onClose?.();
      wrap.classList.remove('open');
      openSheets.splice(openSheets.indexOf(api), 1);
      if (!openSheets.length) document.body.classList.remove('no-scroll');
      setTimeout(() => wrap.remove(), 320);
    },
  };
  openSheets.push(api);
  wrap.querySelector('.sheet-backdrop').addEventListener('click', api.close);
  wrap.querySelector('.sheet-close').addEventListener('click', api.close);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  onMount?.(api.body, api);
  return api;
}

export const closeAllSheets = () => [...openSheets].forEach((s) => s.close());

export function confirmSheet({ title, message, ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const s = openSheet({
      title,
      html: `<p class="muted">${esc(message)}</p>
        <div class="row gap">
          <button type="button" class="btn ghost grow" data-a="no">${esc(cancel)}</button>
          <button type="button" class="btn ${danger ? 'danger' : 'primary'} grow" data-a="yes">${esc(ok)}</button>
        </div>`,
      onClose: () => { if (!answered) resolve(false); },
    });
    s.body.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a) return;
      answered = true;
      resolve(a === 'yes');
      s.close();
    });
  });
}

/* ---------- Mantener la pantalla encendida ---------- */

let wakeLock = null;
let wakeWanted = false;

export async function keepAwake(on) {
  wakeWanted = on;
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* no disponible: no pasa nada */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeWanted) keepAwake(true);
});

export const isStandalone = () =>
  window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function autoGrow(textarea) {
  const grow = () => { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight + 2}px`; };
  textarea.addEventListener('input', grow);
  requestAnimationFrame(grow);
}
