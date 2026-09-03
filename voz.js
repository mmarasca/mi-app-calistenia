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

  // Si en este momento el micrófono está efectivamente abierto. Sirve para
  // no pedirle a la Web Speech API que arranque dos veces seguidas (tira
  // error si ya está escuchando).
  let escuchando = false;

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

  reconocimiento.onstart = () => {
    escuchando = true;
  };

  // Intenta poner en marcha el reconocimiento si hace falta (no si ya está
  // escuchando, ni si ya sabemos que no se puede usar). Si el navegador
  // todavía no terminó de soltar el micrófono de la vez anterior tira
  // error al instante; en ese caso se reintenta enseguida en vez de dejar
  // la app sin escuchar hasta que el usuario recargue la página.
  function intentarEscuchar() {
    if (!vozUtilizable || escuchando) {
      return;
    }
    try {
      reconocimiento.start();
    } catch (error) {
      setTimeout(intentarEscuchar, 300);
    }
  }

  // El reconocimiento se corta solo cada tanto en varios navegadores, y
  // también cuando el celular bloquea la pantalla y el sistema operativo le
  // corta el micrófono a la app (resguardo adicional al Wake Lock de
  // cronometro.js, que evita que la pantalla llegue a bloquearse). Se lo
  // vuelve a arrancar para seguir escuchando durante todo el entrenamiento,
  // salvo que ya sepamos que no se puede usar (por ejemplo, sin permiso de
  // micrófono).
  reconocimiento.onend = () => {
    escuchando = false;
    setTimeout(intentarEscuchar, 300);
  };

  reconocimiento.onerror = (evento) => {
    console.warn("Error de reconocimiento de voz:", evento.error);
    escuchando = false;

    if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
      vozUtilizable = false;
      mostrarAviso("No se dio permiso de micrófono. Usá los botones para controlar el cronómetro.");
    }
    // Los demás errores (por ejemplo "network" o "no-speech") los reintenta
    // el propio onend, que el navegador dispara siempre después de un error.
  };

  // Resguardo extra para cuando se bloquea la pantalla: mientras el celular
  // está bloqueado, la pestaña puede quedar completamente pausada y ni
  // siquiera llegar a disparar onend/onerror; recién se entera al volver a
  // primer plano. Ahí se revisa si quedó escuchando y, si no, se reintenta.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      intentarEscuchar();
    }
  });

  intentarEscuchar();
});
