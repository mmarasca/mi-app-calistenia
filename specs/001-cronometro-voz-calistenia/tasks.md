---
description: "Task list template for feature implementation"
---

# Tasks: Cronómetro por Voz para Calistenia

**Input**: Design documents from `/specs/001-cronometro-voz-calistenia/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No se generan tareas de tests automatizados. El plan (`plan.md`) decidió no sumar un
framework de testing para este MVP; la validación se hace a mano siguiendo `quickstart.md` (ver
tarea de Polish al final).

**Organization**: Las tareas están agrupadas por historia de usuario (US1, US2, US3) según sus
prioridades en `spec.md`, para poder implementar y probar cada una por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivo distinto, sin depender de una tarea sin terminar)
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3)
- Cada tarea incluye la ruta exacta del archivo a modificar

## Path Conventions

Proyecto único de frontend, sin carpetas, todos los archivos en la raíz del repositorio (ver
`plan.md` → Project Structure): `index.html`, `estilos.css`, `cronometro.js`, `voz.js`, `datos.js`.

---

## Phase 1: Setup

**Purpose**: Dejar los archivos base creados y enlazados entre sí

- [X] T001 Crear los archivos `index.html`, `estilos.css`, `cronometro.js`, `voz.js` y `datos.js`
      en la raíz del proyecto. En `index.html` armar el esqueleto HTML mínimo (título de la
      página) y enlazar `estilos.css` con `<link>` y los tres scripts con `<script src="...">` en
      este orden: `datos.js`, `cronometro.js`, `voz.js`. Confirmar que la página abre en el
      navegador sin errores en la consola.

**Checkpoint**: Los archivos existen, están conectados entre sí, y la página abre sin errores.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lo que las tres historias de usuario necesitan para poder construirse

**⚠️ CRITICAL**: No empezar ninguna historia de usuario hasta terminar esta fase

- [X] T002 [P] Implementar en `datos.js` las funciones de datos definidas en
      `contracts/storage-schema.md` y `data-model.md`: `cargarIntentos()` (lee la lista guardada
      en `localStorage` bajo la clave `calistenia_intentos`, o `[]` si no existe todavía),
      `guardarIntento(ejercicio, duracionMs)` (agrega un intento nuevo con `fecha` generada con
      `new Date().toISOString()`, solo si `ejercicio` no está vacío y `duracionMs` es mayor a 0), y
      `obtenerRecord(ejercicio)` (devuelve el mayor `duracionMs` guardado para ese ejercicio, o
      `null` si no hay ninguno).
- [X] T003 [P] Agregar en `index.html` los elementos de interfaz compartidos por las tres
      historias: un campo de texto para escribir el nombre del ejercicio, un elemento para
      mostrar el récord anterior, y un elemento con texto grande para mostrar el tiempo del
      cronómetro corriendo.
- [X] T004 [P] Escribir en `estilos.css` estilos simples y legibles pensados para entrenar: texto
      del cronómetro grande y con buen contraste, para poder leerlo de un vistazo rápido durante
      el ejercicio.

**Checkpoint**: Con datos.js, el HTML base y los estilos listos, ya se puede empezar la User Story 1.

---

## Phase 3: User Story 1 - Cronometrar un ejercicio por voz y guardar el resultado (Priority: P1) 🎯 MVP

**Goal**: El usuario elige un ejercicio, dice "iniciar"/"parar" con la voz, ve el tiempo correr en
pantalla, y el resultado queda guardado solo con fecha y ejercicio.

**Independent Test**: Elegir un ejercicio, decir "iniciar", esperar unos segundos, decir "parar",
y confirmar que queda guardado un intento con la duración correcta, la fecha de hoy y el ejercicio
elegido (ver `quickstart.md`, sección User Story 1).

### Implementation for User Story 1

- [X] T005 [US1] En `cronometro.js`, implementar el estado del cronómetro (`Detenido` /
      `Corriendo`) y las funciones `iniciar()` y `parar()` según la máquina de estados de
      `data-model.md`: `iniciar()` solo actúa si el estado es `Detenido` y hay un nombre de
      ejercicio escrito (si no, no hace nada); `parar()` solo actúa si el estado es `Corriendo`.
- [X] T006 [US1] En `cronometro.js`, mientras el estado es `Corriendo`, actualizar cada ~200ms el
      elemento del cronómetro (creado en T003) con el tiempo transcurrido, calculado como la
      diferencia entre `Date.now()` y el momento en que se llamó a `iniciar()`.
- [X] T007 [US1] En `cronometro.js`, dentro de `parar()`, calcular la duración final en
      milisegundos, llamar a `datos.guardarIntento(ejercicio, duracionMs)` (T002), y volver a
      mostrar el cronómetro en 0.
- [X] T008 [P] [US1] Implementar `voz.js`: iniciar el reconocimiento de voz del navegador
      (`SpeechRecognition`, en español) apenas carga la página, y al reconocer la palabra
      "iniciar" llamar a `cronometro.iniciar()`, y al reconocer "parar" llamar a
      `cronometro.parar()` — según `contracts/voice-commands.md`. Cualquier otra palabra
      reconocida se ignora.
- [X] T009 [US1] En `cronometro.js`, mostrar un aviso visible cuando se intenta iniciar sin haber
      escrito un ejercicio (FR-002), e impedir que se edite el campo de ejercicio mientras el
      estado es `Corriendo` (FR-012).

**Checkpoint**: User Story 1 completa y comprobable de forma independiente usando solo la voz.

---

## Phase 4: User Story 2 - Ver el récord anterior antes de empezar un intento (Priority: P2)

**Goal**: Antes de decir "iniciar", el usuario ve el mejor tiempo anterior guardado para ese mismo
ejercicio.

**Independent Test**: Guardar uno o más intentos de un ejercicio (con User Story 1), volver a
elegir ese mismo ejercicio, y confirmar que se muestra la mayor duración guardada hasta el momento
(ver `quickstart.md`, sección User Story 2).

### Implementation for User Story 2

- [X] T010 [US2] En `cronometro.js`, al escribir o cambiar el nombre del ejercicio (mientras el
      estado es `Detenido`), llamar a `datos.obtenerRecord(ejercicio)` (T002) y mostrar el
      resultado en el elemento de récord creado en T003.
- [X] T011 [US2] En `cronometro.js`, manejar el caso sin récord previo: si
      `datos.obtenerRecord()` devuelve `null`, mostrar un mensaje claro como "Sin récord previo"
      en vez de un valor vacío o 0 (FR-008).
- [X] T012 [US2] En `cronometro.js`, después de guardar un intento nuevo dentro de `parar()`
      (T007), volver a consultar `datos.obtenerRecord()` y refrescar en pantalla el récord del
      ejercicio actual, por si el intento recién guardado es la nueva mejor marca.

**Checkpoint**: User Story 1 y 2 funcionan juntas: se puede entrenar por voz y ver el récord antes
de cada intento.

---

## Phase 5: User Story 3 - Usar botones como respaldo si la voz falla (Priority: P3)

**Goal**: El usuario puede iniciar y detener el cronómetro tocando botones en pantalla, con el
mismo resultado que usando la voz, para cuando el micrófono o el reconocimiento de voz fallen.

**Independent Test**: Repetir el flujo completo de User Story 1 usando únicamente los botones en
pantalla (sin hablar), y confirmar que el resultado se guarda igual (ver `quickstart.md`, sección
User Story 3).

### Implementation for User Story 3

- [X] T013 [US3] Agregar en `index.html` los botones "Iniciar" y "Parar", visibles junto al resto
      de la interfaz.
- [X] T014 [US3] En `cronometro.js`, conectar los botones creados en T013 a las mismas funciones
      `iniciar()` y `parar()` (T005) que usa la voz, para que se comporten exactamente igual
      (mismas condiciones de FR-002/FR-012 y el mismo guardado de FR-006).
- [X] T015 [US3] En `voz.js`, envolver la inicialización del reconocimiento de voz en una
      comprobación de soporte del navegador, para que si `SpeechRecognition` no existe o el
      usuario no da permiso de micrófono, el resto de la app (botones, cronómetro, récord) siga
      funcionando sin errores.

**Checkpoint**: Las tres historias de usuario funcionan, tanto por separado como en conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Últimos ajustes que afectan a toda la app, no a una sola historia

- [X] T016 Revisar todos los mensajes visibles de la interfaz (avisos, "Sin récord previo", etc.)
      para que estén en español simple y claro, entendibles sin conocimientos técnicos.
- [X] T017 Agregar comentarios breves en español en `cronometro.js`, `voz.js` y `datos.js`
      explicando qué hace cada función y, cuando no sea obvio, por qué se hizo así (Principio I de
      la constitución).
- [X] T018 Ejecutar a mano todos los escenarios de `quickstart.md` (las tres historias de usuario
      y la comprobación de que los datos persisten al recargar la página) y confirmar que todos
      se cumplen.

---

## Phase 7: Cambio — Menú desplegable de ejercicios (FR-001, FR-013, FR-014)

**Purpose**: Reemplazar el campo de texto libre del ejercicio por una lista desplegable con
ejercicios precargados y la posibilidad de agregar uno nuevo (pedido posterior a la spec inicial).

- [X] T019 En `datos.js`, agregar la lista fija `EJERCICIOS_FIJOS` (Vertical, Front Lever, L-Sit,
      Planche) y las funciones `cargarEjerciciosPersonalizados()`, `obtenerListaDeEjercicios()` y
      `guardarEjercicioPersonalizado(nombre)` sobre una nueva clave de `localStorage`
      (`calistenia_ejercicios_personalizados`), evitando nombres vacíos o duplicados.
- [X] T020 En `index.html`, cambiar el campo de texto del ejercicio por un `<select id="ejercicio">`
      y agregar un campo de texto oculto `#ejercicio-nuevo` para cuando se elige "+ Agregar nuevo
      ejercicio".
