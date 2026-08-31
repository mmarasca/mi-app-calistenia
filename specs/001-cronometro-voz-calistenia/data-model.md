# Data Model: Cronómetro por Voz para Calistenia

Solo existe un tipo de dato que se guarda de verdad: el **Intento**. El "Ejercicio" es simplemente
el nombre que agrupa intentos, y el "Récord" no se guarda aparte: se calcula al vuelo a partir de
los intentos guardados.

## Intento

Representa un cronometraje ya terminado (se creó en el momento en que el usuario dijo/tocó
"parar").

| Campo        | Tipo                     | Descripción                                                                 |
|--------------|--------------------------|------------------------------------------------------------------------------|
| `ejercicio`  | texto                    | Nombre del ejercicio elegido antes de iniciar (ej. "dominadas").              |
| `fecha`      | texto (fecha/hora ISO)   | Momento en que terminó el intento (se genera solo, el usuario no la escribe). |
| `duracionMs` | número entero            | Duración del intento en milisegundos, medida entre "iniciar" y "parar".      |

**Reglas de validación**:

- `ejercicio` no puede estar vacío ni ser solo espacios (FR-001, FR-002). Se guarda "recortado"
  (sin espacios al principio/final) para que "dominadas" y "dominadas " cuenten como el mismo
  ejercicio.
- `duracionMs` debe ser mayor a 0. Si por algún motivo el cronómetro se detiene en 0, no se guarda
  ningún intento (no aporta información).
- `fecha` la genera el sistema en el momento de guardar; el usuario nunca la edita a mano.

**Cómo se guardan**: todos los intentos viven en una sola lista (array), guardada en
`localStorage` bajo una única clave. Ver [contracts/storage-schema.md](./contracts/storage-schema.md)
para el formato exacto en JSON.

## Ejercicio

El nombre del ejercicio se elige de una lista desplegable, formada por:

1. **Ejercicios fijos**, siempre presentes: Vertical, Front Lever, L-Sit, Planche.
2. **Ejercicios personalizados**, agregados por el usuario con la opción "+ Agregar nuevo
   ejercicio". Se guardan en una lista aparte (separada de los Intentos) para que reaparezcan la
   próxima vez. Ver [contracts/storage-schema.md](./contracts/storage-schema.md).

Un ejercicio personalizado se guarda en el momento en que el usuario inicia un intento con ese
nombre nuevo (no antes, mientras todavía lo está escribiendo). No se guarda si el nombre está
vacío o si ya existe (sea fijo o ya agregado antes).

## Récord (valor calculado, no guardado)

Para un ejercicio dado, el récord es el `duracionMs` más alto entre todos los Intentos guardados
con ese mismo `ejercicio` (FR-007, FR-011). Si no hay ningún intento guardado todavía para ese
ejercicio, no hay récord (FR-008: se debe avisar claramente "sin récord previo", nunca mostrar 0 o
un campo vacío como si fuera un tiempo real).

## Estados del cronómetro (máquina de estados simple)

El cronómetro en pantalla solo tiene dos estados posibles:

- **Detenido**: estado inicial y estado después de guardar un intento.
  - Con `ejercicio` vacío → decir/tocar "iniciar" no hace nada (FR-002).
  - Con `ejercicio` elegido → decir/tocar "iniciar" pasa a **Corriendo** y arranca a contar desde
    cero.
  - Decir/tocar "parar" estando **Detenido** → no hace nada (edge case de la spec).
- **Corriendo**: el cronómetro está contando tiempo.
  - Decir/tocar "parar" → se calcula `duracionMs`, se crea y guarda un nuevo Intento, y se vuelve
    a **Detenido**.
  - Intentar cambiar el `ejercicio` mientras está en este estado → se ignora el cambio (FR-012);
    el ejercicio queda fijo hasta volver a **Detenido**.
