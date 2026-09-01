// datos.js
//
// Se encarga de guardar y leer los intentos en el navegador (localStorage).
// Ningún otro archivo debe tocar localStorage directamente: todo pasa por
// estas tres funciones. Formato exacto de los datos: ver
// specs/001-cronometro-voz-calistenia/contracts/storage-schema.md

const CLAVE_INTENTOS = "calistenia_intentos";
const CLAVE_EJERCICIOS_PERSONALIZADOS = "calistenia_ejercicios_personalizados";

// Categorías ya conocidas, para elegir al agregar un ejercicio nuevo (además
// de la opción de escribir una categoría distinta si ninguna de estas aplica).
const CATEGORIAS_FIJAS = ["Empuje", "Tirón", "Equilibrio", "Core"];

// Categoría de un ejercicio que no tiene ninguna asignada: por ejemplo, uno
// personalizado guardado antes de que existiera este campo. Nunca se guarda
// ni se muestra vacía, para no dejar un espacio en blanco en su lugar.
const CATEGORIA_SIN_ASIGNAR = "Sin categoría";

// Ejercicios que ya vienen precargados en el menú desplegable, con su
// categoría correspondiente, sin que el usuario tenga que agregarlos.
const EJERCICIOS_FIJOS = [
  { nombre: "Vertical", categoria: "Equilibrio" },
  { nombre: "Front Lever", categoria: "Tirón" },
  { nombre: "L-Sit", categoria: "Core" },
  { nombre: "Planche", categoria: "Empuje" },
];

// Lee la lista completa de intentos guardados hasta ahora.
// Si todavía no hay nada guardado (o el dato está corrupto), devuelve una
// lista vacía en vez de romper la app.
function cargarIntentos() {
  const textoGuardado = localStorage.getItem(CLAVE_INTENTOS);
  if (!textoGuardado) {
    return [];
  }

  try {
    return JSON.parse(textoGuardado);
  } catch (error) {
    console.error("No se pudieron leer los intentos guardados, se empieza de nuevo.", error);
    return [];
  }
}

// Guarda un nuevo intento con el ejercicio y la duración indicados.
// No guarda nada si el ejercicio está vacío o la duración no es válida
// (ver data-model.md, reglas de validación del Intento).
function guardarIntento(ejercicio, duracionMs) {
  const ejercicioLimpio = (ejercicio || "").trim();
  if (!ejercicioLimpio || !duracionMs || duracionMs <= 0) {
    return;
  }

  const intentos = cargarIntentos();
  intentos.push({
    ejercicio: ejercicioLimpio,
    fecha: new Date().toISOString(),
    duracionMs: duracionMs,
  });
  localStorage.setItem(CLAVE_INTENTOS, JSON.stringify(intentos));
}

// Devuelve la mayor duración (en milisegundos) registrada para ese ejercicio,
// o null si todavía no hay ningún intento guardado para él (FR-007, FR-008).
function obtenerRecord(ejercicio) {
  const ejercicioLimpio = (ejercicio || "").trim();
  if (!ejercicioLimpio) {
    return null;
  }

  const intentosDelEjercicio = cargarIntentos().filter(
    (intento) => intento.ejercicio === ejercicioLimpio
  );

  if (intentosDelEjercicio.length === 0) {
    return null;
  }

  const duraciones = intentosDelEjercicio.map((intento) => intento.duracionMs);
  return Math.max(...duraciones);
}

// Lee la lista de ejercicios que el usuario fue agregando a mano (no incluye
// los fijos), cada uno con su nombre y su categoría. Si todavía no hay
// ninguno guardado, devuelve una lista vacía.
function cargarEjerciciosPersonalizados() {
  const textoGuardado = localStorage.getItem(CLAVE_EJERCICIOS_PERSONALIZADOS);
  if (!textoGuardado) {
    return [];
  }

  try {
    const guardados = JSON.parse(textoGuardado);
    // Compatibilidad con el formato viejo (una lista de solo nombres, de
    // antes de que existiera la categoría): a esos se les asigna
    // CATEGORIA_SIN_ASIGNAR para no perder los ejercicios ya guardados.
    return guardados.map((item) =>
      typeof item === "string" ? { nombre: item, categoria: CATEGORIA_SIN_ASIGNAR } : item
    );
  } catch (error) {
    console.error("No se pudieron leer los ejercicios agregados, se empieza de nuevo.", error);
    return [];
  }
}

// Devuelve todos los ejercicios que se pueden elegir: los fijos primero, y
// después los que el usuario agregó, en el orden en que los agregó.
function obtenerListaDeEjercicios() {
  return EJERCICIOS_FIJOS.map((ejercicio) => ejercicio.nombre).concat(
    cargarEjerciciosPersonalizados().map((ejercicio) => ejercicio.nombre)
  );
}

// Devuelve la categoría de un ejercicio (fijo o personalizado), para
// mostrarla junto a su nombre. Si no se le conoce ninguna (por ejemplo, un
// ejercicio personalizado guardado antes de que existiera este campo),
// devuelve CATEGORIA_SIN_ASIGNAR.
function obtenerCategoriaEjercicio(nombre) {
  const nombreLimpio = (nombre || "").trim();
  if (!nombreLimpio) {
    return CATEGORIA_SIN_ASIGNAR;
  }

  const fijo = EJERCICIOS_FIJOS.find((ejercicio) => ejercicio.nombre === nombreLimpio);
  if (fijo) {
    return fijo.categoria;
  }

  const personalizado = cargarEjerciciosPersonalizados().find(
    (ejercicio) => ejercicio.nombre === nombreLimpio
  );
  return personalizado ? personalizado.categoria : CATEGORIA_SIN_ASIGNAR;
}

