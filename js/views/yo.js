// Pestaña "Yo": nivel, estadísticas, calendario, ánimo, logros, nota especial y ajustes.

import { CONFIG } from '../config.js';
import { state, save, stats, practiceDays, exportData, replaceState, resetState } from '../store.js';
import { BADGES, MOODS, moodByValue } from '../content.js';
import {
  esc, dayKey, addDays, shortDate, formatMinutes, openSheet, confirmSheet, toast, isStandalone,
  monthName,
} from '../util.js';
import { ICONS } from '../icons.js';
import { bar, applyTheme } from '../ui.js';
import { bell, unlockAudio } from '../audio.js';
import { playlistIdFrom } from '../youtube.js';
import { syncPlaylist } from './meditar.js';

const WEEKS = 16;

function render() {
  const s = stats();
  const now = new Date();
  const monthStart = dayKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthSessions = state.sessions.filter((x) => x.day >= monthStart);
  const monthDays = [...practiceDays()].filter((d) => d >= monthStart).length;
  const earned = BADGES.filter((b) => b.test(s));

  return `
    <header class="page-head">
      <p class="eyebrow">Tu camino</p>
      <h1>${esc(state.profile.name)}</h1>
    </header>

    <section class="card level-card">
      <div class="row gap">
        <span class="level-emoji">${s.level.emoji}</span>
        <div class="grow">
          <p class="eyebrow">Nivel ${s.level.index} · jardín interior</p>
          <h2 class="card-title">${esc(s.level.name)}</h2>
          ${bar(s.level.progress)}
          <p class="tiny muted">${s.level.next ? `${s.points} puntos · faltan ${s.level.next.at - s.points} para ${s.level.next.emoji} ${esc(s.level.next.name)}` : `${s.points} puntos · nivel máximo ✨`}</p>
        </div>
      </div>
    </section>

    <section class="grid-3">
      <div class="card stat"><span class="stat-num">${s.streak}</span><span class="stat-label">racha actual</span></div>
      <div class="card stat"><span class="stat-num">${s.bestStreak}</span><span class="stat-label">mejor racha</span></div>
      <div class="card stat"><span class="stat-num">${s.practiceDays}</span><span class="stat-label">${s.practiceDays === 1 ? 'día' : 'días'} con práctica</span></div>
      <div class="card stat"><span class="stat-num">${formatMinutes(s.totalMinutes)}</span><span class="stat-label">de práctica</span></div>
      <div class="card stat"><span class="stat-num">${s.gratitudeCount}</span><span class="stat-label">gratitudes</span></div>
      <div class="card stat"><span class="stat-num">${s.journalCount}</span><span class="stat-label">${s.journalCount === 1 ? 'página' : 'páginas'} de diario</span></div>
    </section>

    <section class="card">
      <h2 class="card-title">Tus últimas ${WEEKS} semanas</h2>
      ${renderHeatmap()}
      <p class="tiny muted">${esc(monthName(now))}: ${monthDays} ${monthDays === 1 ? 'día' : 'días'} con práctica · ${formatMinutes(monthSessions.reduce((a, x) => a + x.minutes, 0))} · ${monthSessions.length} sesiones</p>
    </section>

    <section class="card">
      <h2 class="card-title">Tu ánimo, últimos 30 días</h2>
      ${renderMoodChart()}
    </section>

    <section>
      <h2 class="section-title">Logros · ${earned.length} de ${BADGES.length}</h2>
      <div class="badges">
        ${BADGES.map((b) => {
          const on = b.test(s);
          return `<button type="button" class="badge${on ? ' on' : ''}" data-badge="${b.id}"><span>${on ? b.emoji : '🔒'}</span><small>${esc(b.name)}</small></button>`;
        }).join('')}
      </div>
    </section>

    <button type="button" class="card love-card" data-note>
      <span>💌</span>
      <span class="grow"><b>${esc(CONFIG.loveNoteTitle)}</b><small>Una nota guardada para ti</small></span>
    </button>

    <section>
      <h2 class="section-title">Ajustes</h2>
      <div class="card settings">
        <label class="set-row"><span>Tu nombre</span><input class="input compact" data-name value="${esc(state.profile.name)}" maxlength="24"></label>
        <div class="set-row"><span>Apariencia</span>
          <div class="seg">${[['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) =>
            `<button type="button" class="${state.settings.theme === v ? 'selected' : ''}" data-theme="${v}">${l}</button>`).join('')}</div>
        </div>
        <div class="set-row"><span>Luna vista desde</span>
          <div class="seg">${[['sur', 'Sur'], ['norte', 'Norte']].map(([v, l]) =>
            `<button type="button" class="${state.settings.hemisphere === v ? 'selected' : ''}" data-hemi="${v}">${l}</button>`).join('')}</div>
        </div>
        <div class="set-row col"><span>Volumen de la campana</span>
          <div class="row gap"><input type="range" class="range grow" min="0.1" max="1" step="0.05" value="${state.settings.bellVolume}" data-bell><button type="button" class="btn soft small" data-bell-test>Probar</button></div>
        </div>
        <button type="button" class="set-row link" data-playlist><span>${ICONS.youtube} Lista de YouTube</span><small class="muted">${playlistIdFrom(state.settings.playlistUrl) ? 'Configurada' : 'Sin configurar'} ›</small></button>
        <button type="button" class="set-row link" data-reminder><span>⏰ Recordatorio diario</span><small class="muted">›</small></button>
        <button type="button" class="set-row link" data-backup><span>💾 Respaldo de mis datos</span><small class="muted">›</small></button>
        ${isStandalone() ? '' : `<button type="button" class="set-row link" data-install><span>📲 Instalar en el iPhone</span><small class="muted">›</small></button>`}
        <button type="button" class="set-row link danger-text" data-reset><span>Borrar todos mis datos</span></button>
      </div>
      <p class="tiny muted center">${esc(CONFIG.appName)} guarda todo solo en este teléfono. Nadie más puede leer tu diario.</p>
    </section>`;
}

