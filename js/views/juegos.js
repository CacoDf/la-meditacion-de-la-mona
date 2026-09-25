// Juegos: "Palabra del día" (tipo Wordle) y "Sopa de letras" con temas de bienestar.

import { state, save } from '../store.js';
import { WORDLE_WORDS, SOPA_THEMES } from '../content.js';
import { esc, dayKey, daysBetween, seededRandom, toast, formatClock } from '../util.js';
import { ICONS } from '../icons.js';
import { openJournalEditor } from './diario.js';

const backHeader = (title, sub) => `
  <header class="page-head with-back">
    <a href="#/retos" class="back-btn" aria-label="Volver">${ICONS.back}</a>
    <div><p class="eyebrow">${sub}</p><h1>${title}</h1></div>
  </header>`;

/* =================== Palabra del día =================== */

const WORD_EPOCH = '2026-01-01';

function shuffledWords() {
  const rnd = seededRandom(333);
  const list = [...WORDLE_WORDS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
const ORDERED = shuffledWords();

export function wordOfDay(day = dayKey()) {
  const n = daysBetween(WORD_EPOCH, day);
  return ORDERED[((n % ORDERED.length) + ORDERED.length) % ORDERED.length];
}

// Devuelve por letra: 'ok' (lugar correcto), 'near' (está en otra posición) o 'no'.
export function evaluate(guess, answer) {
  const g = [...guess];
  const a = [...answer];
  const res = Array(5).fill('no');
  const left = {};
  a.forEach((ch, i) => { if (g[i] === ch) res[i] = 'ok'; else left[ch] = (left[ch] || 0) + 1; });
  g.forEach((ch, i) => {
    if (res[i] === 'ok') return;
    if (left[ch] > 0) { res[i] = 'near'; left[ch]--; }
  });
  return res;
}

let mode = 'daily'; // 'daily' | 'free'
let typing = '';

function currentGame() {
  const games = state.games;
  if (mode === 'free') {
    if (!games.wordleFree) games.wordleFree = { answer: randomWord(), guesses: [], done: false, won: false };
    return games.wordleFree;
  }
  const d = dayKey();
  if (!games.wordle[d]) games.wordle[d] = { guesses: [], done: false, won: false };
  return { ...games.wordle[d], answer: wordOfDay(d), ref: games.wordle[d] };
}

function randomWord() {
  return WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
}

function wordleStats() {
  const all = Object.entries(state.games.wordle).filter(([, g]) => g.done).sort((a, b) => a[0].localeCompare(b[0]));
  const wins = all.filter(([, g]) => g.won).length;
  let streak = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    if (!all[i][1].won) break;
    if (i < all.length - 1 && daysBetween(all[i][0], all[i + 1][0]) !== 1) break;
    streak++;
  }
  return { played: all.length, wins, streak };
}

function renderPalabra() {
  const game = currentGame();
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const guess = game.guesses[r];
    const isTyping = !guess && r === game.guesses.length && !game.done;
    const letters = guess ? [...guess] : isTyping ? [...typing.padEnd(5, ' ')] : [' ', ' ', ' ', ' ', ' '];
    const ev = guess ? evaluate(guess, game.answer) : null;
    rows.push(`<div class="w-row${isTyping ? ' typing' : ''}">${letters.map((l, i) =>
      `<span class="w-tile${ev ? ` ${ev[i]} revealed` : l.trim() ? ' filled' : ''}" style="--i:${i}">${l.trim() ? esc(l) : ''}</span>`).join('')}</div>`);
  }
  const keyState = {};
  game.guesses.forEach((g) => evaluate(g, game.answer).forEach((s, i) => {
    const ch = [...g][i];
    const rank = { ok: 3, near: 2, no: 1 };
    if (!keyState[ch] || rank[s] > rank[keyState[ch]]) keyState[ch] = s;
  }));
  const kb = ['QWERTYUIOP', 'ASDFGHJKLÑ', '⏎ZXCVBNM⌫'].map((row) => `<div class="kb-row">${[...row].map((k) => {
    if (k === '⏎') return '<button type="button" class="key wide" data-key="ENTER">Enviar</button>';
    if (k === '⌫') return `<button type="button" class="key wide" data-key="BACK" aria-label="Borrar">⌫</button>`;
    return `<button type="button" class="key ${keyState[k] || ''}" data-key="${k}">${k}</button>`;
  }).join('')}</div>`).join('');
  const st = wordleStats();

  return `
    ${backHeader('Palabra del día', mode === 'daily' ? 'Una palabra nueva cada día' : 'Modo libre')}
    <p class="small muted center">Adivina la palabra de 5 letras en 6 intentos. Todas son del mundo del bienestar, la naturaleza y el espíritu.</p>
    <div class="legend small"><span class="w-mini ok">A</span> lugar correcto <span class="w-mini near">A</span> está en otro lugar <span class="w-mini no">A</span> no está</div>
    <div class="w-board">${rows.join('')}</div>
    ${game.done ? `
      <div class="card center stack w-result">
        <p class="lead">${game.won ? `¡Lo lograste! ${['🌟', '🌸', '🌿', '💛', '🪷', '✨'][game.guesses.length - 1]}` : 'Esta vez no fue 🍃'}</p>
        <p>La palabra era <b>${esc(game.answer)}</b></p>
        <button type="button" class="btn soft small" data-reflect>¿Qué significa “${esc(game.answer.toLowerCase())}” para ti hoy?</button>
        <div class="row gap wrap center-x">
          ${mode === 'daily' ? '<button type="button" class="btn ghost small" data-share>Compartir resultado</button>' : ''}
          <button type="button" class="btn primary small" data-free>${mode === 'free' ? 'Otra palabra' : 'Jugar modo libre'}</button>
          ${mode === 'free' ? '<button type="button" class="btn ghost small" data-daily>Volver a la del día</button>' : ''}
        </div>
      </div>` : `<div class="keyboard">${kb}</div>`}
    ${mode === 'daily' ? `<div class="row around small muted w-stats"><span><b>${st.played}</b> jugadas</span><span><b>${st.wins}</b> ganadas</span><span><b>${st.streak}</b> seguidas</span></div>` : ''}`;
}

