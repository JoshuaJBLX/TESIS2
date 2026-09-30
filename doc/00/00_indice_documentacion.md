# Índice de Documentación — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Documentos indexados:** 62
**Extensión total:** 20 366 líneas · 981 KB

---

## 0. Tabla de Contenido

1. [Convenciones del repositorio](#1-convenciones-del-repositorio)
2. [Organización por fases del ciclo de vida](#2-organización-por-fases-del-ciclo-de-vida)
3. [Cobertura por norma o estándar](#3-cobertura-por-norma-o-estándar)
4. [Inventario completo de documentos](#4-inventario-completo-de-documentos)
5. [Orden de lectura sugerido](#5-orden-de-lectura-sugerido)
6. [Estadísticas globales](#6-estadísticas-globales)
7. [Estado de verificación](#7-estado-de-verificación)

---

## 1. Convenciones del Repositorio

### 1.1. Esquema de Identificadores

| Prefijo | Elemento | Formato | Documento que lo define |
|---------|----------|---------|-------------------------|
| `RF` | Requerimiento funcional | `RF-###` | [`requerimientos.md`](../01_planificacion_requerimientos/requerimientos/requerimientos.md) |
| `RNF` | Requerimiento no funcional | `RNF-###` | [`requerimientos.md`](../01_planificacion_requerimientos/requerimientos/requerimientos.md) |
| `FUNC` | Funcionalidad | `FUNC-###` | [`funcionalidades.md`](../01_planificacion_requerimientos/requerimientos/funcionalidades.md) |
| `US` | Historia de usuario | `US-###` | [`historias_usuario.md`](../01_planificacion_requerimientos/requerimientos/historias_usuario.md) |
| `CU` | Caso de uso | `CU-###` | [`casos_uso.md`](../01_planificacion_requerimientos/requerimientos/casos_uso.md) |
| `PROC` | Proceso de negocio | `AS-IS-NN` / `TO-BE-NN` | [`procesos_empresa/`](../02_diseno_construccion/procesos_empresa/) |
| `ART` | Referencia bibliográfica | `ART-NN` | [`sustentacion_articulos.md`](../01_planificacion_requerimientos/articulos_sustentacion/sustentacion_articulos.md) |
| `NORM` | Norma aplicable | `NORM-NN` | [`sustentacion_articulos.md`](../01_planificacion_requerimientos/articulos_sustentacion/sustentacion_articulos.md) |

### 1.2. Vocabulario

| Elemento | Cantidad |
|----------|:--------:|
| Requerimientos funcionales | 27 |
| Requerimientos no funcionales | 44 |
| Casos de uso | 24 (`CU-001` a `CU-024`) |
| Historias de usuario | 33 |
| Procesos AS-IS | 5 |
| Procesos TO-BE | 5 |
| Rutas HTTP | 25 |
| Tipos de evento de auditoría | 9 |
| Estados de verificación | 5 |
| Dependencias externas | 32 |

### 1.3. Reglas de Estructura de Documento

| Regla | Aplicación |
|-------|------------|
| Idioma | Español, sin excepciones |
| Codificación | UTF-8 sin BOM |
| Encabezados | Jerarquía de `#` a `####`, sin saltar niveles |
| Enlaces | Solo relativos; nunca rutas absolutas ni vínculos rotos |
| Diagramas | Notación PlantUML en bloques ```` ```plantuml ```` |
| Placeholders | Prohibidos: `[AREA]`, `[ACCIÓN 1]`, `[TÍTULO]`, etc. |
| Nomenclatura | `snake_case.md`, minúsculas, sin espacios ni tildes |

---

## 2. Organización por Fases del Ciclo de Vida

### 2.0. `00/` — Portada e Índice General

| Documento | Aporta |
|-----------|--------|
| [`00_indice_documentacion.md`](00_indice_documentacion.md) | Este índice: convenciones, inventario, orden de lectura, estadísticas y estado de verificación |
| [`01_readme.md`](01_readme.md) | Portada del proyecto: problema, solución, stack, estructura y guía rápida |
| [`02_planificacion.md`](02_planificacion.md) | Planificación exhaustiva: fases, cronograma, riesgos, roles y presupuesto |
| [`03_funcionalidades.md`](03_funcionalidades.md) | Funcionalidades descritas con cuadros de doble entrada, precondiciones y postcondiciones |
| [`04_analisis_detallado.md`](04_analisis_detallado.md) | Análisis funcional y de diseño: casos de uso, RF/RNF, arquitectura y base de datos |
| [`05_instalacion.md`](05_instalacion.md) | Guía de instalación desde cero: requisitos, dependencias, `.env`, base de datos y solución de problemas |
| [`06_ejecucion.md`](06_ejecucion.md) | Acceso rápido para poner el sistema en marcha y ejecutar las pruebas |
| [`07_progreso.md`](07_progreso.md) | Bitácora de progreso v1 (conservada como registro histórico) |
| [`08_progreso_2_0.md`](08_progreso_2_0.md) | Bitácora de progreso v2: estado verificado, correcciones aplicadas y trabajo pendiente |

### 2.1. Fase 1 — Planificación y Requerimientos

Objetivo: establecer **qué** debe hacer el sistema y con qué restricciones.

| Subcarpeta | Documentos | Aporta |
|------------|-----------|--------|
| `requerimientos/` | 4 | 27 RF, 44 RNF, 24 CU, 33 US |
| `estado_del_arte/` | 1 | Análisis de alternativas y muestra la brecha que justifica el proyecto |
| `metodologia/` | 3 | Marco metodológico, uso de IA y estrategia de pruebas |
| `articulos_sustentacion/` | 1 | Sustento bibliográfico y normativo |
| `iso_aplicada/` | 1 | Aplicación de ISO/IEC 25010 y 25019 |

### 2.2. Fase 2 — Diseño y Construcción

Objetivo: decidir **cómo** se construirá y demostrar que funciona.

| Subcarpeta | Documentos | Aporta |
|------------|-----------|--------|
| `arquitectura/` | 3 | Arquitectura, análisis técnico y modelo de datos |
| `pruebas_calidad/` | 8 | Plan, matrices, TDD, BDD, validación, métricas e ISO/IEC 29119 |
| `procesos_empresa/as_is/` | 6 | Mapa y detalle de los 5 procesos actuales |
| `procesos_empresa/to_be/` | 6 | Mapa y detalle de los 5 procesos objetivos |

### 2.3. Fase 3 — Desarrollo y Codificación

| Documento | Aporta |
|-----------|--------|
| [`desarrollo_codificacion.md`](../03_desarrollo_codificacion/desarrollo_codificacion.md) | Convenciones, estructura del código, criptografía y capas |

### 2.4. Fase 4 — Implementación y Despliegue

| Documento | Aporta |
|-----------|--------|
| [`implementacion_despliegue.md`](../04_implementacion_despliegue/implementacion_despliegue.md) | Puesta en marcha local verificada y procedimiento de despliegue |
| [`plan_nube_vercel_supabase.md`](../04_implementacion_despliegue/plan_nube_vercel_supabase.md) | Plan de nube **no ejecutado**, con sus bloqueos explícitos |

### 2.5. Fase 5 — Mantenimiento y Evaluación

Objetivo: sostener el sistema en el tiempo y medir qué se logró.

| Subcarpeta | Documentos | Aporta |
|------------|-----------|--------|
| raíz | `evaluacion.md` | Evaluaciñn del proyecto: objetivos, calidad, riesgos y lecciones |
| `seguridad/` | 1 | Controles implementados, riesgos abiertos y respuesta a incidentes |
| `operacion/` | 4 | Manual de usuario, guía técnica, despliegue y hoja de ruta |
| `referencia/` | 1 | Glosario de acrónimos y términos |
| `iso_aplicada/` | 1 | Aplicación de ISO/IEC 27001:2022 |

### 2.6. Fase 6 — Diagramas y Software

| Documento | Tipo | Aporta |
|-----------|------|--------|
| [`diagrama_clases.md`](../06_diagramas_y_software/diagrama_clases.md) | Estructural | Entidades y relaciones |
| [`diagrama_paquetes.md`](../06_diagramas_y_software/diagrama_paquetes.md) | Estructural | Organización de paquetes |
| [`diagrama_componentes.md`](../06_diagramas_y_software/diagrama_componentes.md) | Estructural | Componentes e interfaces |
| [`diagrama_despliegue.md`](../06_diagramas_y_software/diagrama_despliegue.md) | Estructural | Nodos y medios de ejecucionón |
| [`diagrama_casos_uso.md`](../06_diagramas_y_software/diagrama_casos_uso.md) | Comportamiento | 24 casos de uso por actor |
| [`diagrama_actividades.md`](../06_diagramas_y_software/diagrama_actividades.md) | Comportamiento | Flujos de trabajo |
| [`diagrama_secuencia.md`](../06_diagramas_y_software/diagrama_secuencia.md) | Comportamiento | Interacciones temporales |
| [`diagrama_estados.md`](../06_diagramas_y_software/diagrama_estados.md) | Comportamiento | 6 máquinas de estado |
| [`software_utilizado.md`](../06_diagramas_y_software/software_utilizado.md) | Inventario | 32 dependencias, licencias y riesgos |

---

## 3. Cobertura por Norma o Estándar

| Norma | Documento de aplicación | Alcance real |
|-------|------------------------|--------------|
| **ISO/IEC 25010** (calidad de producto) | [`aplicacion_iso_25000.md`](../01_planificacion_requerimientos/iso_aplicada/aplicacion_iso_25000.md) | Las 8 características; eficiencia y portabilidad **no medidas** |
| **ISO/IEC 25019** (medición) | Mismo documento | Métricas reales: 100 % de pruebas, 100 % de trazabilidad, 43 % de interfaz |
| **ISO/IEC/IEEE 29119** (proceso de prueba) | [`aplicacion_iso_29119.md`](../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md) | Partes 1, 2 y 3: planificación, ejecución y reporte |
| **ISO/IEC 27001:2022** (seguridad) | [`aplicacion_iso_27000.md`](../05_mantenimiento_evaluacion/iso_aplicada/aplicacion_iso_27000.md) | Autoevaluación; **sin certificación ni auditoría externa** |
| **OWASP Top 10 (2021)** y API Security Top 10 (2023) | [`seguridad.md`](../05_mantenimiento_evaluacion/seguridad/seguridad.md) | Mapeo de controles y riesgos abiertos |
| **Ley N.° 27269** (Perú) | [`seguridad.md`](../05_mantenimiento_evaluacion/seguridad/seguridad.md) y [`manual_usuario.md`](../05_mantenimiento_evaluacion/operacion/manual_usuario.md) | **Límite declarado**: sin AC acreditada ni TSA |

---

## 4. Inventario Completo de Documentos

### 4.1. `00/` — Portada e índice General (9)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`00_indice_documentacion.md`](00_indice_documentacion.md) | 376 | 9 |
| [`01_readme.md`](01_readme.md) | 130 | 8 |
| [`02_planificacion.md`](02_planificacion.md) | 330 | 10 |
| [`03_funcionalidades.md`](03_funcionalidades.md) | 270 | 11 |
| [`04_analisis_detallado.md`](04_analisis_detallado.md) | 1 022 | 12 |
| [`05_instalacion.md`](05_instalacion.md) | 298 | 10 |
| [`06_ejecucion.md`](06_ejecucion.md) | 106 | 7 |
| [`07_progreso.md`](07_progreso.md) | 255 | 9 |
| [`08_progreso_2_0.md`](08_progreso_2_0.md) | 295 | 10 |

### 4.2. Fase 1 — Planificación y Requerimientos (10)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`requerimientos/requerimientos.md`](../01_planificacion_requerimientos/requerimientos/requerimientos.md) | 1 114 | 14 |
| [`requerimientos/casos_uso.md`](../01_planificacion_requerimientos/requerimientos/casos_uso.md) | 977 | 8 |
| [`requerimientos/historias_usuario.md`](../01_planificacion_requerimientos/requerimientos/historias_usuario.md) | 616 | 8 |
| [`requerimientos/funcionalidades.md`](../01_planificacion_requerimientos/requerimientos/funcionalidades.md) | 502 | 12 |
| [`metodologia/metodologia_pruebas.md`](../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md) | 307 | 10 |
| [`metodologia/metodologia_general.md`](../01_planificacion_requerimientos/metodologia/metodologia_general.md) | 268 | 6 |
| [`metodologia/metodologia_ia_aplicada.md`](../01_planificacion_requerimientos/metodologia/metodologia_ia_aplicada.md) | 226 | 8 |
| [`estado_del_arte/estado_del_arte.md`](../01_planificacion_requerimientos/estado_del_arte/estado_del_arte.md) | 171 | 7 |
| [`iso_aplicada/aplicacion_iso_25000.md`](../01_planificacion_requerimientos/iso_aplicada/aplicacion_iso_25000.md) | 116 | 8 |
| [`articulos_sustentacion/sustentacion_articulos.md`](../01_planificacion_requerimientos/articulos_sustentacion/sustentacion_articulos.md) | 143 | 12 |

### 4.3. Fase 2 — Diseño y Construcción (23)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`pruebas_calidad/matriz_pruebas.md`](../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) | 330 | 15 |
| [`pruebas_calidad/enfoque_tdd.md`](../02_diseno_construccion/pruebas_calidad/enfoque_tdd.md) | 286 | 12 |
| [`pruebas_calidad/metricas_calidad.md`](../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) | 300 | 10 |
| [`pruebas_calidad/aplicacion_iso_29119.md`](../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md) | 245 | 11 |
| [`pruebas_calidad/validacion_experimental.md`](../02_diseno_construccion/pruebas_calidad/validacion_experimental.md) | 315 | 15 |
| [`pruebas_calidad/plan_de_pruebas.md`](../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md) | 206 | 9 |
| [`pruebas_calidad/enfoque_bdd.md`](../02_diseno_construccion/pruebas_calidad/enfoque_bdd.md) | 182 | 11 |
| [`pruebas_calidad/matriz_trazabilidad.md`](../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) | 183 | 5 |
| [`arquitectura/arquitectura.md`](../02_diseno_construccion/arquitectura/arquitectura.md) | 347 | 8 |
| [`arquitectura/modelo_datos.md`](../02_diseno_construccion/arquitectura/modelo_datos.md) | 330 | 6 |
| [`arquitectura/analisis_tecnico.md`](../02_diseno_construccion/arquitectura/analisis_tecnico.md) | 246 | 7 |
| [`procesos_empresa/as_is/procesos_as_is.md`](../02_diseno_construccion/procesos_empresa/as_is/procesos_as_is.md) | 251 | 8 |
| [`procesos_empresa/as_is/proceso_as_is_01.md`](../02_diseno_construccion/procesos_empresa/as_is/proceso_as_is_01.md) | 247 | 14 |
| [`procesos_empresa/as_is/proceso_as_is_02.md`](../02_diseno_construccion/procesos_empresa/as_is/proceso_as_is_02.md) | 241 | 14 |
| [`procesos_empresa/as_is/proceso_as_is_03.md`](../02_diseno_construccion/procesos_empresa/as_is/proceso_as_is_03.md) | 241 | 14 |
| [`procesos_empresa/as_is/proceso_as_is_04.md`](../02_diseno_construccion/procesos_empresa/as_is/proceso_as_is_04.md) | 252 | 14 |
| [`procesos_empresa/as_is/proceso_as_is_05.md`](../02_diseno_construccion/procesos_empresa/as_is/proceso_as_is_05.md) | 248 | 14 |
| [`procesos_empresa/to_be/procesos_to_be.md`](../02_diseno_construccion/procesos_empresa/to_be/procesos_to_be.md) | 142 | 8 |
| [`procesos_empresa/to_be/proceso_to_be_01.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_01.md) | 280 | 14 |
| [`procesos_empresa/to_be/proceso_to_be_02.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_02.md) | 263 | 14 |
| [`procesos_empresa/to_be/proceso_to_be_03.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_03.md) | 289 | 15 |
| [`procesos_empresa/to_be/proceso_to_be_04.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_04.md) | 296 | 14 |
| [`procesos_empresa/to_be/proceso_to_be_05.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_05.md) | 341 | 15 |

### 4.4. Fases 3 y 4 — Desarrollo e Implementación (3)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`desarrollo_codificacion.md`](../03_desarrollo_codificacion/desarrollo_codificacion.md) | 308 | 13 |
| [`implementacion_despliegue.md`](../04_implementacion_despliegue/implementacion_despliegue.md) | 289 | 11 |
| [`plan_nube_vercel_supabase.md`](../04_implementacion_despliegue/plan_nube_vercel_supabase.md) | 318 | 10 |

### 4.5. Fase 5 — Mantenimiento y Evaluación (8)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`evaluacion.md`](../05_mantenimiento_evaluacion/evaluacion.md) | 349 | 14 |
| [`seguridad/seguridad.md`](../05_mantenimiento_evaluacion/seguridad/seguridad.md) | 399 | 15 |
| [`operacion/guia_tecnica.md`](../05_mantenimiento_evaluacion/operacion/guia_tecnica.md) | 419 | 12 |
| [`operacion/manual_usuario.md`](../05_mantenimiento_evaluacion/operacion/manual_usuario.md) | 430 | 12 |
| [`operacion/guia_despliegue_produccion.md`](../05_mantenimiento_evaluacion/operacion/guia_despliegue_produccion.md) | 449 | 12 |
| [`operacion/roadmap_produccion.md`](../05_mantenimiento_evaluacion/operacion/roadmap_produccion.md) | 403 | 12 |
| [`iso_aplicada/aplicacion_iso_27000.md`](../05_mantenimiento_evaluacion/iso_aplicada/aplicacion_iso_27000.md) | 357 | 11 |
| [`referencia/glosario_tecnico.md`](../05_mantenimiento_evaluacion/referencia/glosario_tecnico.md) | 238 | 8 |

### 4.6. Fase 6 — Diagramas y Software (9)

| Documento | Líneas | Secciones |
|-----------|:------:|:----------:|
| [`diagrama_clases.md`](../06_diagramas_y_software/diagrama_clases.md) | 401 | 7 |
| [`diagrama_secuencia.md`](../06_diagramas_y_software/diagrama_secuencia.md) | 397 | 8 |
| [`diagrama_actividades.md`](../06_diagramas_y_software/diagrama_actividades.md) | 350 | 10 |
| [`diagrama_estados.md`](../06_diagramas_y_software/diagrama_estados.md) | 337 | 9 |
| [`diagrama_casos_uso.md`](../06_diagramas_y_software/diagrama_casos_uso.md) | 309 | 10 |
| [`software_utilizado.md`](../06_diagramas_y_software/software_utilizado.md) | 253 | 11 |
| [`diagrama_paquetes.md`](../06_diagramas_y_software/diagrama_paquetes.md) | 267 | 7 |
| [`diagrama_despliegue.md`](../06_diagramas_y_software/diagrama_despliegue.md) | 240 | 8 |
| [`diagrama_componentes.md`](../06_diagramas_y_software/diagrama_componentes.md) | 235 | 7 |

### 4.7. Carpetas Reservadas

| Carpeta | Estado | Nota |
|---------|--------|------|
| `01_planificacion_requerimientos/articulos_sustentacion/articulos/` | Vacía | Se poblará con las copias de los artículos y normas citados en [`sustentacion_articulos.md`](../01_planificacion_requerimientos/articulos_sustentacion/sustentacion_articulos.md) |
| `02_diseno_construccion/base_de_datos/` | Vacía | El modelo de datos se documenta en [`modelo_datos.md`](../02_diseno_construccion/arquitectura/modelo_datos.md); queda pendiente decisión de depósito del script SQL |

---

## 5. Orden de Lectura Sugerido

### 5.1. Para el evaluador (45 minutos de lectura)

| # | Documento | Motivo |
|:-:|-----------|--------|
| 1 | [`evaluacion.md`](../05_mantenimiento_evaluacion/evaluacion.md) | Resumen ejecutivo, resultados y limitaciones |
| 2 | [`01_readme.md`](01_readme.md) | Portada del proyecto: problema, solución y stack |
| 3 | [`manual_usuario.md`](../05_mantenimiento_evaluacion/operacion/manual_usuario.md) | Ver el producto en funcionamiento |
| 4 | [`diagrama_casos_uso.md`](../06_diagramas_y_software/diagrama_casos_uso.md) | Entender el alcance funcional |
| 5 | [`seguridad.md`](../05_mantenimiento_evaluacion/seguridad/seguridad.md) | Evaluar los riesgos aceptados |

### 5.2. Para la revisión técnica (3 horas)

| # | Documento | Motivo |
|:-:|-----------|--------|
| 1 | [`01_readme.md`](01_readme.md) | Portada del proyecto: problema, solución y stack |
| 2 | [`04_analisis_detallado.md`](04_analisis_detallado.md) | Análisis funcional y de diseño consolidado |
| 3 | [`arquitectura.md`](../02_diseno_construccion/arquitectura/arquitectura.md) | Estructura y decisiones de diseño |
| 4 | [`analisis_tecnico.md`](../02_diseno_construccion/arquitectura/analisis_tecnico.md) | Alternativas evaluadas y su justificación |
| 5 | [`modelo_datos.md`](../02_diseno_construccion/arquitectura/modelo_datos.md) | Esquema y relaciones |
| 6 | [`matriz_pruebas.md`](../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) | Qué se verifica y cómo |
| 7 | [`matriz_trazabilidad.md`](../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) | Cobertura de los 27 RF y 44 RNF |
| 8 | [`guia_tecnica.md`](../05_mantenimiento_evaluacion/operacion/guia_tecnica.md) | Referencia para mantener el código |
| 9 | [`software_utilizado.md`](../06_diagramas_y_software/software_utilizado.md) | Dependencias y licencias |

### 5.3. Para el recorrido completo (8 horas)

Índice → `00/` completa (portada, planificación, funcionalidades, análisis, instalación, ejecución y progreso) → Fase 1 completa → Fase 2 completa → Fases 3 y 4 → Fase 5 → Fase 6.

Dentro de cada fase, el orden natural es: mapa → detalle → verificación.

---

## 6. Estadísticas Globales

| Métrica | Valor |
|---------|:-----:|
| Documentos | 62 |
| Líneas totales | 20 366 |
| Extensión total | 981 KB |
| Secciones de primer nivel | 653 |
| Carpetas con documentos | 18 |
| Carpetas reservadas vacías | 2 |
| Enlaces relativos internos | 456 |
| Enlaces rotos | 0 |
| Diagramas PlantUML | 8 documentos |
| Tablas de datos | 6 366 líneas |

### 6.1. Distribución por Fase

| Fase | Documentos | Líneas | % del total |
|------|:----------:|:------:|:-----------:|
| 1 — Planificación y Requerimientos | 10 | 4 440 | 21.8 % |
| 2 — Diseño y Construcción | 23 | 6 061 | 29.8 % |
| 3 y 4 — Desarrollo e Implementación | 3 | 950 | 4.7 % |
| 5 — Mantenimiento y Evaluación | 8 | 3 044 | 14.9 % |
| 6 — Diagramas y Software | 9 | 2 789 | 13.7 % |
| `00/` (portada, índice general y documentos de proyecto) | 9 | 3 082 | 15.1 % |
| **Total** | **62** | **20 366** | **100 %** |

---

## 7. Estado de Verificación

### 7.1. Verificaciones Ejecutadas

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| Pruebas del backend | `pnpm test` | **98/98** en 12 archivos |
| Pruebas del frontend | `pnpm test` | **22/22** en 2 archivos |
| Tipos del backend | `npx tsc --noEmit` | **0 errores** |
| Tipos del frontend | `npx svelte-check` | **0 errores, 0 advertencias** |
| Compilación del backend | `pnpm build` | Correcta |
| Compilación del frontend | `pnpm build` | Correcta (aviso esperado de `adapter-auto`) |
| Enlaces relativos | Auditoría automática | **0 rotos** de 456 |
| Codificación UTF-8 | Auditoría automática | **0 caracteres de reemplazo, 0 CJK** |
| Coherencia de identificadores | Auditoría automática | 24 CU en catálogo = 24 en diagrama |

### 7.2. Lo que NO está Verificado

| Aspecto | Estado |
|---------|--------|
| Despliegue en producción | **Nunca ejecutado** |
| Pruebas de carga y rendimiento | No realizadas |
| Validación con usuarios reales | No realizada |
| Auditoría de seguridad externa | No realizada |
| Certificación bajo ISO/IEC 27001 | No solicitada; solo autoevaluación |
| Sincronización de los diagramas con el código | Manual, no automatizada |

### 7.3. Riesgos y Defectos Conocidos

| # | Hallazgo | Severidad | Estado |
|:-:|----------|:---------:|--------|
| 1 | `GET /api/verify/:documentId` devuelve `signature.valid: true` sin comprobación criptográfica real | Alta | Abierto; la comprobación sí existe en `POST /api/verify` |
| 2 | Cobertura funcional de la interfaz de usuario de 3/7 áreas (43 %) | Media | Declarado y planificado |
| 3 | `DbDriver` es síncrona; impide adoptar PostgreSQL sin rediseño | Alta | Bloquea la nube |
| 4 | `uploads/` en sistema de archivos efímero, incompatible con serverless | Alta | Bloquea la nube |
| 5 | `@types/express@^5` no corresponde a `express@^4.21.2` | Baja | Corregible en una línea |
| 6 | `multer@1` está en su rama de mantenimiento | Media | Planificar actualización |

### 7.4. Límite Legal Declarado

La firma producida por el SGD-FD es **criptográficamente válida dentro del
sistema**, pero **no es firma electrónica certificada** conforme a la Ley
N.° 27269: el proyecto no incorpora Autoridad de Certificación acreditada ni
sello de tiempo (TSA). Un documento puede ser reported como `VALID` y, aun así,
carecer de validez legal de certificado.

---

## 8. Referencias Cruzadas

- [`06_diagramas_y_software/software_utilizado.md`](../06_diagramas_y_software/software_utilizado.md) — Inventario de dependencias
- [`02_diseno_construccion/pruebas_calidad/metricas_calidad.md`](../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) — Métricas medidas y no medidas
- [`05_mantenimiento_evaluacion/evaluacion.md`](../05_mantenimiento_evaluacion/evaluacion.md) — Evaluación del proyecto
