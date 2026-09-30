# Catálogo de Funcionalidades

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 1 — Planificación y Requerimientos
**Relación:** cada funcionalidad materializa uno o más `REQ-###` de [`requerimientos.md`](./requerimientos.md)

---

## 0. Convenciones

| Símbolo | Significado |
|---------|-------------|
| ✔ | Implementada y verificada por pruebas automatizadas |
| ◐ | Implementada parcialmente |
| ○ | Planificada (fuera de la versión 1.0.0) |
| ✖ | Fuera de alcance declarado |

Cada funcionalidad se registra con: **código**, **nombre**, **descripción**,
**actor principal**, **RF que satisface**, **endpoint o artefacto** y
**verificación**.

---

## 1. Mapa Funcional

```
SGD-FD
│
├─ 1. Autenticación ......................... FUNC-001 … FUNC-005
│   ├─ 1.1 Registro con emisión de clave .... FUNC-001
│   ├─ 1.2 Inicio de sesión .................. FUNC-002
│   ├─ 1.3 Renovación de token ............... FUNC-003
│   ├─ 1.4 Consulta de sesión ................ FUNC-004
│   └─ 1.5 Protección anti-fuerza-bruta ...... FUNC-005
│
├─ 2. Gestión Documental ..................... FUNC-006 … FUNC-012
│   ├─ 2.1 Listado de documentos ............. FUNC-006
│   ├─ 2.2 Subida y firma inicial ............. FUNC-007
│   ├─ 2.3 Versionado ....................... FUNC-008
│   ├─ 2.4 Detalle de documento .............. FUNC-009
│   ├─ 2.5 Historial de versiones ............ FUNC-010
│   ├─ 2.6 Código QR ......................... FUNC-011
│   └─ 2.7 Perfil público .................... FUNC-012
│
├─ 3. Visibilidad y Distribución ............ FUNC-013 … FUNC-015
│   ├─ 3.1 Compartir / dejar de compartir .... FUNC-013
│   ├─ 3.2 Vista pública ..................... FUNC-014
│   └─ 3.3 Descarga de archivos .............. FUNC-015
│
├─ 4. Coautoría ............................. FUNC-016 … FUNC-019
│   ├─ 4.1 Crear propuesta firmada ........... FUNC-016
│   ├─ 4.2 Bandeja de propuestas ............. FUNC-017
│   ├─ 4.3 Aceptar propuesta ................. FUNC-018
│   └─ 4.4 Rechazar propuesta ................ FUNC-019
│
├─ 5. Análisis de Cambios ................... FUNC-020
│   └─ 5.1 Comparación de artefactos ......... FUNC-020
│
├─ 6. Verificación Pública .................. FUNC-021 … FUNC-023
│   ├─ 6.1 Verificación por documento ........ FUNC-021
│   ├─ 6.2 Búsqueda por hash ................. FUNC-022
│   └─ 6.3 Verificación por URL / QR ......... FUNC-023
│
├─ 7. Auditoría ............................. FUNC-024 … FUNC-026
│   ├─ 7.1 Bitácora de auditoría ............. FUNC-024
│   ├─ 7.2 Verificación de cadena ............ FUNC-025
│   └─ 7.3 Eventos de seguridad .............. FUNC-026
│
└─ 8. Operación ............................. FUNC-027 … FUNC-029
    ├─ 8.1 Sonda de salud .................... FUNC-027
    ├─ 8.2 Migración de esquema .............. FUNC-028
    └─ 8.3 Carga de datos de demostración .... FUNC-029
```

---

## 2. Funcionalidades de Autenticación

### FUNC-001 — Registro con emisión de clave criptográfica ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Crea la cuenta del usuario y genera su par de claves RSA-2048. La clave privada se cifra con la contraseña del usuario mediante PBKDF2 + AES-256-GCM antes de persistirse. |
| **Actor principal** | Anónimo |
| **RF** | RF-001 |
| **Endpoint** | `POST /api/auth/register` |
| **Implementación** | `backend/src/services/auth.service.ts`, `backend/src/crypto/keyGenerator.ts`, `backend/src/crypto/keyProtection.ts` |
| **Verificación** | `tests/services/auth.service.test.ts`, `tests/integration/auth.api.test.ts` |
| **Datos generados** | `users` (1 fila), `user_keys` (1 fila), `audit_log` (`USER_REGISTERED`) |

