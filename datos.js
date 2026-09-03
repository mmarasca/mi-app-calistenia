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
  // Agregado para que los retos de hito de Back Lever (ver más abajo) tengan
  // un ejercicio real del que sacar el récord: sin esto, su hito nunca se
  // podría desbloquear porque no habría forma de entrenarlo ni guardar un
  // intento suyo.
  { nombre: "Back Lever", categoria: "Tirón" },
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

// ---------- Progreso del ejercicio (gráfico de barras) ----------
// Reglas exactas: ver la descripción de esta funcionalidad en el feature
// request (gráfico por día mientras el historial tenga 7 días o menos desde
// el primer intento, agrupado por semana una vez superado ese límite, sin
// mezclar los dos estilos ni siquiera retroactivamente).

// Cantidad de días de calendario (hora local) entre el primer intento
// guardado de un ejercicio y la fecha de referencia (normalmente "ahora").
// Se usa solo para decidir el modo del gráfico (día vs. semana), no para
// filtrar qué intentos entran en cada grupo.
function contarDiasDesdePrimerIntento(intentosDelEjercicio, fechaReferencia) {
  const fechasEnMs = intentosDelEjercicio.map((intento) => new Date(intento.fecha).getTime());
  const primerIntento = new Date(Math.min(...fechasEnMs));

  const primerDia = new Date(
    primerIntento.getFullYear(),
    primerIntento.getMonth(),
    primerIntento.getDate()
  );
  const hoy = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate()
  );

  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((hoy.getTime() - primerDia.getTime()) / MS_POR_DIA);
}

// Lunes (hora local, a las 00:00) de la semana que contiene la fecha dada.
// Misma cuenta que obtenerDiasDeLaSemana, pero para una fecha cualquiera en
// vez de siempre "hoy".
function obtenerLunesDeLaSemanaDe(fecha) {
  const soloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diasDesdeElLunes = (soloFecha.getDay() + 6) % 7; // ver obtenerDiasDeLaSemana
  soloFecha.setDate(soloFecha.getDate() - diasDesdeElLunes);
  return soloFecha;
}

// Formato corto "DD/MM" para las etiquetas del gráfico, en hora local.
function formatearFechaCorta(fecha) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

// Reduce una lista de duraciones (ms) de un mismo grupo (día o semana) al
// promedio y a la mejor marca de ese grupo.
function calcularPromedioYMejor(duraciones) {
  const sumaMs = duraciones.reduce((suma, ms) => suma + ms, 0);
  return {
    promedioMs: sumaMs / duraciones.length,
    mejorMs: Math.max(...duraciones),
  };
}

// Devuelve los datos para el gráfico de progreso de un ejercicio: cada grupo
// con su etiqueta, el promedio de duración y la mejor marca de ese grupo.
// - "modo" es "dia" mientras el historial de ese ejercicio (desde su primer
//   intento hasta la fecha de referencia) tenga 7 días o menos; a partir del
//   día 8 pasa a "semana" (lunes a domingo) y ya no vuelve a "dia", así que
//   los grupos nunca mezclan ambos estilos.
// - Solo se genera un grupo por día/semana en el que hubo al menos un
//   intento guardado (no se rellenan huecos vacíos).
// - Devuelve null si el ejercicio todavía no tiene ningún intento guardado.
function obtenerProgresoEjercicio(ejercicio, fechaReferencia) {
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

  const diasDeHistorial = contarDiasDesdePrimerIntento(intentosDelEjercicio, fechaReferencia);
  const modo = diasDeHistorial <= 7 ? "dia" : "semana";

  const gruposPorClave = new Map(); // clave "AAAA-MM-DD" -> { etiqueta, duraciones }
  intentosDelEjercicio.forEach((intento) => {
    const fecha = new Date(intento.fecha);
    const inicioDeGrupo = modo === "dia" ? fecha : obtenerLunesDeLaSemanaDe(fecha);
    const clave = obtenerClaveDeDia(inicioDeGrupo);

    if (!gruposPorClave.has(clave)) {
      gruposPorClave.set(clave, { etiqueta: formatearFechaCorta(inicioDeGrupo), duraciones: [] });
    }
    gruposPorClave.get(clave).duraciones.push(intento.duracionMs);
  });

  const grupos = Array.from(gruposPorClave.entries())
    .sort(([claveA], [claveB]) => (claveA < claveB ? -1 : claveA > claveB ? 1 : 0))
    .map(([, grupo]) => ({
      etiqueta: grupo.etiqueta,
      ...calcularPromedioYMejor(grupo.duraciones),
    }));

  return { modo, grupos };
}

// ---------- Retos (hitos, diario, semanal, mensual) y medallero ----------
// Reglas: ver la descripción de esta funcionalidad tal como se definió al
// pedirla (4 hitos por récord real, diario/semanal/mensual por actividad
// real, medallero con el historial real de logros; nada de datos de ejemplo).

