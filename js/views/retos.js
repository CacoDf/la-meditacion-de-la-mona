// Pestaña "Retos": reto en curso, catálogo, metas semanales, hábitos, reflexión, jardín y juegos.

import {
  state, save, challengeStatus, startChallenge, toggleChallengeDay, closeChallenge, timesCompleted,
  goalProgress, bumpManualGoal, toggleHabit,
} from '../store.js';
import {
  CHALLENGES, CHALLENGE_CATEGORIES, challengeById, GOAL_METRICS, WEEKLY_REFLECTION_QUESTIONS,
} from '../content.js';
import {
  esc, dayKey, weekKey, weekDays, parseDay, WEEK_LETTERS, openSheet, confirmSheet, debounce, autoGrow, uid,
  shortDate, toast,
} from '../util.js';
import { ICONS } from '../icons.js';
import { bar, emptyState } from '../ui.js';

let catFilter = 'todas';

function render() {
  const today = dayKey();
  const ch = challengeStatus();
  const days = weekDays();
  const wk = weekKey();
  const dow = (new Date().getDay() + 6) % 7; // 0 = lunes
  const reflection = state.reflections[wk] || '';
  const completedCount = state.challengeHistory.filter((h) => h.completed).length;

  return `
    <header class="page-head">
      <p class="eyebrow">Crecer un poquito cada día</p>
      <h1>Retos</h1>
    </header>

    ${ch ? renderCurrent(ch, today) : `
    <section class="card challenge-empty-big">
      <div class="big-emoji">🎯</div>
      <h2 class="card-title">Elige tu próximo reto</h2>
      <p class="muted small">${CHALLENGES.length} retos para elegir: semanas temáticas y caminos largos de 14 a 30 días.</p>
      <button type="button" class="btn primary" data-catalog>Ver retos</button>
    </section>`}

    <section>
      <div class="section-head">
        <h2 class="section-title">Metas de la semana</h2>
        <button type="button" class="icon-btn" data-edit-goals aria-label="Editar metas">${ICONS.edit}</button>
      </div>
      <div class="card goals">
        ${state.goals.length ? state.goals.map((g) => {
          const v = goalProgress(g);
          const pct = g.target ? v / g.target : 0;
          const m = GOAL_METRICS[g.metric];
          return `
            <div class="goal${pct >= 1 ? ' done' : ''}">
              <div class="row between">
                <span>${esc(g.emoji || '🎯')} <b>${esc(g.title)}</b></span>
                <span class="small">${v} / ${g.target} ${esc(m?.unit || '')} ${pct >= 1 ? '✓' : ''}</span>
              </div>
              ${bar(pct)}
              ${m && !m.auto ? `<div class="row gap-s goal-btns"><button type="button" class="chip" data-goal-minus="${g.id}">−</button><button type="button" class="chip" data-goal-plus="${g.id}">+ 1</button></div>` : ''}
            </div>`;
        }).join('') : emptyState('🎯', 'Agrega metas para tu semana.')}
      </div>
    </section>

    <section>
      <div class="section-head">
        <h2 class="section-title">Hábitos</h2>
        <button type="button" class="icon-btn" data-edit-habits aria-label="Editar hábitos">${ICONS.edit}</button>
      </div>
      <div class="card habits">
        <div class="habit-head"><span></span>${WEEK_LETTERS.map((l, i) => `<span class="${i === dow ? 'today' : ''}">${l}</span>`).join('')}</div>
        ${state.habits.map((h) => `
          <div class="habit-row">
            <span class="habit-name">${esc(h.emoji)} ${esc(h.name)}</span>
            ${days.map((d, i) => {
              const on = state.habitLog[d]?.includes(h.id);
              const future = i > dow;
              return `<button type="button" class="dot${on ? ' on' : ''}${i === dow ? ' today' : ''}" data-habit="${h.id}" data-day="${d}" ${future ? 'disabled' : ''} aria-label="${esc(h.name)} ${d}"></button>`;
            }).join('')}
          </div>`).join('')}
      </div>
    </section>

    <section class="card reflection-card">
      <h2 class="card-title">Reflexión de la semana</h2>
      <ul class="small muted questions">${WEEKLY_REFLECTION_QUESTIONS.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      <textarea class="input soft" data-reflection rows="3" placeholder="${dow >= 4 ? 'Se acerca el fin de semana: un buen momento para mirar hacia atrás…' : 'Puedes escribir durante toda la semana…'}">${esc(reflection)}</textarea>
      ${Object.keys(state.reflections).filter((k) => k !== wk).length ? '<button type="button" class="btn ghost small" data-past-refl>Reflexiones anteriores</button>' : ''}
    </section>

    <section>
      <h2 class="section-title">Tu jardín</h2>
      <div class="card garden">
        ${renderGarden()}
        <p class="small muted">${completedCount ? `Cada flor es un reto que completaste (${completedCount}).` : 'Cada reto que completes hará florecer tu jardín.'}</p>
        ${state.challengeHistory.length ? '<button type="button" class="btn ghost small" data-history>Ver historial de retos</button>' : ''}
      </div>
    </section>

    <section>
      <h2 class="section-title">Juegos</h2>
      <div class="grid-2">
        <a href="#/juegos/palabra" class="card game-card">
          <span class="big-emoji">🔤</span><b>Palabra del día</b>
          <small class="muted">${state.games.wordle[today]?.done ? (state.games.wordle[today].won ? '✓ Resuelta hoy' : 'Vuelve mañana') : 'Adivina en 6 intentos'}</small>
        </a>
        <a href="#/juegos/sopa" class="card game-card">
          <span class="big-emoji">🔎</span><b>Sopa de letras</b>
          <small class="muted">${state.games.sopa.done ? `${state.games.sopa.done} resueltas` : 'Encuentra las palabras'}</small>
        </a>
      </div>
    </section>`;
}

