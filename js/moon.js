// Fase lunar calculada localmente (sin internet) y dibujo de la luna en SVG.

const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // luna nueva de referencia

// phase: 0 = nueva, 0.25 = cuarto creciente, 0.5 = llena, 0.75 = cuarto menguante
export function moonPhase(date = new Date()) {
  const days = (date.getTime() - REF_NEW_MOON) / 86400000;
  const phase = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  return { phase, illumination, age: phase * SYNODIC, ...phaseInfo(phase) };
}

const PHASES = [
  { max: 0.033, name: 'Luna nueva', ritual: 'Momento de sembrar intenciones. Escribe lo que quieres crear en este ciclo.', prompt: '¿Cuál es tu intención para esta luna nueva?' },
  { max: 0.216, name: 'Luna creciente', ritual: 'La energía crece: da pequeños pasos hacia tus intenciones.', prompt: '¿Qué paso pequeño puedes dar hoy hacia lo que deseas?' },
  { max: 0.283, name: 'Cuarto creciente', ritual: 'Tiempo de acción y decisiones. Sostén tu intención con compromiso.', prompt: '¿Qué obstáculo aparece y cómo quieres atravesarlo?' },
  { max: 0.466, name: 'Gibosa creciente', ritual: 'Afina y ajusta. Confía en que lo que sembraste está creciendo.', prompt: '¿Qué necesitas ajustar para seguir creciendo?' },
  { max: 0.533, name: 'Luna llena', ritual: 'Celebra, agradece y suelta lo que ya no necesitas.', prompt: '¿Qué estás lista para soltar con esta luna llena?' },
  { max: 0.716, name: 'Gibosa menguante', ritual: 'Tiempo de gratitud y de compartir lo aprendido.', prompt: '¿Qué aprendiste en este ciclo?' },
  { max: 0.783, name: 'Cuarto menguante', ritual: 'Limpia, ordena y perdona. Haz espacio.', prompt: '¿Qué quieres perdonar o dejar ir?' },
  { max: 0.967, name: 'Luna menguante', ritual: 'Descansa y escucha tu interior antes del nuevo ciclo.', prompt: '¿Qué necesita tu cuerpo para descansar?' },
  { max: 1.01, name: 'Luna nueva', ritual: 'Momento de sembrar intenciones. Escribe lo que quieres crear en este ciclo.', prompt: '¿Cuál es tu intención para esta luna nueva?' },
];

function phaseInfo(phase) {
  return PHASES.find((p) => phase < p.max);
}

// Días hasta la próxima fase objetivo (0.5 = llena, 0 = nueva).
export function daysUntil(target, date = new Date()) {
  const { phase } = moonPhase(date);
  let diff = target - phase;
  if (diff <= 0.001) diff += 1;
  return Math.round(diff * SYNODIC);
}

// SVG de la luna. En el hemisferio sur se ve espejada respecto al norte.
export function moonSVG(phase, { size = 64, hemisphere = 'sur' } = {}) {
  const r = 30;
  const c = 32;
  const k = Math.cos(2 * Math.PI * phase); // 1 nueva, -1 llena
  const rx = Math.abs(k) * r;
  const waxing = phase < 0.5;
  // Borde exterior iluminado (norte: derecha al crecer).
  const outerSweep = waxing ? 1 : 0;
  // El terminador se curva hacia el lado iluminado cuando es menos de media luna.
  const crescent = k > 0;
  const termSweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 ${outerSweep} ${c} ${c + r} A ${rx} ${r} 0 0 ${termSweep} ${c} ${c - r} Z`;
  const flip = hemisphere === 'sur' ? `transform="translate(64 0) scale(-1 1)"` : '';
  return `<svg class="moon" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient id="moonLit" cx="45%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#FBF6E9"/><stop offset="100%" stop-color="#E4D8BE"/>
      </radialGradient>
    </defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="var(--moon-dark)"/>
    <g ${flip}><path d="${lit}" fill="url(#moonLit)"/></g>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--moon-ring)" stroke-width="1"/>
  </svg>`;
}
