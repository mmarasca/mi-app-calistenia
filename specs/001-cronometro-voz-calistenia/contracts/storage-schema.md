# Contrato: Formato de los Datos Guardados

Define exactamente qué se guarda en `localStorage` y con qué forma, para que `datos.js` sea el
único lugar que lea/escriba este formato.

## Claves usadas en localStorage

```text
calistenia_intentos                    (lista de intentos guardados)
calistenia_ejercicios_personalizados   (lista de ejercicios agregados por el usuario)
```

## Forma del valor guardado en `calistenia_intentos`

Un texto JSON que representa una lista de intentos:

```json
[
  {
    "ejercicio": "dominadas",
    "fecha": "2026-08-31T14:23:05.000Z",
    "duracionMs": 42000
  },
  {
    "ejercicio": "plancha",
    "fecha": "2026-08-30T10:05:00.000Z",
    "duracionMs": 65500
  }
]
```

- `ejercicio`: texto, tal como lo escribió/eligió el usuario (recortado, sin espacios extra).
- `fecha`: texto en formato ISO 8601 (lo que produce `new Date().toISOString()` en JavaScript).
- `duracionMs`: número entero de milisegundos, siempre mayor a 0.

## Forma del valor guardado en `calistenia_ejercicios_personalizados`

Un texto JSON que representa una lista de nombres, en el orden en que se agregaron:

```json
["Muscle Up", "Bandera"]
```

Esta lista NO incluye los ejercicios fijos (Vertical, Front Lever, L-Sit, Planche): esos siempre
están precargados en la app y no se guardan acá.

## Reglas de lectura/escritura

- Si `calistenia_intentos` o `calistenia_ejercicios_personalizados` no existen todavía (primer uso
  de la app), se tratan como una lista vacía `[]`, nunca como un error.
- Cada vez que se guarda un nuevo intento, se lee la lista completa, se le agrega el nuevo
  registro al final, y se vuelve a guardar la lista completa (no hay edición ni borrado de
  intentos existentes en este MVP).
- El récord de un ejercicio se calcula filtrando la lista por `ejercicio` (comparación exacta de
  texto) y tomando el mayor `duracionMs` entre los resultados.

## Compatibilidad a futuro

Si más adelante se agrega una función nueva (por ejemplo, un historial completo o borrar un
intento), debe poder construirse leyendo esta misma lista, sin necesidad de cambiar el formato ya
guardado. Si en el futuro sí hiciera falta cambiar la forma de los datos, esa decisión se explica
y se documenta como una nueva versión de este contrato, no se pisa en silencio.