const CLAVE_LOGROS = "calistenia_logros";

// Retos de hito: una progresión de 4 niveles crecientes por ejercicio (de
// menor a mayor exigencia), cada uno para siempre según el récord real ya
// guardado para ese ejercicio (no según que se haya "activado" nada aparte).
// Los ejercicios personalizados que agregue el usuario no tienen hitos.
const RETOS_HITO_PROGRESION = [
  {
    ejercicio: "Vertical",
    niveles: [
      { nombre: "Rookie", objetivoMs: 10000 },
      { nombre: "Grinder", objetivoMs: 20000 },
      { nombre: "Beast", objetivoMs: 30000 },
      { nombre: "God", objetivoMs: 60000 },
    ],
  },
  {
    ejercicio: "L-Sit",
    niveles: [
      { nombre: "Rookie", objetivoMs: 5000 },
      { nombre: "Grinder", objetivoMs: 10000 },
      { nombre: "Beast", objetivoMs: 20000 },
      { nombre: "God", objetivoMs: 30000 },
    ],
  },
  {
    ejercicio: "Front Lever",
    niveles: [
      { nombre: "Rookie", objetivoMs: 5000 },
      { nombre: "Grinder", objetivoMs: 10000 },
      { nombre: "Beast", objetivoMs: 15000 },
      { nombre: "God", objetivoMs: 20000 },
    ],
  },
  {
    ejercicio: "Planche",
    niveles: [
      { nombre: "Rookie", objetivoMs: 5000 },
      { nombre: "Grinder", objetivoMs: 10000 },
      { nombre: "Beast", objetivoMs: 15000 },
      { nombre: "God", objetivoMs: 20000 },
    ],
  },
  {
    ejercicio: "Back Lever",
    niveles: [
      { nombre: "Rookie", objetivoMs: 10000 },
      { nombre: "Grinder", objetivoMs: 20000 },
      { nombre: "Beast", objetivoMs: 30000 },
      { nombre: "God", objetivoMs: 45000 },
    ],
  },
];

// A partir de qué racha (en días consecutivos) se desbloquea cada hito de
// racha: una sola vez cada uno, aunque la racha después se corte.
const RACHA_HITOS = [7, 21, 66];

// Cuántos días distintos con actividad hacen falta para cumplir el reto
// semanal (lunes a domingo) y el mensual (mes calendario actual).
const OBJETIVO_RETO_SEMANAL = 4;
const OBJETIVO_RETO_MENSUAL = 15;

// Devuelve el estado actual de los retos de hito por ejercicio: cada
// ejercicio con sus 4 niveles (Rookie/Grinder/Beast/God), cada uno con su
// objetivo en ms y si ya está desbloqueado según el récord real guardado
// para ese ejercicio (obtenerRecord ya definida más arriba).
function obtenerEstadoRetosHito() {
  return RETOS_HITO_PROGRESION.map((reto) => {
    const record = obtenerRecord(reto.ejercicio);
    return {
      ejercicio: reto.ejercicio,
      niveles: reto.niveles.map((nivel) => ({
        nombre: nivel.nombre,
        objetivoMs: nivel.objetivoMs,
        desbloqueado: record !== null && record >= nivel.objetivoMs,
      })),
    };
  });
}

// Devuelve el estado actual de los hitos de racha (7/21/66 días
// consecutivos): la racha real de hoy (calcularRachaActual, ya definida más
// arriba) y si cada umbral ya está desbloqueado.
function obtenerEstadoRachaHitos(fechaReferencia) {
  const rachaActual = calcularRachaActual(fechaReferencia);
  return RACHA_HITOS.map((dias) => ({
    dias,
    desbloqueado: rachaActual >= dias,
  }));
}

// Reto diario: cumplido si hay al menos un intento guardado hoy, de
// cualquier ejercicio (mismo criterio que "día activo" de la racha).
function obtenerEstadoRetoDiario(fechaReferencia) {
  return obtenerDiasConActividad().has(obtenerClaveDeDia(fechaReferencia));
}

// Reto semanal: cuántos días distintos (lunes a domingo, sin contar los
// días todavía no llegados) tuvieron al menos un intento guardado.
function obtenerEstadoRetoSemanal(fechaReferencia) {
  const diasActivos = obtenerDiasDeLaSemana(fechaReferencia).filter((dia) => dia.activo).length;
  return {
    diasActivos,
    objetivo: OBJETIVO_RETO_SEMANAL,
    cumplido: diasActivos >= OBJETIVO_RETO_SEMANAL,
  };
}

