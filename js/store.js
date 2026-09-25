// Estado de la app: se guarda en el propio teléfono (localStorage). Nada sale del dispositivo.

import { CONFIG } from './config.js';
import {
  DEFAULT_AFFIRMATIONS, DEFAULT_GOALS, DEFAULT_HABITS, LEVELS, BADGES, challengeById,
} from './content.js';
import { dayKey, weekKey, weekDays, addDays, parseDay, daysBetween, uid } from './util.js';
import { moonPhase } from './moon.js';

const KEY = 'calma:v1';

function defaults() {
  return {
    v: 1,
    createdAt: new Date().toISOString(),
    profile: { name: CONFIG.defaultName, onboarded: false },
    settings: {
      theme: 'auto',
      hemisphere: CONFIG.hemisphere,
      playlistUrl: CONFIG.playlistUrl,
      bellVolume: 0.8,
      soundVolume: 0.6,
      timer: { minutes: 10, interval: 0, prep: 10, sound: '' },
      breath: { pattern: 'caja', minutes: 3, tones: true },
    },
    sessions: [], // { id, at, day, type: video|audio|timer|breath|sound, title, minutes, moodAfter? }
    moods: {}, // día → { v, note }
    intentions: {}, // día → texto
    gratitude: {}, // día → [textos]
    journal: [], // { id, created, updated, title, text, prompt, mood }
    affirmations: [...DEFAULT_AFFIRMATIONS],
    futureSelf: { who: '', feel: '', does: '', letter: '', updated: null },
    challenge: null, // { id, start, done: [días] }
    challengeHistory: [], // { id, start, end, done, days, completed }
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
    goalManual: {}, // `${goalId}|${semana}` → número
    habits: DEFAULT_HABITS.map((h) => ({ ...h })),
    habitLog: {}, // día → [habitIds]
    reflections: {}, // semana → texto
    links: CONFIG.links.map((l) => ({ id: uid(), ...l })),
    videos: { favs: {}, watched: {}, meta: {}, order: [], lastSync: null },
    games: { wordle: {}, wordleFree: null, sopa: { done: 0, best: {}, days: [] } },
    badgesSeen: {},
  };
}

function merge(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return saved ?? base;
  const out = { ...base };
  for (const k of Object.keys(saved)) {
    const b = base[k];
    const s = saved[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)
      ? merge(b, s)
      : s;
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(defaults(), JSON.parse(raw));
  } catch (e) {
    console.warn('No se pudo leer el estado guardado', e);
  }
  return defaults();
}

export let state = load();

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);

export function save({ silent = false } = {}) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('No se pudo guardar', e);
  }
  if (!silent) listeners.forEach((fn) => fn());
}

export function replaceState(next) {
  state = merge(defaults(), next);
  save();
}

export function resetState() {
  state = defaults();
  save();
}

export const exportData = () => JSON.stringify({ app: 'calma', exportedAt: new Date().toISOString(), state }, null, 2);

/* ============ Acciones ============ */

export function logSession({ type, title, minutes, ref }) {
  const m = Math.round(minutes * 10) / 10;
  if (m < 0.5) return null;
  const s = { id: uid(), at: new Date().toISOString(), day: dayKey(), type, title, minutes: m, ref };
  state.sessions.push(s);
  save();
  return s;
}

export function setSessionMood(id, v) {
  const s = state.sessions.find((x) => x.id === id);
  if (s) { s.moodAfter = v; save({ silent: true }); }
}

export function setMood(v, note) {
  const k = dayKey();
  state.moods[k] = { v, note: note ?? state.moods[k]?.note ?? '' };
  save();
}

export function setGratitude(day, items) {
  const clean = items.map((t) => t.trim());
  if (clean.some(Boolean)) state.gratitude[day] = clean;
  else delete state.gratitude[day];
  save({ silent: true });
}

