# Aplicación de ISO/IEC 29119 — SGD-FD

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Propósito

Contrastar el proceso de pruebas del SGD-FD con el modelo de proceso de
software de la norma **ISO/IEC 29119-2** y con los tipos de prueba de
**ISO/IEC 29119-3**, indicando qué partes se aplican, cuáles se aplican de
forma parcial y cuáles no se aplican por no ser aplicables al proyecto.

> **Alcance de la afirmación:** se trata de una **concordancia por inspección**,
> no de una certificación. La norma no certifica sistemas de forma automática:
> exige un proceso de evaluación externo que este proyecto no ha underwent.

---

## 2. Referencia Normativa Aplicada

| Parte | Título | Aplicabilidad |
|-------|--------|:--------------:|
| ISO/IEC 29119-1 | Conceptos y vocabulario | Referencia |
| ISO/IEC 29119-2 | Proceso de prueba | **Aplicada** |
| ISO/IEC 29119-3 | Tipos de prueba y diseño de casos | **Aplicada** |
| ISO/IEC 29119-4 | Técnicas y métricas de prueba | **Aplicada parcialmente** |
| ISO/IEC 29119-5 | Selección y control de productos de prueba | **Aplicada parcialmente** |
| ISO/IEC 29119-6 | Informes de prueba | **Aplicada parcialmente** |
| ISO/IEC 29119-7 | Auditoría de pruebas | No aplicada |
| ISO/IEC 29119-8 | Confirmación de pruebas | No aplicada |
| ISO/IEC 29119-9 | Guías para dominios específicos | No aplicada |
| ISO/IEC 29119-10 | Pruebas de sistemas de información específicos | No aplicada |
| ISO/IEC 29119-11 | Guías para pruebas de móvil | No aplicable |
| ISO/IEC 29119-12 | Pruebas de servicios en la nube | **Referencia** |

---

## 3. Proceso de Prueba (ISO/IEC 29119-2)

### 3.1 Modelo de proceso genérico de la norma

```
 Contexto del proyecto de prueba
   |
   v
 Planificacion  -->  Monitorizacion  -->  Control  -->  Cierre
   |                                       ^               |
   |                                       |               v
   +--------------- Registro y reporte ---+          Informe final
   |
   v
 Ejecucion  -->  Configuracion  -->  Instalacion  -->  Evaluacion de salida
```

### 3.2 Correspondencia con el SGD-FD

| Actividad de la norma | Aplicación en el SGD-FD | Evidencia | Estado |
|-----------------------|------------------------|-----------|:------:|
| 4.3 Contexto del proyecto de prueba | Definición del alcance, riesgos y criterios de entrada | [`plan_de_pruebas.md`](plan_de_pruebas.md) | **Aplicada** |
| 4.4 Planificacion de pruebas | Estrategia por capas, entorno, datos, recursos | [`plan_de_pruebas.md`](plan_de_pruebas.md) | **Aplicada** |
| 5.2 Monitorizacion y control | Seguimiento de ejecución de suites | `pnpm test` | **Aplicada** |
| 5.5 Configuracion | Preparación de base de datos y datos de prueba | `tests/bootstrap.ts`, `tests/db.ts` | **Aplicada** |
| 5.6 Instalacion | Despliegue del build de prueba | `backend/dist/` | **Aplicada** |
| 5.7 Ejecucion | Ejecución de las 120 pruebas | Salida de Vitest | **Aplicada** |
| 5.8 Cierre | Evaluación de resultados y decisión de salida | Este documento y `validacion_experimental.md` | **Aplicada** |
| Registro y reporte | Registro de fallos y resultados | Salida de consola y reporte de Vitest | **Aplicada parcialmente** |
| Informes de prueba (29119-6) | Este documento y `validacion_experimental.md` | — | **Aplicada** |

### 3.3 Criterios de Entrada y Salida

**Entrada**

| Criterio | Verificado |
|----------|-----------|
| Requerimientos aprobados y trazados | 27 RF + 44 RNF en la matriz |
| Ambiente de pruebas disponible | SQLite en memoria, sin dependencia externa |
| Datos de prueba preparados | Generador de archivos de prueba en `tests/` |
| Casos de prueba definidos | 120 casos identificados en `matriz_pruebas.md` |

**Salida**

