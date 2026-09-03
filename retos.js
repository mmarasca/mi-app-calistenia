// retos.js
//
// Arma la parte visual de la sección "Retos": retos de hito por ejercicio
// (una progresión de 4 niveles cada uno, para siempre según el récord
// real), reto diario/semanal/mensual (según la actividad real guardada) y
// el medallero con el historial real de logros (incluyendo los hitos de
// racha y el de "primer reto"). Todo el cálculo y el guardado vive en
// datos.js; este archivo solo lee ese estado y dibuja los elementos del HTML.

// Íconos SVG reutilizados: check y candado con el mismo trazo que ya se usa
// en el resto de la app (ver el carrusel y los botones de control).
const ICONO_RETO_CHECK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICONO_RETO_CANDADO =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const ICONO_MEDALLA =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3l2.2 6.5M15 3l-2.2 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12.2l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z" fill="currentColor"/></svg>';

const MESES_ABREVIADOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Formato corto "12 ago" para las fechas del medallero.
function formatearFechaLegible(fecha) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${dia} ${MESES_ABREVIADOS[fecha.getMonth()]}`;
}

// Formato "30s" para el objetivo de cada hito (todos los objetivos actuales
// son segundos redondos, pero se redondea igual por las dudas).
function formatearSegundos(ms) {
  return `${Math.round(ms / 1000)}s`;
}

let elementoRetoDiarioTarjeta;
let elementoRetoDiarioIcono;
let elementoRetoDiarioEstado;
let elementoRetoSemanalContador;
let elementoRetoSemanalBarra;
let elementoRetoMensualContador;
let elementoRetoMensualBarra;
let elementoRetosHitoLista;
let elementoMedalleroContador;
let elementoMedalleroVacio;
let elementoMedalleroLista;

// Dibuja los 3 retos activos (diario, semanal, mensual) según la actividad
// real guardada hasta este momento.
function actualizarRetosActivosEnPantalla(ahora) {
  const diarioCumplido = obtenerEstadoRetoDiario(ahora); // datos.js
  elementoRetoDiarioTarjeta.classList.toggle("reto-cumplido", diarioCumplido);
  elementoRetoDiarioIcono.innerHTML = diarioCumplido ? ICONO_RETO_CHECK : ICONO_RETO_CANDADO;
  elementoRetoDiarioEstado.textContent = diarioCumplido ? "Listo" : "Pendiente";

  const semanal = obtenerEstadoRetoSemanal(ahora); // datos.js
  elementoRetoSemanalContador.textContent = `${Math.min(semanal.diasActivos, semanal.objetivo)} / ${semanal.objetivo}`;
  elementoRetoSemanalBarra.style.width = `${Math.min(100, (semanal.diasActivos / semanal.objetivo) * 100)}%`;

  const mensual = obtenerEstadoRetoMensual(ahora); // datos.js
  elementoRetoMensualContador.textContent = `${Math.min(mensual.diasActivos, mensual.objetivo)} / ${mensual.objetivo}`;
  elementoRetoMensualBarra.style.width = `${Math.min(100, (mensual.diasActivos / mensual.objetivo) * 100)}%`;
}

// Dibuja la lista de retos de hito agrupada por ejercicio: una fila por
// ejercicio, y adentro sus 4 niveles (Rookie/Grinder/Beast/God), cada uno
// marcado según si ya está desbloqueado por el récord real.
function actualizarRetosHitoEnPantalla() {
  elementoRetosHitoLista.innerHTML = "";

  obtenerEstadoRetosHito().forEach((reto) => { // datos.js
    const fila = document.createElement("li");
    fila.className = "reto-hito-ejercicio";

    const nombreEjercicio = document.createElement("div");
    nombreEjercicio.className = "reto-hito-ejercicio-nombre";
    nombreEjercicio.textContent = reto.ejercicio;

    const niveles = document.createElement("div");
    niveles.className = "reto-hito-niveles";

    reto.niveles.forEach((nivel) => {
      const nivelEl = document.createElement("div");
      nivelEl.className = `reto-hito-nivel${nivel.desbloqueado ? " desbloqueado" : ""}`;

      const icono = document.createElement("span");
      icono.className = "reto-hito-nivel-icono";
      icono.innerHTML = nivel.desbloqueado ? ICONO_RETO_CHECK : ICONO_RETO_CANDADO;

      const nombreNivel = document.createElement("span");
      nombreNivel.className = "reto-hito-nivel-nombre";
      nombreNivel.textContent = nivel.nombre;

      const objetivo = document.createElement("span");
      objetivo.className = "reto-hito-nivel-objetivo";
      objetivo.textContent = formatearSegundos(nivel.objetivoMs);

      nivelEl.appendChild(icono);
      nivelEl.appendChild(nombreNivel);
      nivelEl.appendChild(objetivo);
      niveles.appendChild(nivelEl);
    });

    fila.appendChild(nombreEjercicio);
    fila.appendChild(niveles);
    elementoRetosHitoLista.appendChild(fila);
  });
}

// Dibuja el medallero con el historial real de logros (más reciente
// primero), o el mensaje de "todavía no hay nada" si está vacío.
function actualizarMedalleroEnPantalla() {
  const logros = obtenerLogrosOrdenados(); // datos.js
  elementoMedalleroContador.textContent = `${logros.length} logro${logros.length === 1 ? "" : "s"}`;

  if (logros.length === 0) {
    elementoMedalleroVacio.hidden = false;
    elementoMedalleroLista.hidden = true;
    elementoMedalleroLista.innerHTML = "";
    return;
  }

  elementoMedalleroVacio.hidden = true;
  elementoMedalleroLista.hidden = false;
  elementoMedalleroLista.innerHTML = "";

  logros.forEach((logro) => {
    const item = document.createElement("li");
    item.className = "medalla";

    const icono = document.createElement("span");
    icono.className = "medalla-icono";
    icono.innerHTML = ICONO_MEDALLA;

    const nombre = document.createElement("span");
    nombre.className = "medalla-nombre";
    nombre.textContent = logro.nombre;

    const fecha = document.createElement("span");
    fecha.className = "medalla-fecha";
    fecha.textContent = formatearFechaLegible(new Date(logro.fecha));

    item.appendChild(icono);
    item.appendChild(nombre);
    item.appendChild(fecha);
    elementoMedalleroLista.appendChild(item);
  });
}

// Punto de entrada de este archivo: revisa si hay retos recién cumplidos
// (para sumarlos al medallero, ver datos.js) y vuelve a dibujar toda la
// sección con el estado real actualizado. cronometro.js la llama al cargar
// la página y de nuevo cada vez que se guarda un intento nuevo.
function actualizarRetosEnPantalla() {
  const ahora = new Date();
  verificarYRegistrarLogros(ahora); // datos.js: guarda los logros recién cumplidos
  actualizarRetosActivosEnPantalla(ahora);
  actualizarRetosHitoEnPantalla();
  actualizarMedalleroEnPantalla();
}

window.addEventListener("DOMContentLoaded", () => {
  elementoRetoDiarioTarjeta = document.getElementById("reto-diario");
  elementoRetoDiarioIcono = elementoRetoDiarioTarjeta.querySelector(".reto-diario-icono");
  elementoRetoDiarioEstado = document.getElementById("reto-diario-estado");
  elementoRetoSemanalContador = document.getElementById("reto-semanal-contador");
  elementoRetoSemanalBarra = document.getElementById("reto-semanal-barra");
  elementoRetoMensualContador = document.getElementById("reto-mensual-contador");
  elementoRetoMensualBarra = document.getElementById("reto-mensual-barra");
  elementoRetosHitoLista = document.getElementById("retos-hito-lista");
  elementoMedalleroContador = document.getElementById("medallero-contador");
  elementoMedalleroVacio = document.getElementById("medallero-vacio");
  elementoMedalleroLista = document.getElementById("medallero-lista");

  actualizarRetosEnPantalla();
});
