# Estrategia General de Pruebas

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 4 — Pruebas

---

## 1. Marco Teórico: ISO/IEC 29119

La estrategia de pruebas se apoya en la familia de normas **ISO/IEC 29119**, cuyo
principio organizador es el **proceso de prueba** dentro del ciclo de vida del
software, con los siguientes niveles:

| Nivel | Objetivo | Estabilidad | Dependencias |
|-------|----------|-------------|--------------|
| Prueba de componente (unitaria) | Verificar que una unidad hace lo correcto de forma aislada. | Alta | 0 |
| Prueba de integración | Verificar que las unidades interactúan correctamente. | Media | BD temporal |
| Prueba de sistema | Verificar el sistema completo contra los requisitos. | Baja | BD + HTTP |
| Prueba de aceptación | Verificar que el sistema satisface las necesidades del usuario. | Muy baja | Todo |

Ver [`aplicacion_iso_29119.md`](../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md).

---

## 2. Objetivos de la Estrategia

| # | Objetivo |
|---|----------|
| OP-1 | Demostrar que cada requerimiento funcional está implementado y se comporta como se especifica. |
| OP-2 | Demostrar que los atributos de calidad (RNF) se cumplen con evidencia medible. |
| OP-3 | Detectar defectos antes de la entrega y no al final del proyecto. |
| OP-4 | Documentar la evidencia de forma reproducible por un evaluador externo. |
| OP-5 | Proteger las propiedades de seguridad, que son el valor central del producto. |

---

## 3. Niveles Implementados

### 3.1. Pruebas unitarias

Verifican funciones y clases puras, sin base de datos ni red.

| Suite | Archivo | Cubre | Pruebas |
|-------|---------|-------|:-------:|
| Criptografía | `tests/unit/crypto.test.ts` | Generación de claves, cifrado/descifrado de la clave privada, hash, firma y verificación, detección de manipulación | 12 |
| Análisis documental | `tests/unit/document-analysis.test.ts` | Extracción de texto, diff línea a línea, comparación de metadatos, degradación a modo binario | 9 |
| Middleware de autenticación | `tests/unit/auth-middleware.test.ts` | `authenticate`, `authenticateOptional`, `requireAdmin` | 9 |
| Rate limiting | `tests/unit/rate-limit.test.ts` | Ventanas de límite, cabeceras, respuesta 429, protección de fuerza bruta | 7 |

**Total unitarias: 37**

### 3.2. Pruebas de integración

Verifican servicios reales contra una base de datos temporal.

| Suite | Archivo | Cubre | Pruebas |
|-------|---------|-------|:-------:|
| Servicio de autenticación | `tests/services/auth.service.test.ts` | Registro, política de contraseñas, duplicados, login, refresh | 7 |
| Servicio de documentos | `tests/services/document.service.test.ts` | Subida, versionado, permisos, visibilidad, propuestas, comparación | 11 |
| Servicio de auditoría | `tests/services/audit.service.test.ts` | Encadenado de hashes, filtros, detección de manipulación | 5 |

**Total integración: 23**

### 3.3. Pruebas de sistema (API HTTP)

Verifican el sistema completo con Supertest, simulando un cliente real.

| Suite | Archivo | Cubre | Pruebas |
|-------|---------|-------|:-------:|
| API de autenticación | `tests/integration/auth.api.test.ts` | Registro, login, refresh, `/me`, códigos de estado, bloqueo por fuerza bruta | 10 |
| API de documentos | `tests/integration/documents.api.test.ts` | Subida, versionado, descarga, visibilidad, propuestas, comparación | 13 |
| API de verificación | `tests/integration/verify.api.test.ts` | Verificación válida, manipulada, por hash, por URL | 6 |
| API de auditoría | `tests/integration/audit.api.test.ts` | Control de acceso por rol, paginación, verificación de cadena | 4 |

**Total sistema: 33**

### 3.4. Pruebas de aceptación (escenarios multiusuario)

Verifican los flujos de negocio completos, con varios usuarios y documentos en
interacción.

| Suite | Archivo | Escenario |
|-------|---------|-----------|
| Escenarios end-to-end | `tests/integration/scenarios.test.ts` | 1) Evolución completa a través de 3 versiones |
| | | 2) Colaboración con coautor: crear, rechazar y aceptar |
| | | 3) Ciclo privado → público → propuesta → nueva versión |
| | | 4) El administrador audita la actividad y verifica la cadena |
| | | 5) Permisos: un documento ajeno no puede modificarse ni compartirse |

**Total aceptación: 5**

