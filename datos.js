// datos.js
//
// Se encarga de guardar y leer los intentos en el navegador (localStorage).
// Ningún otro archivo debe tocar localStorage directamente: todo pasa por
// estas tres funciones. Formato exacto de los datos: ver
// specs/001-cronometro-voz-calistenia/contracts/storage-schema.md

const CLAVE_INTENTOS = "calistenia_intentos";
const CLAVE_EJERCICIOS_PERSONALIZADOS = "calistenia_ejercicios_personalizados";

// Ejercicios que ya vienen precargados en el menú desplegable, sin que el
// usuario tenga que agregarlos.
const EJERCICIOS_FIJOS = ["Vertical", "Front Lever", "L-Sit", "Planche"];

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
// los fijos). Si todavía no hay ninguno guardado, devuelve una lista vacía.
function cargarEjerciciosPersonalizados() {
  const textoGuardado = localStorage.getItem(CLAVE_EJERCICIOS_PERSONALIZADOS);
  if (!textoGuardado) {
    return [];
  }

  try {
    return JSON.parse(textoGuardado);
  } catch (error) {
    console.error("No se pudieron leer los ejercicios agregados, se empieza de nuevo.", error);
    return [];
  }
}

// Devuelve todos los ejercicios que se pueden elegir: los fijos primero, y
// después los que el usuario agregó, en el orden en que los agregó.
function obtenerListaDeEjercicios() {
  return EJERCICIOS_FIJOS.concat(cargarEjerciciosPersonalizados());
}

// Guarda un ejercicio nuevo para que aparezca en el menú la próxima vez.
// No hace nada si el nombre está vacío o si ya existe (fijo o ya agregado
// antes), para no repetirlo en la lista.
function guardarEjercicioPersonalizado(nombre) {
  const nombreLimpio = (nombre || "").trim();
  if (!nombreLimpio || obtenerListaDeEjercicios().includes(nombreLimpio)) {
    return;
  }

  const personalizados = cargarEjerciciosPersonalizados();
  personalizados.push(nombreLimpio);
  localStorage.setItem(CLAVE_EJERCICIOS_PERSONALIZADOS, JSON.stringify(personalizados));
}