/* ---------- Calendario de práctica (escala secuencial de un solo tono) ---------- */

function renderHeatmap() {
  const byDay = {};
  state.sessions.forEach((s) => { byDay[s.day] = (byDay[s.day] || 0) + s.minutes; });
  const days = practiceDays();
  const today = new Date();
  const start = addDays(today, -((today.getDay() + 6) % 7) - (WEEKS - 1) * 7); // lunes
  const level = (d) => {
    const m = byDay[d] || 0;
    if (!days.has(d)) return 0;
    if (m < 5) return 1;
    if (m < 15) return 2;
    if (m < 30) return 3;
    return 4;
  };
  const cols = [];
  for (let w = 0; w < WEEKS; w++) {
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, w * 7 + i);
      const k = dayKey(d);
      const future = d > today;
      const lv = level(k);
      const label = `${shortDate(d)}: ${days.has(k) ? `${Math.round(byDay[k] || 0)} min de práctica` : 'sin práctica'}`;
      cells.push(future ? '<span class="hm-cell future"></span>' : `<button type="button" class="hm-cell l${lv}${k === dayKey() ? ' today' : ''}" data-hm="${esc(label)}" aria-label="${esc(label)}"></button>`);
    }
    cols.push(`<div class="hm-col">${cells.join('')}</div>`);
  }
  return `
    <div class="heatmap">${cols.join('')}</div>
    <div class="hm-legend tiny muted">Menos <span class="hm-cell l0"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> Más</div>`;
}

/* ---------- Ánimo (una serie: sin leyenda, el título la nombra) ---------- */