| Criterio | Resultado |
|----------|-----------|
| Todas las pruebas ejecutadas | 120/120 |
| Ninguna prueba fallida | 0 fallos |
| Defectos registrados y clasificados | 3 detectados y corregidos, 1 latente |
| Informe de pruebas emitido | `validacion_experimental.md` |

---

## 4. Tipos de Prueba (ISO/IEC 29119-3)

### 4.1 Clasificación aplicada

| Tipo de prueba (29119-3) | Dónde está en el SGD-FD | Pruebas |
|--------------------------|-------------------------|:-------:|
| Pruebas unitarias | `backend/tests/unit/` | 37 |
| Pruebas de integración | `backend/tests/services/` | 23 |
| Pruebas de sistema | `backend/tests/integration/` | 33 |
| Pruebas de aceptación | `backend/tests/integration/scenarios.test.ts` | 5 |
| Pruebas de regresión | Toda la suite (se ejecuta completa en cada ciclo) | 120 |
| Pruebas de rendimiento | **No realizadas** | 0 |
| Pruebas de seguridad | Parciales: control de acceso, tokens, límite de intentos | 16 |
| Pruebas de usabilidad | **No realizadas** | 0 |
| Pruebas de recuperación y continuidad | **No realizadas** | 0 |

### 4.2 Diseño de casos de prueba (29119-3.5)

La norma define técnicas de diseño de casos. El SGD-FD aplicó las siguientes:

| Técnica | Aplicación en el SGD-FD | Ejemplo |
|---------|------------------------|---------|
| Equivalencia de particiones | Separación entre peticiones válidas y con credenciales ausentes | `rechaza peticiones sin cabecera Authorization` |
| Análisis de valores límite | Límite de 5 intentos de inicio de sesión, de 10 MB por archivo | `rechaza con 429 una vez superado el límite` |
| Tablas de decisión | Condiciones de una versión válida | `changeDescription` presente + contraseña correcta + contenido distinto → crear versión |
| Transición de estados | Estados de una propuesta: `PENDING` → `ACCEPTED` / `REJECTED` | `gestiona propuestas: crear, rechazar y aceptar` |
| Uso de casos | Derivation desde los 24 casos de uso | `escenarios.test.ts` |
| Enumeración de particiones | Comportamiento ante cada tipo MIME no permitido | `rechaza tipos de archivo no permitidos` |
| Prueba de pairwise | Combinaciones de rol y propiedad de documento | Solo administrador vs bitácora |

---

## 5. Técnicas y Métricas (ISO/IEC 29119-4)

| Elemento | Aplicación | Estado |
|----------|------------|:------:|
| Técnicas de prueba de caja negra | Sí, predominantes | **Aplicada** |
| Técnicas de prueba de caja blanca | No se diseñaron desde el flujo de código | **No aplicada** |
| Análisis de tasa deucces de detección de defectos (DDE) | 3 defectos detectados / 3 escapados = 1,00 | **Aplicada** |
| Tasa de cobertura de requisitos | 100 % | **Aplicada** |
| Métricas de tamaño (número de casos) | 120 | **Aplicada** |
| Estimaciones de esfuerzo | No realizadas | **No aplicada** |

---

## 6. Selección y Control de Productos de Prueba (29119-5)

| Actividad | Aplicación en el SGD-FD | Estado |
|-----------|-------------------------|:------:|
| Especificación de herramientas de prueba | Vitest 3 y Supertest 7 | **Aplicada** |
| Configuraciones de prueba reproducibles | `pnpm test` en backend y frontend | **Aplicada** |
| Datos de prueba controlados | Base de datos en memoria con estado limpio por prueba | **Aplicada** |
| Procedimientos de prueba documentados | Cada prueba nombra comportamiento, entrada y resultado | **Aplicada** |
| Informe de incidencias | Registro en salida de Vitest | **Aplicada parcialmente** |

### 6.1 Control de configuración de las pruebas

Un elemento esencial de esta parte es que las pruebas sean **reproducibles por
cualquiera**. En el SGD-FD esto se cumple:

```bash
cd backend
pnpm install
pnpm test          # 98 pruebas, resultado idéntico en cualquier máquina
```

No hay dependencia de servicios externos, ni de orden de ejecución, ni de
estado residual: cada prueba parte de una base de datos limpia.

---

