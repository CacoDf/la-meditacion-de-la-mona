# 🌿 Calma

Una app para meditar, respirar, agradecer y volver a ti. Hecha con amor.

Es una **app web instalable**: se abre desde Safari, se agrega a la pantalla de inicio del iPhone y funciona como cualquier app, incluso sin internet. No necesita App Store ni cuenta de desarrollador, y **todo lo que ella escribe se guarda solo en su teléfono**.

## Qué tiene

| Sección | Contenido |
|---|---|
| ☀️ **Hoy** | Saludo, frase del día, ritual diario (ánimo, práctica, gratitud, reto, palabra del día), intención, fase de la luna con ritual, racha y pregunta del día |
| 🧘‍♀️ **Meditar** | Tu lista de YouTube (se actualiza sola), mis audios (importar MP3/M4A de cursos, se escuchan sin internet), respiración guiada, temporizador con campanas, sonidos (lluvia, mar, viento, fogata, cuencos) y mis cursos y enlaces |
| 📓 **Diario** | 3 gratitudes al día, frasco de gratitud, más de 60 preguntas, entradas con ánimo, afirmaciones y “Mi yo futuro” |
| 🎯 **Retos** | 63 retos para elegir (de 7 días y caminos de 14 a 30 días), metas semanales, hábitos, reflexión semanal, jardín que florece y juegos (Palabra del día y Sopa de letras) |
| 🌸 **Yo** | Nivel del jardín interior, estadísticas, calendario de práctica, gráfico de ánimo, 21 logros, tu nota, ajustes, recordatorio diario y respaldo |

## 1. Publicarla (una sola vez, ~2 minutos)

1. En GitHub, abre el repositorio → **Settings** → **Pages** (menú de la izquierda).
2. En **Build and deployment → Source** elige **Deploy from a branch**.
3. En **Branch** elige la rama donde está la app (`main` si ya la uniste, o la rama `claude/...`) y la carpeta **`/ (root)`** → **Save**.
4. Espera 1–2 minutos y recarga la página: arriba aparecerá el link, algo como
   `https://cacodf.github.io/la-meditacion-de-la-mona/`

## 2. Instalarla en su iPhone

1. Abre el link en **Safari**.
2. Toca **Compartir** (el cuadrado con la flecha) → **Agregar a inicio**.
3. Ábrela desde el ícono 🌿 **Calma**. La primera vez verá tu mensaje sorpresa 💛

> Tip: iOS guarda por separado los datos de Safari y los de la app instalada, así que conviene usarla **siempre desde el ícono**.

## 3. Personalizar

Todo lo personal está en [`js/config.js`](js/config.js). Puedes editarlo directo en GitHub (lápiz ✏️ → cambias el texto → **Commit changes**):

- `loveNote`: el mensaje sorpresa.
- `defaultName`: cómo la saluda (ella también lo puede cambiar en Yo → Ajustes).
- `playlistUrl`: la lista de YouTube de las meditaciones.
- `links`: los enlaces que aparecen de inicio en “Mis cursos y enlaces”.

Los cambios le llegan solos la próxima vez que abra la app con internet.

## La lista de YouTube

- Tiene que ser **pública** o **no listada** (una lista privada no se puede leer desde la app).
- Cuando alguien agrega o quita videos (tú o ella con el enlace de colaboradora), la app muestra la lista actualizada al abrirla, o al tocar ↻.
- Si un video no permite verse dentro de otras apps, aparece un botón para abrirlo en YouTube.
- YouTube se pausa si se bloquea la pantalla (así funciona YouTube sin Premium). Por eso la app mantiene la pantalla encendida mientras se reproduce. Para escuchar con la pantalla bloqueada están **Mis audios**.

## Sus datos

- Se guardan solo en su iPhone. El código es público, pero lo que ella escribe **no** está en GitHub ni en ningún servidor.
- En **Yo → Respaldo de mis datos** puede guardar una copia en iCloud Drive o Archivos y restaurarla en otro teléfono.

## Detalles técnicos

- HTML, CSS y JavaScript sin dependencias ni compilación. Se publica tal cual con GitHub Pages.
- `sw.js`: funcionamiento sin internet (primero intenta traer la versión más nueva; si no hay conexión, usa la copia guardada).
- Datos en `localStorage`; los audios importados en IndexedDB.
- Los sonidos (campanas, lluvia, mar…) se generan en el teléfono con Web Audio.
- La lista de YouTube se lee con la API oficial del reproductor de YouTube, y los títulos con [noembed](https://noembed.com).
- Para probar en el computador: `npx http-server .` y abrir `http://localhost:8080`.
