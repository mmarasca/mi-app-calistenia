// cronometro.js
//
// Maneja el estado del cronómetro (Detenido / Corriendo), lo muestra en
// pantalla, y guarda el resultado en datos.js al terminar un intento.
// Máquina de estados: ver specs/001-cronometro-voz-calistenia/data-model.md

const ESTADO_DETENIDO = "Detenido";
const ESTADO_CORRIENDO = "Corriendo";

// Valor especial de la opción "+ Agregar nuevo ejercicio" en el menú.
const VALOR_NUEVO_EJERCICIO = "__nuevo__";

// Valor especial de la opción "+ Otra categoría" en el selector de categoría.
const VALOR_OTRA_CATEGORIA = "__otra__";

let estado = ESTADO_DETENIDO;
let momentoInicio = null; // Date.now() de cuando arrancó el intento actual
let idIntervalo = null; // referencia al setInterval que actualiza la pantalla
let ultimoMultiploDePitidoEmitido = 0; // cuántos "cada 10s" ya sonaron en este intento

// Referencias a los elementos de la página. Se completan cuando el HTML
// termina de cargar (ver el DOMContentLoaded al final del archivo).
let elementoEjercicioSelect;
let elementoEjercicioNuevoWrap;
let elementoEjercicioNuevo;
let elementoCategoriaNueva;
let elementoCategoriaNuevaTexto;
let elementoCronometro;
let elementoAviso;
let elementoRecord;
let elementoEstadoTexto;
let elementoBotonAnterior;
let elementoBotonSiguiente;
let elementoEjercicioNombre;
let elementoEjercicioCategoria;
let elementoBotonReset;
let elementoBotonPlay;
let elementoRachaNumero;
let elementoRachaUnidad;
let elementoRachaDias;
let elementoMensajeDomingo;
let elementoProgresoPeriodo;
let elementoProgresoVacio;
let elementoProgresoGrafico;
let elementoProgresoLeyenda;

// Íconos SVG del botón central: uno para "Iniciar" (triángulo) y otro para
// "Parar" (cuadrado), se intercambian según el estado del cronómetro.
const ICONO_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg>';
const ICONO_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';

// Convierte milisegundos a un texto "MM:SS" para mostrar en pantalla.
function formatearTiempo(ms) {
  const segundosTotales = Math.floor(ms / 1000);
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  const dosDigitos = (numero) => String(numero).padStart(2, "0");
  return `${dosDigitos(minutos)}:${dosDigitos(segundos)}`;
}

// ---------- Pitido cada 10 segundos (referencia auditiva) ----------
// Generado con la Web Audio API (osciladores), sin ningún archivo de audio
// externo. El contexto de audio se crea recién la primera vez que hace
// falta (algunos navegadores no dejan crearlo antes de una interacción del
// usuario en la página); si el navegador no soporta esta API, o falla por
// cualquier motivo, no hace nada y el resto del cronómetro sigue igual.
let contextoAudio = null;

function reproducirPitido() {
  try {
    if (!contextoAudio) {
      const ContextoDeAudio = window.AudioContext || window.webkitAudioContext;
      if (!ContextoDeAudio) {
        return;
      }
      contextoAudio = new ContextoDeAudio();
    }
    if (contextoAudio.state === "suspended") {
      contextoAudio.resume();
    }

    // Pitido corto (150ms), un tono simple que se apaga solo: no hace falta
    // pararlo a mano al parar/resetear el cronómetro (ver más abajo).
    const oscilador = contextoAudio.createOscillator();
    const ganancia = contextoAudio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.15, contextoAudio.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contextoAudio.currentTime + 0.15);

    oscilador.connect(ganancia);
    ganancia.connect(contextoAudio.destination);
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + 0.15);
  } catch (error) {
    console.warn("No se pudo reproducir el pitido:", error);
  }
}

