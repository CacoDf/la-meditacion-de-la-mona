// Todo el contenido de la app: retos, preguntas, frases, afirmaciones, respiraciones y juegos.

/* ============ Retos ============ */

export const CHALLENGE_CATEGORIES = {
  mente: { name: 'Mente y meditación', emoji: '🧘‍♀️', color: '#8A9A7B' },
  corazon: { name: 'Gratitud y amor', emoji: '💗', color: '#C9967A' },
  cuerpo: { name: 'Cuerpo', emoji: '🌿', color: '#A3A78A' },
  digital: { name: 'Desconexión', emoji: '📵', color: '#9AA5A0' },
  naturaleza: { name: 'Naturaleza', emoji: '🌳', color: '#7F9270' },
  espiritu: { name: 'Energía y espíritu', emoji: '✨', color: '#B59A6E' },
  creatividad: { name: 'Creatividad', emoji: '🎨', color: '#C4A484' },
  autocuidado: { name: 'Autocuidado', emoji: '🛁', color: '#B8A08F' },
  caminos: { name: 'Caminos largos', emoji: '🗺️', color: '#6E7F62' },
};

// days: duración del reto. daily: la acción que se marca cada día.
export const CHALLENGES = [
  // Mente y meditación
  { id: 'medita-10', cat: 'mente', emoji: '🧘‍♀️', title: '10 minutos al día', days: 7, desc: 'Una semana entera regalándote diez minutos de meditación. Pocos minutos, cada día, cambian mucho.', daily: 'Medita al menos 10 minutos.' },
  { id: 'medita-despertar', cat: 'mente', emoji: '🌅', title: 'Meditar al despertar', days: 7, desc: 'Empieza el día desde adentro, antes de que el mundo te hable.', daily: 'Antes de mirar el celular, medita 5 minutos.' },
  { id: 'tres-pausas', cat: 'mente', emoji: '🌬️', title: 'Tres pausas para respirar', days: 7, desc: 'Pequeñas pausas repartidas en el día para volver al cuerpo.', daily: 'Haz 3 pausas de un minuto solo para respirar.' },
  { id: 'monotarea', cat: 'mente', emoji: '🎯', title: 'Una cosa a la vez', days: 7, desc: 'La atención plena también es hacer una sola cosa, entera.', daily: 'Haz al menos una actividad sin multitarea, con toda tu atención.' },
  { id: 'comer-consciente', cat: 'mente', emoji: '🍵', title: 'Comida consciente', days: 7, desc: 'Saborear, oler, masticar lento. Comer también puede ser meditar.', daily: 'Come una comida sin pantallas, saboreando cada bocado.' },
  { id: 'observar-juicios', cat: 'mente', emoji: '☁️', title: 'Observar sin juzgar', days: 7, desc: 'Notar los juicios como nubes que pasan, sin pelear con ellos.', daily: 'Cuando notes un juicio, nómbralo ("estoy juzgando") y suéltalo.' },
  { id: 'silencio', cat: 'mente', emoji: '🤫', title: '15 minutos de silencio', days: 7, desc: 'Sin música, sin pantallas, sin conversación. Solo tú y el silencio.', daily: 'Pasa 15 minutos en silencio total.' },
  { id: 'coherencia', cat: 'mente', emoji: '💗', title: 'Coherencia del corazón', days: 7, desc: 'Respirar con la atención en el corazón mientras sientes una emoción elevada: gratitud, amor o alegría.', daily: 'Respira 5 minutos desde el corazón evocando gratitud.' },
  { id: 'yo-futuro', cat: 'mente', emoji: '✨', title: 'Ensayar a tu yo futuro', days: 7, desc: 'Cada día, siente cómo piensa, siente y actúa la persona que quieres llegar a ser.', daily: 'Dedica 5 minutos a sentirte como tu yo futuro.' },
  { id: 'piloto-automatico', cat: 'mente', emoji: '🔄', title: 'Romper el piloto automático', days: 7, desc: 'Cambiar pequeñas rutinas despierta la mente y te devuelve al presente.', daily: 'Cambia una rutina automática (otro camino, otra mano, otro orden).' },
  { id: 'escaneo-noche', cat: 'mente', emoji: '🌙', title: 'Escaneo antes de dormir', days: 7, desc: 'Recorrer el cuerpo con cariño antes de dormir para soltar el día.', daily: 'Recorre tu cuerpo con la atención antes de dormir.' },

  // Gratitud y amor
  { id: 'gratitud-3', cat: 'corazon', emoji: '🙏', title: 'Tres gratitudes diarias', days: 7, desc: 'Entrenar la mirada para ver lo bueno que ya está aquí.', daily: 'Escribe 3 cosas que agradeces hoy.' },
  { id: 'carta-gratitud', cat: 'corazon', emoji: '💌', title: 'Carta de gratitud', days: 7, desc: 'Escribir, de a poco, una carta a alguien importante. El último día puedes enviarla.', daily: 'Escribe unas líneas de tu carta de agradecimiento.' },
  { id: 'elogio', cat: 'corazon', emoji: '🌷', title: 'Un elogio sincero al día', days: 7, desc: 'Decir en voz alta lo que admiramos de otros hace bien a los dos.', daily: 'Dile a alguien algo que admiras de esa persona.' },
  { id: 'espejo', cat: 'corazon', emoji: '💛', title: 'Amor propio en el espejo', days: 7, desc: 'Mirarte a los ojos y hablarte como le hablarías a quien más quieres.', daily: 'Mírate al espejo y dite una frase amable en voz alta.' },
  { id: 'bondad', cat: 'corazon', emoji: '🤲', title: 'Actos de bondad', days: 7, desc: 'Pequeños gestos, sin esperar nada a cambio.', daily: 'Haz un acto de bondad pequeño, si puedes anónimo.' },
  { id: 'perdon', cat: 'corazon', emoji: '🕊️', title: 'Semana del perdón', days: 7, desc: 'Soltar resentimientos es un regalo para ti misma.', daily: 'Escribe algo que estás lista para soltar o perdonar.' },
  { id: 'conectar', cat: 'corazon', emoji: '📞', title: 'Conectar de verdad', days: 7, desc: 'Conversaciones sin apuro con las personas que quieres.', daily: 'Llama o conversa sin prisa con alguien que quieres.' },
  { id: 'gracias-cuerpo', cat: 'corazon', emoji: '🌸', title: 'Gracias, cuerpo', days: 7, desc: 'Tu cuerpo te sostiene cada día. Esta semana se lo agradeces.', daily: 'Agradécele a tu cuerpo algo que hizo por ti hoy.' },

  // Cuerpo
  { id: 'agua', cat: 'cuerpo', emoji: '💧', title: 'Hidratación consciente', days: 7, desc: 'Cada vaso de agua como un pequeño ritual de cuidado.', daily: 'Toma 8 vasos de agua, cada uno con atención.' },
  { id: 'estirar', cat: 'cuerpo', emoji: '🤸‍♀️', title: 'Estirar al despertar', days: 7, desc: 'Despertar el cuerpo con suavidad antes de empezar el día.', daily: 'Estira tu cuerpo 5 minutos al levantarte.' },
  { id: 'yoga', cat: 'cuerpo', emoji: '🧘', title: 'Yoga diario', days: 7, desc: 'Mover el cuerpo con respiración y presencia.', daily: 'Practica al menos 15 minutos de yoga.' },
  { id: 'caminata', cat: 'cuerpo', emoji: '🚶‍♀️', title: 'Caminata consciente', days: 7, desc: 'Caminar sintiendo cada paso, sin audífonos, atenta a tu entorno.', daily: 'Camina 20 minutos atenta a tus pasos y tu respiración.' },
  { id: 'dormir-temprano', cat: 'cuerpo', emoji: '😴', title: 'Dormir antes de las 23:00', days: 7, desc: 'El descanso es la base de todo lo demás.', daily: 'Acuéstate antes de las 23:00 con una rutina tranquila.' },
  { id: 'bailar', cat: 'cuerpo', emoji: '💃', title: 'Baila una canción', days: 7, desc: 'Mover la energía, soltar, disfrutar. Nadie está mirando.', daily: 'Baila libremente al menos una canción completa.' },
  { id: 'luz-manana', cat: 'cuerpo', emoji: '☀️', title: 'Luz de la mañana', days: 7, desc: 'La luz natural temprano ordena tu reloj interno y tu ánimo.', daily: 'Recibe 10 minutos de luz natural en la mañana.' },
  { id: 'comida-viva', cat: 'cuerpo', emoji: '🥗', title: 'Comida que nutre', days: 7, desc: 'Llenar el plato de colores y de vida.', daily: 'Incluye frutas o verduras frescas en cada comida.' },

  // Desconexión
  { id: 'primera-hora', cat: 'digital', emoji: '📵', title: 'Primera hora sin celular', days: 7, desc: 'La primera hora del día es tuya, no de las notificaciones.', daily: 'No revises el celular durante la primera hora del día.' },
  { id: 'noches-sin-pantallas', cat: 'digital', emoji: '🌙', title: 'Noches sin pantallas', days: 7, desc: 'Preparar el cuerpo y la mente para un descanso profundo.', daily: 'Deja las pantallas 1 hora antes de dormir.' },
  { id: 'pausa-redes', cat: 'digital', emoji: '🧹', title: 'Pausa de redes', days: 7, desc: 'Menos comparación, más presencia.', daily: 'Usa redes sociales máximo 30 minutos en el día.' },
  { id: 'modo-avion', cat: 'digital', emoji: '✈️', title: 'Modo avión consciente', days: 7, desc: 'Una hora al día desconectada para hacer algo que te nutra.', daily: 'Pon el celular en modo avión 1 hora y haz algo que te nutra.' },
  { id: 'notificaciones', cat: 'digital', emoji: '🔕', title: 'Menos notificaciones', days: 7, desc: 'Cada día silencias algo que te distrae y observas la diferencia.', daily: 'Silencia o quita una notificación que te distraiga.' },

  // Naturaleza
  { id: 'pies-tierra', cat: 'naturaleza', emoji: '🌿', title: 'Pies en la tierra', days: 7, desc: 'Sentir el suelo bajo los pies descalzos: pasto, tierra o arena.', daily: 'Camina descalza unos minutos sobre pasto, tierra o arena.' },
  { id: 'mirar-cielo', cat: 'naturaleza', emoji: '☁️', title: 'Mirar el cielo', days: 7, desc: 'Levantar la vista y recordar lo grande que es todo.', daily: 'Detente 5 minutos a mirar el cielo o las nubes.' },
  { id: 'algo-vivo', cat: 'naturaleza', emoji: '🪴', title: 'Cuidar algo vivo', days: 7, desc: 'Cuidar una planta es también cuidarte a ti.', daily: 'Dedica un momento a cuidar una planta.' },
  { id: 'atardecer', cat: 'naturaleza', emoji: '🌇', title: 'Despedir el día', days: 7, desc: 'Cerrar el día contemplando el atardecer o el cielo de la noche.', daily: 'Observa el atardecer o el cielo nocturno en silencio.' },
  { id: 'escuchar-naturaleza', cat: 'naturaleza', emoji: '🐦', title: 'Escucha la naturaleza', days: 7, desc: 'Pájaros, viento, agua: el mundo siempre está sonando.', daily: 'Escucha 5 minutos los sonidos a tu alrededor.' },
  { id: 'abrazar-arbol', cat: 'naturaleza', emoji: '🌳', title: 'Tiempo con los árboles', days: 7, desc: 'Un baño de bosque, aunque sea en una plaza.', daily: 'Pasa 15 minutos cerca de árboles o áreas verdes.' },

  // Energía y espíritu
  { id: 'intencion', cat: 'espiritu', emoji: '🌑', title: 'Intención diaria', days: 7, desc: 'Nombrar cada mañana hacia dónde quieres llevar tu energía.', daily: 'Escribe una intención en la mañana y reléela en la noche.' },
  { id: 'afirmaciones', cat: 'espiritu', emoji: '🔮', title: 'Afirmaciones sentidas', days: 7, desc: 'No solo decirlas: sentirlas en el cuerpo como si ya fueran verdad.', daily: 'Repite tus afirmaciones 3 veces, sintiéndolas.' },
  { id: 'vision', cat: 'espiritu', emoji: '🌈', title: 'Tablero de visión', days: 7, desc: 'Construir, pieza a pieza, la imagen de la vida que estás creando.', daily: 'Agrega una imagen o frase a tu tablero de visión.' },
  { id: 'sincronias', cat: 'espiritu', emoji: '🔢', title: 'Diario de sincronías', days: 7, desc: 'Señales, coincidencias, números repetidos como el 333: el universo conversa.', daily: 'Anota las señales o sincronías que notes hoy.' },
  { id: 'soltar', cat: 'espiritu', emoji: '🍂', title: 'Soltar lo que no es mío', days: 7, desc: 'Hacer espacio para lo nuevo dejando ir lo que ya no sirve.', daily: 'Suelta un objeto, un pensamiento o un compromiso que ya no te sirve.' },
  { id: 'rincon-sagrado', cat: 'espiritu', emoji: '🕯️', title: 'Un rincón sagrado', days: 7, desc: 'Un lugar pequeño, una vela, un momento solo para ti.', daily: 'Enciende una vela en tu rincón y quédate 5 minutos ahí.' },
  { id: 'emociones-elevadas', cat: 'espiritu', emoji: '🌟', title: 'Emociones elevadas', days: 7, desc: 'Sentir hoy la emoción de lo que deseas, antes de que llegue.', daily: 'Por 3 minutos, siente gratitud como si ya tuvieras lo que deseas.' },
  { id: 'bendecir', cat: 'espiritu', emoji: '🙌', title: 'Bendecir tu día', days: 7, desc: 'Cerrar el día reconociendo lo sagrado de lo cotidiano.', daily: 'Antes de dormir, bendice 3 momentos de tu día.' },

  // Creatividad
  { id: 'crear', cat: 'creatividad', emoji: '🎨', title: 'Crear sin juzgar', days: 7, desc: 'Dibujar, pintar o crear por el gusto de hacerlo, no para que quede lindo.', daily: 'Crea algo durante 10 minutos, sin juzgarlo.' },
  { id: 'haiku', cat: 'creatividad', emoji: '✍️', title: 'Un haiku al día', days: 7, desc: 'Tres versos (5-7-5 sílabas) para capturar un instante.', daily: 'Escribe un haiku sobre algo de hoy.' },
  { id: 'escuchar-musica', cat: 'creatividad', emoji: '🎶', title: 'Escuchar con el alma', days: 7, desc: 'Escuchar música de verdad, sin hacer nada más.', daily: 'Escucha una canción con los ojos cerrados.' },
  { id: 'foto-belleza', cat: 'creatividad', emoji: '📷', title: 'Fotografía la belleza', days: 7, desc: 'Entrenar la mirada para encontrar belleza en lo simple.', daily: 'Toma una foto de algo bello y simple.' },
  { id: 'cocinar', cat: 'creatividad', emoji: '🍲', title: 'Cocinar con amor', days: 7, desc: 'Preparar comida con calma y presencia también es meditar.', daily: 'Prepara algo con calma y atención plena.' },

  // Autocuidado
  { id: 'manana-lenta', cat: 'autocuidado', emoji: '🍃', title: 'Mañanas lentas', days: 7, desc: 'Regalarte un comienzo de día sin apuro.', daily: 'Regálate 15 minutos lentos al despertar: té, respiración, silencio.' },
  { id: 'ritual-agua', cat: 'autocuidado', emoji: '🛁', title: 'Ritual de agua', days: 7, desc: 'Convertir la ducha en un momento para soltar.', daily: 'Siente el agua en tu ducha e imagina que se lleva lo que no necesitas.' },
  { id: 'limites', cat: 'autocuidado', emoji: '✋', title: 'Decir que no con amor', days: 7, desc: 'Poner límites también es una forma de cuidarte.', daily: 'Pon un límite amable cuando algo no te haga bien.' },
  { id: 'leer', cat: 'autocuidado', emoji: '📖', title: 'Leer para el alma', days: 7, desc: 'Unos minutos de lectura que te inspiren.', daily: 'Lee 15 minutos de un libro que te inspire.' },
  { id: 'diario-noche', cat: 'autocuidado', emoji: '📓', title: 'Diario nocturno', days: 7, desc: 'Cerrar el día poniéndole palabras a lo que sentiste.', daily: 'Escribe unas líneas en tu diario antes de dormir.' },
  { id: 'descanso-real', cat: 'autocuidado', emoji: '🫖', title: 'Descanso de verdad', days: 7, desc: 'Descansar sin culpa y sin pantallas.', daily: 'Tómate 20 minutos de descanso real, sin hacer nada productivo.' },

  // Caminos largos
  { id: 'camino-meditacion-21', cat: 'caminos', emoji: '🪷', title: '21 días de meditación', days: 21, desc: 'Tres semanas seguidas para que meditar deje de ser un esfuerzo y se vuelva parte de ti.', daily: 'Medita, aunque sean 5 minutos.' },
  { id: 'camino-gratitud-21', cat: 'caminos', emoji: '🙏', title: '21 días de gratitud', days: 21, desc: 'Tres semanas agradeciendo para cambiar la forma en que miras tu vida.', daily: 'Escribe 3 gratitudes nuevas.' },
  { id: 'camino-yo-futuro-30', cat: 'caminos', emoji: '🦋', title: '30 días hacia tu yo futuro', days: 30, desc: 'Un mes pensando, sintiendo y actuando como la persona que estás eligiendo ser.', daily: 'Medita en tu yo futuro y haz una acción coherente con esa versión de ti.' },
  { id: 'camino-yoga-30', cat: 'caminos', emoji: '🧘', title: '30 días de yoga', days: 30, desc: 'Un mes moviendo el cuerpo con amor.', daily: 'Practica yoga, aunque sean 10 minutos.' },
  { id: 'camino-luna', cat: 'caminos', emoji: '🌕', title: 'Un ciclo lunar', days: 29, desc: 'Acompañar a la luna durante un ciclo completo y observar cómo cambia tu energía.', daily: 'Mira la fase de la luna y anota cómo está tu energía hoy.' },
  { id: 'camino-bienestar-14', cat: 'caminos', emoji: '🌱', title: '14 días de ritual diario', days: 14, desc: 'Dos semanas completando tu ritual de "Hoy": meditar, agradecer y cuidarte.', daily: 'Completa tu ritual del día en la pestaña Hoy.' },
];

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id);

