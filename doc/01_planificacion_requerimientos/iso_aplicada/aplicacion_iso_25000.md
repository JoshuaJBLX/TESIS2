# Aplicación de ISO/IEC 25010 y ISO/IEC 25019 al sistema SGD-FD

## 1. Introducción y alcance

Este documento describe la aplicación de la norma ISO/IEC 25010 (Sistemas y software — Requisitos y evaluación de la calidad del producto de software — Modelos de calidad) y de la guía ISO/IEC 25019 (Sistemas y software — Ingeniería del software y sistemas — Guía para medir la calidad del producto de software) al Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD).

El objetivo es evaluar y medir la calidad del producto de software mediante características, subcaracterísticas y métricas verificables, utilizando únicamente evidencias existentes en el proyecto (pruebas, trazabilidad, análisis de tipos y resultados de construcción).

La elección de ISO/IEC 25010 frente a la antigua ISO/IEC 9126 responde a la evolución del modelo: ISO/IEC 25010 actualiza y amplía el modelo de calidad de producto, separando explícitamente calidad de producto y calidad en uso. En la familia SQuaRE (ISO/IEC 25000), la relación entre normas es la siguiente: ISO/IEC 25000 define el marco; ISO/IEC 25010 especifica el modelo de calidad de producto (y modelo de calidad en uso); ISO/IEC 25012 define el modelo de calidad de datos; ISO/IEC 25014 aborda la calidad en uso; ISO/IEC 25019 proporciona guía para la medición de la calidad del producto; ISO/IEC 25022, 25023 y 25024 corresponden a medidas (calidad en uso, calidad de producto, calidad de datos). Esta aplicación se centra en calidad de producto (25010) con medición guiada por 25019.

## 2. Modelo de calidad aplicado: ISO/IEC 25010

ISO/IEC 25010 establece ocho características de calidad de producto: funcionalidad, eficiencia, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y portabilidad. Cada una se descompone en subcaracterísticas. La tabla siguiente identifica, para el SGD-FD, qué subcaracterística resulta aplicable, cómo se mide, qué evidencia se utiliza y su estado actual.

