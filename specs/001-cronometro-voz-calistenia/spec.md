# Feature Specification: Cronómetro por Voz para Calistenia

**Feature Branch**: `001-cronometro-voz-calistenia`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Quiero una app web simple donde pueda controlar un cronómetro con comandos de voz mientras entreno calistenia. Al decir \"iniciar\" arranca a contar el tiempo, al decir \"parar\" se detiene y guarda el resultado con la fecha y el nombre del ejercicio que yo elija antes de empezar. Antes de arrancar cada intento, me muestra mi récord anterior de ese mismo ejercicio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cronometrar un ejercicio por voz y guardar el resultado (Priority: P1)

Mientras entrena, el usuario elige o escribe el nombre del ejercicio que va a hacer, dice
"iniciar" para que el cronómetro empiece a contar sin tener que tocar la pantalla, y dice "parar"
cuando termina el intento. El sistema guarda automáticamente el resultado con la duración
obtenida, la fecha y el nombre del ejercicio.

**Why this priority**: Es el núcleo de la app: sin esto no hay cronómetro ni historial. Ya solo
con esto el usuario obtiene valor real (entrenar con las manos libres y quedarse con un registro
de sus tiempos).

**Independent Test**: Se puede probar por completo eligiendo un ejercicio, diciendo "iniciar",
esperando unos segundos, diciendo "parar", y verificando que queda guardado un resultado con la
duración correcta, la fecha de hoy y el nombre del ejercicio elegido.

**Acceptance Scenarios**:

1. **Given** el usuario ingresó el nombre de un ejercicio y el cronómetro está detenido en cero,
   **When** el usuario dice "iniciar", **Then** el cronómetro empieza a contar el tiempo en
   pantalla.
2. **Given** el cronómetro está corriendo, **When** el usuario dice "parar", **Then** el
   cronómetro se detiene y el sistema guarda un nuevo resultado con esa duración, la fecha actual
   y el nombre del ejercicio elegido.
3. **Given** el usuario no ingresó ningún nombre de ejercicio, **When** intenta decir "iniciar",
   **Then** el cronómetro no arranca y el sistema le indica que primero debe elegir un ejercicio.
4. **Given** el cronómetro está detenido (nunca se dijo "iniciar"), **When** el usuario dice
   "parar", **Then** no ocurre ningún cambio (no se guarda nada).

---

### User Story 2 - Ver el récord anterior antes de empezar un intento (Priority: P2)

Antes de decir "iniciar", el usuario quiere ver cuál fue su mejor tiempo anterior en ese mismo
ejercicio, para saber qué marca tiene que superar.

**Why this priority**: Agrega el valor motivacional de comparar el intento actual contra el
historial, pero depende de que ya existan resultados guardados (User Story 1). Se puede sumar en
una segunda iteración sin tocar el flujo básico de cronometrar y guardar.

**Independent Test**: Se puede probar guardando primero uno o más resultados para un ejercicio
(vía User Story 1), y luego verificando que, al volver a elegir ese mismo ejercicio antes de un
nuevo intento, se muestra en pantalla la mayor duración registrada hasta el momento para ese
ejercicio.

**Acceptance Scenarios**:

1. **Given** el usuario ya tiene resultados guardados para el ejercicio "dominadas", **When**
   vuelve a elegir "dominadas" antes de un nuevo intento, **Then** el sistema muestra el mejor
   tiempo (mayor duración) registrado hasta ahora para "dominadas".
2. **Given** el usuario elige un ejercicio del que nunca guardó un resultado, **When** se prepara
   para empezar, **Then** el sistema indica claramente que no hay récord previo (en vez de mostrar
   un tiempo vacío o incorrecto).
3. **Given** el usuario termina un intento nuevo que supera el récord anterior, **When** vuelve a
   elegir ese mismo ejercicio para un próximo intento, **Then** el récord mostrado es el del
   intento recién guardado (el más alto hasta ahora).

---

### User Story 3 - Usar botones como respaldo si la voz falla (Priority: P3)

Si el micrófono no está disponible, el navegador no reconoce bien los comandos de voz, o hay
demasiado ruido en el lugar de entrenamiento, el usuario quiere poder iniciar y detener el
cronómetro tocando la pantalla en lugar de hablar.

**Why this priority**: Es una red de seguridad que hace la app utilizable en cualquier
circunstancia, pero no bloquea el valor principal (el control por voz) si todavía no está.

**Independent Test**: Se puede probar desactivando o ignorando el reconocimiento de voz y
verificando que los mismos resultados (iniciar, detener, guardar con fecha y ejercicio, ver
récord) se logran usando únicamente botones en pantalla.

**Acceptance Scenarios**:

1. **Given** el reconocimiento de voz no está disponible o el usuario prefiere no usarlo,
   **When** toca el botón "Iniciar" en pantalla, **Then** el cronómetro arranca igual que si
   hubiera dicho "iniciar".
2. **Given** el cronómetro está corriendo por haber usado el botón o la voz, **When** el usuario
   toca el botón "Parar", **Then** el cronómetro se detiene y el resultado se guarda igual que con
   el comando de voz.

---

### Edge Cases

- Si el usuario dice "parar" sin haber dicho antes "iniciar" (cronómetro detenido), el sistema no
  hace nada: no hay nada que detener ni que guardar.
