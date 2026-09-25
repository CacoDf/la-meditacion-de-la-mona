// Reproductores a pantalla completa: video de YouTube, audio propio, temporizador,
// respiración guiada y sonidos ambientales.

import { state, save, logSession } from '../store.js';
import { BREATH_PATTERNS, SOUNDS } from '../content.js';
import { openSheet, esc, keepAwake, formatClock, toast, $ } from '../util.js';
import { ICONS } from '../icons.js';
import { afterSession, refresh } from '../ui.js';
import { createTrackedPlayer, videoUrl } from '../youtube.js';
import { getAudio, updateAudio } from '../audiolib.js';
import {
  unlockAudio, bell, bells, breathTone, startSound, stopSound, stopAllSounds, isPlaying,
  activeSounds, setSoundVolume,
} from '../audio.js';

/* ================= Video de YouTube ================= */

export function openVideo(videoId, { list = [], onChange } = {}) {
  const meta = state.videos.meta[videoId] || {};
  let tracker = null;
  let ended = false;
  let title = meta.title || 'Meditación';

  const idx = list.indexOf(videoId);
  const nextId = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const sheet = openSheet({
    title: '',
    full: true,
    dark: true,
    className: 'video-sheet',
    html: `
      <div class="video-frame"><div id="yt-player"></div><div class="video-loading">Cargando…</div></div>
      <div class="video-info">
        <h2 class="video-title">${esc(title)}</h2>
        <p class="muted small">${esc(meta.author || '')}</p>
        <div class="row gap wrap">
          <button type="button" class="chip-btn" data-fav>${state.videos.favs[videoId] ? ICONS.heartFill : ICONS.heart} Favorita</button>
          <button type="button" class="chip-btn" data-watched>${state.videos.watched[videoId] ? '✓ Vista' : 'Marcar como vista'}</button>
          <a class="chip-btn" href="${videoUrl(videoId)}" target="_blank" rel="noopener">${ICONS.external} YouTube</a>
          ${nextId ? `<button type="button" class="chip-btn" data-next>Siguiente →</button>` : ''}
        </div>
        <p class="hint">Mantén la pantalla encendida: si bloqueas el teléfono, YouTube pausa el video. Para escuchar con la pantalla apagada, usa “Mis audios”.</p>
        <div class="video-error" hidden>
          <p>Este video no se puede ver dentro de la app (su autor lo tiene limitado o ya no existe).</p>
          <a class="btn primary" href="${videoUrl(videoId)}" target="_blank" rel="noopener">Abrir en YouTube</a>
        </div>
      </div>`,
    onClose: () => {
      keepAwake(false);
      const minutes = tracker?.watchedMinutes() || 0;
      const dur = tracker?.duration() || 0;
      if (ended || (dur && tracker.currentTime() / dur > 0.6)) state.videos.watched[videoId] = new Date().toISOString();
      if (dur) state.videos.meta[videoId] = { ...state.videos.meta[videoId], duration: Math.round(dur) };
      tracker?.destroy();
      save({ silent: true });
      onChange?.();
      const session = minutes >= 1 ? logSession({ type: 'video', title, minutes, ref: videoId }) : null;
      if (session) afterSession(session);
      else refresh();
    },
  });

  const body = sheet.body;
  keepAwake(true);

  createTrackedPlayer(body.querySelector('#yt-player'), {
    videoId,
    onTitle: (t, author) => {
      if (!t) return;
      title = t;
      body.querySelector('.video-title').textContent = t;
      state.videos.meta[videoId] = { ...state.videos.meta[videoId], title: t, author: author || state.videos.meta[videoId]?.author || '' };
      save({ silent: true });
    },
    onEnded: () => { ended = true; },
    onError: () => { body.querySelector('.video-error').hidden = false; },
  }).then((t) => {
    tracker = t;
    body.querySelector('.video-loading')?.remove();
  }).catch(() => {
    body.querySelector('.video-loading')?.remove();
    body.querySelector('.video-error').hidden = false;
  });

  body.querySelector('[data-fav]').addEventListener('click', (e) => {
    if (state.videos.favs[videoId]) delete state.videos.favs[videoId];
    else state.videos.favs[videoId] = true;
    save({ silent: true });
    e.currentTarget.innerHTML = `${state.videos.favs[videoId] ? ICONS.heartFill : ICONS.heart} Favorita`;
  });
  body.querySelector('[data-watched]').addEventListener('click', (e) => {
    if (state.videos.watched[videoId]) delete state.videos.watched[videoId];
    else state.videos.watched[videoId] = new Date().toISOString();
    save({ silent: true });
    e.currentTarget.textContent = state.videos.watched[videoId] ? '✓ Vista' : 'Marcar como vista';
  });
  body.querySelector('[data-next]')?.addEventListener('click', () => {
    sheet.close();
    setTimeout(() => openVideo(nextId, { list, onChange }), 350);
  });
}

