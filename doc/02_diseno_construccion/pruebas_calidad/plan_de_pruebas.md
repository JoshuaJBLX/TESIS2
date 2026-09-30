# Plan de Pruebas

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| | |
|---|---|
| **Proyecto** | SGD-FD |
| **Plan de pruebas** | PP-SGD-FD-01 |
| **Versión** | 1.0.0 |
| **Responsable** | Equipo de desarrollo de la tesis |
| **Norma de referencia** | ISO/IEC 29119-2 (planificación de pruebas) |
| **Estrategia** | Funcional y no funcional, con prioridad a la seguridad |

---

## 2. Alcance

### 2.1. Incluido

| # | Elemento en alcance |
|---|---|
| 1 | Autenticación: registro, login, refresh, validación de contraseña. |
| 2 | Gestión de documentos: alta, versionado, descarga, visibilidad. |
| 3 | Propuestas de coautoría: crear, aceptar, rechazar. |
| 4 | Comparación de versiones. |
| 5 | Verificación pública: por QR, por carga y por hash. |
| 6 | Auditoría: consulta, filtros, verificación de la cadena. |
| 7 | Primitivas criptográficas: generación, cifrado, firma, verificación. |
| 8 | Cliente HTTP: sesión, renovación de token, manejo de errores. |
| 9 | Atributos de calidad: rendimiento, seguridad, usabilidad. |

### 2.2. Excluido

| # | Elemento excluido | Motivo |
|---|-------------------|--------|
| 1 | Pruebas de carga y estrés masivas | El volumen objetivo no las justifica; se mide con pruebas de rendimiento. |
| 2 | Pruebas en navegadores reales | El alcance es un navegador moderno; no se requiere matriz de navegadores. |
| 3 | Prueba de accesibilidad con usuarios | Fuera del alcance académico. |
| 4 | Penetración por terceros | Se aplican pruebas de seguridad de caja negra internas. |
| 5 | Compatibilidad con dispositivos móviles | Fuera del alcance declarado. |

---

## 3. Objetivos de las Pruebas

| ID | Objetivo | Verificable mediante |
|----|----------|----------------------|
| OB-1 | Cada requerimiento funcional está implementado | Matriz de trazabilidad RF ↔ caso de prueba |
| OB-2 | La firma criptográfica detecta cualquier alteración | Pruebas de manipulación de contenido |
| OB-3 | La bitácora detecta alteraciones retroactivas | Pruebas de cadena de hashes |
| OB-4 | El sistema responde dentro de los objetivos de rendimiento | Pruebas de tiempo |
| OB-5 | El acceso no autorizado es rechazado | Pruebas de autorización por rol |
| OB-6 | El sistema es reproducible desde cero | Ejecución en entorno limpio |

---

## 4. Estrategia de Pruebas

### 4.1. Niveles

| Nivel | Alcance | Requisito cubierto | Cantidad |
|-------|---------|--------------------|:--------:|
| **Unitaria** | Función o clase aislada | Parte de un RF | 37 |
| **Integración** | Servicio + base de datos real | RF completo | 23 |
| **Sistema** | API HTTP completa con Supertest | RF y RNF | 33 |
| **Aceptación** | Flujo de negocio multiusuario | Caso de uso | 5 |
| **Cliente** | Capa de presentación y transporte | RNF de usabilidad | 22 |
| **Total** | | | **120** |

### 4.2. Técnicas de diseño

| Técnica | Aplicación en este proyecto |
|---------|----------------------------|
| Partición de equivalencia | Contraseñas: válida / sin mayúscula / sin dígito / corta / vacía. |
| Análisis de valores límite | Tamaño de archivo: 0, 1, 10 MB − 1, 10 MB, 10 MB + 1. |
| Transiciones de estado | `pending → accepted`, `pending → rejected`, y transiciones inválidas. |
| Pruebas de flujo de datos | Alterar `content_hash` o `current_hash` y comprobar la detección. |
| Equivalencia de estado | `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND`. |
| Casos de uso | Un caso por cada CU-001 … CU-024. |
| Table-driven testing | Verificación con distintos MIME y tamaños. |

### 4.3. Priorización

El sistema tiene un objetivo de seguridad dominante, por lo que las pruebas
se priorizan según riesgo, no según cobertura uniforme:

| Prioridad | Módulo | Motivo |
|-----------|--------|--------|
| **P0** | Criptografía, verificación, auditoría | Constituyen la garantía central del producto |
| **P1** | Autenticación, autorización, propuestas | Flujos de control y de integridad |
| **P2** | Gestión de documentos, comparación | Funcionalidad de apoyo |
| **P3** | Cliente, presentación | Calidad percibida |

---

## 5. Entorno de Pruebas