function mountPalabra(root) {
  const game = currentGame();
  const press = (key) => {
    if (game.done) return;
    if (key === 'BACK') typing = [...typing].slice(0, -1).join('');
    else if (key === 'ENTER') {
      if ([...typing].length < 5) { shake(root); toast('Faltan letras'); return; }
      const target = mode === 'free' ? game : game.ref;
      target.guesses.push(typing);
      if (typing === game.answer) { target.done = true; target.won = true; }
      else if (target.guesses.length >= 6) { target.done = true; target.won = false; }
      typing = '';
      save();
      return;
    } else if ([...typing].length < 5) typing += key;
    const row = root.querySelector('.w-row.typing');
    if (row) {
      const letters = [...typing.padEnd(5, ' ')];
      row.querySelectorAll('.w-tile').forEach((t, i) => { t.textContent = letters[i].trim(); t.classList.toggle('filled', Boolean(letters[i].trim())); });
    }
  };
  root.querySelectorAll('[data-key]').forEach((b) => b.addEventListener('click', () => press(b.dataset.key)));
  unmountPalabra();
  onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.target.matches('input, textarea')) return;
    if (e.key === 'Enter') press('ENTER');
    else if (e.key === 'Backspace') press('BACK');
    else if (/^[a-zñ]$/i.test(e.key)) press(e.key.toUpperCase());
  };
  document.addEventListener('keydown', onKey);

  root.querySelector('[data-free]')?.addEventListener('click', () => {
    if (mode === 'free') state.games.wordleFree = null;
    mode = 'free';
    typing = '';
    save();
  });
  root.querySelector('[data-daily]')?.addEventListener('click', () => { mode = 'daily'; typing = ''; save({ silent: true }); window.dispatchEvent(new Event('calma:refresh')); });
  root.querySelector('[data-reflect]')?.addEventListener('click', () => openJournalEditor({ prompt: `¿Qué significa “${game.answer.toLowerCase()}” para ti hoy?` }));
  root.querySelector('[data-share]')?.addEventListener('click', async () => {
    const g = state.games.wordle[dayKey()];
    const grid = g.guesses.map((x) => evaluate(x, game.answer).map((s) => ({ ok: '🟩', near: '🟨', no: '⬜' })[s]).join('')).join('\n');
    const text = `Calma · Palabra del día ${g.won ? g.guesses.length : 'X'}/6\n${grid}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('Copiado'); }
    } catch { /* cancelado */ }
  });
}

let onKey = null;
function unmountPalabra() {
  if (onKey) document.removeEventListener('keydown', onKey);
  onKey = null;
}

function shake(root) {
  const row = root.querySelector('.w-row.typing');
  row?.classList.remove('shake');
  void row?.offsetWidth;
  row?.classList.add('shake');
}

export const palabra = { render: renderPalabra, mount: mountPalabra, unmount: unmountPalabra };

/* =================== Sopa de letras =================== */

const LEVELS = {
  facil: { name: 'Fácil', size: 9, words: 6, dirs: [[0, 1], [1, 0]] },
  media: { name: 'Media', size: 10, words: 7, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1]] },
  dificil: { name: 'Difícil', size: 11, words: 8, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] },
};
const FILL = 'AAAAAEEEEEIIIOOOOUURRRSSSNNNLLLTTTCCDDMMPPBGVFHJQZYÑX';

export function generateSopa(themeId, levelId, rnd = Math.random) {
  const theme = SOPA_THEMES.find((t) => t.id === themeId) || SOPA_THEMES[0];
  const level = LEVELS[levelId] || LEVELS.media;
  const n = level.size;
  const pool = theme.words.filter((w) => [...w].length <= n).sort(() => rnd() - 0.5).slice(0, level.words);
  pool.sort((a, b) => [...b].length - [...a].length);

  for (let attempt = 0; attempt < 30; attempt++) {
    const grid = Array.from({ length: n }, () => Array(n).fill(''));
    const placed = [];
    for (const word of pool) {
      const letters = [...word];
      let ok = false;
      for (let t = 0; t < 250 && !ok; t++) {
        const [dr, dc] = level.dirs[Math.floor(rnd() * level.dirs.length)];
        const r0 = Math.floor(rnd() * n);
        const c0 = Math.floor(rnd() * n);
        const rEnd = r0 + dr * (letters.length - 1);
        const cEnd = c0 + dc * (letters.length - 1);
        if (rEnd < 0 || rEnd >= n || cEnd < 0 || cEnd >= n) continue;
        const cells = letters.map((_, i) => [r0 + dr * i, c0 + dc * i]);
        if (cells.every(([r, c], i) => !grid[r][c] || grid[r][c] === letters[i])) {
          cells.forEach(([r, c], i) => { grid[r][c] = letters[i]; });
          placed.push({ w: word, cells });
          ok = true;
        }
      }
    }
    if (placed.length === pool.length || attempt === 29) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grid[r][c]) grid[r][c] = FILL[Math.floor(rnd() * FILL.length)];
      return { theme: theme.id, level: levelId, size: n, grid: grid.map((row) => row.join('|')), words: placed, found: [], start: Date.now(), elapsed: 0 };
    }
  }
  return null;
}

let sopaTheme = null;
let sopaLevel = 'media';
let sopaTick = null;

function currentSopa() {
  return state.games.sopa.current || null;
}

function renderSopa() {
  const p = currentSopa();
  if (!sopaTheme) sopaTheme = p?.theme || SOPA_THEMES[0].id;
  const pickers = `
    <div class="chips scroll-x">${SOPA_THEMES.map((t) => `<button type="button" class="chip${t.id === sopaTheme ? ' selected' : ''}" data-theme="${t.id}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div>
    <div class="chips">${Object.entries(LEVELS).map(([id, l]) => `<button type="button" class="chip${id === sopaLevel ? ' selected' : ''}" data-level="${id}">${l.name}</button>`).join('')}</div>`;

  if (!p) {
    return `${backHeader('Sopa de letras', 'Encuentra las palabras')}
      ${pickers}
      <button type="button" class="btn primary block lg" data-new>Nueva sopa de letras</button>
      ${state.games.sopa.done ? `<p class="small muted center">Has resuelto ${state.games.sopa.done} ${state.games.sopa.done === 1 ? 'sopa' : 'sopas'} 🔎</p>` : ''}`;
  }

  const theme = SOPA_THEMES.find((t) => t.id === p.theme);
  const grid = p.grid.map((row) => row.split('|'));
  const foundCells = new Set(p.words.filter((w) => p.found.includes(w.w)).flatMap((w) => w.cells.map(([r, c]) => `${r},${c}`)));
  const done = p.found.length === p.words.length;

  return `${backHeader('Sopa de letras', `${theme.emoji} ${esc(theme.name)} · ${LEVELS[p.level].name}`)}
    <div class="row between small muted"><span>${p.found.length} de ${p.words.length} palabras</span><span data-clock>${formatClock((p.elapsed + (done ? 0 : Date.now() - p.start)) / 1000)}</span></div>
    <div class="sopa" style="--n:${p.size}" data-grid>
      ${grid.map((row, r) => row.map((ch, c) => `<span class="cell${foundCells.has(`${r},${c}`) ? ' found' : ''}" data-r="${r}" data-c="${c}">${esc(ch)}</span>`).join('')).join('')}
      <svg class="sopa-lines" viewBox="0 0 ${p.size} ${p.size}" preserveAspectRatio="none" aria-hidden="true">
        ${p.words.filter((w) => p.found.includes(w.w)).map((w) => line(w.cells, 'found-line')).join('')}
        <line class="sel-line" data-sel x1="0" y1="0" x2="0" y2="0" hidden/>
      </svg>
    </div>
    <ul class="word-list">${p.words.map((w) => `<li class="${p.found.includes(w.w) ? 'found' : ''}">${esc(w.w)}</li>`).join('')}</ul>
    ${done ? `<div class="card center stack"><p class="lead">¡Encontraste todas! 🌸</p><button type="button" class="btn primary" data-new>Otra sopa</button></div>` : ''}
    <details class="sopa-options"><summary>Cambiar tema o dificultad</summary>${pickers}<button type="button" class="btn soft block" data-new>Nueva sopa</button></details>`;
}

function line(cells, cls) {
  const [r1, c1] = cells[0];
  const [r2, c2] = cells[cells.length - 1];
  return `<line class="${cls}" x1="${c1 + 0.5}" y1="${r1 + 0.5}" x2="${c2 + 0.5}" y2="${r2 + 0.5}"/>`;
}

function mountSopa(root) {
  root.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    sopaTheme = b.dataset.theme;
    root.querySelectorAll('[data-theme]').forEach((x) => x.classList.toggle('selected', x === b));
  }));
  root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => {
    sopaLevel = b.dataset.level;
    root.querySelectorAll('[data-level]').forEach((x) => x.classList.toggle('selected', x === b));
  }));
  root.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => {
    state.games.sopa.current = generateSopa(sopaTheme, sopaLevel);
    save();
  }));

  const p = currentSopa();
  const gridEl = root.querySelector('[data-grid]');
  if (!p || !gridEl) return;
  const done = p.found.length === p.words.length;
  const clock = root.querySelector('[data-clock]');
  clearInterval(sopaTick);
  if (!done) sopaTick = setInterval(() => { if (clock.isConnected) clock.textContent = formatClock((p.elapsed + Date.now() - p.start) / 1000); }, 1000);
  if (done) return;

  const sel = root.querySelector('[data-sel]');
  let start = null;
  let end = null;
  let tapStart = null;
  let moved = false;

  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest?.('.cell');
    return el && gridEl.contains(el) ? [Number(el.dataset.r), Number(el.dataset.c)] : null;
  };
  const lineCells = (a, b) => {
    const dr = b[0] - a[0];
    const dc = b[1] - a[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [a];
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
    const sr = Math.sign(dr);
    const sc = Math.sign(dc);
    return Array.from({ length: len + 1 }, (_, i) => [a[0] + sr * i, a[1] + sc * i]);
  };
  const highlight = () => {
    root.querySelectorAll('.cell.sel').forEach((c) => c.classList.remove('sel'));
    if (!start || !end) { sel.setAttribute('hidden', ''); return; }
    const cells = lineCells(start, end);
    if (!cells) return;
    cells.forEach(([r, c]) => root.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`)?.classList.add('sel'));
    sel.removeAttribute('hidden');
    sel.setAttribute('x1', start[1] + 0.5); sel.setAttribute('y1', start[0] + 0.5);
    sel.setAttribute('x2', end[1] + 0.5); sel.setAttribute('y2', end[0] + 0.5);
  };
  const check = (a, b) => {
    const cells = lineCells(a, b);
    if (!cells || cells.length < 2) return false;
    const key = cells.map(([r, c]) => `${r},${c}`).join(';');
    const rev = [...cells].reverse().map(([r, c]) => `${r},${c}`).join(';');
    const hit = p.words.find((w) => !p.found.includes(w.w) && [key, rev].includes(w.cells.map(([r, c]) => `${r},${c}`).join(';')));
    if (!hit) return false;
    p.found.push(hit.w);
    if (p.found.length === p.words.length) {
      p.elapsed += Date.now() - p.start;
      const sopa = state.games.sopa;
      sopa.done = (sopa.done || 0) + 1;
      sopa.days = [...(sopa.days || []), dayKey()];
      const key2 = `${p.theme}|${p.level}`;
      if (!sopa.best[key2] || p.elapsed < sopa.best[key2]) sopa.best[key2] = p.elapsed;
      clearInterval(sopaTick);
      toast(`¡Sopa resuelta en ${formatClock(p.elapsed / 1000)}! 🌸`);
    } else {
      toast(`✓ ${hit.w}`);
    }
    save();
    return true;
  };

  gridEl.addEventListener('pointerdown', (e) => {
    const c = cellAt(e.clientX, e.clientY);
    if (!c) return;
    e.preventDefault();
    gridEl.setPointerCapture?.(e.pointerId);
    start = c;
    end = c;
    moved = false;
    highlight();
  });
  gridEl.addEventListener('pointermove', (e) => {
    if (!start) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c && lineCells(start, c) && (c[0] !== end[0] || c[1] !== end[1])) { end = c; moved = true; highlight(); }
  });
  const up = () => {
    if (!start) return;
    if (moved) {
      check(start, end);
      tapStart = null;
    } else if (tapStart && (tapStart[0] !== start[0] || tapStart[1] !== start[1])) {
      // Modo toque: primera letra y luego la última.
      const ok = check(tapStart, start);
      tapStart = null;
      if (!ok) toast('Esa no es 🍃');
    } else {
      tapStart = start;
      root.querySelectorAll('.cell.tap').forEach((x) => x.classList.remove('tap'));
      root.querySelector(`.cell[data-r="${start[0]}"][data-c="${start[1]}"]`)?.classList.add('tap');
      start = null; end = null;
      sel.setAttribute('hidden', '');
      return;
    }
    start = null; end = null;
    highlight();
  };
  gridEl.addEventListener('pointerup', up);
  gridEl.addEventListener('pointercancel', () => { start = null; end = null; highlight(); });
}

function unmountSopa() {
  clearInterval(sopaTick);
  const p = currentSopa();
  if (p && p.found.length < p.words.length) {
    p.elapsed += Date.now() - p.start;
    p.start = Date.now();
    save({ silent: true });
  }
}

export const sopa = { render: renderSopa, mount: mountSopa, unmount: unmountSopa };