function renderCurrent(ch, today) {
  const cat = CHALLENGE_CATEGORIES[ch.def.cat];
  const long = ch.def.days > 7;
  return `
    <section class="card challenge-current" style="--cat:${cat.color}">
      <p class="eyebrow">${cat.emoji} ${esc(cat.name)} · ${ch.finished ? 'terminado' : `día ${ch.dayIndex + 1} de ${ch.def.days}`}</p>
      <div class="row gap">
        <span class="ch-emoji big">${ch.def.emoji}</span>
        <div class="grow">
          <h2 class="card-title">${esc(ch.def.title)}</h2>
          <p class="small muted">${esc(ch.def.desc)}</p>
        </div>
      </div>
      <p class="daily-action">${esc(ch.def.daily)}</p>
      <div class="ch-days${long ? ' long' : ''}">
        ${ch.days.map((d, i) => {
          const done = state.challenge.done.includes(d);
          const isToday = d === today;
          const future = i > ch.dayIndex;
          const editable = !future && ch.dayIndex - i <= 1; // hoy y ayer
          return `<button type="button" class="ch-day${done ? ' done' : ''}${isToday ? ' today' : ''}" ${editable ? `data-ch-day="${d}"` : 'disabled'} aria-label="Día ${i + 1}">
            ${long ? '' : `<small>${WEEK_LETTERS[(parseDay(d).getDay() + 6) % 7]}</small>`}<span>${done ? '✓' : i + 1}</span></button>`;
        }).join('')}
      </div>
      ${ch.finished ? `
        <div class="ch-finish">
          <p><b>${ch.doneCount} de ${ch.def.days} días</b> ${ch.doneCount >= Math.ceil(ch.def.days * 0.7) ? '— ¡Reto cumplido! 🌸 Una flor nueva en tu jardín.' : '— Cada día cuenta. Puedes repetirlo cuando quieras.'}</p>
          <button type="button" class="btn primary block" data-close-ch>Guardar y elegir otro</button>
        </div>` : `
        <button type="button" class="btn ${ch.todayDone ? 'done' : 'primary'} block" data-ch-day="${today}">${ch.todayDone ? '✓ Hecho hoy' : 'Marcar hoy como hecho'}</button>
        <div class="row between">
          <span class="small muted">${ch.doneCount} de ${ch.def.days} días</span>
          <button type="button" class="btn link small" data-catalog>Cambiar reto</button>
        </div>`}
    </section>`;
}

function renderGarden() {
  const done = state.challengeHistory.filter((h) => h.completed);
  const flowers = done.map((h) => {
    const def = challengeById(h.id);
    return `<span class="flower" title="${esc(def?.title || '')}">${FLOWERS[def?.cat] || '🌼'}</span>`;
  });
  const sprouts = Math.max(0, 12 - flowers.length);
  return `<div class="garden-bed">${flowers.join('')}${'<span class="flower sprout">🌱</span>'.repeat(Math.min(sprouts, 12))}</div>`;
}

const FLOWERS = { mente: '🪷', corazon: '🌷', cuerpo: '🌿', digital: '🌾', naturaleza: '🌳', espiritu: '🌻', creatividad: '🌺', autocuidado: '🌸', caminos: '🌼' };

/* ---------- Catálogo ---------- */

