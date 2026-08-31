// voz.js
//
// Escucha el micrófono y reconoce los comandos de voz para iniciar y parar
// el cronómetro, llamando a las funciones de cronometro.js. Si el navegador
// no soporta reconocimiento de voz, no hace nada y la app sigue andando igual
// (el resto de los controles no dependen de este archivo). Reglas: ver
// specs/001-cronometro-voz-calistenia/contracts/voice-commands.md

// Cualquiera de estas palabras pone en marcha o detiene el cronómetro.
const PALABRAS_INICIAR = ["iniciar", "vamos", "arranca", "empezar"];
const PALABRAS_PARAR = ["parar", "pará", "listo", "basta"];

// Devuelve true si el texto dicho contiene alguna de las palabras de la lista.
function contieneAlgunaPalabra(texto, palabras) {
  return palabras.some((palabra) => texto.includes(palabra));
}

window.addEventListener("DOMContentLoaded", () => {
  // Chrome/Edge exponen esta función con nombres distintos según la versión.
  const ReconocimientoDeVoz = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!ReconocimientoDeVoz) {
    // mostrarAviso() es de cronometro.js: el resto de la app (botones, guardado,
    // récord) sigue funcionando perfecto sin reconocimiento de voz (User Story 3).
    mostrarAviso("Este navegador no soporta reconocimiento de voz. Usá los botones.");
    return;
  }

  // Si el usuario niega el permiso de micrófono, no tiene sentido seguir
  // reintentando: se avisa una sola vez y se deja de escuchar.
  let vozUtilizable = true;

  const reconocimiento = new ReconocimientoDeVoz();
  reconocimiento.lang = "es-ES";
  reconocimiento.continuous = true; // seguir escuchando todo el tiempo
  reconocimiento.interimResults = false; // solo interesan frases ya terminadas

  reconocimiento.onresult = (evento) => {
    const ultimoResultado = evento.results[evento.results.length - 1];
    const textoDicho = ultimoResultado[0].transcript.trim().toLowerCase();

    if (contieneAlgunaPalabra(textoDicho, PALABRAS_INICIAR)) {
      iniciar(); // función de cronometro.js
    } else if (contieneAlgunaPalabra(textoDicho, PALABRAS_PARAR)) {
      parar(); // función de cronometro.js
    }
    // Cualquier otra palabra reconocida se ignora a propósito.
  };

  // El reconocimiento se corta solo cada tanto en varios navegadores;
  // lo volvemos a arrancar para seguir escuchando durante todo el entrenamiento,
  // salvo que ya sepamos que no se puede usar (por ejemplo, sin permiso de micrófono).
  reconocimiento.onend = () => {
    if (vozUtilizable) {
      reconocimiento.start();
    }
  };

  reconocimiento.onerror = (evento) => {
    console.warn("Error de reconocimiento de voz:", evento.error);

    if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
      vozUtilizable = false;
      mostrarAviso("No se dio permiso de micrófono. Usá los botones para controlar el cronómetro.");
    }
  };

  reconocimiento.start();
});