export function saveJournal(entry) {
  const now = new Date().toISOString();
  if (entry.id) {
    const i = state.journal.findIndex((e) => e.id === entry.id);
    if (i >= 0) state.journal[i] = { ...state.journal[i], ...entry, updated: now };
  } else {
    state.journal.unshift({ ...entry, id: uid(), created: now, updated: now });
  }
  save();
}

export function deleteJournal(id) {
  state.journal = state.journal.filter((e) => e.id !== id);
  save();
}

/* ---------- Retos ---------- */

export function challengeStatus(c = state.challenge, today = dayKey()) {
  if (!c) return null;
  const def = challengeById(c.id);
  if (!def) return null;
  const dayIndex = daysBetween(c.start, today); // 0 = primer día
  const days = Array.from({ length: def.days }, (_, i) => dayKey(addDays(parseDay(c.start), i)));
  return { def, dayIndex, days, doneCount: c.done.length, finished: dayIndex >= def.days, todayDone: c.done.includes(today) };
}

export function startChallenge(id) {
  closeChallenge();
  state.challenge = { id, start: dayKey(), done: [] };
  save();
}

export function toggleChallengeDay(day) {
  const c = state.challenge;
  if (!c) return;
  c.done = c.done.includes(day) ? c.done.filter((d) => d !== day) : [...c.done, day];
  save();
}

// Cierra el reto actual y lo guarda en el historial.
export function closeChallenge() {
  const st = challengeStatus();
  if (!st) { state.challenge = null; return null; }
  const record = {
    id: state.challenge.id,
    start: state.challenge.start,
    end: dayKey(),
    done: st.doneCount,
    days: st.def.days,
    completed: st.doneCount >= Math.ceil(st.def.days * 0.7),
  };
  if (st.doneCount > 0 || st.finished) state.challengeHistory.push(record);
  state.challenge = null;
  save();
  return record;
}

export const timesCompleted = (id) => state.challengeHistory.filter((h) => h.id === id && h.completed).length;

/* ---------- Hábitos y metas ---------- */

export function toggleHabit(habitId, day = dayKey()) {
  const list = state.habitLog[day] || [];
  state.habitLog[day] = list.includes(habitId) ? list.filter((h) => h !== habitId) : [...list, habitId];
  save();
}

export function goalProgress(goal, wk = weekKey()) {
  const days = new Set(weekDays(parseDay(wk)));
  const sessions = state.sessions.filter((s) => days.has(s.day));
  switch (goal.metric) {
    case 'minutes': return Math.round(sessions.reduce((a, s) => a + s.minutes, 0));
    case 'sessions': return sessions.length;
    case 'breath': return sessions.filter((s) => s.type === 'breath').length;
    case 'gratitude': return [...days].filter((d) => state.gratitude[d]?.some(Boolean)).length;
    case 'journal': return state.journal.filter((e) => days.has(dayKey(new Date(e.created)))).length;
    case 'games': return gamesDoneOn(days);
    default: return state.goalManual[`${goal.id}|${wk}`] || 0;
  }
}

function gamesDoneOn(days) {
  let n = 0;
  for (const [d, g] of Object.entries(state.games.wordle)) if (days.has(d) && g.done) n++;
  for (const d of state.games.sopa.days || []) if (days.has(d)) n++;
  return n;
}

export function bumpManualGoal(goalId, delta) {
  const k = `${goalId}|${weekKey()}`;
  state.goalManual[k] = Math.max(0, (state.goalManual[k] || 0) + delta);
  save();
}

/* ============ Estadísticas ============ */

// Un día "con práctica": meditó/respiró/escuchó, escribió, agradeció o marcó su reto.
export function practiceDays() {
  const set = new Set(state.sessions.map((s) => s.day));
  Object.entries(state.gratitude).forEach(([d, g]) => g.some(Boolean) && set.add(d));
  state.journal.forEach((e) => set.add(dayKey(new Date(e.created))));
  state.challenge?.done.forEach((d) => set.add(d));
  return set;
}