// Guarda un ejercicio nuevo (con su categoría) para que aparezca en el menú
// la próxima vez. No hace nada si el nombre está vacío o si ya existe (fijo o
// ya agregado antes), para no repetirlo en la lista. Si no se indica
// categoría (o queda vacía), se guarda como CATEGORIA_SIN_ASIGNAR.
function guardarEjercicioPersonalizado(nombre, categoria) {
  const nombreLimpio = (nombre || "").trim();
  if (!nombreLimpio || obtenerListaDeEjercicios().includes(nombreLimpio)) {
    return;
  }

  const categoriaLimpia = (categoria || "").trim() || CATEGORIA_SIN_ASIGNAR;

  const personalizados = cargarEjerciciosPersonalizados();
  personalizados.push({ nombre: nombreLimpio, categoria: categoriaLimpia });
  localStorage.setItem(CLAVE_EJERCICIOS_PERSONALIZADOS, JSON.stringify(personalizados));
}

// ---------- Racha de entrenamiento (calculada, no guardada) ----------
// Reglas exactas: ver specs/001-cronometro-voz-calistenia/data-model.md

// Agrupa una fecha por su día calendario en hora LOCAL (no UTC), para que
// "hoy" se corresponda con el día que la persona está viviendo, aunque
// `fecha` de cada intento se guarde en UTC (ver contracts/storage-schema.md).
function obtenerClaveDeDia(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Devuelve el conjunto de días (claves "AAAA-MM-DD", hora local) en los que
// hay guardado al menos un intento, sin importar el ejercicio (regla 1: un
// día cuenta como "activo" con cualquier intento, de cualquier ejercicio).
function obtenerDiasConActividad() {
  const dias = new Set();
  cargarIntentos().forEach((intento) => {
    dias.add(obtenerClaveDeDia(new Date(intento.fecha)));
  });
  return dias;
}

// Cuenta la racha activa a partir de una fecha de referencia (normalmente
// "ahora"): arranca en ese día y cuenta hacia atrás, día por día, mientras
// cada uno tenga actividad guardada (regla 1) o sea domingo (regla 2: día
// libre que no corta la racha aunque no haya actividad). Se corta apenas
// aparece un día de lunes a sábado sin ningún intento guardado (regla 3).
function calcularRachaActual(fechaReferencia) {
  const diasConActividad = obtenerDiasConActividad();
  let racha = 0;
  const cursor = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate()
  );

  while (true) {
    const esDomingo = cursor.getDay() === 0; // Date#getDay(): 0 = domingo
    const tuvoActividad = diasConActividad.has(obtenerClaveDeDia(cursor));
    if (!tuvoActividad && !esDomingo) {
      break;
    }
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

// Racha para MOSTRAR en pantalla: igual a calcularRachaActual, salvo por un
// término medio para el día de hoy. Si hoy es un día de lunes a sábado y
// todavía no hay ningún intento guardado hoy, no se sabe todavía si el día
// se va a terminar sin actividad (regla 3) o no, así que no se la corta de
// golpe a 0: se sigue mostrando la racha tal como venía hasta ayer. Recién al
// otro día, si ayer (el día en cuestión) terminó sin ningún intento, esta
// misma cuenta ya la corta sola (porque calcularRachaActual la va a
// encontrar vacía al pasar por ese día). Mientras tanto, el círculo de "hoy"
// es el que avisa que la racha está en riesgo (ver obtenerDiasDeLaSemana).
function calcularRachaAMostrar(fechaReferencia) {
  const hoy = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate()
  );

  const esDomingo = hoy.getDay() === 0;
  const hoyTuvoActividad = obtenerDiasConActividad().has(obtenerClaveDeDia(hoy));
  if (esDomingo || hoyTuvoActividad) {
    return calcularRachaActual(hoy);
  }

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  return calcularRachaActual(ayer);
}

// Devuelve los 7 días de la semana actual (lunes a domingo, en ese orden),
// cada uno con si tuvo actividad, si fue un domingo "libre" sin actividad
// (regla 2), si es el día de hoy, y si está "en riesgo" (hoy, sin actividad
// todavía, en un día que si termina así corta la racha). Pensado para pintar
// los círculos L M X J V S D del diseño; no participa del cálculo de la
// racha en sí (calcularRachaActual/calcularRachaAMostrar no dependen de esta
// semana particular).
function obtenerDiasDeLaSemana(fechaReferencia) {
  const diasConActividad = obtenerDiasConActividad();
  const hoy = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate()
  );

  // El lunes de esta semana: con Date#getDay() (0=domingo..6=sábado), el
  // domingo queda 6 días después del lunes, así que se resta ese corrimiento.
  const diasDesdeElLunes = (hoy.getDay() + 6) % 7;
  const lunes = new Date(hoy);
  lunes.setDate(lunes.getDate() - diasDesdeElLunes);

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);

    const esHoy = fecha.getTime() === hoy.getTime();
    const esFuturo = fecha.getTime() > hoy.getTime();
    const esDomingo = fecha.getDay() === 0;
    const tuvoActividad = !esFuturo && diasConActividad.has(obtenerClaveDeDia(fecha));

    dias.push({
      esHoy,
      activo: tuvoActividad,
      descanso: !esFuturo && esDomingo && !tuvoActividad,
      enRiesgo: esHoy && !tuvoActividad && !esDomingo,
    });
  }

  return dias;
}