- [X] T021 En `cronometro.js`, poblar el `<select>` con `obtenerListaDeEjercicios()` más la opción
      "+ Agregar nuevo ejercicio", mostrar/ocultar `#ejercicio-nuevo` según lo elegido, y adaptar
      `obtenerEjercicioActual()` para leer de uno u otro según corresponda.
- [X] T022 En `cronometro.js`, al ejecutar `iniciar()` con un ejercicio nuevo, llamar a
      `guardarEjercicioPersonalizado()` (T019) y agregarlo como opción seleccionada del `<select>`,
      para que quede disponible como cualquier otro ejercicio a partir de ese momento.

**Checkpoint**: El ejercicio se elige de una lista (fija + agregados), con opción de sumar nuevos
sin tocar el resto de la app (cronómetro, voz, botones y récord siguen igual).

---

## Phase 8: Cambio — Más palabras para iniciar/parar (FR-003, FR-004)

**Purpose**: Aceptar varias palabras equivalentes para cada comando de voz, en vez de una sola
palabra fija por acción (pedido posterior a la spec inicial).

- [X] T023 En `voz.js`, reemplazar la comparación por una sola palabra por dos listas de palabras
      equivalentes (`PALABRAS_INICIAR`: "iniciar", "vamos", "arranca", "empezar";
      `PALABRAS_PARAR`: "parar", "listo", "basta") y una función `contieneAlgunaPalabra()` que
      revisa si lo dicho contiene alguna de ellas.
