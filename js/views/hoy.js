// Pestaña "Hoy": saludo, ritual del día, ánimo, intención, luna, frase y reto.

import { state, save, stats, setMood, todayRitual, challengeStatus, toggleChallengeDay } from '../store.js';
import { QUOTES, MOODS, JOURNAL_PROMPTS } from '../content.js';
import { moonPhase, moonSVG, daysUntil } from '../moon.js';
import { esc, dayKey, longDate, greeting, pickOfDay, debounce, formatMinutes, weekDays } from '../util.js';
import { progressRing } from '../ui.js';
import { ICONS } from '../icons.js';
import { openJournalEditor } from './diario.js';
import { openBreath } from './players.js';

const moonCountdown = (n, label) => (n <= 1 ? `${label} ${n === 0 ? 'hoy' : 'mañana'}` : `${label} en ${n} días`);

function render() {
  const today = dayKey();
  const s = stats();
  const ritual = todayRitual();
  const doneCount = ritual.filter((r) => r.done).length;
  const mood = state.moods[today];
  const moon = moonPhase();
  const ch = challengeStatus();
  const weekMin = state.sessions.filter((x) => weekDays().includes(x.day)).reduce((a, x) => a + x.minutes, 0);
  const prompt = pickOfDay(JOURNAL_PROMPTS, 'prompt');

  return `
    <header class="page-head">
      <p class="eyebrow">${esc(longDate())}</p>
      <h1>${greeting()}, ${esc(state.profile.name)}</h1>
      <a href="#/yo" class="level-chip">${s.level.emoji} ${esc(s.level.name)}</a>
    </header>

    <section class="card quote-card">
      <p class="quote">“${esc(pickOfDay(QUOTES, 'quote'))}”</p>
    </section>

    <section class="card ritual-card">
      <div class="row between">
        <div>
          <h2 class="card-title">Tu ritual de hoy</h2>
          <p class="muted small">${doneCount === ritual.length ? '¡Completo! Qué lindo cuidarte así 🌸' : `${doneCount} de ${ritual.length} momentos`}</p>
        </div>
        ${progressRing(doneCount / ritual.length, { label: `${doneCount}/${ritual.length}` })}
      </div>
      <ul class="ritual">
        ${ritual.map((r) => `
          <li class="${r.done ? 'done' : ''}">
            <a href="${r.href}" ${r.anchor ? `data-anchor="${r.anchor}"` : ''}>
              <span class="check">${r.done ? ICONS.check : ''}</span>${esc(r.label)}
            </a>
          </li>`).join('')}
      </ul>
    </section>

    <section class="card" id="checkin">
      <h2 class="card-title">¿Cómo te sientes hoy?</h2>
      <div class="mood-row">
        ${MOODS.map((m) => `
          <button type="button" class="mood-btn${mood?.v === m.v ? ' selected' : ''}" data-mood="${m.v}">
            <span>${m.emoji}</span><small>${m.label}</small>
          </button>`).join('')}
      </div>
      ${mood ? `<textarea class="input soft" id="mood-note" rows="2" placeholder="¿Quieres contar algo más? (opcional)">${esc(mood.note || '')}</textarea>` : ''}
    </section>

    <section class="card">
      <h2 class="card-title">Mi intención de hoy</h2>
      <input class="input soft" id="intention" placeholder="Hoy elijo…" value="${esc(state.intentions[today] || '')}" enterkeyhint="done">
    </section>

    <section class="card moon-card">
      <div class="row gap">
        ${moonSVG(moon.phase, { size: 72, hemisphere: state.settings.hemisphere })}
        <div class="grow">
          <h2 class="card-title">${esc(moon.name)}</h2>
          <p class="muted small">Iluminada ${Math.round(moon.illumination * 100)}% · ${moonCountdown(daysUntil(0.5), 'Llena')} · ${moonCountdown(daysUntil(1), 'Nueva')}</p>
        </div>
      </div>
      <p class="moon-ritual">${esc(moon.ritual)}</p>
      <button type="button" class="btn soft small" data-moon-write>Escribir: ${esc(moon.prompt)}</button>
    </section>

    ${ch ? `
    <section class="card challenge-mini">
      <p class="eyebrow">Reto en curso · día ${Math.min(ch.dayIndex + 1, ch.def.days)} de ${ch.def.days}</p>
      <div class="row gap">
        <span class="ch-emoji">${ch.def.emoji}</span>
        <div class="grow">
          <h2 class="card-title">${esc(ch.def.title)}</h2>
          <p class="small">${esc(ch.def.daily)}</p>
        </div>
      </div>
      ${ch.finished ? '<a href="#/retos" class="btn primary block">Ver cómo te fue</a>' : `
      <button type="button" class="btn ${ch.todayDone ? 'done' : 'primary'} block" data-ch-today>
        ${ch.todayDone ? '✓ Hecho hoy' : 'Marcar como hecho hoy'}
      </button>`}
    </section>` : `
    <a href="#/retos" class="card challenge-empty">
      <span class="ch-emoji">🎯</span>
      <div><h2 class="card-title">Elige tu reto</h2><p class="muted small">Más de 60 retos para crecer un poquito cada día.</p></div>
    </a>`}

    <section class="grid-2">
      <div class="card stat">
        <span class="stat-num">${s.streak}</span>
        <span class="stat-label">${s.streak === 1 ? 'día seguido' : 'días seguidos'} 🔥</span>
      </div>
      <div class="card stat">
        <span class="stat-num">${formatMinutes(weekMin)}</span>
        <span class="stat-label">esta semana</span>
      </div>
    </section>

    <section class="quick">
      <h2 class="section-title">Un momento para ti</h2>
      <div class="quick-grid">
        <a href="#/meditar" class="quick-btn"><span>${ICONS.meditar}</span>Meditar</a>
        <button type="button" class="quick-btn" data-breathe><span>${ICONS.wind}</span>Respirar 1 min</button>
        <a href="#/diario" class="quick-btn"><span>🙏</span>Agradecer</a>
        <a href="#/juegos/palabra" class="quick-btn"><span>🔤</span>Palabra del día</a>
      </div>
    </section>

    <section class="card prompt-card">
      <p class="eyebrow">Pregunta del día</p>
      <p class="prompt-text">${esc(prompt)}</p>
      <button type="button" class="btn soft small" data-prompt>Escribir en mi diario</button>
    </section>`;
}

function mount(root) {
  const today = dayKey();

  root.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => setMood(Number(b.dataset.mood))));

  const note = root.querySelector('#mood-note');
  note?.addEventListener('input', debounce(() => {
    state.moods[today].note = note.value;
    save({ silent: true });
  }));

  const intention = root.querySelector('#intention');
  intention.addEventListener('input', debounce(() => {
    const v = intention.value.trim();
    if (v) state.intentions[today] = v; else delete state.intentions[today];
    save({ silent: true });
  }));
  intention.addEventListener('keydown', (e) => { if (e.key === 'Enter') intention.blur(); });

  root.querySelector('[data-anchor="checkin"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    root.querySelector('#checkin').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  root.querySelector('[data-ch-today]')?.addEventListener('click', () => toggleChallengeDay(today));
  root.querySelector('[data-breathe]').addEventListener('click', () => openBreath({ minutes: 1 }));
  root.querySelector('[data-prompt]').addEventListener('click', () => openJournalEditor({ prompt: pickOfDay(JOURNAL_PROMPTS, 'prompt') }));
  root.querySelector('[data-moon-write]').addEventListener('click', () => openJournalEditor({ prompt: moonPhase().prompt }));
}

export default { render, mount };
