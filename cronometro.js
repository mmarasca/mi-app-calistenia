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

// Pone en marcha el cronómetro desde cero.
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
  elementoEjercicioSelect.disabled = true; // FR-012: no se puede cambiar el ejercicio corriendo
  elementoEjercicioNuevo.disabled = true;
  elementoCategoriaNueva.disabled = true;
  elementoCategoriaNuevaTexto.disabled = true;
  elementoBotonAnterior.disabled = true;
  elementoBotonSiguiente.disabled = true;
  elementoBotonReset.disabled = false;
  elementoBotonPlay.innerHTML = ICONO_STOP;
  elementoBotonPlay.setAttribute("aria-label", "Parar");
  elementoBotonPlay.classList.add("en-curso");
  elementoEstadoTexto.textContent = "EN CURSO";

  idIntervalo = setInterval(actualizarCronometroEnPantalla, 200);
}

// Detiene el cronómetro, guarda el intento (datos.js) y vuelve todo a cero.
// No hace nada si el cronómetro ya estaba detenido.
function parar() {
  if (estado !== ESTADO_CORRIENDO) {
    return;
  }

  const duracionMs = Date.now() - momentoInicio;
  clearInterval(idIntervalo);
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
  elementoBotonReset.disabled = true;
  elementoBotonPlay.innerHTML = ICONO_PLAY;
  elementoBotonPlay.setAttribute("aria-label", "Iniciar");
  elementoBotonPlay.classList.remove("en-curso");
  elementoEstadoTexto.textContent = "LISTO";
  elementoCronometro.textContent = formatearTiempo(0);

  actualizarRecordEnPantalla(); // por si este intento recién guardado es la nueva mejor marca
  actualizarRachaEnPantalla(); // por si este intento es el primero de hoy (o de un domingo)
}

// Se llama cada 200ms mientras el cronómetro está corriendo, para refrescar
// el tiempo mostrado en pantalla.
function actualizarCronometroEnPantalla() {
  const transcurrido = Date.now() - momentoInicio;
  elementoCronometro.textContent = formatearTiempo(transcurrido);
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

  elementoCronometro.textContent = formatearTiempo(0);
  poblarSelectEjercicios();
  poblarSelectCategorias();
  actualizarRecordEnPantalla(); // mostrar el récord del ejercicio ya seleccionado por defecto
  actualizarCarruselDisplay(); // mostrar nombre + categoría del ejercicio ya seleccionado
  actualizarRachaEnPantalla(); // mostrar la racha real (antes era un dato de ejemplo fijo)

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
  });

  // Cada vez que se escribe o cambia el ejercicio, se actualiza el récord mostrado.
  elementoEjercicioNuevo.addEventListener("input", actualizarRecordEnPantalla);

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

  // Un solo botón central hace de "Iniciar"/"Parar" según el estado; el botón
  // de reset queda deshabilitado salvo mientras el cronómetro está corriendo
  // (mismo comportamiento que antes tenía "Parar", que no hacía nada detenido).
  elementoBotonPlay.addEventListener("click", alternarPlay);
  elementoBotonReset.addEventListener("click", parar);
});
