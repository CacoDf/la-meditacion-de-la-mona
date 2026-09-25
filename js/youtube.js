// Lista de YouTube: lee los videos de la playlist en vivo (así, si alguien agrega o quita
// videos en YouTube, la app se actualiza sola) y reproduce videos registrando los minutos.

let apiPromise = null;

export function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { apiPromise = null; reject(new Error('No se pudo cargar YouTube')); };
    document.head.appendChild(s);
    setTimeout(() => { if (!window.YT?.Player) { apiPromise = null; reject(new Error('YouTube tardó demasiado')); } }, 20000);
  });
  return apiPromise;
}

export function playlistIdFrom(input = '') {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const list = url.searchParams.get('list');
    if (list) return list;
  } catch { /* no es una URL */ }
  return /^[\w-]{10,}$/.test(text) ? text : null;
}

export const playlistUrl = (id) => `https://www.youtube.com/playlist?list=${id}`;
export const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

// Obtiene los IDs de los videos de la lista usando un reproductor invisible.
export async function fetchPlaylistVideoIds(listId) {
  const YT = await loadYouTubeAPI();
  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:180px;opacity:0;pointer-events:none;';
    const inner = document.createElement('div');
    host.appendChild(inner);
    document.body.appendChild(host);
    let player;
    let settled = false;
    const finish = (ids, err) => {
      if (settled) return;
      settled = true;
      try { player?.destroy(); } catch { /* nada */ }
      host.remove();
      if (err) reject(err); else resolve(ids);
    };
    player = new YT.Player(inner, {
      width: 320,
      height: 180,
      host: 'https://www.youtube-nocookie.com',
      playerVars: { listType: 'playlist', list: listId, playsinline: 1, autoplay: 0, controls: 0 },
      events: {
        onReady: () => {
          let tries = 0;
          const poll = () => {
            const ids = player.getPlaylist?.();
            if (ids?.length) finish(ids);
            else if (++tries < 24) setTimeout(poll, 400);
            else finish(null, new Error('La lista está vacía o es privada'));
          };
          poll();
        },
        onError: (e) => finish(null, new Error(`YouTube respondió con error ${e.data}`)),
      },
    });
    setTimeout(() => finish(null, new Error('YouTube tardó demasiado')), 25000);
  });
}

// Título y canal de un video (servicio público noembed, con respaldo de YouTube oEmbed).
export async function fetchVideoMeta(id) {
  const tries = [
    `https://noembed.com/embed?url=${encodeURIComponent(videoUrl(id))}`,
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl(id))}`,
  ];
  for (const url of tries) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.title) return { title: j.title, author: j.author_name || '' };
    } catch { /* probar el siguiente */ }
  }
  return null;
}

// Crea un reproductor visible y cuenta el tiempo realmente reproducido.
export async function createTrackedPlayer(el, { videoId, onTitle, onEnded, onState, onError } = {}) {
  const YT = await loadYouTubeAPI();
  let playingSince = null;
  let watchedMs = 0;
  let duration = 0;

  const tick = () => {
    if (playingSince) { watchedMs += Date.now() - playingSince; playingSince = Date.now(); }
  };

  const player = await new Promise((resolve, reject) => {
    const p = new YT.Player(el, {
      videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 1 },
      events: {
        onReady: () => {
          const data = p.getVideoData?.();
          if (data?.title) onTitle?.(data.title, data.author);
          resolve(p);
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            if (!playingSince) playingSince = Date.now();
            duration = p.getDuration?.() || duration;
            const data = p.getVideoData?.();
            if (data?.title) onTitle?.(data.title, data.author);
          } else {
            tick();
            playingSince = null;
          }
          if (e.data === YT.PlayerState.ENDED) onEnded?.();
          onState?.(e.data);
        },
        onError: (e) => { onError?.(e.data); reject(new Error(`error ${e.data}`)); },
      },
    });
  });

  return {
    player,
    watchedMinutes() { tick(); return watchedMs / 60000; },
    duration: () => duration || player.getDuration?.() || 0,
    currentTime: () => player.getCurrentTime?.() || 0,
    destroy() { tick(); playingSince = null; try { player.destroy(); } catch { /* nada */ } },
  };
}