| Característica | Subcaracterística aplicable | Cómo se mide en el proyecto | Evidencia (archivo de pruebas) | Estado |
|---|---|---|---|---|
| Funcionalidad | Completitud, corrección, idoneidad, interoperabilidad | 27 RF (requerimientos funcionales) con al menos una prueba asociada; trazabilidad RF→pruebas; verificación de firma y estados de verificación (VALID, MANIPULATED, INVALID_SIGNATURE, NOT_FOUND, FOUND). | `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md`; `matriz_pruebas.md` | Medido. Trazabilidad RF 27/27 (100 %). |
| Eficiencia | Utilización de recursos, comportamiento temporal | Ejecución de 120 pruebas automatizadas (backend+frontend) en tiempo de ejecución del entorno de desarrollo; verificación de construcción (`pnpm build`) exitosa en ambos módulos. No se midió rendimiento bajo carga ni tiempos SLA. | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`; resultados de suites (`backend/tests/*`, `frontend/tests/*`) | Parcialmente medido. Solo eficiencia de ejecución de pruebas (medida implícita). No medido en carga/producción. |
| Compatibilidad | Interoperabilidad, coexistencia | Interoperabilidad a nivel de API (pruebas de API/integración 33) y cliente HTTP (frontend 15). Capa `DbDriver` síncrona definida para abstraer acceso a datos; coexistencia con SQLite en memoria (`sql.js`). No evaluada con otros motores de BD. | `../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md` | Medido a nivel de interfaz/API. Coexistencia con otros sistemas no medida. |
| Usabilidad | Idoneidad para el uso, reconocibilidad, aprendibilidad, operabilidad, protección frente a errores, estética de la interfaz | Cobertura funcional por capa (INTERFAZ DE USUARIO 3/7 = 43 %). Pruebas de estado de autenticación (frontend 7) y cliente HTTP. No se realizó evaluación con usuarios reales (usabilidad empírica). | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`; `matriz_pruebas.md` | Medido parcialmente. Solo cobertura de pruebas de UI. Usabilidad con usuarios no medida. |
| Fiabilidad | Disponibilidad, tolerancia a fallos, recuperabilidad, madurez | Madurez medida por tasa de pruebas satisfactorias 120/120 (100 %). Integridad de bitácora: solo-append (sin UPDATE/DELETE), eventos encadenados por SHA-256 (`previous_hash`/`current_hash`). Recuperabilidad no evaluada en despliegue. Disponibilidad no medida. | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`; `matriz_trazabilidad.md` | Medido en madurez y estructura de auditoría. Disponibilidad/recuperabilidad no medidas. |
| Seguridad | Confidencialidad, integridad, autenticación, autorización, responsabilidad, no repudio, resistencia a ataques | Cifrado AES-256-GCM de clave privada; PBKDF2-HMAC-SHA512 (100000 iteraciones); bcryptjs coste 12 (implementación pura JS); JWT; `helmet`, `cors`; bitácora inmutable y encadenada; limitador 300 req/15 min sobre `/api`; bloqueo temporal por intentos fallidos con expiración; 5 estados de verificación; uso exclusivo de `node:crypto` para criptografía. | `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md`; `matriz_pruebas.md`; `metricas_calidad.md` | Medido por controles y pruebas asociadas. Auditoría/responsabilidad cubiertas por trazabilidad de eventos. |
| Mantenibilidad | Modularidad, reusabilidad, analizabilidad, modificabilidad, capacidad de prueba | Separación por capas (Express + SvelteKit), `DbDriver` como abstracción; `npx tsc --noEmit` (backend) 0 errores; `npx svelte-check` (frontend) 0 errores y 0 advertencias; 120 pruebas automatizadas, todas pasan; trazabilidad 100 % RNF 44/44. | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`; resultados de verificación de tipos | Medido. Alta capacidad de prueba y analizabilidad verificada. |
| Portabilidad | Adaptabilidad, instalabilidad, sustituibilidad | Solo `adapter-auto` instalado; `uploads/` local y efímero; `sql.js` en memoria; `DbDriver` síncrona (impide PostgreSQL sin rediseño); `vercel.json` nunca validado. No se probó despliegue en distintos entornos ni sustituibilidad de BD. | `../../02_diseno_construccion/pruebas_calidad/validacion_experimental.md` | No medido. Limitaciones declaradas (bloqueos reales). |

## 3. Requisitos de calidad y trazabilidad RNF → prueba

El SGD-FD cuenta con 44 RNF agrupados según categorías presentes en el proyecto. La trazabilidad completa se encuentra en `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md`. A continuación se presenta la agrupación aplicable y su cobertura:

| Categoría RNF (según proyecto) | Alcance | Cobertura de trazabilidad (medida) |
|---|---|---|
| Identidad y autenticación | Credenciales, PBKDF2, bcrypt, bloqueo por intentos, sesiones/JWT. | 6/6 RNF con al menos una prueba asociada. |
| Emisión, firma y conservación | Proceso de firma, estados de firma, inmutabilidad del documento. | 8/8 RNF con al menos una prueba asociada. |
| Versionado y coautoría | Versionado de documentos, coautoría. | 6/6 RNF con al menos una prueba asociada (agrupados). |
| Visibilidad y permisos | Control de acceso, visibilidad. | 4/4 RNF con al menos una prueba asociada. |
| Verificación y validez | Estados de verificación, integridad, resultado de verificación. | 5/5 RNF con al menos una prueba asociada. |
| Auditoría y trazabilidad | Bitácora solo-append, encadenamiento SHA-256, eventos auditables. | 5/5 RNF con al menos una prueba asociada. |
| No funcionales transversales (rendimiento/operación/criptografía) | Configuración criptográfica, límites, protección. | 10 RNF restantes cubiertos por pruebas (total 44/44). |

Total: 44/44 RNF con al menos una prueba asociada (100 %). Esta trazabilidad RNF→prueba constituye la evidencia principal para las características de seguridad, fiabilidad y mantenibilidad.

## 4. Proceso de evaluación (ISO/IEC 25019)

La evaluación sigue el enfoque de ISO/IEC 25019 para medir la calidad del producto: definición de métricas, recolección de datos, análisis y acciones correctivas. Las métricas se han recopilado a partir de suites de pruebas, análisis estático de tipos y resultados de construcción.

### 4.1 Métricas definidas y valores reales medidos

| Métrica | Fórmula/definición | Valor real medido | Fuente de evidencia |
|---|---|---|---|
| Tasa de pruebas satisfactorias (madurez) | (Pruebas superadas / Total pruebas) × 100 | 120/120 = 100 % | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`; suites backend (98) + frontend (22). |
| Trazabilidad funcional | RF con prueba / Total RF × 100 | 27/27 = 100 % | `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md` |
| Trazabilidad de calidad | RNF con prueba / Total RNF × 100 | 44/44 = 100 % | `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md` |
| Cobertura funcional por capa (UI) | Casos/cobertura de interfaz verificada / definida × 100 | INTERFAZ DE USUARIO 3/7 = 43 % | `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md` |
| Errores de tipos (TypeScript/Svelte) | Número de errores en verificación estática | Backend: 0 (`npx tsc --noEmit`). Frontend: 0 errores, 0 advertencias (`npx svelte-check`). | Resultados de verificación estática (desarrollo). |
| Integridad de bitácora | Cumplimiento append-only + encadenamiento SHA-256 | Cumple (sin UPDATE/DELETE, `previous_hash`/`current_hash`). Verificado por diseño y pruebas. | `matriz_pruebas.md`; `arquitectura.md` (referenciado). |
| Estados de verificación | Cobertura de estados (VALID/MANIPULATED/INVALID_SIGNATURE/NOT_FOUND/FOUND) | 5/5 estados definidos y cubiertos por pruebas. | `matriz_pruebas.md`; `matriz_trazabilidad.md` |

### 4.2 Recolección, análisis y acciones correctivas

- **Recolección de datos**: ejecución automatizada de 120 pruebas (backend 98 en 12 archivos: 37 unitarias, 23 de servicios, 33 de API/integración, 5 de aceptación; frontend 22 en 2 archivos: 15 cliente HTTP, 7 estado de autenticación). Verificación estática y construcción (`pnpm build`) en ambos módulos.
- **Análisis**: se confirma 100 % de pruebas satisfactorias, trazabilidad completa 27/27 y 44/44. Se identifica una brecha real y declarada: cobertura de INTERFAZ DE USUARIO 3/7 = 43 %. Asimismo, se identifica un defecto abierto: `GET /api/verify/:documentId` devuelve `signature.valid: true` sin comprobación criptográfica real.
- **Acciones correctivas**: incrementar cobertura de pruebas de UI para cerrar el 43 % (casos de interfaz pendientes), corregir la verificación en el endpoint `/verify/:documentId` para realizar comprobación criptográfica real frente al documento y su firma, y registrar ambos ítems en el plan de mejora (sección 6).

## 5. Calidad de datos (ISO/IEC 25012)

Aplicando ISO/IEC 25012 (modelo de calidad de datos), se identifican características aplicadas y controles implementados en el SGD-FD:

| Característica de calidad de datos | Control aplicado en el proyecto | Evidencia |
|---|---|---|
| Integridad (consistencia, validez) | Integridad referencial conceptual, validación de entradas, 5 estados de verificación, bitácora encadenada SHA-256 (integridad de eventos). | Pruebas de API/integración (33) y servicios (23). |
| Confidencialidad | Cifrado de la clave privada con AES-256-GCM; PBKDF2-HMAC-SHA512 (100000 iteraciones) para derivación; bcryptjs coste 12; hashes SHA-256 para integridad. | Diseño criptográfico (uso exclusivo de `node:crypto` para operaciones criptográficas críticas). |
| Trazabilidad/auditabilidad | Bitácora solo-append, sin UPDATE ni DELETE, encadenada por `previous_hash`/`current_hash`; 9 tipos de evento auditables. | Cobertura de auditoría 5/5 RNF con pruebas asociadas. |
| Precisión/completitud | Validación de contraseña, validación de datos de firma/documento, estados de verificación que discriminan casos (NOT_FOUND, FOUND, etc.). | Pruebas unitarias (37) y de servicios. |
| Disponibilidad/usabilidad de datos | Almacenamiento con `sql.js` (SQLite en memoria) mediante capa `DbDriver` síncrona; `uploads/` local y efímero. | Arquitectura definida; limitaciones operativas declaradas. |

## 6. Resumen: brechas detectadas y plan de mejora

### 6.1 Brechas detectadas

| Brecha | Descripción | Impacto declarado |
|---|---|---|
| Cobertura de interfaz de usuario (43 %) | INTERFAZ DE USUARIO 3/7 = 43 % (cobertura funcional por capa). | Brecha real y declarada. Reduce cobertura de regresión en UI. |
| Defecto abierto en verificación | `GET /api/verify/:documentId` devuelve `signature.valid: true` sin comprobación criptográfica real. | Riesgo de verificación incorrecta; requiere corrección para cumplir integridad de verificación. |
| Portabilidad limitada | `DbDriver` síncrona (impide PostgreSQL sin rediseño); solo `adapter-auto`; `uploads/` local y efímero; `vercel.json` nunca validado. | Limitaciones de despliegue; no medido. |
| Métricas no medidas | Rendimiento bajo carga, disponibilidad, usabilidad con usuarios reales, portabilidad a otros entornos. | Alcance de evaluación acotado (ver sección 7). |

### 6.2 Plan de mejora

| Acción correctiva | Responsable (rol) | Prioridad | Criterio de aceptación | Estado |
|---|---|---|---|---|
| Incrementar cobertura de pruebas de UI para cerrar casos pendientes (alcanzar cobertura definida). | Desarrollo/Pruebas | Alta | Casos de interfaz cubiertos y documentados en `matriz_pruebas.md`; verificación en pipeline. | Pendiente |
| Corregir endpoint `GET /api/verify/:documentId` para realizar comprobación criptográfica real (verificación de firma frente a documento) según estados definidos. | Desarrollo | Alta | Prueba asociada que valida `signature.valid` con comprobación criptográfica real; pasa en suite. | Pendiente (defecto abierto) |
| Documentar y evaluar estrategia de portabilidad (validación de `vercel.json`, análisis de migración de `DbDriver` a asincrónico si se requiere PostgreSQL). | Arquitectura/DevOps | Media | Decisión técnica documentada en `../../02_diseno_construccion/arquitectura/arquitectura.md` y `analisis_tecnico.md`. | Pendiente |
| Definir alcance de medición para rendimiento/usabilidad (experimento o alcance fuera de este informe). | Calidad | Baja | Alcance claramente delimitado en `../../05_mantenimiento_evaluacion/evaluacion.md`. | Pendiente |

## 7. Declaración de honestidad (lo que NO se midió y por qué)

Conforme a ISO/IEC 25019 y principios de integridad científica, se declara explícitamente lo siguiente:

- **Rendimiento**: no se midieron tiempos de respuesta, throughput, latencia ni comportamiento bajo carga (stress/performance). Motivo: evaluación centrada en calidad de producto mediante pruebas funcionales y estáticas; medición de rendimiento requeriría entorno representativo y carga definida (fuera del alcance actual).
- **Disponibilidad**: no se midió tiempo de actividad (uptime), recuperación ante fallos operativos ni RTO/RPO. Motivo: despliegue no evaluado en entorno de producción con monitoreo.
- **Usabilidad con usuarios reales**: no se realizó evaluación empírica con usuarios finales (heurísticas, tests de usabilidad, SUS). Motivo: alcance centrado en verificación funcional y calidad de producto; se registran solo métricas de cobertura de UI (43 %).
- **Portabilidad a otros entornos**: no se probó en múltiples sistemas/plataformas ni sustituibilidad de motor de BD. Motivo: limitaciones reales (`DbDriver` síncrona, solo `adapter-auto`, `uploads/` local y efímero, `vercel.json` no validado).
- **Otras medidas SQuaRE**: medidas detalladas de algunas subcaracterísticas (ej. complejidad ciclomática, líneas de código, acoplamiento) no se presentan como valores medidos en este documento; solo se incluyen métricas con evidencia verificable.

Esta delimitación asegura separación entre "medido" y "no medido", evitando inventar valores o afirmaciones no sustentadas por evidencias.

## Referencias cruzadas

- `../metodologia/metodologia_general.md`
- `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`
- `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md`
- `../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md`
- `../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md`
- `../../02_diseno_construccion/pruebas_calidad/validacion_experimental.md`
- `../../05_mantenimiento_evaluacion/evaluacion.md`