/* ================= Mis audios ================= */

export async function openAudio(id, { onChange } = {}) {
  const rec = await getAudio(id);
  if (!rec) { toast('No se encontró el audio'); return; }
  const url = URL.createObjectURL(rec.blob);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  let listened = 0;
  let lastT = 0;

  const sheet = openSheet({
    title: '',
    full: true,
    dark: true,
    className: 'audio-sheet',
    html: `
      <div class="player-center">
        <div class="audio-art"><span>${ICONS.music}</span></div>
        <h2 class="player-title">${esc(rec.name)}</h2>
        <p class="muted small">${esc(rec.folder || 'Mis audios')}</p>
        <input type="range" class="seek" min="0" max="1000" value="0" aria-label="Posición">
        <div class="row between small muted times"><span data-cur>0:00</span><span data-dur>${formatClock(rec.duration || 0)}</span></div>
        <div class="player-controls">
          <button type="button" class="icon-btn lg" data-back aria-label="Retroceder 15 segundos">${ICONS.back15}</button>
          <button type="button" class="play-btn" data-play aria-label="Reproducir">${ICONS.play}</button>
          <button type="button" class="icon-btn lg" data-fwd aria-label="Adelantar 15 segundos">${ICONS.fwd15}</button>
        </div>
      </div>`,
    onClose: async () => {
      audio.pause();
      URL.revokeObjectURL(url);
      keepAwake(false);
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
      const minutes = listened / 60;
      if (minutes >= 1) {
        await updateAudio(id, { plays: (rec.plays || 0) + 1, lastPlayed: new Date().toISOString() });
        onChange?.();
        afterSession(logSession({ type: 'audio', title: rec.name, minutes, ref: id }));
      }
    },
  });
  const b = sheet.body;
  const playBtn = b.querySelector('[data-play]');
  const seek = b.querySelector('.seek');
  const cur = b.querySelector('[data-cur]');
  const dur = b.querySelector('[data-dur]');
  let seeking = false;

  const updateBtn = () => { playBtn.innerHTML = audio.paused ? ICONS.play : ICONS.pause; };
  const toggle = () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };

  audio.addEventListener('play', () => { updateBtn(); keepAwake(true); lastT = audio.currentTime; });
  audio.addEventListener('pause', updateBtn);
  audio.addEventListener('ended', updateBtn);
  audio.addEventListener('loadedmetadata', () => { dur.textContent = formatClock(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    const d = audio.currentTime - lastT;
    if (d > 0 && d < 2) listened += d;
    lastT = audio.currentTime;
    cur.textContent = formatClock(audio.currentTime);
    if (!seeking && audio.duration) seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  });
  seek.addEventListener('input', () => { seeking = true; if (audio.duration) cur.textContent = formatClock((seek.value / 1000) * audio.duration); });
  seek.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
    lastT = audio.currentTime;
    seeking = false;
  });
  playBtn.addEventListener('click', toggle);
  b.querySelector('[data-back]').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); lastT = audio.currentTime; });
  b.querySelector('[data-fwd]').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15); lastT = audio.currentTime; });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: rec.name,
      artist: rec.folder || 'Calma',
      album: 'Calma',
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
    navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 15; });
  }

  audio.play().catch(() => updateBtn());
}

/* ================= Temporizador ================= */

const TIMER_MINUTES = [3, 5, 10, 15, 20, 30, 45, 60];
const TIMER_INTERVALS = [[0, 'Sin campanas intermedias'], [1, 'Cada 1 min'], [2, 'Cada 2 min'], [5, 'Cada 5 min'], [10, 'Cada 10 min']];
const TIMER_PREP = [[0, 'Sin preparación'], [5, '5 s'], [10, '10 s'], [30, '30 s']];