// Reto mensual: cuántos días distintos del mes calendario actual tuvieron
// al menos un intento guardado.
function obtenerEstadoRetoMensual(fechaReferencia) {
  const prefijoDelMes = obtenerClaveDeDia(fechaReferencia).slice(0, 7); // "AAAA-MM"
  const diasActivos = Array.from(obtenerDiasConActividad()).filter((clave) =>
    clave.startsWith(prefijoDelMes)
  ).length;
  return {
    diasActivos,
    objetivo: OBJETIVO_RETO_MENSUAL,
    cumplido: diasActivos >= OBJETIVO_RETO_MENSUAL,
  };
}

// ---- Medallero: historial real de logros (ver verificarYRegistrarLogros) ----

// Lee el medallero completo guardado hasta ahora. Si todavía no hay nada
// guardado (o el dato está corrupto), devuelve una lista vacía.
function cargarLogros() {
  const textoGuardado = localStorage.getItem(CLAVE_LOGROS);
  if (!textoGuardado) {
    return [];
  }

  try {
    return JSON.parse(textoGuardado);
  } catch (error) {
    console.error("No se pudieron leer los logros guardados, se empieza de nuevo.", error);
    return [];
  }
}

// Agrega un logro nuevo al medallero, salvo que ya exista uno con la misma
// "clave" (por ejemplo, el mismo hito, o el mismo día/semana/mes ya
// registrado antes): así cada logro real queda guardado una sola vez.
function guardarLogroSiFalta(clave, nombre, fechaReferencia) {
  const logros = cargarLogros();
  if (logros.some((logro) => logro.clave === clave)) {
    return;
  }

  logros.push({ clave, nombre, fecha: fechaReferencia.toISOString() });
  localStorage.setItem(CLAVE_LOGROS, JSON.stringify(logros));
}

// Revisa el estado actual de todos los tipos de reto (hito por ejercicio,
// hito de racha, diario, semanal, mensual, y el hito simbólico de "primer
// reto") y, por cada uno que esté cumplido y todavía no tenga su logro
// guardado, lo agrega al medallero con la fecha de hoy. Pensado para
// llamarse cada vez que se vuelve a dibujar la sección de Retos (al cargar
// la página y después de guardar cada intento nuevo), para que el
// medallero quede siempre al día con la actividad real.
function verificarYRegistrarLogros(fechaReferencia) {
  // Hitos de progresión por ejercicio: una entrada por cada nivel
  // desbloqueado (no uno solo por ejercicio), para que Rookie/Grinder/
  // Beast/God queden cada uno como su propio logro en el medallero.
  obtenerEstadoRetosHito().forEach((reto) => {
    reto.niveles.forEach((nivel) => {
      if (nivel.desbloqueado) {
        guardarLogroSiFalta(
          `hito-${reto.ejercicio}-${nivel.nombre}`,
          `${reto.ejercicio} ${nivel.nombre}`,
          fechaReferencia
        );
      }
    });
  });

  // Hitos de racha (7/21/66 días): una sola vez cada uno, aunque la racha
  // después se corte (guardarLogroSiFalta ya se encarga de no repetirlos).
  obtenerEstadoRachaHitos(fechaReferencia).forEach((hito) => {
    if (hito.desbloqueado) {
      guardarLogroSiFalta(`racha-${hito.dias}`, `Racha de ${hito.dias} días`, fechaReferencia);
    }
  });

  const diarioCumplido = obtenerEstadoRetoDiario(fechaReferencia);
  if (diarioCumplido) {
    const claveDelDia = obtenerClaveDeDia(fechaReferencia);
    guardarLogroSiFalta(`diario-${claveDelDia}`, "Entrená hoy", fechaReferencia);
  }

  const semanal = obtenerEstadoRetoSemanal(fechaReferencia);
  if (semanal.cumplido) {
    const claveDeLaSemana = obtenerClaveDeDia(obtenerLunesDeLaSemanaDe(fechaReferencia));
    guardarLogroSiFalta(
      `semanal-${claveDeLaSemana}`,
      `${OBJETIVO_RETO_SEMANAL} días esta semana`,
      fechaReferencia
    );
  }

  const mensual = obtenerEstadoRetoMensual(fechaReferencia);
  if (mensual.cumplido) {
    const claveDelMes = obtenerClaveDeDia(fechaReferencia).slice(0, 7);
    guardarLogroSiFalta(`mensual-${claveDelMes}`, `${OBJETIVO_RETO_MENSUAL} días este mes`, fechaReferencia);
  }

  // Hito simbólico: la primera vez que se cumple CUALQUIERA de los 3 retos
  // activos (diario, semanal o mensual), sin importar cuál haya sido.
  if (diarioCumplido || semanal.cumplido || mensual.cumplido) {
    guardarLogroSiFalta("primer-reto", "Primer reto completado", fechaReferencia);
  }
}

// Devuelve el medallero completo, ordenado del logro más reciente al más viejo.
function obtenerLogrosOrdenados() {
  return cargarLogros().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}
