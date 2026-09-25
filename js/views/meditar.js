// Pestaña "Meditar": herramientas, lista de YouTube (se sincroniza sola), mis audios y enlaces.

import { state, save } from '../store.js';
import { esc, openSheet, toast, confirmSheet, formatClock, uid, pickRandom } from '../util.js';
import { ICONS } from '../icons.js';
import { emptyState } from '../ui.js';
import {
  playlistIdFrom, playlistUrl, fetchPlaylistVideoIds, fetchVideoMeta, thumbUrl,
} from '../youtube.js';
import { listAudios, importAudioFiles, deleteAudio, updateAudio, storageEstimate, formatBytes } from '../audiolib.js';
import { openVideo, openAudio, openTimerSetup, openBreathSetup, openSounds } from './players.js';

const SYNC_EVERY_MS = 5 * 60 * 1000;
let filter = 'todas';
let query = '';
let syncing = false;
let syncError = null;
let rootEl = null;

function render() {
  return `
    <header class="page-head">
      <p class="eyebrow">Tu espacio</p>
      <h1>Meditar</h1>
    </header>

    <section class="tools">
      <button type="button" class="tool" data-tool="breath"><span class="tool-icon">${ICONS.wind}</span>Respiración</button>
      <button type="button" class="tool" data-tool="timer"><span class="tool-icon">${ICONS.timer}</span>Temporizador</button>
      <button type="button" class="tool" data-tool="sounds"><span class="tool-icon">${ICONS.sound}</span>Sonidos</button>
      <button type="button" class="tool" data-tool="random"><span class="tool-icon">${ICONS.shuffle}</span>Sorpréndeme</button>
    </section>

    <section>
      <div class="section-head">
        <h2 class="section-title">Mis meditaciones</h2>
        <div class="row gap-s">
          <button type="button" class="icon-btn" data-sync aria-label="Actualizar lista">${ICONS.refresh}</button>
          <a class="icon-btn" href="${esc(playlistUrl(playlistIdFrom(state.settings.playlistUrl) || ''))}" target="_blank" rel="noopener" aria-label="Abrir lista en YouTube">${ICONS.youtube}</a>
        </div>
      </div>
      <div class="chips scroll-x">
        ${[['todas', 'Todas'], ['favs', '♥ Favoritas'], ['nuevas', 'Sin ver'], ['vistas', 'Vistas']].map(([id, l]) =>
          `<button type="button" class="chip${filter === id ? ' selected' : ''}" data-filter="${id}">${l}</button>`).join('')}
      </div>
      <label class="search"><span>${ICONS.search}</span><input type="search" placeholder="Buscar meditación" value="${esc(query)}" data-search></label>
      <div id="videos"></div>
      <p class="hint center">¿Quieres agregar o quitar meditaciones? Hazlo en la lista de YouTube (${ICONS.youtube}) y aquí aparecerán solas.</p>
    </section>

    <section>
      <div class="section-head">
        <h2 class="section-title">Mis audios</h2>
        <label class="btn soft small file-btn">${ICONS.plus} Agregar
          <input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg" multiple data-import hidden>
        </label>
      </div>
      <div id="audios"><p class="muted small">Cargando…</p></div>
    </section>

    <section>
      <div class="section-head">
        <h2 class="section-title">Mis cursos y enlaces</h2>
        <button type="button" class="btn soft small" data-add-link>${ICONS.plus} Agregar</button>
      </div>
      <div class="links">
        ${state.links.length ? state.links.map((l) => `
          <div class="link-row">
            <a href="${esc(l.url)}" target="_blank" rel="noopener" class="link-main">
              <span class="link-emoji">${esc(l.emoji || '🔗')}</span>
              <span class="grow"><b>${esc(l.title)}</b><small>${esc(prettyUrl(l.url))}</small></span>
              ${ICONS.external}
            </a>
            <button type="button" class="icon-btn" data-edit-link="${l.id}" aria-label="Editar">${ICONS.edit}</button>
          </div>`).join('') : emptyState('🔗', 'Guarda aquí los enlaces a tus cursos, plataformas o perfiles favoritos.')}
      </div>
    </section>`;
}

