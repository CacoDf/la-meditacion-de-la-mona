// Arranque de la app: tema, navegación entre pantallas, bienvenida y actualización offline.

import { state, subscribe } from './store.js';
import { $, closeAllSheets, toast } from './util.js';
import { ICONS } from './icons.js';
import { announceBadges, applyTheme } from './ui.js';
import { unlockAudio } from './audio.js';
import hoy from './views/hoy.js';
import meditar from './views/meditar.js';
import diario from './views/diario.js';
import retos from './views/retos.js';
import yo from './views/yo.js';
import { palabra, sopa } from './views/juegos.js';
import { showOnboarding } from './views/onboarding.js';

const TABS = [
  { id: 'hoy', label: 'Hoy', view: hoy },
  { id: 'meditar', label: 'Meditar', view: meditar },
  { id: 'diario', label: 'Diario', view: diario },
  { id: 'retos', label: 'Retos', view: retos },
  { id: 'yo', label: 'Yo', view: yo },
];

const ROUTES = {
  ...Object.fromEntries(TABS.map((t) => [t.id, t.view])),
  'juegos/palabra': palabra,
  'juegos/sopa': sopa,
};

const viewEl = $('#view');
const navEl = $('#tabbar');
let currentRoute = null;

function routeFromHash() {
  const r = location.hash.replace(/^#\/?/, '');
  return ROUTES[r] ? r : 'hoy';
}

function renderNav(route) {
  const tab = route.split('/')[0];
  const active = tab === 'juegos' ? 'retos' : tab;
  navEl.innerHTML = TABS.map((t) => `
    <a href="#/${t.id}" class="tab${t.id === active ? ' active' : ''}" aria-label="${t.label}" ${t.id === active ? 'aria-current="page"' : ''}>
      ${ICONS[t.id]}<span>${t.label}</span>
    </a>`).join('');
}

function render({ keepScroll = false } = {}) {
  const route = routeFromHash();
  const view = ROUTES[route];
  const changed = route !== currentRoute;
  if (changed && currentRoute) ROUTES[currentRoute].unmount?.();
  const y = window.scrollY;
  // Un contenedor nuevo en cada render: así los eventos de la vista anterior desaparecen con él.
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = view.render();
  viewEl.replaceChildren(page);
  viewEl.dataset.route = route;
  view.mount?.(page);
  renderNav(route);
  if (changed) {
    window.scrollTo(0, 0);
    viewEl.classList.remove('enter');
    void viewEl.offsetWidth;
    viewEl.classList.add('enter');
  } else if (keepScroll) {
    window.scrollTo(0, y);
  }
  currentRoute = route;
}

window.addEventListener('hashchange', () => { closeAllSheets(); render(); });
window.addEventListener('calma:refresh', () => render({ keepScroll: true }));
subscribe(() => { render({ keepScroll: true }); announceBadges(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

// iOS exige un toque antes de poder reproducir sonido.
document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
document.addEventListener('click', unlockAudio, { once: true });

// Si pasa la medianoche con la app abierta, refresca "Hoy".
let lastDay = new Date().toDateString();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const d = new Date().toDateString();
  if (d !== lastDay) { lastDay = d; render({ keepScroll: true }); }
});

/* ---------- Funcionamiento sin internet ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const offerUpdate = (worker) => {
        toast('Hay una nueva versión de Calma', {
          action: 'Actualizar',
          onAction: () => worker.postMessage('skipWaiting'),
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    } catch (e) {
      console.warn('Service worker no disponible', e);
    }
  });
}

/* ---------- Inicio ---------- */

applyTheme();
render();
if (!state.profile.onboarded) showOnboarding(() => render());