export function openTimerSetup() {
  const cfg = state.settings.timer;
  const chips = (list, current, attr) => list.map(([v, label]) =>
    `<button type="button" class="chip${v === current ? ' selected' : ''}" data-${attr}="${v}">${label}</button>`).join('');

  const sheet = openSheet({
    title: 'Temporizador',
    html: `
      <p class="label">Duración</p>
      <div class="chips">${chips(TIMER_MINUTES.map((m) => [m, `${m} min`]), cfg.minutes, 'min')}</div>
      <p class="label">Campana intermedia</p>
      <div class="chips">${chips(TIMER_INTERVALS, cfg.interval, 'int')}</div>
      <p class="label">Preparación</p>
      <div class="chips">${chips(TIMER_PREP, cfg.prep, 'prep')}</div>
      <p class="label">Sonido de fondo</p>
      <div class="chips">${chips([['', 'Silencio'], ...SOUNDS.map((s) => [s.id, `${s.emoji} ${s.name}`])], cfg.sound, 'snd')}</div>
      <button type="button" class="btn primary block lg" data-start>Comenzar</button>`,
  });
  const b = sheet.body;
  const bind = (attr, key, parse) => b.querySelectorAll(`[data-${attr}]`).forEach((el) => el.addEventListener('click', () => {
    b.querySelectorAll(`[data-${attr}]`).forEach((x) => x.classList.remove('selected'));
    el.classList.add('selected');
    cfg[key] = parse(el.dataset[attr]);
    save({ silent: true });
  }));
  bind('min', 'minutes', Number);
  bind('int', 'interval', Number);
  bind('prep', 'prep', Number);
  bind('snd', 'sound', String);
  b.querySelector('[data-start]').addEventListener('click', () => {
    unlockAudio();
    sheet.close();
    setTimeout(() => runTimer({ ...cfg }), 320);
  });
}