const prettyUrl = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

/* ---------- Videos ---------- */

function visibleVideos() {
  const v = state.videos;
  const q = query.trim().toLowerCase();
  return v.order.filter((id) => {
    if (filter === 'favs' && !v.favs[id]) return false;
    if (filter === 'nuevas' && v.watched[id]) return false;
    if (filter === 'vistas' && !v.watched[id]) return false;
    if (q) {
      const m = v.meta[id] || {};
      return `${m.title || ''} ${m.author || ''}`.toLowerCase().includes(q);
    }
    return true;
  });
}

function renderVideos() {
  const el = rootEl?.querySelector('#videos');
  if (!el) return;
  const v = state.videos;
  const listId = playlistIdFrom(state.settings.playlistUrl);

  if (!listId) {
    el.innerHTML = `<div class="card notice">No hay una lista de YouTube configurada. Agrégala en <a href="#/yo">Yo → Ajustes</a>.</div>`;
    return;
  }
  if (!v.order.length) {
    if (syncing) {
      el.innerHTML = `<div class="video-grid">${'<div class="video-card skeleton"><div class="thumb"></div><div class="vc-body"><span></span><span></span></div></div>'.repeat(4)}</div>`;
    } else if (syncError) {
      el.innerHTML = `
        <div class="card notice">
          <p>No pude leer la lista de YouTube${navigator.onLine ? '' : ' (no hay internet)'}.</p>
          <p class="small muted">${esc(syncError)}. Revisa que la lista sea pública o no listada y que el enlace esté completo en Yo → Ajustes.</p>
          <div class="embed-fallback"><iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}&playsinline=1" title="Lista de meditaciones" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
          <button type="button" class="btn soft small" data-sync>Reintentar</button>
        </div>`;
    } else {
      el.innerHTML = emptyState('🪷', 'Tu lista todavía no tiene meditaciones.');
    }
    return;
  }

  const ids = visibleVideos();
  const syncedText = v.lastSync ? `Actualizada ${timeAgo(v.lastSync)}` : '';
  el.innerHTML = `
    <p class="tiny muted">${ids.length} de ${v.order.length} meditaciones · ${syncing ? 'actualizando…' : syncedText}</p>
    ${ids.length ? `<div class="video-grid">${ids.map((id) => {
      const m = v.meta[id] || {};
      return `
        <button type="button" class="video-card" data-video="${id}">
          <div class="thumb">
            <img src="${thumbUrl(id)}" alt="" loading="lazy">
            ${m.duration ? `<span class="dur">${formatClock(m.duration)}</span>` : ''}
            ${v.favs[id] ? `<span class="fav">${ICONS.heartFill}</span>` : ''}
            ${v.watched[id] ? '<span class="seen">✓</span>' : ''}
          </div>
          <div class="vc-body">
            <b>${esc(m.title || 'Meditación')}</b>
            <small>${esc(m.author || '')}</small>
          </div>
        </button>`;
    }).join('')}</div>` : emptyState('🔎', filter === 'favs' ? 'Aún no marcas favoritas. Toca ♡ Favorita dentro de un video.' : 'No hay meditaciones con ese filtro.')}`;
}

function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export async function syncPlaylist({ force = false } = {}) {
  const listId = playlistIdFrom(state.settings.playlistUrl);
  const v = state.videos;
  if (!listId || syncing) return;
  if (!force && v.lastSync && Date.now() - new Date(v.lastSync) < SYNC_EVERY_MS && v.order.length) return;
  syncing = true;
  syncError = null;
  renderVideos();
  try {
    const ids = await fetchPlaylistVideoIds(listId);
    v.order = [...new Set(ids)];
    v.lastSync = new Date().toISOString();
    save({ silent: true });
    renderVideos();
    // Títulos de los videos nuevos, de a poco.
    const missing = v.order.filter((id) => !v.meta[id]?.title);
    for (let i = 0; i < missing.length; i += 4) {
      const batch = missing.slice(i, i + 4);
      const metas = await Promise.all(batch.map(fetchVideoMeta));
      batch.forEach((id, k) => { if (metas[k]) v.meta[id] = { ...v.meta[id], ...metas[k] }; });
      save({ silent: true });
      renderVideos();
    }
  } catch (e) {
    syncError = e.message;
  } finally {
    syncing = false;
    renderVideos();
  }
}