### FUNC-002 — Inicio de sesión y emisión de tokens ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Valida las credenciales con bcryptjs y emite un par de tokens JWT firmados con secretos separados. |
| **Actor principal** | Usuario registrado |
| **RF** | RF-002 |
| **Endpoint** | `POST /api/auth/login` |
| **Implementación** | `auth.service.ts` (AuthService.login) |
| **Verificación** | `tests/services/auth.service.test.ts`, `tests/integration/auth.api.test.ts` |
| **Datos generados** | `audit_log` (`LOGIN_SUCCESS` o `LOGIN_FAILED`) |

### FUNC-003 — Renovación del token de acceso ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Valida el refresh token y emite un access token nuevo sin exigir las credenciales originales. |
| **Actor principal** | Usuario con sesión |
| **RF** | RF-003 |
| **Endpoint** | `POST /api/auth/refresh` |
| **Implementación** | `auth.service.ts` (AuthService.refresh) |
| **Verificación** | `tests/integration/auth.api.test.ts` |

### FUNC-004 — Consulta de la sesión actual ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Devuelve la identidad del portador del access token. |
| **Actor principal** | Autenticado |
| **RF** | RF-004 |
| **Endpoint** | `GET /api/auth/me` |
| **Implementación** | `backend/src/routes/auth.ts` |
| **Verificación** | `tests/integration/auth.api.test.ts` |

### FUNC-005 — Protección anti-fuerza-bruta ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Limita los intentos de autenticación por combinación IP + usuario y aplica rate limiting global. |
| **Actor principal** | Sistema |
| **RF** | RF-002, RF-026 |
| **Endpoint** | Middleware global y de `routes/auth.ts` |
| **Implementación** | `backend/src/middleware/rateLimit.ts` |
| **Verificación** | `tests/unit/rate-limit.test.ts` |
| **Parámetros** | Login: 20 req / 15 min · Registro: 10 req / 60 min · Global `/api`: 300 req / 15 min · Fuerza bruta: 5 fallos / 15 min |

---

## 3. Funcionalidades de Gestión Documental

### FUNC-006 — Listado de documentos del propietario ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Lista los documentos propios con su número de versión vigente, ordenados por fecha de actualización. |
| **Actor principal** | Autenticado |
| **RF** | RF-005 |
| **Endpoint** | `GET /api/docs` |
| **Implementación** | `DocumentService.getDocuments` |
| **Verificación** | `tests/integration/documents.api.test.ts` |

### FUNC-007 — Subida y firma del documento inicial ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Recibe el archivo, valida tipo y tamaño, firma su contenido con la clave del usuario y crea la versión 1 junto con su código QR. |
| **Actor principal** | Autenticado |
| **RF** | RF-006 |
| **Endpoint** | `POST /api/docs` |
| **Implementación** | `DocumentService.uploadDocument`, `DocumentService.storeOfficialVersion` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts` |
| **Datos generados** | `documents`, `document_versions` (v1), `document_signatures`, `audit_log` |
| **Restricciones** | PDF, DOC, DOCX o TXT · ≤ 10 MB · título y contraseña obligatorios |

### FUNC-008 — Creación de una nueva versión firmada ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Añade una versión al documento conservando intactas las anteriores. |
| **Actor principal** | Propietario |
| **RF** | RF-007 |
| **Endpoint** | `PUT /api/docs/:id` |
| **Implementación** | `DocumentService.updateDocument` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts`, `scenarios.test.ts` (escenario 1) |

### FUNC-009 — Detalle de documento ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Presenta la ficha del documento junto con su última versión y los datos del firmante y coautor. |
| **Actor principal** | Propietario |
| **RF** | RF-008 |
| **Endpoint** | `GET /api/docs/:id` |
| **Implementación** | `DocumentService.getDocument` |
| **Verificación** | `documents.api.test.ts` |

### FUNC-010 — Historial de versiones ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Lista el historial completo con autores, firmantes, hashes y descripciones de cambio. |
| **Actor principal** | Propietario |
| **RF** | RF-009 |
| **Endpoint** | `GET /api/docs/:id/versions` |
| **Implementación** | `DocumentService.getDocumentVersions` |
| **Verificación** | `documents.api.test.ts` |

### FUNC-011 — Emisión del código QR ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Genera el código QR que apunta a la URL pública de verificación del documento. |
| **Actor principal** | Propietario |
| **RF** | RF-010 |
| **Endpoint** | `GET /api/docs/:id/qr` |
| **Implementación** | `routes/documents.ts`, biblioteca `qrcode` |
| **Verificación** | `documents.api.test.ts` |
| **Parámetros** | 256 px de ancho, margen 2 |

