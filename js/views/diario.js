// Pestaña "Diario": gratitud, escritura libre con preguntas, afirmaciones y yo futuro.

import { state, save, setGratitude, saveJournal, deleteJournal } from '../store.js';
import { JOURNAL_PROMPTS, MOODS, moodByValue } from '../content.js';
import {
  esc, dayKey, parseDay, shortDate, monthName, longDate, openSheet, confirmSheet, debounce, autoGrow,
  pickRandom, pickOfDay, toast,
} from '../util.js';
import { ICONS } from '../icons.js';
import { emptyState } from '../ui.js';

let search = '';
let promptIndex = null;
let affIndex = null;

function currentPrompt() {
  if (promptIndex === null) promptIndex = JOURNAL_PROMPTS.indexOf(pickOfDay(JOURNAL_PROMPTS, 'prompt'));
  return JOURNAL_PROMPTS[promptIndex];
}

function render() {
  const today = dayKey();
  const g = state.gratitude[today] || [];
  const slots = Math.max(3, g.length + (g.length >= 3 && g.every(Boolean) ? 1 : 0));
  const total = Object.values(state.gratitude).reduce((a, x) => a + x.filter(Boolean).length, 0);
  const affs = state.affirmations;
  if (affIndex === null) affIndex = affs.length ? Math.floor(Math.random() * affs.length) : 0;
  const fs = state.futureSelf;

  return `
    <header class="page-head">
      <p class="eyebrow">Tu mundo interior</p>
      <h1>Diario</h1>
    </header>

    <section class="card gratitude-card">
      <div class="row between">
        <h2 class="card-title">Hoy agradezco…</h2>
        <span class="tiny muted">${total} en tu frasco</span>
      </div>
      <div class="gratitude-inputs">
        ${Array.from({ length: Math.min(slots, 7) }, (_, i) => `
          <label class="g-line"><span>${i + 1}</span>
            <input class="input line" data-g="${i}" value="${esc(g[i] || '')}" placeholder="${['Algo pequeño que me hizo bien', 'Una persona', 'Algo de mí', 'Algo más…'][Math.min(i, 3)]}" enterkeyhint="next">
          </label>`).join('')}
      </div>
      <div class="row gap wrap">
        <button type="button" class="btn soft small" data-jar>🫙 Abrir el frasco</button>
        <button type="button" class="btn ghost small" data-all-grat>Ver todas</button>
      </div>
    </section>

    <section class="card prompt-card">
      <p class="eyebrow">Una pregunta para ti</p>
      <p class="prompt-text">${esc(currentPrompt())}</p>
      <div class="row gap wrap">
        <button type="button" class="btn primary small" data-write-prompt>Responder</button>
        <button type="button" class="btn ghost small" data-other-prompt>${ICONS.shuffle} Otra</button>
        <button type="button" class="btn ghost small" data-free>Escribir libre</button>
      </div>
    </section>

    <section class="card affirmation-card">
      <p class="eyebrow">Afirmación</p>
      <p class="affirmation">${affs.length ? esc(affs[affIndex % affs.length]) : 'Agrega tus afirmaciones'}</p>
      <div class="row gap">
        <button type="button" class="btn ghost small" data-next-aff>Siguiente</button>
        <button type="button" class="btn ghost small" data-manage-aff>Mis afirmaciones (${affs.length})</button>
      </div>
    </section>

    <button type="button" class="card future-card" data-future>
      <span class="big-emoji">🦋</span>
      <span class="grow">
        <b>Mi yo futuro</b>
        <small>${fs.who ? esc(fs.who.slice(0, 90)) + (fs.who.length > 90 ? '…' : '') : '¿Quién estás eligiendo ser? Descríbela, siéntela y vuelve aquí para recordarla.'}</small>
      </span>
    </button>

    <section>
      <div class="section-head">
        <h2 class="section-title">Mis entradas</h2>
        <button type="button" class="btn soft small" data-free>${ICONS.plus} Nueva</button>
      </div>
      ${state.journal.length > 3 ? `<label class="search"><span>${ICONS.search}</span><input type="search" placeholder="Buscar en mi diario" value="${esc(search)}" data-search></label>` : ''}
      <div id="entries">${renderEntries()}</div>
    </section>`;
}

function renderEntries() {
  const q = search.trim().toLowerCase();
  const list = state.journal
    .filter((e) => !q || `${e.title} ${e.text} ${e.prompt || ''}`.toLowerCase().includes(q))
    .sort((a, b) => b.created.localeCompare(a.created));
  if (!list.length) return q ? emptyState('🔎', 'No encontré entradas con esa palabra.') : emptyState('📓', 'Tu diario está esperando tu primera página.');
  let lastMonth = '';
  return list.map((e) => {
    const d = new Date(e.created);
    const m = monthName(d);
    const head = m !== lastMonth ? `<p class="month-label">${m}</p>` : '';
    lastMonth = m;
    const mood = moodByValue(e.mood);
    return `${head}
      <button type="button" class="entry" data-entry="${e.id}">
        <span class="entry-date"><b>${d.getDate()}</b><small>${shortDate(d).split(' ')[1] || ''}</small></span>
        <span class="grow">
          <b>${esc(e.title || e.prompt || 'Sin título')}</b>
          <small>${esc((e.text || '').slice(0, 110))}</small>
        </span>
        ${mood ? `<span class="entry-mood">${mood.emoji}</span>` : ''}
      </button>`;
  }).join('');
}