## 7. Informes de Prueba (ISO/IEC 29119-6)

### 7.1 Contenido exigido por la norma

| Elemento del informe (29119-6) | Dónde se encuentra |
|--------------------------------|--------------------|
| Identificación del proyecto de prueba | Encabezado de `plan_de_pruebas.md` |
| Criterios de entrada y salida | Sección 3.3 de este documento |
| Informe de ejecución | Salida de `pnpm test` |
| Resumen de incidencias | `validacion_experimental.md`, sección 12 |
| Evaluación del cumplimiento | `metricas_calidad.md` |
| Evaluación de la calidad del producto | `validacion_experimental.md` |

### 7.2 Resumen del informe de ejecución

| Elemento | Valor |
|----------|-------|
| Pruebas planificadas | 120 |
| Pruebas ejecutadas | 120 |
| Pruebas superadas | 120 |
| Pruebas fallidas | 0 |
| Pruebas omitidas | 0 |
| Cobertura de requisitos | 100 % |
| Defectos abiertos | 1 (latente, documentado) |

---

## 8. Resumen de Correspondencia

| Parte de ISO/IEC 29119 | Dimensión | Estado |
|------------------------|-----------|:------:|
| 29119-1 Conceptos y vocabulario | Vocabulario común | **Aplicada** |
| 29119-2 Proceso de prueba | Proceso | **Aplicada** |
| 29119-3 Tipos de prueba | Componente | **Aplicada** |
| 29119-4 Técnicas y métricas | Soporte | **Aplicada parcialmente** |
| 29119-5 Productos de prueba | Soporte | **Aplicada parcialmente** |
| 29119-6 Informes de prueba | Entregable | **Aplicada parcialmente** |
| 29119-7 Auditoría de pruebas | No aplicable a un proyecto individual | No aplicada |
| 29119-8 Confirmación de pruebas | Requiere proveedor independiente | No aplicada |
| 29119-9 a 29119-11 Dominios específicos | Fuera del alcance | No aplicada |
| 29119-12 Pruebas en la nube | Arquitectura aún no desplegada | **Referencia** |

---

## 9. Brechas respecto a la Norma

| # | Brecha | Causa | Impacto |
|---|--------|-------|---------|
| B-1 | No hay pruebas de caja blanca | Se priorizó la cobertura funcional | La cobertura de caminos internos no se conoce |
| B-2 | No hay pruebas de rendimiento | Fuera del alcance definido | No se puede afirmar capacidad de carga |
| B-3 | No hay pruebas de usabilidad | No se disponían usuarios de prueba | No se puede afirmar facilidad de uso |
| B-4 | No hay auditoría ni confirmación externa (29119-7, 29119-8) | Requiere un tercero independiente | No hay certificación |
| B-5 | No hay gestión formal de incidencias | Los defectos se corrigen directamente | No hay trazabilidad de ciclo de vida de defectos |
| B-6 | No hay informes de prueba por ciclo separados | Se emite un informe consolidado | Se pierde visibilidad de la evolución temporal |

---

## 10. Conclusiones

El proceso de pruebas del SGD-FD concuerda **sustantivamente** con ISO/IEC
29119 en sus aspectos más relevantes: hay contexto definido, planificación,
criterios de entrada y salida, ejecución controlada, cierre documentado y
técnicas de diseño de casos recognized (equivalencia de particiones, valores
límite, tablas de decisión y transiciones de estados).

Las brechas identificadas son **reconocibles y explicadas**, no ocultas. Las más
relevantes —falta de pruebas de caja blanca, de rendimiento y de usabilidad—
corresponden a decisiones de alcance, no a desconocimiento de la norma.

El SGD-FD **no puede considerarse certificado** bajo ISO/IEC 29119: la
certificación requiere auditoría y confirmación independientes, partes 7 y 8 de
la norma, que no se han aplicado.

---

## 11. Referencias Cruzadas

- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`enfoque_tdd.md`](enfoque_tdd.md) — Enfoque TDD
- [`enfoque_bdd.md`](enfoque_bdd.md) — Enfoque BDD
- [`validacion_experimental.md`](validacion_experimental.md) — Validación experimental
- [`metricas_calidad.md`](metricas_calidad.md) — Métricas de calidad
- [`../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md`](../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md) — Metodología de pruebas