### FUNC-012 — Perfil público de usuario ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Muestra los documentos que un usuario ha compartido, sin exponer datos personales. |
| **Actor principal** | Anónimo |
| **RF** | RF-013 |
| **Endpoint** | `GET /api/users/:username` |
| **Implementación** | `DocumentService.getPublicProfile`, `routes/users.ts` |
| **Verificación** | `documents.api.test.ts` |

---

## 4. Funcionalidades de Visibilidad y Distribución

### FUNC-013 — Compartir / dejar de compartir ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Alterna la bandera `is_public` del documento, habilitando o bloqueando la recepción de propuestas. |
| **Actor principal** | Propietario |
| **RF** | RF-011 |
| **Endpoint** | `PATCH /api/docs/:id/visibility` |
| **Implementación** | `DocumentService.setDocumentVisibility` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts` |

### FUNC-014 — Vista pública de documento ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Permite consultar un documento compartido sin necesidad de cuenta. |
| **Actor principal** | Anónimo |
| **RF** | RF-012 |
| **Endpoint** | `GET /api/docs/:id/public` |
| **Implementación** | `routes/documents.ts` |
| **Verificación** | `documents.api.test.ts` |
| **Seguridad** | Responde 404 indistintamente para documentos inexistentes y privados. |

### FUNC-015 — Descarga de archivos ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Descarga el archivo de una versión o de una propuesta, con control de acceso según visibilidad y rol. |
| **Actor principal** | Propietario, coautor o anónimo (si es público) |
| **RF** | RF-014, RF-019 |
| **Endpoints** | `GET /api/docs/:id/file`, `GET /api/docs/:id/proposals/:proposalId/file` |
| **Implementación** | `resolveVersionFile`, `resolveProposalFile`, `streamFile` |
| **Verificación** | `documents.api.test.ts`, `document.service.test.ts` |
| **Características** | Streaming sin cargar en memoria · `Content-Disposition` con nombre UTF-8 · `no-store` |

---

## 5. Funcionalidades de Coautoría

### FUNC-016 — Crear propuesta firmada ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Permite que un usuario registrado proponga una modificación de un documento público, firmando el contenido propuesto. |
| **Actor principal** | Coautor (usuario ≠ propietario) |
| **RF** | RF-015 |
| **Endpoint** | `POST /api/docs/:id/proposals` |
| **Implementación** | `DocumentService.createProposal` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts`, `scenarios.test.ts` (escenario 2) |
| **Reglas** | Requiere `is_public = 1` · Propietario excluido · Descripción de cambio obligatoria · Firma del proponente obligatoria |

### FUNC-017 — Bandeja de propuestas ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Presenta al propietario las propuestas recibidas, ordenadas por urgencia (pendientes primero) e incluye los datos de la versión base. |
| **Actor principal** | Propietario |
| **RF** | RF-016 |
| **Endpoint** | `GET /api/docs/:id/proposals` |
| **Implementación** | `DocumentService.getDocumentProposals` |
| **Verificación** | `documents.api.test.ts` |