/* ============ Frases del día ============ */

export const QUOTES = [
  'Respira. Este momento también es tu vida.',
  'No tienes que tenerlo todo resuelto para estar en paz.',
  'Lo que riegas, crece. Riega lo que amas.',
  'Tu calma también es una forma de fuerza.',
  'Hoy basta con dar un paso pequeño, pero con el corazón.',
  'Vuelve a tu respiración: siempre está aquí esperándote.',
  'Eres el cielo. Los pensamientos son solo nubes que pasan.',
  'La gratitud convierte lo que tienes en suficiente.',
  'Sé suave contigo. Estás haciendo lo mejor que puedes.',
  'Donde pones tu atención, pones tu energía.',
  'No se trata de dejar la mente en blanco, sino de volver una y otra vez.',
  'Cada inhalación es un comienzo. Cada exhalación, un soltar.',
  'Tu yo futuro te está agradeciendo lo que haces hoy.',
  'Siente hoy la emoción de lo que deseas.',
  'La paz no se busca afuera: se recuerda adentro.',
  'Descansar también es avanzar.',
  'Hay magia en lo cotidiano cuando lo miras con atención.',
  'Suelta lo que no puedes controlar y abraza lo que sí.',
  'Lo que sientes es válido. Lo que eres es más grande.',
  'Florecer lleva su tiempo. Confía en tus estaciones.',
  'Tu corazón sabe el camino. Escúchalo en silencio.',
  'Hoy elige una cosa: presencia.',
  'Mereces el mismo amor que le das a los demás.',
  'Estar presente es el regalo más lindo que puedes darte.',
  'Cuando cambias tu energía, cambia lo que atraes.',
  'Que tu día tenga pausas, luz y ternura.',
  'No hay prisa. Todo llega en su momento perfecto.',
  'Cierra los ojos, respira hondo y vuelve a ti.',
  'Eres más que tus pensamientos: eres quien los observa.',
  'La intención le da dirección a tu energía.',
  'Tu cuerpo es tu hogar. Habítalo con cariño.',
  'Agradecer por adelantado es sembrar.',
  'Pequeños rituales, grandes transformaciones.',
  'La vida sucede ahora. No te la pierdas.',
  'Brillas más cuando te permites ser tú.',
  'Deja que hoy sea más ligero.',
  'Lo simple es sagrado.',
  'Tu respiración es un ancla en cualquier tormenta.',
  'Crea desde el amor, no desde el miedo.',
  'El universo responde a cómo te sientes, no solo a lo que piensas.',
  'Hoy eres semilla. Mañana, bosque.',
  'Todo lo que necesitas ya está dentro de ti.',
  'Honra tu proceso. No es una carrera.',
  'Un minuto de presencia vale más que una hora de preocupación.',
  'Aprende a estar contigo como con tu mejor amiga.',
  'La luna también tiene fases y siempre vuelve a estar llena.',
  'Donde hay gratitud, hay abundancia.',
  'El silencio también habla. Escúchalo.',
  'Hazlo con amor o suéltalo con amor.',
  'Tu energía es preciosa: cuídala.',
  'Eres un milagro respirando.',
  'Nada florece a la fuerza. Todo florece con cuidado.',
  'Deja espacio para lo inesperado.',
  'Estás justo donde necesitas estar para aprender lo que viniste a aprender.',
  'Hoy puedes empezar de nuevo, las veces que quieras.',
  'Que tu mente descanse en tu corazón.',
  'Cambiar un hábito es elegirte, un día a la vez.',
  'Tu presencia es suficiente.',
  'Mira el mundo como si fuera la primera vez.',
  'Respira profundo: lo estás haciendo bien.',
];