// El cronómetro se puede arrancar por voz sin ningún toque en la pantalla,
// pero los navegadores no dejan crear/reanudar el audio hasta que hubo
// alguna interacción real del usuario con la página (si no, el primer
// pitido podría no sonar nunca). Para adelantarse a eso, se prepara el
// contexto de audio apenas se detecta el primer toque o tecla, sea cual sea
// (no hace falta que sea justo el botón de play): si para cuando llega el
// primer pitido ya hubo alguna interacción, suena bien aunque el resto del
// entrenamiento sea 100% por voz.
function desbloquearAudioAlPrimerToque() {
  if (!contextoAudio) {
    const ContextoDeAudio = window.AudioContext || window.webkitAudioContext;
    if (!ContextoDeAudio) {
      return;
    }
    contextoAudio = new ContextoDeAudio();
  }
  if (contextoAudio.state === "suspended") {
    contextoAudio.resume().catch(() => {});
  }
}

document.addEventListener("pointerdown", desbloquearAudioAlPrimerToque, { once: true });
document.addEventListener("keydown", desbloquearAudioAlPrimerToque, { once: true });

// Devuelve el nombre del ejercicio elegido en este momento: si está
// seleccionada la opción "+ Agregar nuevo ejercicio", toma lo escrito en el
// campo de texto; si no, toma directamente el valor del menú desplegable.
function obtenerEjercicioActual() {
  if (elementoEjercicioSelect.value === VALOR_NUEVO_EJERCICIO) {
    return elementoEjercicioNuevo.value.trim();
  }
  return elementoEjercicioSelect.value;
}

// Llena el menú desplegable con los ejercicios fijos y los que el usuario ya
// agregó antes (datos.js), y deja al final la opción para agregar uno nuevo.
function poblarSelectEjercicios() {
  elementoEjercicioSelect.innerHTML = "";

  obtenerListaDeEjercicios().forEach((nombre) => {
    const opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    elementoEjercicioSelect.appendChild(opcion);
  });

  const opcionAgregar = document.createElement("option");
  opcionAgregar.value = VALOR_NUEVO_EJERCICIO;
  opcionAgregar.textContent = "+ Agregar nuevo ejercicio";
  elementoEjercicioSelect.appendChild(opcionAgregar);
}

// Llena el selector de categoría con las categorías ya conocidas (datos.js)
// y deja al final la opción para escribir una categoría distinta.
function poblarSelectCategorias() {
  elementoCategoriaNueva.innerHTML = "";

  CATEGORIAS_FIJAS.forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria;
    elementoCategoriaNueva.appendChild(opcion);
  });

  const opcionOtra = document.createElement("option");
  opcionOtra.value = VALOR_OTRA_CATEGORIA;
  opcionOtra.textContent = "+ Otra categoría";
  elementoCategoriaNueva.appendChild(opcionOtra);
}

// Devuelve la categoría elegida en este momento para el ejercicio nuevo: si
// está seleccionada la opción "+ Otra categoría", toma lo escrito en su
// campo de texto; si no, toma directamente el valor del selector.
function obtenerCategoriaElegida() {
  if (elementoCategoriaNueva.value === VALOR_OTRA_CATEGORIA) {
    return elementoCategoriaNuevaTexto.value.trim();
  }
  return elementoCategoriaNueva.value;
}

// Agrega una opción nueva al menú (si todavía no está) y la deja seleccionada,
// para que el ejercicio recién escrito quede elegido como cualquier otro.
function agregarOpcionAlSelect(nombre) {
  const yaEstaEnElMenu = Array.from(elementoEjercicioSelect.options).some(
    (opcion) => opcion.value === nombre
  );

  if (!yaEstaEnElMenu) {
    const opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    const opcionAgregar = elementoEjercicioSelect.querySelector(
      `option[value="${VALOR_NUEVO_EJERCICIO}"]`
    );
    elementoEjercicioSelect.insertBefore(opcion, opcionAgregar);
  }

  elementoEjercicioSelect.value = nombre;
}