function openCatalog() {
  const draw = () => {
    const list = CHALLENGES.filter((c) => catFilter === 'todas' || c.cat === catFilter);
    return `
      <div class="chips scroll-x">
        <button type="button" class="chip${catFilter === 'todas' ? ' selected' : ''}" data-cat="todas">Todos</button>
        ${Object.entries(CHALLENGE_CATEGORIES).map(([id, c]) => `<button type="button" class="chip${catFilter === id ? ' selected' : ''}" data-cat="${id}">${c.emoji} ${esc(c.name)}</button>`).join('')}
      </div>
      <div class="catalog">
        ${list.map((c) => {
          const n = timesCompleted(c.id);
          const current = state.challenge?.id === c.id;
          return `
            <button type="button" class="catalog-item${current ? ' current' : ''}" data-pick="${c.id}" style="--cat:${CHALLENGE_CATEGORIES[c.cat].color}">
              <span class="ch-emoji">${c.emoji}</span>
              <span class="grow"><b>${esc(c.title)}</b><small>${esc(c.daily)}</small></span>
              <span class="catalog-meta">${c.days} días${n ? `<br>✓ ${n}` : ''}${current ? '<br>en curso' : ''}</span>
            </button>`;
        }).join('')}
      </div>`;
  };
  const s = openSheet({ title: 'Elige un reto', full: true, html: `<div data-wrap>${draw()}</div>` });
  const wrap = s.body.querySelector('[data-wrap]');
  wrap.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]');
    if (cat) { catFilter = cat.dataset.cat; wrap.innerHTML = draw(); return; }
    const pick = e.target.closest('[data-pick]');
    if (pick) openChallengeDetail(pick.dataset.pick, s);
  });
}

function openChallengeDetail(id, parent) {
  const c = challengeById(id);
  const cat = CHALLENGE_CATEGORIES[c.cat];
  const n = timesCompleted(id);
  const s = openSheet({
    title: c.title,
    html: `
      <div class="center stack">
        <div class="big-emoji">${c.emoji}</div>
        <p class="eyebrow">${cat.emoji} ${esc(cat.name)} · ${c.days} días</p>
        <p>${esc(c.desc)}</p>
        <div class="card soft-card"><p class="small muted">Cada día</p><p><b>${esc(c.daily)}</b></p></div>
        ${n ? `<p class="small muted">Ya lo completaste ${n} ${n === 1 ? 'vez' : 'veces'} 🌸</p>` : ''}
        <button type="button" class="btn primary block" data-start>${state.challenge?.id === id ? 'Reiniciar este reto' : 'Comenzar hoy'}</button>
      </div>`,
  });
  s.body.querySelector('[data-start]').addEventListener('click', async () => {
    if (state.challenge) {
      const cur = challengeById(state.challenge.id);
      const ok = await confirmSheet({
        title: 'Cambiar de reto',
        message: `Tu reto actual (“${cur?.title}”) se guardará en tu historial con los días que llevas.`,
        ok: 'Cambiar',
      });
      if (!ok) return;
    }
    startChallenge(id);
    s.close();
    parent?.close();
    toast(`Comienza “${c.title}” ${c.emoji}`);
  });
}

/* ---------- Metas ---------- */

function openGoalsEditor() {
  const draw = () => `
    <div class="goal-edit-list">
      ${state.goals.map((g) => `
        <div class="goal-edit">
          <span>${esc(g.emoji)} <b>${esc(g.title)}</b><small class="muted"> · ${g.target} ${esc(GOAL_METRICS[g.metric]?.unit || '')}/semana</small></span>
          <button type="button" class="icon-btn" data-rm="${g.id}" aria-label="Quitar">${ICONS.trash}</button>
        </div>`).join('')}
    </div>
    <p class="label">Nueva meta</p>
    <div class="row gap">
      <input class="input" style="width:4rem" data-emoji value="🎯" maxlength="4" aria-label="Ícono">
      <input class="input grow" data-title placeholder="Ej: Hacer yoga">
    </div>
    <div class="row gap">
      <select class="input grow" data-metric>
        ${Object.entries(GOAL_METRICS).map(([k, m]) => `<option value="${k}">${esc(m.label)}</option>`).join('')}
      </select>
      <input class="input" style="width:5.5rem" type="number" inputmode="numeric" min="1" data-target value="3" aria-label="Meta">
    </div>
    <button type="button" class="btn primary block" data-add>Agregar meta</button>`;
  const s = openSheet({ title: 'Metas semanales', html: `<div data-wrap>${draw()}</div>`, onClose: () => save() });
  const wrap = s.body.querySelector('[data-wrap]');
  wrap.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { state.goals = state.goals.filter((g) => g.id !== rm.dataset.rm); save({ silent: true }); wrap.innerHTML = draw(); }
    if (e.target.closest('[data-add]')) {
      const title = wrap.querySelector('[data-title]').value.trim();
      const metric = wrap.querySelector('[data-metric]').value;
      const target = Math.max(1, Number(wrap.querySelector('[data-target]').value) || 1);
      if (!title) { toast('Ponle un nombre a tu meta'); return; }
      state.goals.push({ id: uid(), title, metric, target, emoji: wrap.querySelector('[data-emoji]').value.trim() || '🎯' });
      save({ silent: true });
      wrap.innerHTML = draw();
    }
  });
}