/* ============ Afirmaciones iniciales ============ */

export const DEFAULT_AFFIRMATIONS = [
  'Estoy en paz con quien soy y con quien estoy llegando a ser.',
  'Merezco amor, descanso y alegría.',
  'Confío en el proceso de mi vida.',
  'Mi cuerpo es sabio y lo cuido con amor.',
  'Elijo pensamientos que me hacen bien.',
  'Soy abundante en amor, salud y oportunidades.',
  'Suelto lo que no puedo controlar.',
  'Cada día me vuelvo más consciente y más libre.',
  'Estoy creando una vida que amo.',
  'Mi calma es mi poder.',
  'Agradezco todo lo que soy y todo lo que tengo.',
  'Estoy abierta a recibir lo bueno que la vida me trae.',
];

/* ============ Preguntas para el diario ============ */

export const JOURNAL_PROMPTS = [
  '¿Qué momento de hoy te hizo sentir más viva?',
  '¿Qué necesitas soltar esta semana?',
  'Si tu yo de dentro de un año te escribiera una carta, ¿qué te diría?',
  '¿Qué emoción estuvo más presente hoy y qué te quería decir?',
  '¿Qué te está enseñando la situación más difícil que estás viviendo?',
  'Describe un lugar donde te sientes completamente en paz.',
  '¿Qué harías hoy si no tuvieras miedo?',
  '¿Qué pequeña cosa te hizo sonreír hoy?',
  '¿Cómo te hablaste a ti misma hoy? ¿Cómo te gustaría hablarte?',
  '¿Qué hábito quieres dejar atrás y cuál quieres sembrar?',
  '¿Qué significa para ti vivir en abundancia?',
  'Escribe sobre una persona que te inspira y por qué.',
  '¿En qué momentos del día te sientes más tú?',
  '¿Qué te gustaría que tu cuerpo supiera que agradeces?',
  '¿Qué sueño has dejado guardado y quieres volver a mirar?',
  'Si hoy fuera perfecto, ¿cómo sería desde que despiertas hasta que te duermes?',
  '¿Qué límites necesitas poner para cuidar tu energía?',
  '¿Qué aprendiste de ti esta semana?',
  '¿Qué pensamiento se repite en tu mente últimamente? ¿Es verdad?',
  'Escribe tres cualidades tuyas que te hacen única.',
  '¿Qué te da calma cuando todo se acelera?',
  '¿Cómo se sentiría tu vida si confiaras plenamente en ti?',
  '¿Qué señales o sincronías has notado últimamente?',
  '¿Qué parte de ti necesita más cariño hoy?',
  'Describe a tu yo futuro: ¿cómo camina, cómo habla, cómo se siente?',
  '¿Qué emociones elevadas quieres sentir más seguido?',
  '¿Qué conversación pendiente te haría bien tener?',
  '¿Qué te hace sentir en casa?',
  '¿A quién te gustaría perdonar y qué te lo impide?',
  '¿Qué harías con un día completamente libre?',
  '¿Qué te está pidiendo tu intuición últimamente?',
  '¿Qué logro reciente no te has celebrado lo suficiente?',
  '¿Qué te gustaría crear en este ciclo lunar?',
  '¿Qué hábito de tu yo antiguo notaste hoy?',
  '¿Cuándo fue la última vez que te sentiste profundamente agradecida?',
  'Escribe una carta a tu niña interior.',
  '¿Qué cosas simples te hacen feliz?',
  '¿Qué te preocupa hoy y qué parte de eso sí depende de ti?',
  '¿Cómo quieres sentirte al final de este mes?',
  '¿Qué palabra quieres que defina tu próxima semana?',
  '¿Qué te dirías si fueras tu mejor amiga?',
  '¿Qué momento de tu vida te llena de orgullo?',
  '¿Qué te gustaría aprender este año?',
  '¿Dónde sientes el estrés en tu cuerpo? ¿Qué necesita esa parte?',
  '¿Qué puedes hacer mañana para cuidarte un poquito más?',
  '¿Qué te regaló la naturaleza esta semana?',
  '¿Qué creencia sobre ti misma estás lista para cambiar?',
  'Describe tu mañana ideal.',
  '¿Qué te hace perder la noción del tiempo?',
  '¿Qué relación de tu vida quieres nutrir más?',
  '¿Cuál es tu intención para esta luna nueva?',
  '¿Qué estás lista para soltar con esta luna llena?',
  '¿Qué te gustaría decirle a alguien que ya no está?',
  '¿Qué significa el éxito para ti, de verdad?',
  'Si tu corazón pudiera hablar hoy, ¿qué diría?',
  '¿Qué estás aprendiendo a aceptar?',
  '¿Qué te gustaría recordar de este día dentro de diez años?',
  '¿Qué es lo más amable que alguien hizo por ti recientemente?',
  '¿Cómo cambió tu energía después de meditar hoy?',
  '¿Qué te hace sentir en paz con tu pasado?',
  '¿Qué nueva versión de ti está naciendo?',
  'Escribe sin parar durante 5 minutos: lo que salga.',
];