// Refleja el ejercicio elegido en las tarjetas del carrusel (nombre grande +
// categoría chica). Puramente visual: el <select> real sigue siendo la
// fuente de verdad de qué ejercicio está elegido.
function actualizarCarruselDisplay() {
  if (elementoEjercicioSelect.value === VALOR_NUEVO_EJERCICIO) {
    elementoEjercicioNombre.textContent = "Nuevo ejercicio";
    elementoEjercicioCategoria.textContent = "";
    return;
  }

  const ejercicio = elementoEjercicioSelect.value;
  elementoEjercicioNombre.textContent = ejercicio || "—";
  elementoEjercicioCategoria.textContent = ejercicio
    ? obtenerCategoriaEjercicio(ejercicio).toUpperCase() // función de datos.js
    : "";
}

// Mueve la selección del carrusel una posición hacia adelante o atrás
// (delta = 1 o -1), dando la vuelta al llegar a una punta. Dispara el mismo
// evento "change" que dispararía el usuario eligiendo del <select>, para que
// se actualice el récord, la categoría mostrada, etc.
function moverSelector(delta) {
  const opciones = elementoEjercicioSelect.options;
  if (opciones.length === 0) {
    return;
  }

  let indice = elementoEjercicioSelect.selectedIndex + delta;
  if (indice < 0) {
    indice = opciones.length - 1;
  } else if (indice >= opciones.length) {
    indice = 0;
  }

  elementoEjercicioSelect.selectedIndex = indice;
  elementoEjercicioSelect.dispatchEvent(new Event("change"));
}

// Arranca o detiene el cronómetro con un solo botón, según cómo esté en ese
// momento: mismo comportamiento que antes tenían los botones separados
// "Iniciar" y "Parar".
function alternarPlay() {
  if (estado === ESTADO_DETENIDO) {
    iniciar();
  } else {
    parar();
  }
}

// Refleja en pantalla la racha real (datos.js hace las cuentas a partir de
// los intentos guardados): el número + "día(s)" arriba, y los 7 círculos
// L M X J V S D de la semana actual. Se llama al cargar la página y de
// nuevo cada vez que se guarda un intento nuevo (parar()), para que quede
// al día sin necesidad de recargar.
function actualizarRachaEnPantalla() {
  const ahora = new Date();

  const racha = calcularRachaAMostrar(ahora); // función de datos.js
  elementoRachaNumero.textContent = racha;
  elementoRachaUnidad.textContent = racha === 1 ? " día" : " días";

  const dias = obtenerDiasDeLaSemana(ahora); // función de datos.js
  Array.from(elementoRachaDias.children).forEach((circulo, indice) => {
    const dia = dias[indice];
    circulo.classList.remove("activo", "descanso", "riesgo", "hoy");
    if (dia.activo) {
      circulo.classList.add("activo");
    } else if (dia.descanso) {
      circulo.classList.add("descanso");
    } else if (dia.enRiesgo) {
      circulo.classList.add("riesgo");
    }
    if (dia.esHoy) {
      circulo.classList.add("hoy");
    }
  });

  elementoMensajeDomingo.hidden = ahora.getDay() !== 0; // 0 = domingo
}

// Crea la etiqueta con el valor redondeado en segundos (ej. "18s") que se
// pega arriba de cada barra del gráfico de progreso.
function crearEtiquetaValorEnSegundos(ms) {
  const etiqueta = document.createElement("span");
  etiqueta.className = "progreso-valor";
  etiqueta.textContent = `${Math.round(ms / 1000)}s`;
  return etiqueta;
}

