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

1. **Ejercicios fijos**, siempre presentes, cada uno con su categoría: Vertical (Equilibrio),
   Front Lever (Tirón), L-Sit (Core), Planche (Empuje).
2. **Ejercicios personalizados**, agregados por el usuario con la opción "+ Agregar nuevo
   ejercicio", junto con su categoría. Se guardan en una lista aparte (separada de los Intentos)
   para que reaparezcan la próxima vez. Ver [contracts/storage-schema.md](./contracts/storage-schema.md).

Un ejercicio personalizado se guarda en el momento en que el usuario inicia un intento con ese
nombre nuevo (no antes, mientras todavía lo está escribiendo). No se guarda si el nombre está
vacío o si ya existe (sea fijo o ya agregado antes).

### Categoría

Al agregar un ejercicio nuevo, el usuario también elige su categoría: una de las ya conocidas
(Empuje, Tirón, Equilibrio, Core) o una distinta escrita a mano con la opción "+ Otra categoría".
Es solo un dato para agrupar/mostrar junto al nombre del ejercicio (por ejemplo, en el carrusel de
selección); no afecta el cronómetro, el récord ni la voz. Si no se elige ninguna (o la escrita a
mano queda vacía), se guarda como "Sin categoría" en vez de dejarla vacía.

## Récord (valor calculado, no guardado)

Para un ejercicio dado, el récord es el `duracionMs` más alto entre todos los Intentos guardados
con ese mismo `ejercicio` (FR-007, FR-011). Si no hay ningún intento guardado todavía para ese
ejercicio, no hay récord (FR-008: se debe avisar claramente "sin récord previo", nunca mostrar 0 o
un campo vacío como si fuera un tiempo real).

## Racha (valor calculado, no guardada)

Igual que el récord, la racha no se guarda aparte: se recalcula a partir de los mismos Intentos
guardados, tomando la fecha del día (hora local, no UTC) en que se hizo cada uno.

- Un día cuenta como **activo** si hay guardado al menos un Intento con esa fecha, sin importar el
  ejercicio.
- Los **domingos** son un día libre: no cortan la racha aunque no haya ningún Intento guardado ese
  día.
- La racha es la cantidad de días, contando hacia atrás desde hoy, que son activos o domingo, sin
  cortarse. Se corta (vuelve a 0) apenas aparece un día de lunes a sábado sin ningún Intento.
- **Término medio para el día de hoy**: si hoy es un día de lunes a sábado y todavía no se guardó
  ningún Intento hoy, el número no baja a 0 todavía (no se sabe si el día va a terminar sin
  actividad o no) — se sigue mostrando la racha tal como venía hasta ayer. Recién al día
  siguiente, si ese día terminó sin ningún Intento, la racha ya se corta sola. Mientras tanto, el
  círculo de hoy avisa que está "en riesgo" (ver más abajo).

Los 7 círculos (lunes a domingo) muestran la semana actual. Esta semana en pantalla es solo
informativa: no participa del cálculo de la racha, que siempre mira hacia atrás desde hoy sin
importar en qué día de la semana se para a contar. Cada círculo puede estar en uno de estos
estados:

- **Activo**: ese día tuvo algún Intento.
- **Descanso**: fue domingo sin Intento (el día libre que no corta nada).
- **En riesgo**: es hoy, todavía no tiene ningún Intento guardado, y no es domingo — si el día
  termina así, mañana la racha se corta.
- Ninguno de los anteriores: todavía no llegó ese día de la semana, o quedó en el pasado sin
  Intento (de lunes a sábado) sin ser hoy.

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