/* ============ Reflexión semanal ============ */

export const WEEKLY_REFLECTION_QUESTIONS = [
  '¿Qué fue lo más lindo de esta semana?',
  '¿Qué aprendí de mí?',
  '¿Qué quiero llevar a la próxima semana y qué quiero dejar atrás?',
];

/* ============ Ánimo ============ */

export const MOODS = [
  { v: 1, emoji: '🌧️', label: 'Difícil' },
  { v: 2, emoji: '☁️', label: 'Bajita' },
  { v: 3, emoji: '🌤️', label: 'Tranquila' },
  { v: 4, emoji: '☀️', label: 'Bien' },
  { v: 5, emoji: '🌈', label: 'Radiante' },
];

export const moodByValue = (v) => MOODS.find((m) => m.v === v);

/* ============ Respiración guiada ============ */

// Fases: [etiqueta, segundos, tipo] tipo: in (inhala), hold (sostén), out (exhala)
export const BREATH_PATTERNS = [
  { id: 'caja', name: 'Respiración cuadrada', emoji: '🟩', desc: 'Para enfocarte y volver al centro.', phases: [['Inhala', 4, 'in'], ['Sostén', 4, 'hold'], ['Exhala', 4, 'out'], ['Sostén', 4, 'hold']] },
  { id: '478', name: '4 · 7 · 8', emoji: '🌙', desc: 'Para relajarte y dormir mejor.', phases: [['Inhala', 4, 'in'], ['Sostén', 7, 'hold'], ['Exhala', 8, 'out']] },
  { id: 'coherente', name: 'Coherencia cardíaca', emoji: '💗', desc: 'Equilibrio entre corazón y mente.', phases: [['Inhala', 5, 'in'], ['Exhala', 5, 'out']] },
  { id: 'suspiro', name: 'Suspiro de alivio', emoji: '🍃', desc: 'Doble inhalación y exhalación larga. Calma rápida.', phases: [['Inhala', 2, 'in'], ['Un poco más', 1, 'in2'], ['Exhala lento', 6, 'out']] },
  { id: 'relajante', name: 'Exhalación larga', emoji: '🌊', desc: 'Suelta tensión alargando la exhalación.', phases: [['Inhala', 4, 'in'], ['Exhala', 6, 'out']] },
  { id: 'energia', name: 'Despertar la energía', emoji: '☀️', desc: 'Para comenzar el día con vitalidad.', phases: [['Inhala', 3, 'in'], ['Sostén', 3, 'hold'], ['Exhala', 3, 'out']] },
];