// Dibuja el gráfico de progreso (barras hechas con divs, sin librerías) del
// ejercicio elegido en este momento en el carrusel. Se llama al cargar la
// página, cada vez que cambia el ejercicio elegido, y después de guardar un
// intento nuevo (por si entra en un grupo distinto al que ya se veía).
function actualizarProgresoEnPantalla() {
  const ejercicio = obtenerEjercicioActual();
  const progreso = ejercicio ? obtenerProgresoEjercicio(ejercicio, new Date()) : null; // datos.js

  if (!progreso) {
    elementoProgresoPeriodo.textContent = "";
    elementoProgresoVacio.hidden = false;
    elementoProgresoGrafico.hidden = true;
    elementoProgresoGrafico.innerHTML = "";
    elementoProgresoLeyenda.hidden = true;
    return;
  }

  elementoProgresoPeriodo.textContent = progreso.modo === "dia" ? "POR DÍA" : "POR SEMANA";
  elementoProgresoVacio.hidden = true;
  elementoProgresoGrafico.hidden = false;
  elementoProgresoLeyenda.hidden = false;

  // Todas las barras (promedio y mejor marca, de todos los grupos) se
  // escalan contra la mejor marca más alta de todo el gráfico, para que las
  // alturas sean comparables entre columnas.
  const mejorMaximo = Math.max(...progreso.grupos.map((grupo) => grupo.mejorMs));

  elementoProgresoGrafico.innerHTML = "";
  progreso.grupos.forEach((grupo) => {
    const columna = document.createElement("div");
    columna.className = "progreso-columna";

    const barras = document.createElement("div");
    barras.className = "progreso-barras";

    const barraPromedio = document.createElement("div");
    barraPromedio.className = "progreso-barra progreso-barra-promedio";
    barraPromedio.style.height = `${(grupo.promedioMs / mejorMaximo) * 100}%`;
    barraPromedio.title = `Promedio: ${formatearTiempo(grupo.promedioMs)}`;
    barraPromedio.appendChild(crearEtiquetaValorEnSegundos(grupo.promedioMs));

    const barraMejor = document.createElement("div");
    barraMejor.className = "progreso-barra progreso-barra-mejor";
    barraMejor.style.height = `${(grupo.mejorMs / mejorMaximo) * 100}%`;
    barraMejor.title = `Mejor marca: ${formatearTiempo(grupo.mejorMs)}`;
    barraMejor.appendChild(crearEtiquetaValorEnSegundos(grupo.mejorMs));

    barras.appendChild(barraPromedio);
    barras.appendChild(barraMejor);

    const etiqueta = document.createElement("span");
    etiqueta.className = "progreso-etiqueta";
    etiqueta.textContent = grupo.etiqueta;

    columna.appendChild(barras);
    columna.appendChild(etiqueta);
    elementoProgresoGrafico.appendChild(columna);
  });

  // Mostrar siempre el grupo más reciente (el gráfico puede tener más
  // columnas de las que entran en el ancho visible).
  elementoProgresoGrafico.scrollLeft = elementoProgresoGrafico.scrollWidth;
}

function mostrarAviso(mensaje) {
  elementoAviso.textContent = mensaje;
}

function limpiarAviso() {
  elementoAviso.textContent = "";
}

// Muestra en pantalla el récord guardado del ejercicio escrito en este momento
// (FR-007), o un mensaje claro si todavía no hay ningún intento guardado para
// él (FR-008). No muestra nada si el campo de ejercicio está vacío.
function actualizarRecordEnPantalla() {
  const ejercicio = obtenerEjercicioActual();
  if (!ejercicio) {
    elementoRecord.textContent = "";
    return;
  }

  const record = obtenerRecord(ejercicio); // función de datos.js
  if (record === null) {
    elementoRecord.textContent = "Sin récord previo para este ejercicio.";
  } else {
    elementoRecord.textContent = `Récord anterior: ${formatearTiempo(record)}`;
  }
}

