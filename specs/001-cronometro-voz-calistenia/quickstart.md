# Quickstart: Cronómetro por Voz para Calistenia

Guía para correr la app y comprobar a mano que funciona, siguiendo los escenarios de aceptación
de [spec.md](./spec.md). No hace falta instalar nada (no hay Node, ni `npm install`, ni build).

## Prerrequisitos

- Un navegador con soporte de reconocimiento de voz: se recomienda **Google Chrome** o
  **Microsoft Edge** (de escritorio o Android).
- Micrófono disponible y permiso concedido al navegador para usarlo.
- Conexión a internet (la necesita el reconocimiento de voz del navegador; el resto de la app no).

## Cómo correr la app

1. Abrir el archivo `index.html` haciendo doble clic, o servirlo con un servidor local simple
   (por ejemplo, con la extensión "Live Server" de VS Code) si el navegador bloquea el permiso de
   micrófono al abrirlo directamente como archivo.
2. Si el navegador pide permiso de micrófono, aceptarlo.

## Escenarios para probar (User Story 1 — cronometrar y guardar)

1. Escribir/elegir un ejercicio, por ejemplo "dominadas".
2. Decir "iniciar" (o tocar el botón "Iniciar") → el cronómetro debe empezar a contar en pantalla.
3. Esperar unos segundos y decir "parar" (o tocar el botón "Parar") → el cronómetro se detiene.
4. Verificar que apareció un resultado guardado con: la duración correcta (aproximada a los
   segundos que pasaron), la fecha de hoy, y el nombre "dominadas".
5. Probar decir "iniciar" sin haber elegido ningún ejercicio → no debe pasar nada, y debe avisar
   que falta elegir un ejercicio.
6. Probar decir "parar" sin haber dicho antes "iniciar" → no debe pasar nada.

## Escenarios para probar (User Story 2 — ver récord anterior)

1. Guardar 2 o 3 intentos para el mismo ejercicio (por ejemplo "plancha") con distintas
   duraciones, siguiendo los pasos de arriba.
2. Volver a elegir "plancha" antes de un nuevo intento → debe mostrarse como récord la mayor
   duración entre los intentos ya guardados.
3. Elegir un ejercicio nuevo que nunca se usó (por ejemplo "sentadillas") → debe indicar
   claramente que no hay récord previo, sin mostrar 0 ni un espacio vacío confuso.
4. Guardar un intento de "plancha" que supere el récord anterior → al volver a elegir "plancha",
   el nuevo récord mostrado debe ser el de este último intento.

## Escenarios para probar (User Story 3 — botones de respaldo)

1. Sin usar el micrófono (o con el navegador sin soporte de voz), repetir los pasos de la User
   Story 1 usando solo los botones "Iniciar" y "Parar" en pantalla.
2. Confirmar que el resultado se guarda igual (misma fecha, ejercicio y duración) que si se
   hubiera usado la voz.

## Comprobar que los datos persisten

1. Después de guardar algún intento, cerrar la pestaña o recargar la página (F5).
2. Volver a elegir el mismo ejercicio → el récord anterior debe seguir mostrándose igual que antes
   de recargar (los datos no se perdieron).

## Dónde mirar si algo falla

- **El botón/voz "iniciar" no hace nada**: revisar que haya un ejercicio elegido (ver `FR-002` en
  `spec.md`) y mirar la consola del navegador por errores de `cronometro.js` o `voz.js`.
- **La voz no reconoce nada**: confirmar que el navegador soporta la Web Speech API, que se dio
  permiso de micrófono, y que hay conexión a internet (ver `research.md`, punto 2).
- **El récord no aparece o está mal**: revisar `datos.js` y el formato guardado en
  `contracts/storage-schema.md` (se puede inspeccionar con las herramientas de desarrollador del
  navegador, pestaña "Application" → "Local Storage").