/* ============ Sonidos ============ */

export const SOUNDS = [
  { id: 'lluvia', name: 'Lluvia', emoji: '🌧️' },
  { id: 'mar', name: 'Mar', emoji: '🌊' },
  { id: 'viento', name: 'Viento', emoji: '🍃' },
  { id: 'fogata', name: 'Fogata', emoji: '🔥' },
  { id: 'cuencos', name: 'Cuencos', emoji: '🥣' },
  { id: 'marron', name: 'Ruido suave', emoji: '🤎' },
];

/* ============ Metas semanales ============ */

export const GOAL_METRICS = {
  minutes: { label: 'Minutos de meditación', unit: 'min', auto: true },
  sessions: { label: 'Sesiones de práctica', unit: 'sesiones', auto: true },
  gratitude: { label: 'Días con gratitud', unit: 'días', auto: true },
  journal: { label: 'Entradas en el diario', unit: 'entradas', auto: true },
  breath: { label: 'Respiraciones guiadas', unit: 'veces', auto: true },
  games: { label: 'Juegos completados', unit: 'juegos', auto: true },
  manual: { label: 'Otra (la marco yo)', unit: 'veces', auto: false },
};

export const DEFAULT_GOALS = [
  { id: 'g-min', title: 'Meditar', metric: 'minutes', target: 60, emoji: '🧘‍♀️' },
  { id: 'g-grat', title: 'Agradecer', metric: 'gratitude', target: 5, emoji: '🙏' },
  { id: 'g-diario', title: 'Escribir en mi diario', metric: 'journal', target: 2, emoji: '📓' },
];