/* ---------- Hábitos ---------- */

function openHabitsEditor() {
  const draw = () => `
    <div class="goal-edit-list">
      ${state.habits.map((h) => `
        <div class="goal-edit"><span>${esc(h.emoji)} ${esc(h.name)}</span>
          <button type="button" class="icon-btn" data-rm="${h.id}" aria-label="Quitar">${ICONS.trash}</button></div>`).join('')}
    </div>
    <p class="label">Nuevo hábito</p>
    <div class="row gap">
      <input class="input" style="width:4rem" data-emoji value="✨" maxlength="4" aria-label="Ícono">
      <input class="input grow" data-name placeholder="Ej: Leer 10 páginas" enterkeyhint="done">
      <button type="button" class="btn primary" data-add>${ICONS.plus}</button>
    </div>
    <p class="tiny muted">Ideas: 🍵 Té sin apuro · 📖 Leer · 🛏️ Dormir temprano · 🙆‍♀️ Estirar · 🥗 Comer rico y sano</p>`;
  const s = openSheet({ title: 'Mis hábitos', html: `<div data-wrap>${draw()}</div>`, onClose: () => save() });
  const wrap = s.body.querySelector('[data-wrap]');
  const add = () => {
    const name = wrap.querySelector('[data-name]').value.trim();
    if (!name) return;
    state.habits.push({ id: uid(), name, emoji: wrap.querySelector('[data-emoji]').value.trim() || '✨' });
    save({ silent: true });
    wrap.innerHTML = draw();
  };
  wrap.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { state.habits = state.habits.filter((h) => h.id !== rm.dataset.rm); save({ silent: true }); wrap.innerHTML = draw(); }
    if (e.target.closest('[data-add]')) add();
  });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-name]')) add(); });
}

/* ---------- Historial ---------- */

function openHistory() {
  const list = [...state.challengeHistory].reverse();
  openSheet({
    title: 'Historial de retos',
    html: list.map((h) => {
      const c = challengeById(h.id);
      return `<div class="history-item">
        <span class="ch-emoji">${c?.emoji || '🎯'}</span>
        <span class="grow"><b>${esc(c?.title || h.id)}</b><small class="muted">${shortDate(parseDay(h.start))} · ${h.done}/${h.days} días</small></span>
        <span>${h.completed ? '🌸' : '🌱'}</span>
      </div>`;
    }).join(''),
  });
}

function openPastReflections() {
  const wk = weekKey();
  const entries = Object.entries(state.reflections).filter(([k, v]) => k !== wk && v.trim()).sort((a, b) => b[0].localeCompare(a[0]));
  openSheet({
    title: 'Reflexiones anteriores',
    html: entries.length ? entries.map(([k, v]) => `<div class="grat-day"><p class="month-label">Semana del ${shortDate(parseDay(k))}</p><p class="pre">${esc(v)}</p></div>`).join('') : emptyState('🍃', 'Aún no hay reflexiones anteriores.'),
  });
}

/* ---------- Montaje ---------- */

function mount(root) {
  root.querySelectorAll('[data-catalog]').forEach((b) => b.addEventListener('click', openCatalog));
  root.querySelectorAll('[data-ch-day]').forEach((b) => b.addEventListener('click', () => toggleChallengeDay(b.dataset.chDay)));
  root.querySelector('[data-close-ch]')?.addEventListener('click', () => {
    const rec = closeChallenge();
    if (rec?.completed) toast('¡Una flor nueva en tu jardín! 🌸');
    openCatalog();
  });
  root.querySelectorAll('[data-habit]').forEach((b) => b.addEventListener('click', () => toggleHabit(b.dataset.habit, b.dataset.day)));
  root.querySelector('[data-edit-goals]').addEventListener('click', openGoalsEditor);
  root.querySelector('[data-edit-habits]').addEventListener('click', openHabitsEditor);
  root.querySelectorAll('[data-goal-plus]').forEach((b) => b.addEventListener('click', () => bumpManualGoal(b.dataset.goalPlus, 1)));
  root.querySelectorAll('[data-goal-minus]').forEach((b) => b.addEventListener('click', () => bumpManualGoal(b.dataset.goalMinus, -1)));
  root.querySelector('[data-history]')?.addEventListener('click', openHistory);
  root.querySelector('[data-past-refl]')?.addEventListener('click', openPastReflections);

  const refl = root.querySelector('[data-reflection]');
  autoGrow(refl);
  refl.addEventListener('input', debounce(() => {
    const v = refl.value;
    if (v.trim()) state.reflections[weekKey()] = v; else delete state.reflections[weekKey()];
    save({ silent: true });
  }));
}

export default { render, mount };