### 5.1. Componentes

| Componente | Requisito |
|-----------|-----------|
| Node.js | ≥ 18 (probado con 20.x y 25.x) |
| pnpm | ≥ 9 |
| Sistema operativo | Windows, Linux o macOS (independiente del SO) |
| Base de datos | Temporal, creada por la propia suite; no requiere instalación |
| Puertos | Ninguno: las pruebas usan la aplicación en memoria (Supertest) |

### 5.2. Datos de prueba

Cada suite crea su propia base de datos temporal en el directorio temporal del
sistema operativo. Ninguna prueba comparte estado con otra, y ninguna toca los
datos de desarrollo. Implementación en
`backend/tests/helpers/db.ts`.

| Suite | Ubicación temporal |
|-------|--------------------|
| Servicios | `%TEMP%/tesis-test-XXXXXX/test.sqlite` |
| Rutas | Instancia de la aplicación en memoria, sin puerto |

### 5.3. Datos de entrada por defecto

| Dato | Valor | Condición |
|------|-------|-----------|
| Contraseña válida | `Password<salt>123!` | Cumple la política |
| Contraseña inválida | `abc` | Sin mayúscula, sin dígito, corta |
| Archivo válido | PDF de 1 MB generado en memoria | |
| Archivo inválido | `.exe` de 1 KB | MIME rechazado |
| Archivo sobredimensionado | 11 MB | Supera el límite |
| Documento manipulado | PDF con un byte alterado | Hash distinto |

---

## 6. Criterios de Entrada y de Salida

### 6.1. Entrada

| ID | Criterio | Verificación |
|----|----------|--------------|
| CE-1 | Requerimientos aprobados | `requerimientos.md` vigente |
| CE-2 | Código compilando | `tsc --noEmit` sin errores |
| CE-3 | Migración aplicada | Base creada sin errores |
| CE-4 | Dependencias instaladas | `pnpm install` completado |
| CE-5 | Documentos de prueba revisados | Este plan y la matriz |

### 6.2. Salida

| ID | Criterio | Estado |
|----|----------|--------|
| CS-1 | Todas las pruebas ejecutadas | ✔ 120/120 |
| CS-2 | Ninguna prueba fallando | ✔ 0 fallos |
| CS-3 | Cobertura de todos los RF | ✔ 27/27 |
| CS-4 | Ningún defecto abierto de severidad alta o crítica | ✔ 3 resueltos |
| CS-5 | Resultados reproducibles | ✔ Verificado |

---

## 7. Gestión de Defectos

| Severidad | Definición | Plazo de corrección |
|-----------|------------|---------------------|
| Crítica | Compromete la seguridad o la integridad | Inmediato |
| Alta | Bloquea una funcionalidad principal | Antes de la entrega |
| Media | Afecta a un flujo alterno | Antes de la entrega |
| Baja | Cosmética | Posterior |

Ciclo: `Detectado → Clasificado → Asignado → Corregido → Verificado → Cerrado`.
Detalle de los defectos encontrados en
[`../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md`](../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md) §8.

---

## 8. Entregables de las Pruebas

| Entregable | Ubicación |
|------------|-----------|
| Plan de pruebas | Este documento |
| Catálogo de casos | [`matriz_pruebas.md`](matriz_pruebas.md) |
| Matriz de trazabilidad | [`matriz_trazabilidad.md`](matriz_trazabilidad.md) |
| Enfoque TDD | [`enfoque_tdd.md`](enfoque_tdd.md) |
| Enfoque BDD | [`enfoque_bdd.md`](enfoque_bdd.md) |
| Resultados medidos | [`validacion_experimental.md`](validacion_experimental.md) |

---

## 9. Limitaciones del Plan

| # | Limitación | Impacto |
|---|-----------|---------|
| 1 | Las pruebas validan el comportamiento, no la corrección absoluta del diseño. | Un defecto de diseño no detectado por los casos modelados pasa inadvertido. |
| 2 | No hay prueba de inter-operabilidad con clientes reales distintos del incluido. | La compatibilidad con otros verificadores no está garantizada. |
| 3 | El rendimiento se midió en un entorno de desarrollo, no en producción. | Las cifras pueden diferir bajo carga. |
| 4 | No se prueban escenarios de corrupción masiva de la base de datos. | La resistencia a un atacante con control total queda fuera de alcance. |

---

**Documentos relacionados**

- [`matriz_pruebas.md`](matriz_pruebas.md) — Catálogo de casos de prueba
- [`matriz_trazabilidad.md`](matriz_trazabilidad.md) — Trazabilidad RF ↔ prueba
- [`validacion_experimental.md`](validacion_experimental.md) — Resultados de rendimiento y seguridad