export const DEFAULT_HABITS = [
  { id: 'h-agua', name: 'Tomar agua', emoji: '💧' },
  { id: 'h-mover', name: 'Mover el cuerpo', emoji: '🧘' },
  { id: 'h-aire', name: 'Aire libre', emoji: '🌿' },
  { id: 'h-pantallas', name: 'Pausa de pantallas', emoji: '📵' },
];

/* ============ Niveles (jardín interior) ============ */

export const LEVELS = [
  { at: 0, name: 'Semilla', emoji: '🌱' },
  { at: 60, name: 'Brote', emoji: '🍃' },
  { at: 200, name: 'Hojita', emoji: '🌿' },
  { at: 450, name: 'Planta', emoji: '🪴' },
  { at: 800, name: 'Capullo', emoji: '🌷' },
  { at: 1300, name: 'Flor', emoji: '🌸' },
  { at: 2000, name: 'Jardín', emoji: '🌼' },
  { at: 3000, name: 'Loto', emoji: '🪷' },
  { at: 4500, name: 'Bosque', emoji: '🌳' },
  { at: 6500, name: 'Luz', emoji: '✨' },
];

/* ============ Juegos ============ */

// Palabra del día (5 letras, sin tildes; la Ñ se mantiene).
export const WORDLE_WORDS = [
  'CALMA', 'MENTE', 'SUAVE', 'LUNAR', 'PAUSA', 'NUBES', 'FLUIR', 'SANAR', 'VIBRA', 'AROMA',
  'BRISA', 'CIELO', 'FUEGO', 'LLAMA', 'LOTOS', 'LUCES', 'MAREA', 'NOBLE', 'OASIS', 'PALMA',
  'PLENA', 'POEMA', 'PRANA', 'RAYOS', 'SABIA', 'SELVA', 'SENDA', 'TRIGO', 'VALOR', 'VELAS',
  'VERDE', 'VIDAS', 'YOGUI', 'AGUAS', 'ALBAS', 'AMADA', 'ANGEL', 'ARBOL', 'ASANA', 'AURAS',
  'BELLA', 'CANTO', 'CAUCE', 'DICHA', 'DONES', 'DULCE', 'FELIZ', 'GOZAR', 'GRATA', 'HOGAR',
  'KARMA', 'LIBRE', 'MAGIA', 'MUNDO', 'NACER', 'NOTAS', 'ORDEN', 'PIANO', 'PLAYA', 'RISAS',
  'SALUD', 'SAVIA', 'SUTIL', 'TACTO', 'TEJER', 'VIAJE', 'VIVIR', 'ALMAS', 'AMIGA', 'ANIMO',
  'ARENA', 'CAMPO', 'CEDRO', 'CISNE', 'CLARA', 'COLOR', 'CORAL', 'DANZA', 'ESTAR', 'FAROL',
  'FLORA', 'GOTAS', 'GRANO', 'HOJAS', 'IDEAS', 'ISLAS', 'JUGAR', 'LAGOS', 'LENTO', 'LIRIO',
  'LOMAS', 'LUNAS', 'MANTO', 'MIRAR', 'MONTE', 'MUSGO', 'NIEVE', 'NORTE', 'OCASO', 'ONDAS',
  'OTOÑO', 'PERLA', 'PINOS', 'PLUMA', 'POLEN', 'PRADO', 'PULSO', 'RAMAS', 'REIKI', 'RITMO',
  'ROCIO', 'ROSAS', 'RUMBO', 'SAUCE', 'SERES', 'SOLAR', 'SUEÑO', 'SOÑAR', 'TALLO', 'TIBIO',
  'TRINO', 'UNION', 'VALLE', 'VAPOR', 'VERSO', 'VITAL', 'VUELO', 'CALOR', 'FIRME', 'GRATO',
  'MUDRA', 'SUTRA', 'TAROT', 'RUNAS', 'SIGNO', 'ASTRO', 'VENUS', 'SOLES', 'MANOS', 'BESOS',
  'CREAR', 'GIRAR', 'ABRIR', 'VOLAR', 'NADAR', 'TOCAR', 'DEJAR', 'REZAR', 'AHORA', 'LUCIR',
  'BROTE', 'FRUTO', 'NIDOS', 'BALSA', 'MIMAR', 'ALTAR', 'SALVE', 'LEVES', 'BAHIA', 'CUEVA',
  'DUNAS', 'GEMAS', 'LILAS', 'OLIVO', 'PECHO', 'PICOS', 'RELAX', 'CUIDA', 'TERSO',
].filter((w) => [...w].length === 5);