### FUNC-018 — Aceptar propuesta ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Convierte una propuesta en versión oficial: el propietario firma el contenido y se registra la autoría del coautor. |
| **Actor principal** | Propietario |
| **RF** | RF-017 |
| **Endpoint** | `POST /api/docs/:id/proposals/:proposalId/accept` |
| **Implementación** | `DocumentService.acceptProposal` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts`, `scenarios.test.ts` (escenarios 2 y 3) |
| **Datos generados** | `document_versions` (nueva), `document_signatures`, actualización de `document_proposals`, `audit_log` |

### FUNC-019 — Rechazar propuesta ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Descarta la propuesta conservando su archivo y su firma como evidencia. |
| **Actor principal** | Propietario |
| **RF** | RF-018 |
| **Endpoint** | `POST /api/docs/:id/proposals/:proposalId/reject` |
| **Implementación** | `DocumentService.rejectProposal` |
| **Verificación** | `document.service.test.ts`, `documents.api.test.ts` |

---

## 6. Funcionalidades de Análisis

### FUNC-020 — Comparación de artefactos documentales ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Compara dos artefactos (versiones o propuestas) de un mismo documento y devuelve diferencias de metadatos y de contenido línea a línea. |
| **Actor principal** | Propietario, o cualquier usuario si el documento es público |
| **RF** | RF-020 |
| **Endpoint** | `GET /api/docs/:id/compare` |
| **Implementación** | `backend/src/services/document-analysis.ts` (`compareComparableArtifacts`, `buildLineDiff`, `extractComparableText`) |
| **Verificación** | `tests/unit/document-analysis.test.ts`, `documents.api.test.ts` |
| **Algoritmo** | Programación dinámica (tabla LCS) para el diff; O(n·m) en número de líneas |
| **Modos** | `text` · `pdf` (pdfplumber / PyPDF2) · `docx` (zip + XML) · `binary` (solo metadatos) |

---

## 7. Funcionalidades de Verificación Pública

### FUNC-021 — Verificación contra un documento conocido ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Compara el archivo recibido con una versión concreta del repositorio y determina si el contenido y la firma son válidos. |
| **Actor principal** | Anónimo |
| **RF** | RF-021 |
| **Endpoint** | `POST /api/verify` con `documentId` |
| **Implementación** | `routes/verify.ts`, `backend/src/crypto/verification.ts` |
| **Verificación** | `verify.api.test.ts`, `crypto.test.ts` |
| **Estados** | `VALID` · `MANIPULATED` · `INVALID_SIGNATURE` · `NOT_FOUND` |

### FUNC-022 — Búsqueda de coincidencias por hash ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Determina si un archivo recibido corresponde a alguna versión del repositorio, sin necesidad de conocer su identificador. |
| **Actor principal** | Anónimo |
| **RF** | RF-022 |
| **Endpoint** | `POST /api/verify` sin `documentId` |
| **Implementación** | `routes/verify.ts` |
| **Verificación** | `verify.api.test.ts` |
| **Estados** | `FOUND` · `NOT_FOUND` |

### FUNC-023 — Verificación por URL o QR ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Publica los datos de verificación del documento en una URL que el receptor puede escanear con la cámara del teléfono. |
| **Actor principal** | Anónimo |
| **RF** | RF-023 |
| **Endpoint** | `GET /api/verify/:documentId` |
| **Implementación** | `routes/verify.ts` |
| **Verificación** | `verify.api.test.ts` |
| **Estados** | 200 con datos · 404 `Documento no encontrado` |

---

## 8. Funcionalidades de Auditoría

### FUNC-024 — Bitácora de auditoría ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Permite al administrador consultar todos los eventos del sistema con filtros por tipo, entidad y rango de fechas. |
| **Actor principal** | Administrador |
| **RF** | RF-024 |
| **Endpoint** | `GET /api/audit` |
| **Implementación** | `routes/audit.ts`, `backend/src/services/audit.service.ts` |
| **Verificación** | `audit.service.test.ts`, `audit.api.test.ts` |
| **Seguridad** | `authenticate` + `requireAdmin` en todo el router |

### FUNC-025 — Verificación de integridad de la cadena ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Recorre la bitácora y comprueba que cada entrada encadena correctamente con la anterior, detectando cualquier manipulación. |
| **Actor principal** | Administrador |
| **RF** | RF-025 |
| **Endpoint** | `GET /api/audit/verify-chain` |
| **Implementación** | `AuditService.verifyChain` |
| **Verificación** | `audit.service.test.ts`, `scenarios.test.ts` (escenario 4) |
| **Respuesta** | 200 `valid: true` · 409 `valid: false` con `brokenAt` y `reason` |

### FUNC-026 — Registro de eventos de seguridad ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Audita los accesos y los intentos fallidos, con la IP de origen y sin datos sensibles. |
| **Actor principal** | Sistema |
| **RF** | RF-002, RF-041 |
| **Implementación** | `routes/auth.ts` |
| **Verificación** | `audit.service.test.ts` |
| **Eventos** | `LOGIN_SUCCESS` · `LOGIN_FAILED` |

---

## 9. Funcionalidades de Operación

### FUNC-027 — Sonda de salud ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Expone el estado del servicio para balanceadores y supervisión. |
| **Actor principal** | Infraestructura |
| **RF** | RF-027 |
| **Endpoint** | `GET /api/health` |
| **Implementación** | `backend/src/app.ts` |
| **Verificación** | Verificación manual documentada en Implementación |

### FUNC-028 — Migración de esquema ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Crea o actualiza el esquema de forma idempotente y segura, ejecutándose en cada arranque. |
| **Actor principal** | Sistema |
| **RF** | RNF-029 |
| **Comando** | `pnpm db:migrate` |
| **Implementación** | `backend/src/db/migrate.ts` |
| **Verificación** | `tests/helpers/db.ts` ejecuta la migración en cada prueba |
| **Idempotencia** | `CREATE TABLE IF NOT EXISTS` · `addColumnIfMissing` con `PRAGMA table_info` |

### FUNC-029 — Carga de datos de demostración ✔

| Campo | Valor |
|-------|-------|
| **Descripción** | Crea usuarios y documentos de ejemplo para evaluación y demostración. |
| **Actor principal** | Evaluador / desarrollador |
| **RF** | — |
| **Comandos** | `pnpm db:seed`, `pnpm db:seed-documents`, `pnpm db:reset` |
| **Implementación** | `backend/src/db/seed.ts`, `backend/src/db/seed-documents.ts` |
| **Datos** | `admin` / `carlos` / `maria`, con claves RSA generadas y cifradas |

---

## 10. Funcionalidades No Incluidas en la Versión 1.0.0

| Funcionalidad propuesta | Estado | Motivo |
|-------------------------|--------|--------|
| Firma electrónica acreditada bajo Ley 27269 | ✖ | Requiere Entidad de Certificación acreditada. |
| Sellado de tiempo por TSA | ✖ | `signed_at` es declarativo. |
| Cifrado en reposo de los archivos del repositorio | ○ | El sistema cifra la clave privada, no los documentos. |
| Notificaciones por correo/SMS | ○ | Sin servicio de mensajería. |
| Almacenamiento en la nube de objetos (S3 / Supabase Storage) | ○ | La capa ya está preparada; ver plan de nube. |
| Revocación de versiones | ○ | Contradice RN-02 (inmutabilidad). Se evaluaría marcar una versión como *retirada* sin borrarla. |
| Firma múltiple por versión | ○ | Hoy la firma es única; se registrarían filas adicionales en `document_signatures` con eliminar el `UNIQUE(version_id)`. |
| Integración con LDAP / SSO corporativo | ○ | Fuera del objetivo. |

---

## 11. Matriz de Cobertura Funcionalidad → Requerimiento

| Funcionalidad | RF | Módulo de código | Prueba |
|---------------|----|------------------|--------|
| FUNC-001 | RF-001 | `services/auth.service.ts` | `auth.service.test.ts` |
| FUNC-002 | RF-002 | `services/auth.service.ts` | `auth.service.test.ts` |
| FUNC-003 | RF-003 | `services/auth.service.ts` | `auth.api.test.ts` |
| FUNC-004 | RF-004 | `routes/auth.ts` | `auth.api.test.ts` |
| FUNC-005 | RF-002, RF-026 | `middleware/rateLimit.ts` | `rate-limit.test.ts` |
| FUNC-006 | RF-005 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-007 | RF-006 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-008 | RF-007 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-009 | RF-008 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-010 | RF-009 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-011 | RF-010 | `routes/documents.ts` | `documents.api.test.ts` |
| FUNC-012 | RF-013 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-013 | RF-011 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-014 | RF-012 | `routes/documents.ts` | `documents.api.test.ts` |
| FUNC-015 | RF-014, RF-019 | `routes/documents.ts` | `documents.api.test.ts` |
| FUNC-016 | RF-015 | `services/document.service.ts` | `document.service.test.ts` |
| FUNC-017 | RF-016 | `services/document.service.ts` | `documents.api.test.ts` |
| FUNC-018 | RF-017 | `services/document.service.ts` | `scenarios.test.ts` |
| FUNC-019 | RF-018 | `services/document.service.ts` | `document.service.test.ts` |
| FUNC-020 | RF-020 | `services/document-analysis.ts` | `document-analysis.test.ts` |
| FUNC-021 | RF-021 | `routes/verify.ts` | `verify.api.test.ts` |
| FUNC-022 | RF-022 | `routes/verify.ts` | `verify.api.test.ts` |
| FUNC-023 | RF-023 | `routes/verify.ts` | `verify.api.test.ts` |
| FUNC-024 | RF-024 | `services/audit.service.ts` | `audit.service.test.ts` |
| FUNC-025 | RF-025 | `services/audit.service.ts` | `audit.service.test.ts` |
| FUNC-026 | RF-002 | `routes/auth.ts` | `audit.service.test.ts` |
| FUNC-027 | RF-027 | `app.ts` | Manual |
| FUNC-028 | RNF-029 | `db/migrate.ts` | `tests/helpers/db.ts` |
| FUNC-029 | — | `db/seed.ts` | Manual |

---

**Documentos relacionados**

- [`requerimientos.md`](./requerimientos.md) — Documento maestro de RF y RNF
- [`historias_usuario.md`](./historias_usuario.md) — Historias de usuario por épica
- [`casos_uso.md`](./casos_uso.md) — Casos de uso CU-###