export function openJournalEditor({ id, prompt } = {}) {
  const existing = id ? state.journal.find((e) => e.id === id) : null;
  const e = existing || { title: '', text: '', prompt: prompt || '', mood: state.moods[dayKey()]?.v || null };
  const draftKey = 'calma:draft';
  let draft = null;
  if (!existing) { try { draft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* nada */ } }
  if (draft && draft.prompt === e.prompt && draft.text) Object.assign(e, draft);

  let saved = false;
  const s = openSheet({
    title: existing ? longDate(new Date(existing.created)) : longDate(),
    full: true,
    className: 'editor-sheet',
    html: `
      ${e.prompt ? `<p class="editor-prompt">${esc(e.prompt)}</p>` : ''}
      <input class="input title-input" data-title placeholder="Título (opcional)" value="${esc(e.title)}">
      <textarea class="input editor-text" data-text placeholder="Escribe lo que sientas…" rows="8">${esc(e.text)}</textarea>
      <p class="label">¿Cómo te sientes?</p>
      <div class="mood-row compact">
        ${MOODS.map((m) => `<button type="button" class="mood-btn${e.mood === m.v ? ' selected' : ''}" data-m="${m.v}"><span>${m.emoji}</span></button>`).join('')}
      </div>
      <div class="row gap editor-actions">
        ${existing ? `<button type="button" class="btn danger ghost" data-del>${ICONS.trash}</button>` : ''}
        <button type="button" class="btn primary grow" data-save>Guardar</button>
      </div>`,
    onClose: () => {
      if (saved || existing) return;
      const text = s.body.querySelector('[data-text]').value;
      if (text.trim()) {
        localStorage.setItem(draftKey, JSON.stringify({ prompt: e.prompt, text, title: s.body.querySelector('[data-title]').value }));
        toast('Guardé tu borrador');
      }
    },
  });
  const b = s.body;
  const ta = b.querySelector('[data-text]');
  autoGrow(ta);
  if (!existing) setTimeout(() => ta.focus(), 350);
  let mood = e.mood;
  b.querySelectorAll('[data-m]').forEach((btn) => btn.addEventListener('click', () => {
    mood = Number(btn.dataset.m) === mood ? null : Number(btn.dataset.m);
    b.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('selected', Number(x.dataset.m) === mood));
  }));
  b.querySelector('[data-save]').addEventListener('click', () => {
    const text = ta.value.trim();
    const title = b.querySelector('[data-title]').value.trim();
    if (!text && !title) { toast('Escribe algo primero 🌿'); return; }
    saved = true;
    localStorage.removeItem(draftKey);
    saveJournal({ id: existing?.id, title, text, prompt: e.prompt, mood });
    s.close();
    toast(existing ? 'Entrada actualizada' : 'Guardado en tu diario 📓');
  });
  b.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (!(await confirmSheet({ title: 'Eliminar entrada', message: 'Esta entrada se borrará para siempre.', ok: 'Eliminar', danger: true }))) return;
    saved = true;
    deleteJournal(existing.id);
    s.close();
  });
}

function allGratitudes() {
  return Object.entries(state.gratitude)
    .flatMap(([d, items]) => items.filter(Boolean).map((t) => ({ d, t })))
    .sort((a, b) => b.d.localeCompare(a.d));
}

function openJar() {
  const all = allGratitudes().filter((x) => x.d !== dayKey());
  const pool = all.length ? all : allGratitudes();
  if (!pool.length) { toast('Tu frasco se llena a medida que agradeces 🫙'); return; }
  const show = () => {
    const g = pickRandom(pool);
    return `<div class="jar-note"><p>“${esc(g.t)}”</p><small>${esc(longDate(parseDay(g.d)))}</small></div>`;
  };
  const s = openSheet({
    title: 'Frasco de gratitud',
    html: `<div data-note>${show()}</div><button type="button" class="btn soft block" data-again>Sacar otro papelito</button>`,
  });
  s.body.querySelector('[data-again]').addEventListener('click', () => { s.body.querySelector('[data-note]').innerHTML = show(); });
}