/* ---------- Audios ---------- */

async function renderAudios() {
  const el = rootEl?.querySelector('#audios');
  if (!el) return;
  let list = [];
  try { list = await listAudios(); } catch { el.innerHTML = '<p class="muted small">Este navegador no permite guardar audios.</p>'; return; }
  if (!rootEl?.contains(el)) return;
  if (!list.length) {
    el.innerHTML = `${emptyState('🎧', 'Importa audios de tus cursos o meditaciones favoritas (MP3, M4A…). Quedan guardados en tu teléfono y se escuchan sin internet, incluso con la pantalla bloqueada.')}`;
    return;
  }
  const folders = {};
  list.forEach((a) => { (folders[a.folder || 'Sin carpeta'] ||= []).push(a); });
  const est = await storageEstimate();
  el.innerHTML = Object.entries(folders).map(([folder, items]) => `
    <div class="folder">
      <p class="folder-name">${ICONS.folder} ${esc(folder)}</p>
      ${items.map((a) => `
        <div class="audio-row">
          <button type="button" class="audio-main" data-audio="${a.id}">
            <span class="audio-play">${ICONS.play}</span>
            <span class="grow"><b>${esc(a.name)}</b><small>${a.duration ? formatClock(a.duration) : ''}${a.plays ? ` · escuchado ${a.plays} ${a.plays === 1 ? 'vez' : 'veces'}` : ''}</small></span>
          </button>
          <button type="button" class="icon-btn" data-audio-edit="${a.id}" aria-label="Editar">${ICONS.edit}</button>
        </div>`).join('')}
    </div>`).join('') + (est ? `<p class="tiny muted center">Espacio usado: ${formatBytes(est.used)}</p>` : '');

  el.querySelectorAll('[data-audio]').forEach((b) => b.addEventListener('click', () => openAudio(b.dataset.audio, { onChange: renderAudios })));
  el.querySelectorAll('[data-audio-edit]').forEach((b) => b.addEventListener('click', () => {
    const a = list.find((x) => x.id === b.dataset.audioEdit);
    editAudio(a, [...new Set(list.map((x) => x.folder).filter(Boolean))]);
  }));
}

function editAudio(a, folders) {
  const s = openSheet({
    title: 'Editar audio',
    html: `
      <label class="label">Nombre<input class="input" data-name value="${esc(a.name)}"></label>
      <label class="label">Carpeta<input class="input" data-folder value="${esc(a.folder || '')}" list="folder-list" placeholder="Ej: Curso de abundancia">
        <datalist id="folder-list">${folders.map((f) => `<option value="${esc(f)}">`).join('')}</datalist></label>
      <div class="row gap">
        <button type="button" class="btn danger ghost" data-del>${ICONS.trash} Eliminar</button>
        <button type="button" class="btn primary grow" data-save>Guardar</button>
      </div>`,
  });
  s.body.querySelector('[data-save]').addEventListener('click', async () => {
    await updateAudio(a.id, { name: s.body.querySelector('[data-name]').value.trim() || a.name, folder: s.body.querySelector('[data-folder]').value.trim() });
    s.close();
    renderAudios();
  });
  s.body.querySelector('[data-del]').addEventListener('click', async () => {
    if (!(await confirmSheet({ title: 'Eliminar audio', message: `¿Eliminar “${a.name}” de tu teléfono?`, ok: 'Eliminar', danger: true }))) return;
    await deleteAudio(a.id);
    s.close();
    renderAudios();
  });
}