- Si el navegador no tiene permiso de micrófono o no soporta reconocimiento de voz, el usuario
  igual puede entrenar completo usando los botones manuales (User Story 3).
- Si el usuario cierra o recarga la app mientras el cronómetro está corriendo, ese intento en
  curso se pierde y no queda guardado (no hubo un "parar" que lo cerrara).
- Si el usuario intenta cambiar el nombre del ejercicio mientras el cronómetro está corriendo, el
  sistema no permite el cambio hasta que el intento actual termine (se detenga con "parar").
- Si dos intentos del mismo ejercicio quedan con exactamente la misma duración, ambos se guardan
  y esa duración es la que se muestra como récord.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir al usuario elegir el ejercicio de una lista desplegable
  antes de iniciar un intento de cronometraje. La lista debe incluir los ejercicios precargados
  Vertical, Front Lever, L-Sit y Planche, más cualquier ejercicio que el usuario haya agregado en
  usos anteriores.
- **FR-002**: El sistema DEBE impedir que el cronómetro arranque si todavía no se especificó un
  nombre de ejercicio, y avisar al usuario que debe elegirlo primero.
- **FR-003**: El sistema DEBE reconocer cualquiera de los comandos de voz "iniciar", "vamos",
  "arranca" o "empezar" para poner en marcha el cronómetro desde cero.
- **FR-004**: El sistema DEBE reconocer cualquiera de los comandos de voz "parar", "pará", "listo"
  o "basta" para detener el cronómetro mientras está corriendo.
- **FR-005**: El sistema DEBE mostrar en pantalla el tiempo transcurrido mientras el cronómetro
  está corriendo.
- **FR-006**: Cuando el cronómetro se detiene, el sistema DEBE guardar automáticamente un nuevo
  resultado con la duración obtenida, la fecha del intento y el nombre del ejercicio elegido.
- **FR-007**: Antes de que el usuario inicie un nuevo intento, el sistema DEBE mostrar el récord
  anterior (la mayor duración guardada hasta el momento) del ejercicio elegido, si existe alguno.
- **FR-008**: Si no hay ningún resultado previo guardado para el ejercicio elegido, el sistema
  DEBE indicarlo claramente en lugar de mostrar un valor vacío o confuso.
- **FR-009**: El sistema DEBE ofrecer botones en pantalla para iniciar y detener el cronómetro,
  como alternativa a los comandos de voz.
- **FR-010**: El sistema DEBE conservar los resultados guardados entre usos de la app (no se
  pierden al cerrar o recargar la página).
- **FR-011**: El sistema DEBE calcular y mostrar el récord por separado para cada ejercicio, de
  forma que nunca se mezclen los tiempos de un ejercicio con los de otro.
- **FR-012**: El sistema NO DEBE permitir cambiar el ejercicio elegido mientras el cronómetro está
  corriendo.
- **FR-013**: La lista desplegable DEBE incluir una opción para agregar un ejercicio nuevo,
  distinta de los ejercicios ya cargados. Al elegirla, el sistema DEBE mostrar un campo de texto
  para escribir el nombre del ejercicio nuevo.
- **FR-014**: Cuando el usuario inicia un intento con un nombre de ejercicio nuevo, el sistema
  DEBE guardar ese nombre para que aparezca como una opción más en la lista desplegable la
  próxima vez, además de usarlo para el intento actual.

### Key Entities

- **Ejercicio**: nombre elegido por el usuario de la lista desplegable (por ejemplo "Vertical",
  "Front Lever") que agrupa sus intentos y determina de qué récord se habla. Puede ser uno de los
  ejercicios precargados (Vertical, Front Lever, L-Sit, Planche) o uno agregado por el usuario.
- **Intento**: un registro guardado con la fecha, el ejercicio asociado y la duración obtenida en
  ese cronometraje.
- **Récord**: no es un dato que se guarda aparte, sino el intento con mayor duración entre todos
  los guardados para un mismo ejercicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede completar un ciclo entero de entrenamiento (elegir ejercicio, ver
  récord anterior, decir "iniciar", entrenar, decir "parar", ver el resultado guardado) sin tocar
  la pantalla ni pedir ayuda externa.
- **SC-002**: En condiciones normales de entrenamiento (ambiente sin ruido excesivo), los comandos
  de voz "iniciar" y "parar" son reconocidos correctamente en al menos el 9 de cada 10 intentos.
- **SC-003**: El 100% de los intentos completados (con "iniciar" y "parar" dichos correctamente)
  quedan guardados con su fecha y ejercicio, y siguen disponibles la próxima vez que se abre la
  app.
- **SC-004**: El usuario puede ver el récord anterior de un ejercicio en menos de 3 segundos desde
  que lo elige, antes de decir "iniciar".

## Assumptions

- La app es de uso personal (un solo usuario, sin necesidad de crear cuenta ni iniciar sesión).
- Los resultados se guardan en este mismo dispositivo/navegador; esta primera versión no
  necesita que los datos se vean desde otro dispositivo distinto.
- Los comandos de voz se reconocen en español ("iniciar" / "parar"); no se contemplan otros
  idiomas en esta versión.
- "Récord anterior" significa la mayor duración registrada hasta el momento para ese ejercicio,
  no simplemente el último intento realizado.
- Esta primera versión no incluye una pantalla con el historial completo de todos los intentos;
  solo se pide mostrar el récord antes de cada intento. Se puede agregar como mejora futura si se
  necesita.