// Pone en marcha el cronómetro desde cero: SIEMPRE un intento nuevo arrancando
// en 00:00, nunca sigue sumando desde un tiempo final que haya quedado
// congelado en pantalla (ver parar()).
// No hace nada si ya está corriendo, ni si todavía no se eligió un ejercicio (FR-002).
function iniciar() {
  if (estado === ESTADO_CORRIENDO) {
    return;
  }

  const ejercicio = obtenerEjercicioActual();
  if (!ejercicio) {
    mostrarAviso("Elegí un ejercicio antes de arrancar el cronómetro.");
    return;
  }

  // Si se estaba escribiendo un ejercicio nuevo, se guarda ahora para que
  // aparezca en el menú la próxima vez, y queda seleccionado como cualquier
  // otro ejercicio ya guardado.
  if (elementoEjercicioSelect.value === VALOR_NUEVO_EJERCICIO) {
    guardarEjercicioPersonalizado(ejercicio, obtenerCategoriaElegida()); // función de datos.js
    agregarOpcionAlSelect(ejercicio);
    elementoEjercicioNuevoWrap.style.display = "none";
    actualizarCarruselDisplay(); // mostrar el nombre y la categoría recién guardados
  }

  limpiarAviso();
  estado = ESTADO_CORRIENDO;
  momentoInicio = Date.now();
  ultimoMultiploDePitidoEmitido = 0; // este intento nuevo todavía no hizo sonar ningún pitido
  // El cronómetro puede estar mostrando el tiempo final congelado del
  // intento anterior (ver parar()): se lo pisa a 00:00 de entrada, para no
  // esperar hasta el primer tick del intervalo de abajo.
  elementoCronometro.textContent = formatearTiempo(0);
  elementoEjercicioSelect.disabled = true; // FR-012: no se puede cambiar el ejercicio corriendo
  elementoEjercicioNuevo.disabled = true;
  elementoCategoriaNueva.disabled = true;
  elementoCategoriaNuevaTexto.disabled = true;
  elementoBotonAnterior.disabled = true;
  elementoBotonSiguiente.disabled = true;
  elementoBotonReset.disabled = true; // el reset solo tiene sentido con el cronómetro detenido
  elementoBotonPlay.innerHTML = ICONO_STOP;
  elementoBotonPlay.setAttribute("aria-label", "Parar");
  elementoBotonPlay.classList.add("en-curso");
  elementoEstadoTexto.textContent = "EN CURSO";

  idIntervalo = setInterval(actualizarCronometroEnPantalla, 200);
}

// Detiene el cronómetro, guarda el intento (datos.js) y deja el tiempo final
// congelado en pantalla (no lo vuelve a poner en 00:00): así se puede ver
// cuánto duró el intento que se acaba de terminar. Para limpiar la vista a
// 00:00 sin arrancar nada nuevo está el botón de reset (reiniciarCronometro());
// para arrancar un intento nuevo, iniciar() siempre pisa este valor congelado.
// No hace nada si el cronómetro ya estaba detenido.
function parar() {
  if (estado !== ESTADO_CORRIENDO) {
    return;
  }

  const duracionMs = Date.now() - momentoInicio;
  clearInterval(idIntervalo); // también corta el pitido cada 10s: sin este intervalo, no se vuelve a disparar
  idIntervalo = null;

  const ejercicio = obtenerEjercicioActual();
  guardarIntento(ejercicio, duracionMs); // función de datos.js

  estado = ESTADO_DETENIDO;
  momentoInicio = null;
  elementoEjercicioSelect.disabled = false;
  elementoEjercicioNuevo.disabled = false;
  elementoCategoriaNueva.disabled = false;
  elementoCategoriaNuevaTexto.disabled = false;
  elementoBotonAnterior.disabled = false;
  elementoBotonSiguiente.disabled = false;
  elementoBotonReset.disabled = false; // ya detenido: el reset vuelve a estar disponible
  elementoBotonPlay.innerHTML = ICONO_PLAY;
  elementoBotonPlay.setAttribute("aria-label", "Iniciar");
  elementoBotonPlay.classList.remove("en-curso");
  elementoEstadoTexto.textContent = "LISTO";
  // El último valor que pintó el intervalo puede tener hasta 200ms de
  // atraso; se pisa con la duración exacta recién calculada para que quede
  // congelado el tiempo final preciso, no un valor intermedio.
  elementoCronometro.textContent = formatearTiempo(duracionMs);

  actualizarRecordEnPantalla(); // por si este intento recién guardado es la nueva mejor marca
  actualizarRachaEnPantalla(); // por si este intento es el primero de hoy (o de un domingo)
  actualizarProgresoEnPantalla(); // por si este intento cambia el grupo (día o semana) que se ve
  actualizarRetosEnPantalla(); // función de retos.js: por si este intento cumple algún reto nuevo
}

