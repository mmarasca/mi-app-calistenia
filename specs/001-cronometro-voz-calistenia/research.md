# Research: Cronómetro por Voz para Calistenia

Este documento explica, para cada decisión técnica del plan, qué se eligió, por qué, y qué otras
opciones se consideraron y se descartaron (Principio II de la constitución: explicar antes de
implementar).

## 1. ¿Con o sin servidor propio (backend)?

- **Decisión**: Sin servidor. Todo corre en el navegador (solo frontend).
- **Rationale**: El usuario es una sola persona entrenando desde su propio dispositivo; no
  necesita que sus datos se vean desde otro lugar. Armar un servidor implicaría elegir un
  lenguaje de backend, una base de datos, dónde alojarlo y cómo mantenerlo — complejidad que el
  MVP no necesita (Principio I y III de la constitución).
- **Alternativas consideradas**:
  - *Backend propio + base de datos*: descartado por agregar infraestructura (hosting, base de
    datos, seguridad de cuentas) sin que la spec lo pida.
  - *Backend-as-a-service (ej. Firebase)*: descartado por ahora porque suma una cuenta externa y
    una dependencia de un servicio de terceros para un problema que `localStorage` resuelve solo.

## 2. ¿Cómo reconocer los comandos de voz?

- **Decisión**: Web Speech API (`SpeechRecognition`), la función de reconocimiento de voz que ya
  viene incluida en navegadores como Chrome y Edge.
- **Rationale**: Es gratis, no requiere crear una cuenta ni pedir una clave de API, y no agrega
  ninguna librería externa al proyecto. Es la opción más simple posible para escuchar "iniciar" y
  "parar".
- **Alternativas consideradas**:
  - *Servicio de voz en la nube pagado (ej. Google Cloud Speech-to-Text, Azure Speech)*:
    descartado por requerir una cuenta, facturación y credenciales — mucha complejidad para
    reconocer solo dos palabras.
  - *Librería de JavaScript de terceros para voz*: descartado porque sumaría una dependencia
    externa a mantener sin necesidad, ya que el navegador ya resuelve esto.
- **Limitación a tener en cuenta**: el soporte de esta función varía según el navegador (funciona
  bien en Chrome/Edge de escritorio y Android; es limitado o inexistente en Safari/iOS). Por eso
  la spec incluye botones manuales como respaldo (User Story 3).
- **Detalle importante**: aunque la app no tiene servidor propio, el navegador sí necesita
  conexión a internet para que esta función de reconocimiento de voz funcione (manda el audio a
  un servicio externo de Google/Microsoft para interpretarlo). El resto de la app no necesita
  internet.

## 3. ¿Dónde guardar los resultados?

- **Decisión**: `localStorage` del navegador, guardando los intentos como una lista en formato
  JSON bajo una sola clave.
- **Rationale**: Es la forma más simple de que los datos "se acuerden" entre usos de la app sin
  necesitar servidor ni base de datos. Ya viene incluido en el navegador, no requiere
  configuración, y alcanza de sobra para el volumen de datos de una sola persona entrenando
  (cientos de intentos guardados ocupan un espacio mínimo).
- **Alternativas consideradas**:
  - *IndexedDB*: más potente pero mucho más compleja de usar (requiere manejar transacciones y
    una API asincrónica más difícil de leer); no se justifica para una lista simple de intentos.
  - *Backend con base de datos*: descartado por lo mismo que el punto 1 (agrega infraestructura
    innecesaria para un solo usuario).

## 4. ¿Framework de frontend (React, Vue, etc.) o JavaScript simple?

- **Decisión**: JavaScript simple ("vanilla"), sin frameworks ni herramientas de build.
- **Rationale**: Un framework suma conceptos (componentes, estado reactivo, un paso de
  compilación/build antes de poder ver la app) que no son necesarios para una sola pantalla con
  pocos elementos. Con HTML + CSS + JS simple, el usuario puede abrir cualquier archivo y
  entender qué hace sin instalar nada.
- **Alternativas consideradas**:
  - *React/Vue*: descartado por la complejidad adicional (Node.js, paso de build, conceptos
    nuevos) que no aporta valor a una app de esta escala.

## 5. ¿Framework de testing automatizado?

- **Decisión**: No se incluye en este MVP. La validación se hace a mano siguiendo los pasos de
  `quickstart.md`, que reflejan los criterios de aceptación de la spec.
- **Rationale**: Sumar un framework de pruebas (por ejemplo Jest) implicaría instalar Node.js y un
  gestor de paquetes, herramientas que no existen todavía en este proyecto y que no son
  necesarias para verificar una app tan chica. Se puede reconsiderar en una iteración futura si el
  proyecto crece.
- **Alternativas consideradas**:
  - *Jest / Vitest*: descartado por ahora para no sumar tooling (Node, `package.json`, un
    ejecutor de pruebas) a un proyecto que hoy no lo necesita.

## 6. Idioma de nombres de código

- **Decisión**: Español, tanto en nombres de archivo (`cronometro.js`, `datos.js`, `voz.js`) como
  en nombres de variables y funciones.
- **Rationale**: El usuario piensa y escribe en español; usar el mismo idioma en el código hace
  que, si algún día quiere mirar el código, lo entienda sin traducir mentalmente términos
  técnicos en inglés.
- **Alternativas consideradas**: Inglés (convención más común en programación en general) —
  descartado para este proyecto puntual porque prioriza que su dueño lo entienda por sobre
  seguir una convención de la industria.
