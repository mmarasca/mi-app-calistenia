# Contrato: Comandos de Voz

Define qué frases entiende la app y qué acción dispara cada una. Esto es lo que `voz.js` debe
reconocer, y lo que los botones manuales (`index.html` + `cronometro.js`) deben poder disparar
también, de forma idéntica.

## Idioma

Español (`es-ES` o `es-AR` según disponibilidad del navegador).

## Comandos reconocidos

| Palabras equivalentes                   | Acción disparada                          | Condición para que tenga efecto                        |
|------------------------------------------|--------------------------------------------|----------------------------------------------------------|
| "iniciar", "vamos", "arranca", "empezar" | Arrancar el cronómetro desde cero          | Hay un `ejercicio` elegido y el cronómetro está Detenido |
| "parar", "pará", "listo", "basta"        | Detener el cronómetro y guardar el intento | El cronómetro está Corriendo                             |

Alcanza con que la frase escuchada *contenga* alguna de esas palabras (por ejemplo, "dale,
arranca" también cuenta). Cualquier palabra o frase que no contenga ninguna de las palabras de la
tabla se ignora por completo (no genera ningún error ni acción).

## Equivalencia con controles manuales (User Story 3)

Los botones en pantalla "Iniciar" y "Parar" deben producir exactamente el mismo efecto que sus
comandos de voz equivalentes, incluyendo las mismas condiciones de la tabla de arriba. La lógica
de "qué pasa cuando se inicia/para" vive en un solo lugar (`cronometro.js`); tanto `voz.js` como
los botones solo la disparan, para no duplicar reglas en dos sitios distintos.

## Errores de reconocimiento

- Si el navegador no soporta la Web Speech API, o el usuario no dio permiso de micrófono, la app
  debe seguir siendo 100% usable con los botones manuales (no debe romperse ni bloquear la
  pantalla).
- Si el reconocimiento entiende mal una palabra (ej. entiende "tirar" en vez de "parar"), no pasa
  nada: simplemente no coincide con ningún comando y se ignora. El usuario puede repetir la
  palabra o usar el botón.
