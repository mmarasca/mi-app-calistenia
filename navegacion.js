// navegacion.js
//
// Cambia entre las dos pantallas de la app (Cronómetro / Retos) tocando las
// pestañas de arriba: solo muestra una y oculta la otra, sin recargar la
// página ni usar ninguna librería de rutas. No depende de ningún otro
// archivo, y ningún otro archivo depende de este: el reconocimiento de voz
// (voz.js) sigue escuchando igual sin importar qué pantalla esté a la
// vista, porque no tiene ninguna relación con que una pantalla esté oculta
// o no (solo llama a iniciar()/parar(), que siguen ahí aunque no se vean).

const PANTALLAS = [
  { idPestana: "pestana-cronometro", idPantalla: "pantalla-cronometro" },
  { idPestana: "pestana-retos", idPantalla: "pantalla-retos" },
];

// Muestra la pantalla pedida y oculta la otra, y marca como activa la
// pestaña correspondiente (visualmente y para lectores de pantalla).
function mostrarPantalla(idPantallaAMostrar) {
  PANTALLAS.forEach(({ idPestana, idPantalla }) => {
    const esLaElegida = idPantalla === idPantallaAMostrar;
    document.getElementById(idPantalla).hidden = !esLaElegida;

    const pestana = document.getElementById(idPestana);
    pestana.classList.toggle("activa", esLaElegida);
    pestana.setAttribute("aria-selected", String(esLaElegida));
  });
}

window.addEventListener("DOMContentLoaded", () => {
  PANTALLAS.forEach(({ idPestana, idPantalla }) => {
    document.getElementById(idPestana).addEventListener("click", () => mostrarPantalla(idPantalla));
  });

  // Siempre arranca en "Cronómetro" (el HTML ya lo deja así por defecto;
  // esto lo deja explícito y a prueba de futuros cambios en el HTML).
  mostrarPantalla("pantalla-cronometro");
});