export const SOPA_THEMES = [
  { id: 'meditacion', name: 'Meditación', emoji: '🧘‍♀️', words: ['RESPIRAR', 'CALMA', 'PRESENTE', 'SILENCIO', 'QUIETUD', 'MANTRA', 'ATENCION', 'PAUSA', 'ALMA', 'PAZ', 'ENFOQUE', 'CONCIENCIA'] },
  { id: 'naturaleza', name: 'Naturaleza', emoji: '🌳', words: ['BOSQUE', 'MONTAÑA', 'RIO', 'SEMILLA', 'LLUVIA', 'MUSGO', 'HELECHO', 'CASCADA', 'VIENTO', 'TIERRA', 'PRADERA', 'ARBOL'] },
  { id: 'emociones', name: 'Emociones lindas', emoji: '💗', words: ['ALEGRIA', 'TERNURA', 'GRATITUD', 'AMOR', 'ASOMBRO', 'ESPERANZA', 'SERENIDAD', 'CONFIANZA', 'COMPASION', 'DICHA', 'GOZO', 'ENTUSIASMO'] },
  { id: 'chakras', name: 'Chakras y energía', emoji: '🌈', words: ['RAIZ', 'SACRO', 'PLEXO', 'CORAZON', 'GARGANTA', 'CORONA', 'ENERGIA', 'LUZ', 'PRANA', 'AURA', 'VIBRACION', 'CENTRO'] },
  { id: 'cosmos', name: 'Luna y cosmos', emoji: '🌙', words: ['LUNA', 'ESTRELLA', 'COSMOS', 'ECLIPSE', 'ORBITA', 'NEBULOSA', 'GALAXIA', 'VENUS', 'MAREA', 'CICLO', 'COMETA', 'UNIVERSO'] },
  { id: 'yoga', name: 'Yoga', emoji: '🧘', words: ['ASANA', 'NAMASTE', 'VINYASA', 'SAVASANA', 'MUDRA', 'LOTO', 'POSTURA', 'SALUDO', 'FLUIR', 'ESTIRAR', 'EQUILIBRIO', 'ESTERILLA'] },
  { id: 'gratitud', name: 'Gratitud', emoji: '🙏', words: ['GRACIAS', 'ABRAZO', 'FAMILIA', 'HOGAR', 'AMIGAS', 'SALUD', 'RISA', 'VIDA', 'CARIÑO', 'REGALO', 'SONRISA', 'COMPARTIR'] },
  { id: 'yofuturo', name: 'Tu yo futuro', emoji: '🦋', words: ['COHERENCIA', 'INTENCION', 'CAMPO', 'POTENCIAL', 'ELEVAR', 'VISION', 'CREAR', 'CAMBIO', 'MENTE', 'SINCRONIA', 'MANIFESTAR', 'SENTIR'] },
  { id: 'autocuidado', name: 'Autocuidado', emoji: '🛁', words: ['DESCANSO', 'BAÑO', 'INFUSION', 'SUEÑO', 'MIMOS', 'LECTURA', 'AGUA', 'YOGA', 'MASAJE', 'VELA', 'SIESTA', 'CUIDARME'] },
];