// Vuelve el cronómetro a 00:00 en pantalla, sin guardar nada como intento ni
// tocar ningún dato ya guardado (récords, intentos anteriores): solo afecta
// lo que se está viendo en este momento. Pensado para "limpiar la vista",
// por ejemplo si te confundiste de ejercicio antes de arrancar. El botón ya
// queda deshabilitado mientras el cronómetro está corriendo (ver
// iniciar()/parar()); este chequeo es solo un resguardo extra.
function reiniciarCronometro() {
  if (estado === ESTADO_CORRIENDO) {
    return;
  }
  elementoCronometro.textContent = formatearTiempo(0);
}

// Se llama cada 200ms mientras el cronómetro está corriendo, para refrescar
// el tiempo mostrado en pantalla.
function actualizarCronometroEnPantalla() {
  const transcurrido = Date.now() - momentoInicio;
  elementoCronometro.textContent = formatearTiempo(transcurrido);

  // Pitido cada 10s (10, 20, 30...): se dispara una sola vez por cada
  // múltiplo nuevo que se cruza, no en cada tick de los 200ms.
  const multiploActual = Math.floor(transcurrido / 10000);
  if (multiploActual > ultimoMultiploDePitidoEmitido) {
    ultimoMultiploDePitidoEmitido = multiploActual;
    reproducirPitido();
  }
}

// ---------- Pantalla activa (Wake Lock) ----------
// Evita que el celular bloquee la pantalla solo mientras la app está
// abierta, para no perder el reconocimiento de voz a mitad de un
// entrenamiento (que es lo que pasaba antes: al bloquearse la pantalla, el
// sistema le corta el micrófono a la app). Si el navegador no soporta esta
// API (por ejemplo Firefox o Safari en algunas versiones), esta función no
// hace nada y el resto de la app sigue funcionando igual que antes.
let wakeLock = null;