function runTimer({ minutes, interval, prep, sound }) {
  const total = minutes * 60;
  let phase = prep > 0 ? 'prep' : 'run';
  let elapsed = 0; // segundos de meditación
  let prepLeft = prep;
  let last = performance.now();
  let paused = false;
  let nextBell = interval ? interval * 60 : Infinity;
  let raf;
  let finished = false;
  const vol = state.settings.bellVolume;

  const sheet = openSheet({
    title: '',
    full: true,
    dark: true,
    className: 'timer-sheet',
    html: `
      <div class="player-center">
        <p class="eyebrow" data-phase>${phase === 'prep' ? 'Acomódate' : 'Meditando'}</p>
        <div class="timer-ring">
          <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" class="track"/><circle cx="100" cy="100" r="90" class="progress" data-ring/></svg>
          <div class="timer-time" data-time>${formatClock(phase === 'prep' ? prep : total)}</div>
        </div>
        <div class="player-controls">
          <button type="button" class="play-btn" data-toggle aria-label="Pausar">${ICONS.pause}</button>
        </div>
        <button type="button" class="btn ghost light" data-end>Terminar</button>
      </div>`,
    onClose: () => {
      cancelAnimationFrame(raf);
      keepAwake(false);
      if (sound) stopSound(sound);
      if (!finished && elapsed >= 60) afterSession(logSession({ type: 'timer', title: 'Meditación en silencio', minutes: elapsed / 60 }));
    },
  });
  const b = sheet.body;
  const ring = b.querySelector('[data-ring]');
  const timeEl = b.querySelector('[data-time]');
  const phaseEl = b.querySelector('[data-phase]');
  const C = 2 * Math.PI * 90;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;

  keepAwake(true);
  if (sound) startSound(sound);
  if (phase === 'run') bell({ volume: vol });

  const finish = () => {
    finished = true;
    cancelAnimationFrame(raf);
    bells(3, { volume: vol });
    phaseEl.textContent = 'Terminaste 🌿';
    timeEl.textContent = '0:00';
    b.querySelector('[data-toggle]').remove();
    b.querySelector('[data-end]').textContent = 'Cerrar';
    if (sound) setTimeout(() => stopSound(sound, 4), 3000);
    const session = logSession({ type: 'timer', title: 'Meditación en silencio', minutes });
    setTimeout(() => { sheet.close(); afterSession(session); }, 7000);
  };

  const loop = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    if (!paused) {
      if (phase === 'prep') {
        prepLeft -= dt;
        timeEl.textContent = formatClock(Math.ceil(prepLeft));
        if (prepLeft <= 0) {
          phase = 'run';
          phaseEl.textContent = 'Meditando';
          bell({ volume: vol });
        }
      } else {
        elapsed += dt;
        if (elapsed >= nextBell && elapsed < total - 1) { bell({ volume: vol * 0.7, pitch: 1.5, length: 0.6 }); nextBell += interval * 60; }
        timeEl.textContent = formatClock(Math.ceil(total - elapsed));
        ring.style.strokeDashoffset = C * (1 - Math.min(1, elapsed / total));
        if (elapsed >= total) { finish(); return; }
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  b.querySelector('[data-toggle]').addEventListener('click', (e) => {
    paused = !paused;
    e.currentTarget.innerHTML = paused ? ICONS.play : ICONS.pause;
    phaseEl.textContent = paused ? 'En pausa' : (phase === 'prep' ? 'Acomódate' : 'Meditando');
  });
  b.querySelector('[data-end]').addEventListener('click', () => sheet.close());
}

/* ================= Respiración guiada ================= */

export function openBreathSetup() {
  const cfg = state.settings.breath;
  const sheet = openSheet({
    title: 'Respiración guiada',
    html: `
      <div class="pattern-list">
        ${BREATH_PATTERNS.map((p) => `
          <button type="button" class="pattern${p.id === cfg.pattern ? ' selected' : ''}" data-pattern="${p.id}">
            <span class="pattern-emoji">${p.emoji}</span>
            <span class="grow"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small><small class="muted">${p.phases.map((x) => x[1]).join(' · ')} s</small></span>
          </button>`).join('')}
      </div>
      <p class="label">Duración</p>
      <div class="chips">${[1, 3, 5, 10].map((m) => `<button type="button" class="chip${m === cfg.minutes ? ' selected' : ''}" data-min="${m}">${m} min</button>`).join('')}</div>
      <label class="switch-row"><span>Tonos suaves de guía</span><input type="checkbox" data-tones ${cfg.tones ? 'checked' : ''}></label>
      <button type="button" class="btn primary block lg" data-start>Comenzar</button>`,
  });
  const b = sheet.body;
  b.querySelectorAll('[data-pattern]').forEach((el) => el.addEventListener('click', () => {
    b.querySelectorAll('[data-pattern]').forEach((x) => x.classList.remove('selected'));
    el.classList.add('selected');
    cfg.pattern = el.dataset.pattern;
    save({ silent: true });
  }));
  b.querySelectorAll('[data-min]').forEach((el) => el.addEventListener('click', () => {
    b.querySelectorAll('[data-min]').forEach((x) => x.classList.remove('selected'));
    el.classList.add('selected');
    cfg.minutes = Number(el.dataset.min);
    save({ silent: true });
  }));
  b.querySelector('[data-tones]').addEventListener('change', (e) => { cfg.tones = e.target.checked; save({ silent: true }); });
  b.querySelector('[data-start]').addEventListener('click', () => {
    unlockAudio();
    sheet.close();
    setTimeout(() => openBreath({}), 320);
  });
}

export function openBreath({ minutes, pattern } = {}) {
  unlockAudio();
  const cfg = state.settings.breath;
  const p = BREATH_PATTERNS.find((x) => x.id === (pattern || cfg.pattern)) || BREATH_PATTERNS[0];
  const total = (minutes || cfg.minutes) * 60;
  let timer;
  let started = performance.now();
  let stopped = false;
  let cycles = 0;
  let completed = false;

  const sheet = openSheet({
    title: '',
    full: true,
    dark: true,
    className: 'breath-sheet',
    html: `
      <div class="player-center">
        <p class="eyebrow">${p.emoji} ${esc(p.name)}</p>
        <div class="breath-stage">
          <div class="breath-halo"></div>
          <div class="breath-circle" data-circle></div>
          <div class="breath-label"><span data-label>Prepárate</span><small data-count></small></div>
        </div>
        <p class="muted" data-left></p>
        <button type="button" class="btn ghost light" data-end>Terminar</button>
      </div>`,
    onClose: () => {
      stopped = true;
      clearTimeout(timer);
      keepAwake(false);
      const secs = (performance.now() - started) / 1000;
      if (!completed && secs >= 30) afterSession(logSession({ type: 'breath', title: `Respiración: ${p.name}`, minutes: secs / 60 }));
    },
  });
  const b = sheet.body;
  const circle = b.querySelector('[data-circle]');
  const label = b.querySelector('[data-label]');
  const count = b.querySelector('[data-count]');
  const left = b.querySelector('[data-left]');
  keepAwake(true);

  const SCALE = { in: 1, in2: 1.1, out: 0.42 };

  const runPhase = (i) => {
    if (stopped) return;
    if (i === 0 && (performance.now() - started) / 1000 >= total) {
      completed = true;
      label.textContent = 'Muy bien 🌿';
      count.textContent = '';
      circle.style.transitionDuration = '2s';
      circle.style.transform = 'scale(0.7)';
      bell({ volume: state.settings.bellVolume * 0.7 });
      const session = logSession({ type: 'breath', title: `Respiración: ${p.name}`, minutes: total / 60 });
      timer = setTimeout(() => { sheet.close(); afterSession(session); }, 3500);
      return;
    }
    const [text, secs, kind] = p.phases[i];
    label.textContent = text;
    if (kind in SCALE) {
      circle.style.transitionDuration = `${secs}s`;
      circle.style.transform = `scale(${SCALE[kind]})`;
    }
    circle.dataset.kind = kind;
    if (cfg.tones) breathTone(kind, secs);
    let n = secs;
    count.textContent = n;
    const tick = () => {
      if (stopped) return;
      n -= 1;
      if (n > 0) { count.textContent = n; timer = setTimeout(tick, 1000); } else {
        const next = (i + 1) % p.phases.length;
        if (next === 0) cycles++;
        const remain = Math.max(0, total - (performance.now() - started) / 1000);
        left.textContent = `${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'} · quedan ${formatClock(remain)}`;
        runPhase(next);
      }
    };
    timer = setTimeout(tick, 1000);
  };

  circle.style.transform = 'scale(0.42)';
  left.textContent = `${formatClock(total)} de respiración`;
  timer = setTimeout(() => { started = performance.now(); runPhase(0); }, 1500);
  b.querySelector('[data-end]').addEventListener('click', () => sheet.close());
}

/* ================= Sonidos ================= */

let sleepTimer = null;
let sleepAt = null;

function renderSoundPill() {
  let pill = $('#sound-pill');
  const playing = activeSounds();
  if (!playing.length) { pill?.remove(); return; }
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'sound-pill';
    document.body.appendChild(pill);
  }
  const emojis = playing.map((id) => SOUNDS.find((s) => s.id === id)?.emoji).join(' ');
  pill.innerHTML = `
    <button type="button" class="pill-open">${emojis} <span>Sonando${sleepAt ? ` · ${Math.max(1, Math.round((sleepAt - Date.now()) / 60000))} min` : ''}</span></button>
    <button type="button" class="pill-stop" aria-label="Detener sonidos">✕</button>`;
  pill.querySelector('.pill-open').onclick = openSounds;
  pill.querySelector('.pill-stop').onclick = () => { stopAllSounds(); clearSleep(); renderSoundPill(); };
}

function clearSleep() {
  clearTimeout(sleepTimer);
  sleepTimer = null;
  sleepAt = null;
}

setInterval(() => { if (sleepAt) renderSoundPill(); }, 30000);

export function openSounds() {
  unlockAudio();
  setSoundVolume(state.settings.soundVolume);
  const sheet = openSheet({
    title: 'Sonidos',
    html: `
      <p class="muted small">Toca uno o varios para mezclarlos. Siguen sonando aunque cierres esta ventana.</p>
      <div class="sound-grid">
        ${SOUNDS.map((s) => `<button type="button" class="sound-tile${isPlaying(s.id) ? ' on' : ''}" data-sound="${s.id}"><span>${s.emoji}</span>${esc(s.name)}</button>`).join('')}
      </div>
      <p class="label">Volumen</p>
      <input type="range" min="0.05" max="1" step="0.05" value="${state.settings.soundVolume}" data-vol class="range" aria-label="Volumen">
      <p class="label">Apagar solos después de</p>
      <div class="chips">${[[0, 'Sin límite'], [15, '15 min'], [30, '30 min'], [60, '1 hora']].map(([m, l]) =>
        `<button type="button" class="chip" data-sleep="${m}">${l}</button>`).join('')}</div>
      <p class="small muted" data-sleep-info>${sleepAt ? `Se apagan a las ${new Date(sleepAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>`,
    onClose: renderSoundPill,
  });
  const b = sheet.body;
  b.querySelectorAll('[data-sound]').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.sound;
    if (isPlaying(id)) stopSound(id); else startSound(id);
    el.classList.toggle('on', isPlaying(id));
  }));
  b.querySelector('[data-vol]').addEventListener('input', (e) => {
    state.settings.soundVolume = Number(e.target.value);
    setSoundVolume(state.settings.soundVolume);
    save({ silent: true });
  });
  b.querySelectorAll('[data-sleep]').forEach((el) => el.addEventListener('click', () => {
    b.querySelectorAll('[data-sleep]').forEach((x) => x.classList.remove('selected'));
    el.classList.add('selected');
    clearSleep();
    const m = Number(el.dataset.sleep);
    const info = b.querySelector('[data-sleep-info]');
    if (m) {
      sleepAt = Date.now() + m * 60000;
      sleepTimer = setTimeout(() => { stopAllSounds(8); clearSleep(); setTimeout(renderSoundPill, 8500); }, m * 60000);
      info.textContent = `Se apagan a las ${new Date(sleepAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    } else info.textContent = '';
  }));
}