export function streaks(set = practiceDays()) {
  let current = 0;
  let d = new Date();
  if (!set.has(dayKey(d))) d = addDays(d, -1); // si hoy aún no practica, la racha sigue viva
  while (set.has(dayKey(d))) { current++; d = addDays(d, -1); }

  let best = 0;
  let run = 0;
  let prev = null;
  [...set].sort().forEach((k) => {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  });
  return { current, best: Math.max(best, current) };
}

export function stats() {
  const days = practiceDays();
  const { current, best } = streaks(days);
  const totalMinutes = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const gratitudeCount = Object.values(state.gratitude).reduce((a, g) => a + g.filter(Boolean).length, 0);
  const completed = state.challengeHistory.filter((h) => h.completed);
  const wordleWins = Object.values(state.games.wordle).filter((g) => g.won).length;
  const sopaDone = state.games.sopa.done || 0;
  const challengeDays = state.challengeHistory.reduce((a, h) => a + h.done, 0) + (state.challenge?.done.length || 0);
  const moonPractice = (() => {
    let full = false;
    let nw = false;
    for (const d of days) {
      const p = moonPhase(parseDay(d)).phase;
      if (p > 0.46 && p < 0.54) full = true;
      if (p < 0.04 || p > 0.96) nw = true;
      if (full && nw) return true;
    }
    return false;
  })();

  const s = {
    practiceDays: days.size,
    streak: current,
    bestStreak: best,
    totalMinutes,
    totalSessions: state.sessions.length,
    breathCount: state.sessions.filter((x) => x.type === 'breath').length,
    gratitudeCount,
    journalCount: state.journal.length,
    challengesCompleted: completed.length,
    longCompleted: completed.filter((h) => h.days > 7).length,
    moodDays: Object.keys(state.moods).length,
    wordleWins,
    sopaDone,
    futureSelf: Boolean(state.futureSelf.who || state.futureSelf.feel),
    moonPractice,
  };

  // Puntos para el nivel del jardín interior.
  s.points = Math.round(
    totalMinutes * 2 + s.totalSessions * 5 + gratitudeCount * 3 + s.journalCount * 8 + challengeDays * 6 +
    completed.length * 40 + s.moodDays * 2 + wordleWins * 4 + sopaDone * 4 + days.size * 5,
  );
  const idx = LEVELS.reduce((acc, l, i) => (s.points >= l.at ? i : acc), 0);
  s.level = { ...LEVELS[idx], index: idx + 1, next: LEVELS[idx + 1] || null };
  s.level.progress = s.level.next ? (s.points - s.level.at) / (s.level.next.at - s.level.at) : 1;
  return s;
}

// Devuelve los logros nuevos (no vistos) y los marca como vistos.
export function checkNewBadges() {
  const s = stats();
  const fresh = BADGES.filter((b) => b.test(s) && !state.badgesSeen[b.id]);
  if (fresh.length) {
    fresh.forEach((b) => { state.badgesSeen[b.id] = dayKey(); });
    save({ silent: true });
  }
  return fresh;
}

// Ritual del día (pestaña Hoy).
export function todayRitual(day = dayKey()) {
  const sessions = state.sessions.filter((s) => s.day === day);
  return [
    { id: 'animo', label: 'Registrar cómo me siento', done: Boolean(state.moods[day]), href: '#/hoy', anchor: 'checkin' },
    { id: 'practica', label: 'Meditar o respirar', done: sessions.length > 0, href: '#/meditar' },
    { id: 'gratitud', label: 'Agradecer', done: Boolean(state.gratitude[day]?.some(Boolean)), href: '#/diario' },
    { id: 'reto', label: 'Mi reto del día', done: Boolean(state.challenge?.done.includes(day)), href: '#/retos', hidden: !state.challenge },
    { id: 'palabra', label: 'Palabra del día', done: Boolean(state.games.wordle[day]?.done), href: '#/juegos/palabra' },
  ].filter((r) => !r.hidden);
}