### 3.5. Pruebas del cliente

| Suite | Archivo | Cubre | Pruebas |
|-------|---------|-------|:-------:|
| Cliente API | `src/lib/api.test.ts` | Resolución de URL, login, manejo de 401, renovación, errores | 15 |
| Almacén de sesión | `src/lib/stores/auth.test.ts` | Restauración de sesión, login, logout, estado de carga | 7 |

**Total cliente: 22**

---

## 4. Resumen Cuantitativo

| Nivel | Suites | Pruebas | % del total |
|-------|:------:|:-------:|:-----------:|
| Unitarias | 4 | 37 | 30,8 % |
| Integración | 3 | 23 | 19,2 % |
| Sistema (API) | 4 | 33 | 27,5 % |
| Aceptación | 1 | 5 | 4,2 % |
| Cliente | 2 | 22 | 18,3 % |
| **Total** | **14** | **120** | **100 %** |

**Resultado de la última ejecución:** 14/14 suites en verde, 120/120 pruebas
aprobadas, 0 pruebas omitidas, 0 pruebas pendientes.

---

## 5. Técnicas de Diseño de Pruebas

### 5.1. Aplicación

| Técnica | Dónde se aplica | Ejemplo |
|---------|-----------------|---------|
| **Partición de equivalencia** | Validación de contraseñas y de MIME | Clases: contraseña válida vs. sin mayúscula vs. sin dígito vs. corta vs. vacía. |
| **Análisis de valores límite** | Tamaño de archivo y paginación | 0 bytes, 1 byte, 10 MB − 1, exactamente 10 MB, 10 MB + 1. `limit` en 0, 1, 200, 201, "abc". |
| **Casos de uso** | Cobertura funcional | Un caso por cada CU-001 … CU-024. |
| **Transiciones de estado** | Propuesta de aceptada/rechazada | `pending → accepted`, `pending → rejected`, y los reintentos sobre estados terminales. |
| **Pruebas de flujo de datos** | Cadena de integridad | Se altera `content_hash` o `current_hash` y se comprueba que la detección falla. |
| **Equivalencia de estado** | Verificación de documentos | `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `FOUND`, `NOT_FOUND`. |
| **Pruebas de mutación conceptual** | Detección de ramas muertas | Se eliminó un middleware y las pruebas deben fallar. |

### 5.2. Enfoque de Cobertura de Requerimientos

Cada RF debe estar cubierto por al menos una prueba. El estado de cobertura se
registra en la matriz de trazabilidad
([`matriz_trazabilidad.md`](../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md)).

---

## 6. Datos de Prueba

### 6.1. Estrategia de Aislamiento

Cada prueba utiliza su **propia base de datos temporal**, creada en el directorio
temporal del sistema operativo:

```
%TEMP%/tesis-test-XXXXXX/
├── test.sqlite          ← base de datos aislada
└── uploads/
    ├── proposals/       ← propuestas aisladas
    └── temp/            ← temporales de multer
