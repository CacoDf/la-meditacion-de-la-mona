// Sonido: campanas tipo cuenco (temporizador), tonos de respiración y ambientes (lluvia, mar...).
// Todo se sintetiza en el teléfono, así funciona sin internet.

let ctx = null;
let master = null;

/* ---------- Sesión de audio: encendida solo mientras se usa ----------
   iOS muestra la app como "reproduciendo" mientras el contexto de audio está activo.
   Por eso se enciende al necesitar sonido y se suspende apenas termina el último sonido. */

let holds = 0; // pantallas de práctica abiertas (temporizador, respiración)
let busyUntil = 0; // hasta cuándo sigue sonando la última campana o tono
let idleTimer = null;

function setSessionType(type) {
  try {
    if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type;
  } catch { /* opcional */ }
}

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  // 'playback' permite sonar aunque el switch de silencio esté activado (iOS 17+).
  setSessionType('playback');
  if (ctx.state !== 'running') ctx.resume();
  scheduleRelease();
  return ctx;
}

function markBusy(seconds) {
  busyUntil = Math.max(busyUntil, performance.now() + seconds * 1000);
  scheduleRelease();
}

function scheduleRelease() {
  clearTimeout(idleTimer);
  const wait = Math.max(0, busyUntil - performance.now()) + 1500;
  idleTimer = setTimeout(releaseIfIdle, wait);
}

function releaseIfIdle(force = false) {
  if (holds > 0 || active.size > 0) return;
  if (!force && performance.now() < busyUntil) { scheduleRelease(); return; }
  clearTimeout(idleTimer);
  busyUntil = 0;
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  setSessionType('auto');
}

// Mientras una pantalla de práctica esté abierta el audio se mantiene listo (las campanas
// intermedias necesitan sonar sin un toque); al cerrarla se libera.
export function holdAudio(on) {
  holds = Math.max(0, holds + (on ? 1 : -1));
  if (on) getCtx(); else scheduleRelease();
}

// Al salir de la app, si no hay sonidos ambientales activos, se apaga todo de inmediato.
// Si vuelve con un temporizador o respiración abiertos, el audio se reactiva.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && active.size === 0) {
    clearTimeout(idleTimer);
    busyUntil = 0;
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    setSessionType('auto');
  } else if (document.visibilityState === 'visible' && holds > 0) {
    getCtx();
  }
});

// Debe llamarse dentro de un toque del usuario (requisito de iOS).
export function unlockAudio() {
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
  markBusy(0.2);
}

/* ============ Campana tipo cuenco tibetano ============ */

export function bell({ volume = 0.8, pitch = 1, when = 0, length = 1 } = {}) {
  const c = getCtx();
  const t = c.currentTime + when;
  const out = c.createGain();
  out.gain.value = volume * 0.32;
  out.connect(master);

  markBusy(when + 7 * length + 0.2);
  const base = 174 * pitch;
  // Parciales inarmónicos de un cuenco: [razón, amplitud, decaimiento en segundos]
  const partials = [[1, 1, 7], [2.02, 0.55, 5], [2.98, 0.35, 4], [4.16, 0.22, 3], [5.43, 0.14, 2.4], [6.79, 0.08, 1.8]];
  partials.forEach(([ratio, amp, decay]) => {
    [-0.6, 0.6].forEach((beat) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * ratio + beat * ratio;
      const g = c.createGain();
      const d = decay * length;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + d + 0.05);
    });
  });
}

export function bells(count = 3, opts = {}) {
  for (let i = 0; i < count; i++) bell({ ...opts, when: i * 2.6 });
}

/* ============ Tonos suaves para la respiración ============ */

