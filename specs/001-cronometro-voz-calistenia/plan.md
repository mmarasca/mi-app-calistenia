# Implementation Plan: Cronómetro por Voz para Calistenia

**Branch**: `001-cronometro-voz-calistenia` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cronometro-voz-calistenia/spec.md`

## Summary

App web de una sola pantalla para entrenar calistenia con las manos libres: el usuario elige el
ejercicio, ve su récord anterior, dice "iniciar"/"parar" (o toca botones equivalentes) para
cronometrar el intento, y el resultado queda guardado automáticamente con fecha y ejercicio. Todo
corre en el navegador, sin servidor ni base de datos propia: HTML + CSS + JavaScript estándar,
reconocimiento de voz con la Web Speech API del navegador, y los resultados guardados en
localStorage (en el propio dispositivo).

## Technical Context

**Language/Version**: JavaScript estándar de navegador (ES2020+), sin transpilar ni compilar; HTML5 y CSS3.

**Primary Dependencies**: Ninguna librería externa. Se usa solo la Web Speech API (reconocimiento
de voz) y `localStorage`, ambas ya incluidas en navegadores modernos — no hay `npm install` ni
paso de build.

**Storage**: `localStorage` del navegador (los intentos guardados quedan en formato JSON, en el
propio dispositivo del usuario).

**Testing**: Validación manual guiada por `quickstart.md`, siguiendo los escenarios de aceptación
de la spec. No se suma un framework de pruebas automatizadas en este MVP: agregaría herramientas
(Node, un test runner) que no son necesarias para el tamaño y el objetivo de esta app.

**Target Platform**: Navegador de escritorio o Android con soporte de Web Speech API (recomendado
Google Chrome o Microsoft Edge). El reconocimiento de voz puede no estar disponible en Safari/iOS
por soporte limitado del navegador; los botones manuales (User Story 3) cubren ese caso.

**Project Type**: Aplicación web de un solo frontend, sin servidor/backend propio.

**Performance Goals**: El cronómetro en pantalla se actualiza de forma fluida (cada ~200ms es
suficiente para que se vea corriendo); el comando de voz debe reflejarse en el cronómetro en menos
de 2 segundos desde que el usuario termina de hablar.

**Constraints**: El reconocimiento de voz requiere conexión a internet (el navegador envía el
audio a un servicio externo para interpretarlo). El resto de la app (cronómetro, guardado, ver
récord) funciona sin conexión una vez que la página cargó. Los datos guardados son locales a ese
navegador/dispositivo; no hay sincronización entre dispositivos en este MVP.

**Scale/Scope**: Uso personal de una sola persona; a lo sumo decenas de ejercicios distintos y
cientos de intentos guardados con el tiempo — un volumen trivial para `localStorage` (cuyo límite
típico es de varios MB).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidad Ante Todo** — PASS. Sin frameworks, sin build, sin librerías externas; 5
  archivos chicos, cada uno con una sola responsabilidad, comentados en español simple.
- **II. Explicación Previa en Lenguaje No Técnico** — PASS. Las decisiones técnicas de este plan
  (sin backend, localStorage, Web Speech API, sin framework de testing) fueron explicadas en
  lenguaje no técnico al usuario antes de generar este documento.
- **III. MVP Mínimo por Iteración** — PASS. El plan cubre exactamente las 3 user stories de la
  spec (cronometrar y guardar, ver récord, botones de respaldo), sin agregar pantallas ni
  funciones no pedidas (por ejemplo, no se incluye un historial completo ni edición/borrado de
  intentos).
- **Estándares de Simplicidad Técnica** — PASS. Tecnología estándar y ampliamente documentada
  (HTML/CSS/JS + APIs nativas del navegador); nombres de archivos y de código en español, un solo
  idioma elegido y mantenido; ninguna dependencia externa que justificar.

No hay violaciones que registrar en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-cronometro-voz-calistenia/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones técnicas y por qué se eligieron
├── data-model.md        # Fase 1: qué datos se guardan y cómo
├── quickstart.md        # Fase 1: cómo correr y probar la app a mano
├── contracts/           # Fase 1: comandos de voz y forma de los datos guardados
│   ├── voice-commands.md
│   └── storage-schema.md
└── tasks.md             # Fase 2 (comando /speckit-tasks, todavía no generado)
```

### Source Code (repository root)

```text
mi-app-calistenia/
├── index.html        # La página: dónde elegís el ejercicio, ves el récord y el cronómetro
├── estilos.css        # Cómo se ve (colores, tamaños, orden visual)
├── cronometro.js       # Lleva la cuenta del tiempo: iniciar, parar, mostrar los segundos
├── voz.js              # Escucha el micrófono y detecta "iniciar" / "parar"
└── datos.js            # Guarda y lee los intentos en localStorage, y calcula el récord
```

**Structure Decision**: Un solo proyecto de frontend, sin carpetas (`src/`, `backend/`, etc.): 5
archivos planos en la raíz, cada uno explicable en una frase. No hace falta más estructura para
una app de una sola pantalla y sin servidor.

## Complexity Tracking

*No aplica — el Constitution Check no encontró violaciones que justificar.*