- [X] T024 Actualizar el mensaje de aviso en `cronometro.js` que mencionaba solo la palabra
      "iniciar", para que no quede desactualizado ahora que hay varias palabras válidas.

**Checkpoint**: Cualquiera de las palabras de cada lista controla el cronómetro igual; el resto de
la app (botones, récord, guardado) sigue exactamente igual.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias, se hace primero.
- **Foundational (Phase 2)**: Depende de Setup. Bloquea a las tres historias de usuario.
- **User Story 1 (Phase 3)**: Depende de Foundational. No depende de otras historias.
- **User Story 2 (Phase 4)**: Depende de Foundational y de que exista `parar()` (T007, de US1) para
  poder refrescar el récord después de guardar (T012). El resto de US2 (mostrar récord al elegir
  ejercicio) solo necesita `datos.js` (T002).
- **User Story 3 (Phase 5)**: Depende de Foundational y de que existan `iniciar()`/`parar()`
  (T005, de US1) para conectar los botones.
- **Polish (Phase 6)**: Depende de que las historias que se quieran entregar ya estén completas.

### Parallel Opportunities

- T002, T003 y T004 (Foundational) tocan archivos distintos (`datos.js`, `index.html`,
  `estilos.css`) y se pueden hacer en paralelo.
- T008 (`voz.js`) se puede hacer en paralelo con T006/T007 una vez que T005 definió las funciones
  `iniciar()`/`parar()`, ya que toca un archivo distinto (`voz.js`).

---

## Parallel Example: Foundational Phase

```bash
Task: "Implementar datos.js (cargarIntentos, guardarIntento, obtenerRecord)"
Task: "Agregar en index.html el campo de ejercicio, el récord y el cronómetro"
Task: "Escribir estilos.css con texto grande y legible"
```

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloquea todo lo demás)
3. Completar Phase 3: User Story 1
4. **Parar y validar**: probar User Story 1 de forma independiente con `quickstart.md`
5. Ya hay una app usable: cronómetro por voz con guardado automático

### Entrega incremental

1. Setup + Foundational → base lista
2. Sumar User Story 1 → probar sola → primera versión usable (MVP)
3. Sumar User Story 2 → probar junto con US1 → ahora se ve el récord antes de cada intento
4. Sumar User Story 3 → probar junto con US1+US2 → ahora hay respaldo con botones si falla la voz
5. Sumar Polish → repasar mensajes, comentarios y validar todo con `quickstart.md`

Cada historia se puede entregar y usar por sí sola antes de sumar la siguiente, sin romper lo ya
construido — en línea con el Principio III de la constitución (MVP mínimo por iteración).
