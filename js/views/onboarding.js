// Bienvenida: primero invita a instalar la app y luego muestra la sorpresa.

import { CONFIG } from '../config.js';
import { state, save } from '../store.js';
import { esc, isStandalone, isIOS } from '../util.js';
import { ICONS } from '../icons.js';

export function showOnboarding(done) {
  const el = document.createElement('div');
  el.className = 'onboarding';
  document.body.appendChild(el);
  document.body.classList.add('no-scroll');

  const finish = () => {
    state.profile.onboarded = true;
    save({ silent: true });
    el.classList.add('leaving');
    document.body.classList.remove('no-scroll');
    setTimeout(() => el.remove(), 700);
    done?.();
  };

  const steps = {
    install() {
      el.innerHTML = `
        <div class="ob-inner">
          <div class="ob-logo">${ICONS.meditar}</div>
          <h1 class="ob-title">${esc(CONFIG.appName)}</h1>
          <p class="ob-sub">Tu rincón para respirar, agradecer y volver a ti.</p>
          <div class="card install-card">
            <p><strong>Instálala en tu iPhone</strong> para usarla como una app:</p>
            <ol>
              <li>Toca el botón <b>Compartir</b> <span class="ios-share">${ICONS.share}</span> de Safari.</li>
              <li>Elige <b>“Agregar a inicio”</b>.</li>
              <li>Abre <b>${esc(CONFIG.appName)}</b> desde tu pantalla de inicio.</li>
            </ol>
            <p class="muted small">Hay una sorpresa esperándote adentro 💛</p>
          </div>
          <button type="button" class="btn link" data-next>Seguir en el navegador</button>
        </div>`;
      el.querySelector('[data-next]').onclick = () => steps.note();
    },
    note() {
      el.innerHTML = `
        <div class="ob-inner note-step">
          <div class="note-leaf">🌿</div>
          <p class="note-title">${esc(CONFIG.loveNoteTitle)}</p>
          <p class="note-text">${esc(CONFIG.loveNote)}</p>
          <button type="button" class="btn primary" data-next>Entrar</button>
        </div>`;
      el.querySelector('[data-next]').onclick = () => steps.name();
    },
    name() {
      el.innerHTML = `
        <div class="ob-inner">
          <div class="big-emoji">🪷</div>
          <h2 class="ob-h2">¿Cómo quieres que te llame?</h2>
          <input class="input center" id="ob-name" maxlength="24" value="${esc(state.profile.name)}" autocomplete="given-name">
          <button type="button" class="btn primary" data-next>Continuar</button>
        </div>`;
      const input = el.querySelector('#ob-name');
      el.querySelector('[data-next]').onclick = () => {
        state.profile.name = input.value.trim() || CONFIG.defaultName;
        save({ silent: true });
        steps.tour();
      };
    },
    tour() {
      const items = [
        ['hoy', 'Hoy', 'Tu ritual diario: ánimo, intención, luna y frase del día.'],
        ['meditar', 'Meditar', 'Tus meditaciones de YouTube, tus audios, respiración, temporizador y sonidos.'],
        ['diario', 'Diario', 'Gratitud, escritura, afirmaciones y tu yo futuro.'],
        ['retos', 'Retos', 'Más de 60 retos para elegir, metas, hábitos y juegos.'],
        ['yo', 'Yo', 'Tu progreso, tu jardín interior y tus logros.'],
      ];
      el.innerHTML = `
        <div class="ob-inner">
          <h2 class="ob-h2">Hola, ${esc(state.profile.name)} 🌿</h2>
          <p class="ob-sub">Esto es lo que encontrarás:</p>
          <ul class="tour">
            ${items.map(([ic, t, d]) => `<li><span class="tour-icon">${ICONS[ic]}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}
          </ul>
          <button type="button" class="btn primary" data-next>Comenzar</button>
        </div>`;
      el.querySelector('[data-next]').onclick = finish;
    },
  };

  if (isIOS() && !isStandalone()) steps.install();
  else steps.note();
}