export function breathTone(kind, seconds) {
  const c = getCtx();
  markBusy(seconds + 0.2);
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  const lo = 196;
  const hi = 294;
  if (kind === 'in' || kind === 'in2') {
    o.frequency.setValueAtTime(kind === 'in2' ? hi * 0.95 : lo, t);
    o.frequency.linearRampToValueAtTime(hi, t + seconds);
  } else if (kind === 'out') {
    o.frequency.setValueAtTime(hi, t);
    o.frequency.linearRampToValueAtTime(lo, t + seconds);
  } else {
    o.frequency.setValueAtTime(247, t);
  }
  const peak = kind === 'hold' ? 0.035 : 0.07;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.6, seconds / 3));
  g.gain.setValueAtTime(peak, t + Math.max(0.6, seconds - 0.6));
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + seconds + 0.05);
}

/* ============ Ambientes ============ */

const noiseCache = {};

function noiseBuffer(kind) {
  if (noiseCache[kind]) return noiseCache[kind];
  const c = getCtx();
  const len = c.sampleRate * 8;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    // Fundido en los bordes para que el bucle no se note.
    const fade = 2048;
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
  }
  noiseCache[kind] = buf;
  return buf;
}

function noiseSource(kind) {
  const c = getCtx();
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(kind);
  s.loop = true;
  // Arranca en un punto al azar para que capas iguales no suenen idénticas.
  s.start(0, Math.random() * 7);
  return s;
}

function lfo(freq, depth, target) {
  const c = getCtx();
  const o = c.createOscillator();
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
  return o;
}

function filter(type, freq, q = 0.7) {
  const f = getCtx().createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

// Cada ambiente devuelve { out: GainNode, stop() }.
const BUILDERS = {
  lluvia() {
    const c = getCtx();
    const out = c.createGain();
    const a = noiseSource('pink');
    const hp = filter('highpass', 500);
    const lp = filter('lowpass', 7000);
    const ga = c.createGain(); ga.gain.value = 0.55;
    a.connect(hp).connect(lp).connect(ga).connect(out);
    const b = noiseSource('brown');
    const lpb = filter('lowpass', 900);
    const gb = c.createGain(); gb.gain.value = 0.35;
    b.connect(lpb).connect(gb).connect(out);
    // Gotas: pequeños golpes filtrados al azar.
    const drops = setInterval(() => {
      const t = c.currentTime;
      for (let i = 0; i < 3; i++) {
        const s = c.createBufferSource();
        s.buffer = noiseBuffer('white');
        const bp = filter('bandpass', 1800 + Math.random() * 3500, 6);
        const g = c.createGain();
        const when = t + Math.random() * 0.3;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.25 + Math.random() * 0.25, when + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
        s.connect(bp).connect(g).connect(out);
        s.start(when, Math.random() * 7, 0.08);
      }
    }, 320);
    return { out, stop: () => { clearInterval(drops); a.stop(); b.stop(); } };
  },

  mar() {
    const c = getCtx();
    const out = c.createGain();
    const a = noiseSource('brown');
    const lp = filter('lowpass', 700);
    const swell = c.createGain(); swell.gain.value = 0.5;
    a.connect(lp).connect(swell).connect(out);
    const l1 = lfo(0.085, 0.42, swell.gain);
    const l2 = lfo(0.085, 450, lp.frequency);
    const foam = noiseSource('pink');
    const hp = filter('highpass', 2200);
    const fg = c.createGain(); fg.gain.value = 0.1;
    foam.connect(hp).connect(fg).connect(out);
    const l3 = lfo(0.085, 0.09, fg.gain);
    return { out, stop: () => { [a, foam, l1, l2, l3].forEach((n) => n.stop()); } };
  },

  viento() {
    const c = getCtx();
    const out = c.createGain();
    const a = noiseSource('pink');
    const bp = filter('bandpass', 450, 1.4);
    const g = c.createGain(); g.gain.value = 0.9;
    a.connect(bp).connect(g).connect(out);
    const l1 = lfo(0.05, 260, bp.frequency);
    const l2 = lfo(0.13, 0.4, g.gain);
    const b = noiseSource('brown');
    const lp = filter('lowpass', 300);
    const gb = c.createGain(); gb.gain.value = 0.35;
    b.connect(lp).connect(gb).connect(out);
    return { out, stop: () => { [a, b, l1, l2].forEach((n) => n.stop()); } };
  },

  fogata() {
    const c = getCtx();
    const out = c.createGain();
    const bed = noiseSource('brown');
    const lp = filter('lowpass', 500);
    const gb = c.createGain(); gb.gain.value = 0.6;
    bed.connect(lp).connect(gb).connect(out);
    const crackle = setInterval(() => {
      const t = c.currentTime;
      const n = Math.random() < 0.3 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.45) continue;
        const s = c.createBufferSource();
        s.buffer = noiseBuffer('white');
        const hp = filter('highpass', 1500 + Math.random() * 3000);
        const g = c.createGain();
        const when = t + Math.random() * 0.2;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(0.3 + Math.random() * 0.5, when + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.02 + Math.random() * 0.05);
        s.connect(hp).connect(g).connect(out);
        s.start(when, Math.random() * 7, 0.1);
      }
    }, 140);
    return { out, stop: () => { clearInterval(crackle); bed.stop(); } };
  },

  cuencos() {
    const c = getCtx();
    const out = c.createGain();
    // Un colchón muy suave y golpes de cuenco espaciados.
    const mods = [];
    const drone = [87, 130.5, 174].map((f, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = 0.05 / (i + 1);
      o.connect(g).connect(out);
      o.start();
      mods.push(lfo(0.07 + i * 0.03, 0.02 / (i + 1), g.gain));
      return o;
    });
    const pitches = [1, 1.125, 1.25, 1.5, 1.667, 2];
    const strike = () => {
      const saved = master;
      master = out; // dirige la campana a este ambiente
      bell({ volume: 0.55, pitch: pitches[Math.floor(Math.random() * pitches.length)], length: 1.3 });
      master = saved;
    };
    strike();
    const timer = setInterval(strike, 9000 + Math.random() * 5000);
    return { out, stop: () => { clearInterval(timer); [...drone, ...mods].forEach((o) => o.stop()); } };
  },

  marron() {
    const c = getCtx();
    const out = c.createGain();
    const a = noiseSource('brown');
    const lp = filter('lowpass', 1000);
    const g = c.createGain(); g.gain.value = 0.8;
    a.connect(lp).connect(g).connect(out);
    return { out, stop: () => a.stop() };
  },
};