/* ============ Logros ============ */

// Cada logro recibe las estadísticas calculadas (ver store.js → stats()).
export const BADGES = [
  { id: 'primer-paso', emoji: '🌱', name: 'Primer paso', desc: 'Tu primera práctica.', test: (s) => s.totalSessions >= 1 },
  { id: 'hora', emoji: '⏳', name: 'Primera hora', desc: '60 minutos de práctica en total.', test: (s) => s.totalMinutes >= 60 },
  { id: 'diez-horas', emoji: '🕰️', name: 'Diez horas', desc: '600 minutos de práctica.', test: (s) => s.totalMinutes >= 600 },
  { id: 'racha-3', emoji: '🔥', name: 'Constancia', desc: '3 días seguidos practicando.', test: (s) => s.bestStreak >= 3 },
  { id: 'racha-7', emoji: '🌟', name: 'Una semana entera', desc: '7 días seguidos.', test: (s) => s.bestStreak >= 7 },
  { id: 'racha-21', emoji: '🪷', name: 'Nuevo hábito', desc: '21 días seguidos.', test: (s) => s.bestStreak >= 21 },
  { id: 'racha-60', emoji: '🌳', name: 'Raíces profundas', desc: '60 días seguidos.', test: (s) => s.bestStreak >= 60 },
  { id: 'gratitud-10', emoji: '🙏', name: 'Corazón agradecido', desc: '10 gratitudes escritas.', test: (s) => s.gratitudeCount >= 10 },
  { id: 'gratitud-100', emoji: '🫙', name: 'Frasco lleno', desc: '100 gratitudes escritas.', test: (s) => s.gratitudeCount >= 100 },
  { id: 'diario-1', emoji: '📓', name: 'Querido diario', desc: 'Tu primera entrada.', test: (s) => s.journalCount >= 1 },
  { id: 'diario-30', emoji: '📚', name: 'Escritora del alma', desc: '30 entradas en tu diario.', test: (s) => s.journalCount >= 30 },
  { id: 'reto-1', emoji: '🎯', name: 'Reto cumplido', desc: 'Completaste tu primer reto.', test: (s) => s.challengesCompleted >= 1 },
  { id: 'reto-5', emoji: '🏵️', name: 'Coleccionista', desc: '5 retos completados.', test: (s) => s.challengesCompleted >= 5 },
  { id: 'reto-15', emoji: '👑', name: 'Maestra de retos', desc: '15 retos completados.', test: (s) => s.challengesCompleted >= 15 },
  { id: 'camino', emoji: '🗺️', name: 'Caminante', desc: 'Completaste un camino largo.', test: (s) => s.longCompleted >= 1 },
  { id: 'respira-10', emoji: '🌬️', name: 'Respira', desc: '10 respiraciones guiadas.', test: (s) => s.breathCount >= 10 },
  { id: 'animo-14', emoji: '🌈', name: 'Me conozco', desc: 'Registraste tu ánimo 14 días.', test: (s) => s.moodDays >= 14 },
  { id: 'palabra-10', emoji: '🔤', name: 'Palabras sabias', desc: 'Adivinaste 10 palabras del día.', test: (s) => s.wordleWins >= 10 },
  { id: 'sopa-10', emoji: '🔎', name: 'Buscadora', desc: 'Resolviste 10 sopas de letras.', test: (s) => s.sopaDone >= 10 },
  { id: 'yo-futuro', emoji: '🦋', name: 'Mi yo futuro', desc: 'Describiste a tu yo futuro.', test: (s) => s.futureSelf },
  { id: 'luna', emoji: '🌕', name: 'Hija de la luna', desc: 'Practicaste en luna llena y en luna nueva.', test: (s) => s.moonPractice },
];