function openAllGratitude() {
  const all = allGratitudes();
  const byDay = {};
  all.forEach(({ d, t }) => { (byDay[d] ||= []).push(t); });
  openSheet({
    title: `Mis gratitudes (${all.length})`,
    html: all.length ? Object.entries(byDay).map(([d, items]) => `
      <div class="grat-day"><p class="month-label">${esc(longDate(parseDay(d)))}</p><ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')
      : emptyState('🙏', 'Aún no hay gratitudes guardadas.'),
  });
}

function manageAffirmations() {
  const draw = () => `
    <ul class="aff-list">
      ${state.affirmations.map((a, i) => `<li><span>${esc(a)}</span><button type="button" class="icon-btn" data-rm="${i}" aria-label="Quitar">${ICONS.trash}</button></li>`).join('')}
    </ul>
    <div class="row gap">
      <input class="input grow" data-new placeholder="Escribe una afirmación en presente" enterkeyhint="done">
      <button type="button" class="btn primary" data-add>${ICONS.plus}</button>
    </div>`;
  const s = openSheet({ title: 'Mis afirmaciones', html: `<div data-wrap>${draw()}</div>`, onClose: () => save() });
  const wrap = s.body.querySelector('[data-wrap]');
  const add = () => {
    const input = wrap.querySelector('[data-new]');
    const v = input.value.trim();
    if (!v) return;
    state.affirmations.push(v);
    save({ silent: true });
    wrap.innerHTML = draw();
    wrap.querySelector('[data-new]').focus();
  };
  wrap.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { state.affirmations.splice(Number(rm.dataset.rm), 1); save({ silent: true }); wrap.innerHTML = draw(); }
    if (e.target.closest('[data-add]')) add();
  });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-new]')) add(); });
}

export function openFutureSelf() {
  const fs = state.futureSelf;
  const fields = [
    ['who', '¿Quién es tu yo futuro?', 'Describe a la persona que estás eligiendo ser: cómo piensa, cómo se ve, cómo vive.'],
    ['feel', '¿Cómo se siente?', 'Las emociones elevadas que vive a diario: paz, gratitud, alegría, confianza…'],
    ['does', '¿Qué hace distinto?', 'Sus hábitos, sus decisiones, cómo reacciona, qué ya no hace.'],
    ['letter', 'Una carta de tu yo futuro', 'Escríbete como si ya fueras ella, agradeciendo lo que hiciste por llegar.'],
  ];
  const s = openSheet({
    title: 'Mi yo futuro 🦋',
    full: true,
    html: `
      <p class="muted">Vuelve a leer esto antes de meditar: tu mente y tu corazón empiezan a ensayar a esa persona hoy.</p>
      ${fields.map(([k, label, hint]) => `
        <label class="label">${label}
          <textarea class="input" data-fs="${k}" rows="3" placeholder="${esc(hint)}">${esc(fs[k] || '')}</textarea>
        </label>`).join('')}
      <p class="tiny muted">Se guarda automáticamente.</p>`,
    onClose: () => save(),
  });
  s.body.querySelectorAll('[data-fs]').forEach((ta) => {
    autoGrow(ta);
    ta.addEventListener('input', debounce(() => {
      fs[ta.dataset.fs] = ta.value;
      fs.updated = new Date().toISOString();
      save({ silent: true });
    }, 300));
  });
}

function mount(root) {
  const today = dayKey();
  const inputs = [...root.querySelectorAll('[data-g]')];
  const saveG = debounce(() => setGratitude(today, inputs.map((i) => i.value)), 350);
  inputs.forEach((input, i) => {
    input.addEventListener('input', saveG);
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      (inputs[i + 1] || input).focus();
      if (!inputs[i + 1]) input.blur();
    });
    // Al salir del último campo lleno, agrega una línea más (hasta 7).
    input.addEventListener('blur', () => {
      setGratitude(today, inputs.map((x) => x.value));
      const all = inputs.every((x) => x.value.trim());
      if (all && inputs.length < 7) setTimeout(() => { if (!root.contains(document.activeElement) || !document.activeElement.matches('[data-g]')) save(); }, 50);
    });
  });

  root.querySelector('[data-jar]').addEventListener('click', openJar);
  root.querySelector('[data-all-grat]').addEventListener('click', openAllGratitude);
  root.querySelector('[data-write-prompt]').addEventListener('click', () => openJournalEditor({ prompt: currentPrompt() }));
  root.querySelector('[data-other-prompt]').addEventListener('click', () => {
    promptIndex = (promptIndex + 1 + Math.floor(Math.random() * (JOURNAL_PROMPTS.length - 1))) % JOURNAL_PROMPTS.length;
    root.querySelector('.prompt-card .prompt-text').textContent = currentPrompt();
  });
  root.querySelectorAll('[data-free]').forEach((b) => b.addEventListener('click', () => openJournalEditor({})));
  root.querySelector('[data-next-aff]').addEventListener('click', () => {
    affIndex++;
    const affs = state.affirmations;
    if (affs.length) root.querySelector('.affirmation').textContent = affs[affIndex % affs.length];
  });
  root.querySelector('[data-manage-aff]').addEventListener('click', manageAffirmations);
  root.querySelector('[data-future]').addEventListener('click', openFutureSelf);
  root.querySelector('#entries').addEventListener('click', (e) => {
    const b = e.target.closest('[data-entry]');
    if (b) openJournalEditor({ id: b.dataset.entry });
  });
  root.querySelector('[data-search]')?.addEventListener('input', (e) => {
    search = e.target.value;
    root.querySelector('#entries').innerHTML = renderEntries();
  });
}

export default { render, mount };