const active = new Map(); // id → { node, gain }
let ambientVolume = 0.6;

export function isPlaying(id) {
  return active.has(id);
}

export function activeSounds() {
  return [...active.keys()];
}

export function startSound(id) {
  if (active.has(id) || !BUILDERS[id]) return;
  const c = getCtx();
  const node = BUILDERS[id]();
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(ambientVolume, c.currentTime + 1.5);
  node.out.connect(gain).connect(master);
  active.set(id, { node, gain });
}

export function stopSound(id, fade = 1.2) {
  const entry = active.get(id);
  if (!entry) return;
  active.delete(id);
  const c = getCtx();
  entry.gain.gain.cancelScheduledValues(c.currentTime);
  entry.gain.gain.setValueAtTime(Math.max(0.0001, entry.gain.gain.value), c.currentTime);
  entry.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fade);
  markBusy(fade + 0.2);
  setTimeout(() => { entry.node.stop(); entry.gain.disconnect(); }, fade * 1000 + 100);
}

export function stopAllSounds(fade = 1.2) {
  [...active.keys()].forEach((id) => stopSound(id, fade));
}

export function setSoundVolume(v) {
  ambientVolume = Math.max(0.0001, v);
  if (!ctx) return;
  active.forEach(({ gain }) => gain.gain.setTargetAtTime(ambientVolume, ctx.currentTime, 0.1));
}