```

**Implementación:** `backend/tests/helpers/db.ts`

| Mecanismo | Propósito |
|-----------|-----------|
| `setupTempDb()` | Crea el directorio y asigna `DB_PATH` y `UPLOAD_DIR`. |
| `vi.resetModules()` | Descarta la caché de módulos para que `connection.ts` relea la nueva ruta. |
| `runMigration()` | Aplica el esquema a la base recién creada. |
| `teardownTempDb()` | Elimina el directorio y limpia las variables. |

Esta estrategia garantiza que **ninguna prueba puede afectar a otra** y que
**ninguna prueba toca la base de datos de desarrollo**.

### 6.2. Contraseñas de Prueba

Las pruebas usan contraseñas que cumplen la política real, para no probar con
credenciales que el sistema rechazaría:

```typescript
export function validPassword(salt: string): string {
  return `Password${salt}123!`;
}
```

### 6.3. Usuarios de Prueba

| Usuario | Rol | Uso en las pruebas |
|---------|-----|--------------------|
| `admin` | `admin` | Pruebas de auditoría y de control de acceso por rol. |
| `carlos` | `user` | Propietario de documentos. |
| `maria` | `user` | Segundo usuario para escenarios de coautoría y de aislamiento. |

---

## 7. Criterios de Entrada y Salida

### 7.1. Criterios de Entrada

| # | Criterio |
|---|----------|
| CE-1 | Los casos de uso están documentados y aprobados. |
| CE-2 | El plan de pruebas está completo. |
| CE-3 | El entorno de pruebas está configurado (`DB_PATH`, `UPLOAD_DIR`, `NODE_ENV=test`). |
| CE-4 | Las dependencias están instaladas (`pnpm install`). |
| CE-5 | El código compila sin errores de tipos. |

### 7.2. Criterios de Salida

| # | Criterio | Estado |
|---|----------|--------|
| CS-1 | Todas las pruebas aprobadas. | ✔ Cumplido (120/120) |
| CS-2 | Ninguna prueba crítica fallando. | ✔ Cumplido (0 fallos) |
| CS-3 | Cobertura de todos los RF. | ✔ Cumplido (27/27) |
| CS-4 | Ningún defecto abierto de severidad alta o crítica. | ✔ Cumplido |
| CS-5 | Resultados reproducibles en un entorno limpio. | ✔ Cumplido |

---

## 8. Gestión de Defectos

### 8.1. Clasificación de Severidad

| Severidad | Definición | Ejemplo |
|-----------|------------|---------|
| **Crítica** | Compromete la seguridad o la integridad de la información. | La clave privada se almacena en claro. |
| **Alta** | Impide completar una funcionalidad principal. | No se puede aceptar una propuesta. |
| **Media** | Afecta a un flujo alterno o degrada la experiencia. | El diff no distingue mayúsculas. |
| **Baja** | Cosmético o de documentación. | Mensaje con falta de tilde. |

### 8.2. Ciclo de Vida

```
  Detectado ──▶ Clasificado ──▶ Asignado ──▶ Corregido ──▶ Verificado ──▶ Cerrado
      │                                                    │
      └──────────────────▶ Descartado ◀───────────────────┘
                          (con justificación)
```

### 8.3. Defectos Detectados y Resueltos

| ID | Severidad | Descripción | Detectado por | Estado | Resolución |
|----|-----------|-------------|---------------|--------|------------|
| DEF-01 | Media | `middleware/auth.ts` definía dos funciones idénticas (`optionalAuthenticate` y `authenticateOptional`); la primera era código muerto. | Revisión de código | **Resuelto** | Se eliminó la duplicada y se actualizaron las 3 pruebas que la referenciaban. |
| DEF-02 | Media | La URL de la API estaba fija en `http://localhost:3000/api`, lo que impedía cualquier despliegue fuera de local. | Revisión de arquitectura | **Resuelto** | Se resolvió con `VITE_API_URL` / `PUBLIC_API_ORIGIN` y fallbacks. |
| DEF-03 | Baja | El proyecto no tenía `svelte.config.js`; el adaptador se pasaba de forma no estándar por el plugin de Vite, y el entorno no declaraba las variables públicas. | Revisión de despliegue | **Resuelto** | Se creó `svelte.config.js` con selección de adaptador por entorno. |

---

## 9. Ejecución

### 9.1. Backend

```powershell
cd backend
pnpm test
```

Resultado esperado:

```
 Test Files  12 passed (12)
      Tests  98 passed (98)
```

### 9.2. Frontend

```powershell
cd frontend
pnpm test
```

Resultado esperado:

```
 Test Files  2 passed (2)
      Tests  22 passed (22)
```

### 9.3. Ejecución completa

```powershell
cd backend  ; pnpm test
cd frontend ; pnpm test
```

### 9.4. Verificación de tipos

```powershell
cd backend
.\node_modules\.bin\tsc.cmd --noEmit
# exit code 0
```

---

## 10. Documentos Relacionados

| Documento | Contenido |
|-----------|-----------|
| [`plan_de_pruebas.md`](../../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md) | Plan completo: objetivos, alcance, estrategia, riesgos. |
| [`matriz_pruebas.md`](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) | Catálogo de casos de prueba. |
| [`matriz_trazabilidad.md`](../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) | RF ↔ caso de prueba ↔ código. |
| [`enfoque_tdd.md`](../../02_diseno_construccion/pruebas_calidad/enfoque_tdd.md) | Práctica de TDD aplicada. |
| [`enfoque_bdd.md`](../../02_diseno_construccion/pruebas_calidad/enfoque_bdd.md) | Escenarios Gherkin de aceptación. |
| [`validacion_experimental.md`](../../02_diseno_construccion/pruebas_calidad/validacion_experimental.md) | Resultados medidos de rendimiento y seguridad. |

---

**Documentos relacionados**

- [`metodologia_general.md`](../metodologia/metodologia_general.md) — Marco metodológico
- [`metodologia_ia_aplicada.md`](../metodologia/metodologia_ia_aplicada.md) — Uso de IA en la codificación
