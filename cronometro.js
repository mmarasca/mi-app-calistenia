// cronometro.js
//
// Maneja el estado del cronómetro (Detenido / Corriendo), lo muestra en
// pantalla, y guarda el resultado en datos.js al terminar un intento.
// Máquina de estados: ver specs/001-cronometro-voz-calistenia/data-model.md

const ESTADO_DETENIDO = "Detenido";
const ESTADO_CORRIENDO = "Corriendo";

// Valor especial de la opción "+ Agregar nuevo ejercicio" en el menú.
const VALOR_NUEVO_EJERCICIO = "__nuevo__";

let estado = ESTADO_DETENIDO;
let momentoInicio = null; // Date.now() de cuando arrancó el intento actual
let idIntervalo = null; // referencia al setInterval que actualiza la pantalla

// Referencias a los elementos de la página. Se completan cuando el HTML
// termina de cargar (ver el DOMContentLoaded al final del archivo).
let elementoEjercicioSelect;
let elementoEjercicioNuevo;
let elementoCronometro;
let elementoAviso;
let elementoRecord;
let elementoBotonIniciar;
let elementoBotonParar;

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
    guardarEjercicioPersonalizado(ejercicio); // función de datos.js
    agregarOpcionAlSelect(ejercicio);
    elementoEjercicioNuevo.style.display = "none";
  }

  limpiarAviso();
  estado = ESTADO_CORRIENDO;
  momentoInicio = Date.now();
  elementoEjercicioSelect.disabled = true; // FR-012: no se puede cambiar el ejercicio corriendo
  elementoEjercicioNuevo.disabled = true;

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
  elementoCronometro.textContent = formatearTiempo(0);

  actualizarRecordEnPantalla(); // por si este intento recién guardado es la nueva mejor marca
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
  elementoEjercicioNuevo = document.getElementById("ejercicio-nuevo");
  elementoCronometro = document.getElementById("cronometro");
  elementoAviso = document.getElementById("aviso");
  elementoRecord = document.getElementById("record");
  elementoBotonIniciar = document.getElementById("boton-iniciar");
  elementoBotonParar = document.getElementById("boton-parar");

  elementoCronometro.textContent = formatearTiempo(0);
  poblarSelectEjercicios();
  actualizarRecordEnPantalla(); // mostrar el récord del ejercicio ya seleccionado por defecto

  // Al elegir "+ Agregar nuevo ejercicio" aparece el campo de texto; al
  // elegir cualquier otro ejercicio, se oculta.
  elementoEjercicioSelect.addEventListener("change", () => {
    const seEligioAgregarNuevo = elementoEjercicioSelect.value === VALOR_NUEVO_EJERCICIO;
    elementoEjercicioNuevo.style.display = seEligioAgregarNuevo ? "inline-block" : "none";
    if (seEligioAgregarNuevo) {
      elementoEjercicioNuevo.value = "";
      elementoEjercicioNuevo.focus();
    }
    actualizarRecordEnPantalla();
  });

  // Cada vez que se escribe o cambia el ejercicio, se actualiza el récord mostrado.
  elementoEjercicioNuevo.addEventListener("input", actualizarRecordEnPantalla);

  // Los botones llaman a las mismas funciones que los comandos de voz (voz.js),
  // así que se comportan siempre igual sin importar cómo se los dispare.
  elementoBotonIniciar.addEventListener("click", iniciar);
  elementoBotonParar.addEventListener("click", parar);
});