function renderMoodChart() {
  const pts = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const m = state.moods[dayKey(d)];
    if (m) pts.push({ x: 29 - i, v: m.v, d });
  }
  if (pts.length < 2) return `<p class="muted small">Registra cómo te sientes en “Hoy” y aquí verás cómo cambia tu ánimo.</p>`;
  const W = 300;
  const H = 130;
  const padL = 28;
  const padB = 18;
  const x = (i) => padL + (i / 29) * (W - padL - 8);
  const y = (v) => 8 + ((5 - v) / 4) * (H - padB - 16);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const avg = pts.reduce((a, p) => a + p.v, 0) / pts.length;
  return `
    <svg class="mood-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ánimo de los últimos 30 días, promedio ${avg.toFixed(1)} de 5">
      ${MOODS.map((m) => `<line x1="${padL}" x2="${W - 8}" y1="${y(m.v)}" y2="${y(m.v)}" class="grid"/><text x="2" y="${y(m.v) + 5}" class="axis-emoji">${m.emoji}</text>`).join('')}
      <path d="${path}" class="mood-line"/>
      ${pts.map((p) => `<circle cx="${x(p.x)}" cy="${y(p.v)}" r="4.5" class="mood-dot"/><circle cx="${x(p.x)}" cy="${y(p.v)}" r="14" class="hit" data-mood-pt="${esc(`${shortDate(p.d)}: ${moodByValue(p.v).emoji} ${moodByValue(p.v).label}`)}"/>`).join('')}
      <text x="${padL}" y="${H - 2}" class="axis">hace 30 días</text>
      <text x="${W - 8}" y="${H - 2}" class="axis" text-anchor="end">hoy</text>
    </svg>
    <p class="tiny muted">Promedio: ${moodByValue(Math.round(avg)).emoji} ${moodByValue(Math.round(avg)).label} · ${pts.length} días registrados</p>`;
}

/* ---------- Hojas de ajustes ---------- */

function openPlaylistSettings() {
  const s = openSheet({
    title: 'Lista de YouTube',
    html: `
      <p class="muted small">Pega el enlace de la lista de YouTube con las meditaciones. Tiene que ser pública o “no listada”. Cuando alguien agrega o quita videos en esa lista, la app se actualiza sola.</p>
      <label class="label">Enlace de la lista<textarea class="input" rows="3" data-url placeholder="https://youtube.com/playlist?list=…">${esc(state.settings.playlistUrl)}</textarea></label>
      <div class="row gap">
        <button type="button" class="btn ghost" data-default>Usar la original</button>
        <button type="button" class="btn primary grow" data-save>Guardar</button>
      </div>`,
  });
  s.body.querySelector('[data-default]').addEventListener('click', () => { s.body.querySelector('[data-url]').value = CONFIG.playlistUrl; });
  s.body.querySelector('[data-save]').addEventListener('click', () => {
    const url = s.body.querySelector('[data-url]').value.trim();
    if (!playlistIdFrom(url)) { toast('Ese enlace no parece una lista de YouTube'); return; }
    if (playlistIdFrom(url) !== playlistIdFrom(state.settings.playlistUrl)) state.videos.order = [];
    state.settings.playlistUrl = url;
    state.videos.lastSync = null;
    save();
    s.close();
    toast('Lista guardada 🪷');
    syncPlaylist({ force: true });
  });
}

function openReminder() {
  const times = ['07:00', '08:00', '09:00', '13:00', '19:00', '21:00', '22:00'];
  openSheet({
    title: 'Recordatorio diario',
    html: `
      <p class="muted small">Elige una hora y se agregará a tu app Calendario un recordatorio diario con alarma para tu momento de calma.</p>
      <div class="chips">${times.map((t) => `<a class="chip" href="recordatorios/calma-${t.replace(':', '')}.ics" target="_blank" rel="noopener">${t}</a>`).join('')}</div>
      <p class="tiny muted">Al tocar una hora, iPhone te preguntará si quieres agregar el evento. Para quitarlo, bórralo desde la app Calendario.</p>`,
  });
}