async function importFiles(files) {
  if (!files.length) return;
  const existing = [...new Set((await listAudios()).map((x) => x.folder).filter(Boolean))];
  const s = openSheet({
    title: `Importar ${files.length} ${files.length === 1 ? 'audio' : 'audios'}`,
    html: `
      <label class="label">¿En qué carpeta los guardo? (opcional)
        <input class="input" data-folder list="folder-list2" placeholder="Ej: Curso de meditación">
        <datalist id="folder-list2">${existing.map((f) => `<option value="${esc(f)}">`).join('')}</datalist>
      </label>
      <button type="button" class="btn primary block" data-go>Guardar en mi teléfono</button>`,
  });
  s.body.querySelector('[data-go]').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    e.currentTarget.textContent = 'Guardando…';
    try {
      const n = await importAudioFiles(files, s.body.querySelector('[data-folder]').value.trim());
      toast(`${n} ${n === 1 ? 'audio guardado' : 'audios guardados'} 🎧`);
    } catch {
      toast('No se pudo guardar. ¿Queda espacio en el teléfono?');
    }
    s.close();
    renderAudios();
  });
}

/* ---------- Enlaces ---------- */

function editLink(link) {
  const isNew = !link;
  const l = link || { emoji: '🔗', title: '', url: '' };
  const s = openSheet({
    title: isNew ? 'Nuevo enlace' : 'Editar enlace',
    html: `
      <div class="row gap">
        <label class="label" style="width:5rem">Ícono<input class="input center" data-emoji value="${esc(l.emoji)}" maxlength="4"></label>
        <label class="label grow">Nombre<input class="input" data-title value="${esc(l.title)}" placeholder="Ej: Mi curso de meditación"></label>
      </div>
      <label class="label">Enlace<input class="input" data-url type="url" inputmode="url" value="${esc(l.url)}" placeholder="https://…"></label>
      <div class="row gap">
        ${isNew ? '' : `<button type="button" class="btn danger ghost" data-del>${ICONS.trash}</button>`}
        <button type="button" class="btn primary grow" data-save>Guardar</button>
      </div>`,
  });
  const q = (sel) => s.body.querySelector(sel);
  q('[data-save]').addEventListener('click', () => {
    let url = q('[data-url]').value.trim();
    if (!url) { toast('Falta el enlace'); return; }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const data = { emoji: q('[data-emoji]').value.trim() || '🔗', title: q('[data-title]').value.trim() || prettyUrl(url), url };
    if (isNew) state.links.push({ id: uid(), ...data });
    else Object.assign(state.links.find((x) => x.id === l.id), data);
    s.close();
    save();
  });
  q('[data-del]')?.addEventListener('click', () => {
    state.links = state.links.filter((x) => x.id !== l.id);
    s.close();
    save();
  });
}

/* ---------- Montaje ---------- */

function mount(root) {
  rootEl = root;
  renderVideos();
  renderAudios();
  syncPlaylist();

  root.querySelector('[data-tool="breath"]').addEventListener('click', openBreathSetup);
  root.querySelector('[data-tool="timer"]').addEventListener('click', openTimerSetup);
  root.querySelector('[data-tool="sounds"]').addEventListener('click', openSounds);
  root.querySelector('[data-tool="random"]').addEventListener('click', () => {
    const pool = state.videos.order.filter((id) => !state.videos.watched[id]);
    const list = pool.length ? pool : state.videos.order;
    if (!list.length) { toast('Aún no se carga tu lista'); return; }
    openVideo(pickRandom(list), { list: state.videos.order, onChange: renderVideos });
  });

  root.addEventListener('click', (e) => {
    const card = e.target.closest('[data-video]');
    if (card) openVideo(card.dataset.video, { list: visibleVideos(), onChange: renderVideos });
    if (e.target.closest('[data-sync]')) syncPlaylist({ force: true });
    const f = e.target.closest('[data-filter]');
    if (f) {
      filter = f.dataset.filter;
      root.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('selected', x === f));
      renderVideos();
    }
    const le = e.target.closest('[data-edit-link]');
    if (le) editLink(state.links.find((x) => x.id === le.dataset.editLink));
    if (e.target.closest('[data-add-link]')) editLink(null);
  });

  root.querySelector('[data-search]').addEventListener('input', (e) => { query = e.target.value; renderVideos(); });
  root.querySelector('[data-import]').addEventListener('change', (e) => { importFiles([...e.target.files]); e.target.value = ''; });
}

function unmount() {
  rootEl = null;
}

export default { render, mount, unmount };