async function pedirPantallaActiva() {
  if (!("wakeLock" in navigator)) {
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    // El navegador puede soltar el wake lock por su cuenta (por ejemplo, al
    // cambiar de pestaña o minimizar la app); se vuelve a pedir apenas la
    // página vuelve a primer plano (ver el "visibilitychange" más abajo).
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch (error) {
    // No es un error grave (por ejemplo, falla si se pide justo cuando la
    // pestaña no está visible): la app sigue funcionando igual, solo sin
    // este resguardo hasta el próximo intento.
    console.warn("No se pudo mantener la pantalla activa:", error);
  }
}

// Cuando la página termina de cargar: buscar los elementos del HTML,
// dejar el cronómetro listo en 00:00, y conectar los botones manuales
// (User Story 3) a las mismas funciones iniciar()/parar() que usa la voz.
window.addEventListener("DOMContentLoaded", () => {
  elementoEjercicioSelect = document.getElementById("ejercicio");
  elementoEjercicioNuevoWrap = document.getElementById("ejercicio-nuevo-wrap");
  elementoEjercicioNuevo = document.getElementById("ejercicio-nuevo");
  elementoCategoriaNueva = document.getElementById("categoria-nueva");
  elementoCategoriaNuevaTexto = document.getElementById("categoria-nueva-texto");
  elementoCronometro = document.getElementById("cronometro");
  elementoAviso = document.getElementById("aviso");
  elementoRecord = document.getElementById("record");
  elementoEstadoTexto = document.getElementById("estado-texto");
  elementoBotonAnterior = document.getElementById("boton-anterior");
  elementoBotonSiguiente = document.getElementById("boton-siguiente");
  elementoEjercicioNombre = document.getElementById("ejercicio-nombre");
  elementoEjercicioCategoria = document.getElementById("ejercicio-categoria");
  elementoBotonReset = document.getElementById("boton-reset");
  elementoBotonPlay = document.getElementById("boton-play");
  elementoRachaNumero = document.getElementById("racha-numero");
  elementoRachaUnidad = document.getElementById("racha-unidad");
  elementoRachaDias = document.getElementById("racha-dias");
  elementoMensajeDomingo = document.getElementById("mensaje-domingo");
  elementoProgresoPeriodo = document.getElementById("progreso-periodo");
  elementoProgresoVacio = document.getElementById("progreso-vacio");
  elementoProgresoGrafico = document.getElementById("progreso-grafico");
  elementoProgresoLeyenda = document.getElementById("progreso-leyenda");

  elementoCronometro.textContent = formatearTiempo(0);
  poblarSelectEjercicios();
  poblarSelectCategorias();
  actualizarRecordEnPantalla(); // mostrar el récord del ejercicio ya seleccionado por defecto
  actualizarCarruselDisplay(); // mostrar nombre + categoría del ejercicio ya seleccionado
  actualizarRachaEnPantalla(); // mostrar la racha real (antes era un dato de ejemplo fijo)
  actualizarProgresoEnPantalla(); // mostrar el gráfico del ejercicio ya seleccionado por defecto

  pedirPantallaActiva(); // no dejar que el celular bloquee la pantalla solo mientras se entrena
  // El wake lock se suelta solo cuando la pestaña deja de estar visible
  // (por ejemplo, al ir a otra app); apenas se vuelve a esta pestaña hay
  // que volver a pedirlo, o queda sin efecto el resto de la sesión.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      pedirPantallaActiva();
    }
  });

  // Al elegir "+ Agregar nuevo ejercicio" aparece el formulario (nombre +
  // categoría); al elegir cualquier otro ejercicio, se oculta. Esto pasa
  // tanto si se elige desde el <select> como si se llega ahí con las
  // flechas del carrusel.
  elementoEjercicioSelect.addEventListener("change", () => {
    const seEligioAgregarNuevo = elementoEjercicioSelect.value === VALOR_NUEVO_EJERCICIO;
    elementoEjercicioNuevoWrap.style.display = seEligioAgregarNuevo ? "flex" : "none";
    if (seEligioAgregarNuevo) {
      elementoEjercicioNuevo.value = "";
      elementoCategoriaNueva.value = CATEGORIAS_FIJAS[0]; // valor de datos.js
      elementoCategoriaNuevaTexto.style.display = "none";
      elementoCategoriaNuevaTexto.value = "";
      elementoEjercicioNuevo.focus();
    }
    actualizarRecordEnPantalla();
    actualizarCarruselDisplay();
    actualizarProgresoEnPantalla();
  });

  // Cada vez que se escribe o cambia el ejercicio, se actualiza el récord y
  // el gráfico de progreso mostrados (para un nombre nuevo, sin guardar
  // todavía, el gráfico va a mostrar el mensaje de "sin datos").
  elementoEjercicioNuevo.addEventListener("input", () => {
    actualizarRecordEnPantalla();
    actualizarProgresoEnPantalla();
  });

  // Al elegir "+ Otra categoría" aparece el campo para escribirla; al elegir
  // cualquiera de las categorías ya conocidas, se oculta.
  elementoCategoriaNueva.addEventListener("change", () => {
    const seEligioOtra = elementoCategoriaNueva.value === VALOR_OTRA_CATEGORIA;
    elementoCategoriaNuevaTexto.style.display = seEligioOtra ? "block" : "none";
    if (seEligioOtra) {
      elementoCategoriaNuevaTexto.value = "";
      elementoCategoriaNuevaTexto.focus();
    }
  });

  // Flechas del carrusel: recorren las mismas opciones que el <select>.
  elementoBotonAnterior.addEventListener("click", () => moverSelector(-1));
  elementoBotonSiguiente.addEventListener("click", () => moverSelector(1));

  // Un solo botón central hace de "Iniciar"/"Parar" según el estado (guarda el
  // intento al parar); el de reset es aparte y solo limpia la vista a 00:00
  // sin guardar nada, así que solo está habilitado con el cronómetro detenido.
  elementoBotonPlay.addEventListener("click", alternarPlay);
  elementoBotonReset.addEventListener("click", reiniciarCronometro);
});
