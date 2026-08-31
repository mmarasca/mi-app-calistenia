<!--
Sync Impact Report
- Version change: (sin versión previa / plantilla sin rellenar) → 1.0.0
- Ratificación inicial de la constitución del proyecto.
- Principios añadidos:
  1. Simplicidad Ante Todo
  2. Explicación Previa en Lenguaje No Técnico (NON-NEGOTIABLE)
  3. MVP Mínimo por Iteración
- Secciones añadidas: Estándares de Simplicidad Técnica; Flujo de Trabajo de Desarrollo; Governance
- Plantillas dependientes: no se modifican en este comando (se leen en tiempo de ejecución).
  Pendiente de revisión manual en una próxima pasada: .specify/templates/plan-template.md,
  .specify/templates/spec-template.md, .specify/templates/tasks-template.md para confirmar que
  no contradicen estos principios (ninguna contradicción detectada al redactar esta versión).
- TODOs diferidos: ninguno.
-->

# Mi App Calistenia Constitution

## Core Principles

### I. Simplicidad Ante Todo
El código DEBE ser simple, legible y estar bien explicado, incluso cuando exista una solución
más "elegante" o sofisticada disponible. Ante dos formas de resolver algo, se elige siempre la
que un desarrollador sin experiencia previa en programación pueda leer, entender y modificar por
sí mismo. Está prohibido introducir abstracciones genéricas, patrones de diseño avanzados,
librerías o herramientas adicionales cuando una solución directa y básica resuelve el mismo
problema. Todo archivo o función no trivial DEBE incluir comentarios en lenguaje simple que
expliquen qué hace y, cuando no sea obvio, por qué se hizo así.
Rationale: el dueño del proyecto no tiene formación en programación; su capacidad de mantener,
depurar y hacer crecer la aplicación depende de que el código nunca supere lo que puede entender
leyéndolo con calma.

### II. Explicación Previa en Lenguaje No Técnico (NON-NEGOTIABLE)
Antes de implementar cualquier decisión técnica relevante (elegir una librería, definir una
estructura de datos, un modelo de base de datos, una arquitectura, o cambiar algo ya construido),
se DEBE explicar primero en lenguaje no técnico: qué se va a hacer, por qué es necesario, y qué
alternativas más simples se consideraron y por qué se descartaron. La implementación NO empieza
hasta que esa explicación fue entregada y el usuario tuvo oportunidad de entenderla y aprobarla.
No se asume consentimiento implícito en decisiones que agregan complejidad nueva al proyecto.
Rationale: sin esta explicación previa, el usuario pierde control real sobre su propio proyecto y
no puede aprender ni tomar decisiones informadas sobre su propia aplicación.

### III. MVP Mínimo por Iteración
Cada iteración (feature, spec o tarea) DEBE definir explícitamente el subconjunto más pequeño de
funcionalidad que aporte valor real y sea verificable, y DEBE excluir todo lo que no sea
indispensable para esa entrega. Se prohíbe agregar funcionalidad "por si acaso", generalizar
para casos futuros hipotéticos, o construir infraestructura que el MVP actual no necesita
(principio YAGNI). Cada iteración nueva se construye sobre la base mínima ya validada de la
anterior, nunca se planifican varias iteraciones grandes de una sola vez.
Rationale: mantener cada entrega pequeña reduce el riesgo de errores, limita cuánto código nuevo
hay que entender de una vez, y permite validar que la app funciona antes de sumar más complejidad.

## Estándares de Simplicidad Técnica

Se DEBE preferir siempre tecnología ampliamente documentada, popular y con buenos tutoriales en
español o inglés simple, por sobre alternativas técnicamente superiores pero más difíciles de
aprender o depurar sin experiencia previa. Se evitan microservicios, arquitecturas en capas
excesivas, inyección de dependencias compleja, o cualquier estructura de carpetas/módulos que no
se pueda explicar en una frase. Los nombres de variables, funciones y archivos DEBEN ser
descriptivos y consistentes en todo el proyecto (un único idioma para nombres de código, español
o inglés, elegido una vez y mantenido). Toda dependencia externa nueva (librería, framework,
servicio) DEBE justificarse explicando qué problema resuelve y por qué no alcanza con código
propio simple.

## Flujo de Trabajo de Desarrollo

Antes de planificar tareas de una feature (`/speckit-plan`, `/speckit-tasks`), se DEBE declarar
explícitamente cuál es el alcance mínimo de MVP de esa iteración y qué queda fuera a propósito.
Toda decisión técnica no trivial identificada durante specify, clarify o plan DEBE pasar primero
por la explicación no técnica del Principio II antes de pasar a tareas de implementación. Al
cerrar una iteración, se revisa si se introdujo complejidad no justificada (nuevas dependencias,
abstracciones, capas) y, si la hay, se simplifica o se documenta la justificación explícita antes
de continuar con la siguiente iteración.

## Governance

Esta constitución prevalece sobre preferencias técnicas individuales, plantillas por defecto de
herramientas, o costumbres de "buenas prácticas" generales cuando entren en conflicto con la
simplicidad exigida aquí. Toda propuesta que agregue complejidad (nueva dependencia, patrón
avanzado, capa de abstracción, generalización anticipada) DEBE justificarse explícitamente contra
los Principios I y III en el documento de plan o spec correspondiente; si no puede justificarse,
se rechaza o se reemplaza por la alternativa más simple. Las enmiendas a esta constitución
requieren: documentar el cambio y su razón, actualizar la versión siguiendo versionado semántico
(MAJOR: eliminación o redefinición incompatible de un principio; MINOR: principio o sección nueva,
o expansión material de guía existente; PATCH: aclaraciones y correcciones de redacción), y
actualizar la fecha de última enmienda. Cada spec, plan y revisión de tareas DEBE verificar
cumplimiento de estos principios antes de avanzar a la siguiente etapa.

**Version**: 1.0.0 | **Ratified**: 2026-08-31 | **Last Amended**: 2026-08-31