function openBackup() {
  const s = openSheet({
    title: 'Respaldo',
    html: `
      <p class="muted small">Tus datos viven solo en este teléfono. Guarda un respaldo de vez en cuando en iCloud Drive o en Archivos, por si cambias de celular.</p>
      <button type="button" class="btn primary block" data-export>${ICONS.share} Guardar respaldo</button>
      <label class="btn soft block file-btn">Restaurar desde un respaldo<input type="file" accept="application/json,.json" data-import hidden></label>
      <p class="tiny muted">El respaldo incluye diario, gratitudes, retos, progreso y ajustes. Los audios importados no se incluyen (son muy pesados): guárdalos también en Archivos.</p>`,
  });
  s.body.querySelector('[data-export]').addEventListener('click', async () => {
    const name = `calma-respaldo-${dayKey()}.json`;
    const file = new File([exportData()], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Respaldo de Calma' });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  s.body.querySelector('[data-import]').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'calma' || !data.state) throw new Error('formato');
      const ok = await confirmSheet({
        title: 'Restaurar respaldo',
        message: `Esto reemplazará los datos actuales por los del respaldo del ${new Date(data.exportedAt).toLocaleDateString('es-CL')}.`,
        ok: 'Restaurar',
      });
      if (!ok) return;
      replaceState(data.state);
      applyTheme();
      s.close();
      toast('Respaldo restaurado 🌿');
    } catch {
      toast('Ese archivo no es un respaldo de Calma');
    }
  });
}

function openInstall() {
  openSheet({
    title: 'Instalar en el iPhone',
    html: `
      <ol class="install-steps">
        <li>Abre esta página en <b>Safari</b>.</li>
        <li>Toca el botón <b>Compartir</b> <span class="ios-share">${ICONS.share}</span>.</li>
        <li>Desliza y elige <b>“Agregar a inicio”</b>.</li>
        <li>Abre <b>${esc(CONFIG.appName)}</b> desde tu pantalla de inicio: se verá y funcionará como una app, también sin internet.</li>
      </ol>`,
  });
}

function openNote() {
  openSheet({
    title: '',
    className: 'note-sheet',
    html: `<div class="note-step center"><div class="note-leaf">🌿</div><p class="note-title">${esc(CONFIG.loveNoteTitle)}</p><p class="note-text">${esc(CONFIG.loveNote)}</p></div>`,
  });
}

function mount(root) {
  root.querySelector('[data-name]').addEventListener('change', (e) => {
    state.profile.name = e.target.value.trim() || CONFIG.defaultName;
    save();
  });
  root.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    state.settings.theme = b.dataset.theme;
    save();
    applyTheme();
  }));
  root.querySelectorAll('[data-hemi]').forEach((b) => b.addEventListener('click', () => {
    state.settings.hemisphere = b.dataset.hemi;
    save();
  }));
  root.querySelector('[data-bell]').addEventListener('change', (e) => {
    state.settings.bellVolume = Number(e.target.value);
    save({ silent: true });
  });
  root.querySelector('[data-bell-test]').addEventListener('click', () => { unlockAudio(); bell({ volume: state.settings.bellVolume }); });
  root.querySelector('[data-playlist]').addEventListener('click', openPlaylistSettings);
  root.querySelector('[data-reminder]').addEventListener('click', openReminder);
  root.querySelector('[data-backup]').addEventListener('click', openBackup);
  root.querySelector('[data-install]')?.addEventListener('click', openInstall);
  root.querySelector('[data-note]').addEventListener('click', openNote);
  root.querySelector('[data-reset]').addEventListener('click', async () => {
    const ok = await confirmSheet({
      title: 'Borrar todo',
      message: 'Se borrarán tu diario, gratitudes, retos y progreso de este teléfono. Esto no se puede deshacer. (Tus audios importados se mantienen.)',
      ok: 'Borrar todo',
      danger: true,
    });
    if (ok) { resetState(); state.profile.onboarded = true; save(); applyTheme(); toast('Datos borrados'); }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-badge]');
    if (b) {
      const badge = BADGES.find((x) => x.id === b.dataset.badge);
      const on = badge.test(stats());
      toast(`${on ? badge.emoji : '🔒'} ${badge.name}: ${badge.desc}`);
    }
    const hm = e.target.closest('[data-hm]');
    if (hm) toast(hm.dataset.hm);
    const mp = e.target.closest('[data-mood-pt]');
    if (mp) toast(mp.dataset.moodPt);
  });
}

export default { render, mount };
