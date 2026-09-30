# Funcionalidades del Aplicativo — DocuTrust

**Sistema de Gestión Documental con Firma Digital y Trazabilidad**
> Documento de referencia con todas las funcionalidades del sistema, presentadas en cuadros de doble entrada.
> Para la **instalación de dependencias y puesta en marcha** consulta [`04_instalacion.md`](./04_instalacion.md).
> Última actualización: revisión exhaustiva del código, suites de tests (98 backend + 17 frontend) en verde, verificación funcional por API y pase de diseño de las páginas colaborativas (descargas autenticadas, códigos de estado 403/404).

---

## 1. Módulos del Sistema

| Módulo | Descripción General | Acceso Requerido | Dónde se Implementa (Backend) | Dónde se Implementa (Frontend) |
|--------|--------------------|------------------|-------------------------------|-------------------------------|
| **Autenticación** | Registro, inicio de sesión y renovación de sesión mediante JWT | Público (registro/login) | `src/routes/auth.ts` · `src/services/auth.service.ts` | `/login/+page.svelte` · `/register/+page.svelte` |
| **Criptografía** | Generación de claves RSA-2048, cifrado de clave privada AES-256-GCM y firma | Interno (backend) | `src/crypto/keyGenerator.ts` · `keyProtection.ts` · `signature.ts` | — (transparente al usuario) |
| **Gestión Documental** | Subir, listar, consultar y versionar documentos firmados | Autenticado (user/admin) | `src/routes/documents.ts` · `src/services/document.service.ts` | `/documents/+page.svelte` · `/documents/[id]/+page.svelte` |
| **Código QR** | Generación de QR con la URL de verificación pública por documento | Autenticado | `documents.ts` (endpoint `/qr`) | `/documents/+page.svelte` · `/documents/[id]/+page.svelte` |
| **Verificación Pública** | Verificar integridad (hash) y autenticidad (firma) de un archivo sin cuenta | Público | `src/routes/verify.ts` · `src/crypto/verification.ts` | `/verify/+page.svelte` |
| **Auditoría y Trazabilidad** | Bitácora inmutable (append-only) encadenada por hashes, verificable | Solo admin | `src/routes/audit.ts` · `src/services/audit.service.ts` | `/audit/+page.svelte` |
| **Seguridad de Acceso** | Rate limiting y protección contra fuerza bruta | Interno (middleware) | `src/middleware/auth.ts` · `rateLimit.ts` · `app.ts` | — |
| **Comparación de Artefactos** *(nuevo)* | Extracción de texto (PDF/DOCX/texto) y diff LCS entre versiones o propuestas | Expuesto: `GET /api/docs/:id/compare` | `src/services/document-analysis.ts` · `routes/documents.ts` (endpoint `/compare`) | comparador en `/documents/[id]` |
| **Propuestas y Coautoría** *(nuevo)* | Crear/aceptar/rechazar propuestas de cambio sobre documentos públicos | Expuesto: `POST /api/docs/:id/proposals…` | `src/services/document.service.ts` (createProposal, acceptProposal, rejectProposal) · `routes/documents.ts` | panel de propuestas en `/documents/[id]` · formulario en `/v/[id]` |
| **Visibilidad Pública / Perfil Público** *(nuevo)* | Marcar documentos como públicos y exponer perfil público | Expuesto: `PATCH /api/docs/:id/visibility` · `GET /api/users/:username` | `setDocumentVisibility` · `getPublicProfile` en `document.service.ts` · `routes/users.ts` | compartir en `/documents/[id]` · `/u/[username]` · `/v/[id]` |
| **Seed de demostración** *(nuevo)* | Crear 5 usuarios y 13 documentos de ejemplo (versiones, propuestas, coautorías) | Script CLI | `src/db/seed-documents.ts` | — (datos para la UI) |
| **Pruebas automatizadas** *(nuevo)* | Suite de tests unit, de servicio e integración de API | `pnpm test` (backend y frontend) | `vitest` + `supertest` (backend) · `vitest` (frontend) | `api.test.ts` · `stores/auth.test.ts` |

---

## 2. Funcionalidades por Capa (Backend vs Frontend)

### 2.1 Autenticación

| Funcionalidad | Backend (Endpoint / Lógica) | Frontend (Página / Acción) | Datos / Requisitos |
|---------------|-----------------------------|----------------------------|--------------------|
| Registrar usuario | `POST /api/auth/register` | `/register` | username, email, password (≥12, mayúscula/minúscula/número/especial), fullName |
| Iniciar sesión | `POST /api/auth/login` | `/login` | username, password → devuelve accessToken + refreshToken |
| Refrescar token | `POST /api/auth/refresh` | 🔄 **Automático** en `api.ts` (reintento tras 401) | refreshToken → nuevo accessToken |
| Obtener perfil | `GET /api/auth/me` (protegido) | Store `auth` | Token JWT |
| Cerrar sesión | — (local) | Botón en `+layout.svelte` | Limpia localStorage |
| Protección contra fuerza bruta | Middleware `bruteForceProtection` (5 intentos / 15 min → bloqueo) | Mensaje de bloqueo en `/login` | Por IP + username |
| Rate limiting (login / register / global) | `createRateLimiter`: login 20/15min, register 10/h, global 300/15min | — | Por IP |

> ✅ **Nota:** Se corrigió el problema de "Token inválido o expirado": el cliente API ahora renueva automáticamente el accessToken (15 min de vida) usando el refreshToken y reintenta la petición.

### 2.2 Gestión Documental

| Funcionalidad | Backend (Endpoint) | Frontend (Página / Acción) | Comportamiento |
|---------------|--------------------|----------------------------|----------------|
| Listar documentos | `GET /api/docs` (protegido) | `/documents` | Solo documentos del usuario logueado |
| Subir documento | `POST /api/docs` (protegido, multipart) | `/documents` (formulario de subida) | Firma automática RSA-SHA256, genera v1, hash y QR; `is_public=0` por defecto |
| Detalle de documento | `GET /api/docs/:id` (protegido) | `/documents/[id]` | Última versión + firmante + coautor (si existe) |
| Historial de versiones | `GET /api/docs/:id/versions` (protegido) | `/documents/[id]` (sección historial) | Todas las versiones con hash, firmante, coautor |
| Actualizar (nueva versión) | `PUT /api/docs/:id` (protegido) | `/documents/[id]` (formulario) | Crea vN+1 firmada, conserva la anterior |
| Obtener QR | `GET /api/docs/:id/qr` (protegido) | `/documents/[id]` | DataURL QR → URL `/api/verify/:id` |

### 2.3 Verificación Pública

| Funcionalidad | Backend (Endpoint) | Frontend (Página / Acción) | Resultado |
|---------------|--------------------|----------------------------|-----------|
| Verificar por documento (ID) | `POST /api/verify` con `documentId` | `/verify` (subida de archivo) | VALID / MANIPULATED / INVALID_SIGNATURE / NOT_FOUND |
| Verificar por coincidencia de hash | `POST /api/verify` sin `documentId` | `/verify` | FOUND / NOT_FOUND |
| Info de verificación (QR scan) | `GET /api/verify/:documentId` (público) | `/verify?doc=ID` | Título, versión actual y firmante |

### 2.4 Auditoría (Solo Admin)

| Funcionalidad | Backend (Endpoint) | Frontend (Página / Acción) | Detalle |
|---------------|--------------------|----------------------------|---------|
| Listar bitácora | `GET /api/audit` (admin) | `/audit` | Paginado (1-200) + filtros (eventType, entityType, from, to) |
| Verificar integridad de cadena | `GET /api/audit/verify-chain` (admin) | `/audit` (indicador de integridad) | Recalcula SHA-256 encadenado → valid + entries + brokenAt |
| Registro de eventos | `auditService.append()` (interno) | — | append-only, hash encadenado (previous_hash → current_hash) |
| Bloqueo físico de modificación | Triggers `audit_log_no_update` / `audit_log_no_delete` | — | Error SQL si se intenta UPDATE/DELETE |

### 2.5 Colaboración Documental (Fase E) — Expuesto en API y UI ✅

| Funcionalidad | Endpoint (Backend) | Frontend | Propósito |
|---------------|--------------------|----------|-----------|
| Compartir documento (público/privado) | `PATCH /api/docs/:id/visibility` | `/documents/[id]` (botón "Compartir") | El propietario marca un documento como público y copia el enlace |
| Vista pública de documento | `GET /api/docs/:id/public` | `/v/[id]` | Cualquier visitante ve metadata + historial y descarga versiones |
| Descarga de archivo por versión | `GET /api/docs/:id/file?versionId=` | botones "Descargar" en lista y detalle | Solo si el doc es público o eres el propietario |
| Descarga autenticada de privados | — | `downloadFileWithAuth` en `api.ts`: botones "⭳ Descargar" en `/documents`, `/documents/[id]` e historial | fetch + blob + reintento tras `401` (renueva con refreshToken) — resuelve que `<a download>` no envía `Authorization` |
| Descarga de propuesta | `GET /api/docs/:id/proposals/:pid/file` | panel de propuestas | Propietario, proponente o cualquier visitante si el doc es público |
| Perfil público de usuario | `GET /api/users/:username` | `/u/[username]` | Documentos públicos de un usuario con enlace a cada doc |
| Crear propuesta | `POST /api/docs/:id/proposals` | `/v/[id]` (formulario) | Usuario registrado firma y propone cambios a un documento público |
| Listar propuestas | `GET /api/docs/:id/proposals` | `/documents/[id]` (panel) | Historial de propuestas (pending/accepted/rejected) |
| Aceptar propuesta | `POST /api/docs/:id/proposals/:pid/accept` | panel de propuestas | Propietario firma → nueva versión oficial + coautor |
| Rechazar propuesta | `POST /api/docs/:id/proposals/:pid/reject` | panel de propuestas | Propietario rechaza y registra la decisión en auditoría |
| Comparar versiones/propuestas | `GET /api/docs/:id/compare` | comparador en `/documents/[id]` | Diff de líneas + metadatos entre cualquier par de artefactos |
| Autenticación opcional para descargas | Middleware `authenticateOptional` | — | Permite descargar como visitante si el documento es público |
| Red de versiones y propuestas | — | gráfico SVG en `/documents/[id]` | Visualización tipo red neuronal (versiones oficiales + propuestas según su versión base y estado) |
| Extracción de texto | `compareDocumentArtifacts` + `extractComparableText` | — | TXT/MD/CSV/JSON/XML/YAML/LOG nativo; PDF/DOCX vía Python |

> ✅ **Nota (códigos de estado):** la pasarela de descargas mapea errores con `fileErrorStatus` — `403` si "No tienes permisos" y `404` si el documento/versión no existe (antes era un `400` genérico).

---

## 3. Cuadro de Doble Entrada — Funcionalidades vs Roles

| Funcionalidad | Visitante (sin sesión) | Usuario (user) | Administrador (admin) |
|---------------|:----------------------:|:--------------:|:----------------------:|
| Verificar un documento públicamente | ✅ | ✅ | ✅ |
| Obtener info de verificación por QR | ✅ | ✅ | ✅ |
| Registrarse (crear cuenta) | ✅ | — | — |
| Iniciar / cerrar sesión | — | ✅ | ✅ |
| Renovar token (automático) | — | ✅ | ✅ |
| Listar sus documentos | — | ✅ | ✅ |
| Subir documento firmado | — | ✅ | ✅ |
| Consultar detalle e historial | — | ✅ | ✅ |
| Crear nueva versión (firmada) | — | ✅ | ✅ |
| Generar código QR del documento | — | ✅ | ✅ |
| Ver perfil público de un usuario | ✅ | ✅ | ✅ |
| Ver documento público + descargar versiones | ✅ | ✅ | ✅ |
| Proponer cambios a un documento público | — | ✅ | ✅ (no sobre sus propios docs) |
| Aceptar / rechazar propuestas (coautoría) | — | — | ✅ (propietario) |
| Comparar versiones y propuestas | — | ✅ | ✅ |
| Ver panel de auditoría | — | — | ✅ |
| Verificar integridad de la cadena de auditoría | — | — | ✅ |

---

## 4. Cuadro de Doble Entrada — Funcionalidades vs Fases del Proyecto

| Funcionalidad | Fase A (Fundamentos) | Fase B (Criptografía) | Fase C (Documentos) | Fase D (Trazabilidad) | Fase E (Colaboración) ⭐ |
|---------------|:--------------------:|:---------------------:|:-------------------:|:---------------------:|:------------------------:|
| Registro de usuarios | ✅ | ✅ | — | — | — |
| Login + JWT + refresh | ✅ | — | — | — | — |
| Generación de claves RSA-2048 | — | ✅ | — | — | — |
| Cifrado de clave privada AES-256-GCM | — | ✅ | — | — | — |
| Firma de documentos (RSA-SHA256) | — | ✅ | ✅ | — | — |
| Verificación de hash y firma | — | ✅ | — | — | — |
| Código QR de verificación | — | ✅ | ✅ | — | — |
| Subir / listar / ver documentos | — | — | ✅ | — | — |
| Versionado automático (v1, v2…) | — | — | ✅ | — | — |
| Auditoría encadenada (hashes) | — | — | — | ✅ | — |
| Verificación de la cadena | — | — | — | ✅ | — |
| Rate limiting / fuerza bruta | — | — | — | ✅ | — |
| Token refresh automático (frontend) | — | — | — | ✅ | — |
| Visibilidad pública de documentos | — | — | — | — | ✅ |
| Propuestas de cambio (coautoría) | — | — | — | — | ✅ |
| Comparación de versiones/propuestas | — | — | — | — | ✅ |
| Perfil público de usuario | — | — | — | — | ✅ |
| Descarga de archivos por versión | — | — | — | — | ✅ |

> **Leyenda:** ✅ = completo y expuesto en API + UI.

---

## 5. Cuadro de Doble Entrada — Tablas de Base de Datos vs Uso

| Tabla | Autenticación | Criptografía | Documentos | Colaboración | Auditoría |
|-------|:-------------:|:------------:|:----------:|:------------:|:---------:|
| `users` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `user_keys` | — | ✅ | ✅ | ✅ | — |
| `documents` (con `is_public`) | — | — | ✅ | ✅ | ✅ |
| `document_versions` (con `coauthor_id`, `source_proposal_id`) | — | — | ✅ | ✅ | ✅ |
| `document_proposals` | — | ✅ | ✅ | ✅ | ✅ |
| `document_signatures` (con `signed_at`) | — | ✅ | ✅ | ✅ | — |
| `audit_log` (append-only) | — | — | — | — | ✅ |

---

## 6. Cuadro de Doble Entrada — Algoritmos Criptográficos vs Propósito

| Algoritmo / Mecanismo | Clave generada | Firma de documento | Verificación | Protección de clave privada | Integridad | Auditoría |
|----------------------|:--------------:|:------------------:|:------------:|:---------------------------:|:----------:|:---------:|
| RSA-2048 (claves) | ✅ | — | — | — | — | — |
| RSA-SHA256 (firma) | — | ✅ | ✅ | — | — | — |
| SHA-256 (hash de archivo) | — | ✅ | ✅ | — | — | — |
| AES-256-GCM (cifrado simétrico) | — | — | — | ✅ | — | — |
| PBKDF2 100k (derivación de clave) | — | — | — | ✅ | — | — |
| SHA-256 (cadena de auditoría) | — | — | — | — | — | ✅ |

---

## 7. Cuadro de Doble Entrada — Endpoints de la API vs Método HTTP

| Endpoint | GET | POST | PUT | Autenticado | Rol |
|----------|:---:|:----:|:---:|:-----------:|:---:|
| `/api/health` | ✅ | — | — | No | Público |
| `/api/auth/register` | — | ✅ | — | No | Público |
| `/api/auth/login` | — | ✅ | — | No | Público |
| `/api/auth/refresh` | — | ✅ | — | No | — |
| `/api/auth/me` | ✅ | — | — | Sí | user/admin |
| `/api/docs` | ✅ | ✅ | — | Sí | user/admin |
| `/api/docs/:id` | ✅ | — | ✅ | Sí | user/admin |
| `/api/docs/:id/versions` | ✅ | — | — | Sí | user/admin |
| `/api/docs/:id/qr` | ✅ | — | — | Sí | user/admin |
| `/api/docs/:id/public` | ✅ | — | — | No | Público |
| `/api/docs/:id/file` | ✅ (stream) | — | — | Opcional | Público si es público / propietario |
| `/api/docs/:id/visibility` | — | — | ✅ PATCH | Sí | propietario |
| `/api/docs/:id/proposals` | ✅ | ✅ | — | Listar: propietario · Crear: user logueado en doc público | propietario / user |
| `/api/docs/:id/proposals/:pid/file` | ✅ (stream) | — | — | Opcional | Público / propietario / proponente |
| `/api/docs/:id/proposals/:pid/accept` | — | ✅ | — | Sí | propietario |
| `/api/docs/:id/proposals/:pid/reject` | — | ✅ | — | Sí | propietario |
| `/api/docs/:id/compare` | ✅ | — | — | Opcional | Público si es público / propietario |
| `/api/users/:username` | ✅ | — | — | No | Público |
| `/api/verify` | — | ✅ | — | No | Público |
| `/api/verify/:id` | ✅ | — | — | No | Público |
| `/api/audit` | ✅ | — | — | Sí | **admin** |
| `/api/audit/verify-chain` | ✅ | — | — | Sí | **admin** |

---

## 8. Cuadro de Doble Entrada — Pantallas del Frontend vs Su Propósito

| Ruta (Página) | Propósito Principal | Requiere Sesión | Acciones Disponibles |
|---------------|--------------------|:---------------:|----------------------|
| `/` (inicio) | Landing / presentación | No | Enlaces de acceso |
| `/login` | Iniciar sesión | No | Login, ir a registro, ver usuarios demo |
| `/register` | Crear cuenta | No | Registro con validación de contraseña |
| `/dashboard` | Resumen del usuario | Sí | Acceso a documentos, verificar, auditoría (admin) + franja "Colaboración" (compartir / perfil público / verificar) |
| `/documents` | Lista + subir documentos | Sí | Listar, subir y firmar, descargar versión actual, ver estado público |
| `/documents/[id]` | Detalle + versiones | Sí (propietario) | Nueva versión, descargar por versión, compartir (público/privado) + copiar enlace, panel de propuestas (aceptar/rechazar con contraseña), red de versiones y propuestas (SVG), comparador de artefactos |
| `/u/[username]` | Perfil público de usuario | No | Ver documentos públicos, ir a cada documento, descargar versión actual |
| `/v/[id]` | Vista pública de documento | No | Ver historial, descargar versiones y (si estás logueado y no eres propietario) enviar una propuesta firmada |
| `/verify` | Verificación pública | No | Verificar archivo, resultado QR |
| `/audit` | Auditoría (admin) | Sí (admin) | Listar eventos, verificar cadena, filtros |

---

## 9. Cuadro de Doble Entrada — Seguridad vs Contramedida Implementada

| Amenaza / Riesgo | Contramedida Implementada | Módulo / Archivo |
|------------------|---------------------------|------------------|
| Robo de clave privada | Cifrado AES-256-GCM + PBKDF2, nunca en disco en texto plano | `crypto/keyProtection.ts` |
| Manipulación del documento | Hash SHA-256 por versión + firma RSA | `crypto/signature.ts` · `verification.ts` |
| Manipulación de la auditoría | Cadena de hashes SHA-256 + triggers append-only | `services/audit.service.ts` · `db/migrate.ts` |
| Fuerza bruta en login | Bloqueo tras 5 intentos fallidos (15 min) | `middleware/rateLimit.ts` |
| Abuso de endpoints | Rate limiting (login/register/global por IP) | `middleware/rateLimit.ts` · `app.ts` |
| Suplantación en rutas protegidas | Middleware `authenticate` (JWT) | `middleware/auth.ts` |
| Acceso no autorizado a descargas | Passarela de permisos: público OR propietario OR proponente (`resolveVersionFile` / `resolveProposalFile`) con `403`/`404` explícitos | `services/document.service.ts` · `authenticateOptional` · `routes/documents.ts` |
| Propuestas sobre documentos privados | `createProposal` exige `is_public` y usuario ≠ propietario | `services/document.service.ts` |
| Acceso no autorizado a auditoría | Middleware `requireAdmin` | `middleware/auth.ts` |
| Sesión expirada (15 min) | 🔄 Renovación automática con refreshToken | `frontend/src/lib/api.ts` |
| XSS / headers inseguros | Helmet | `app.ts` |
| Compartición entre orígenes | CORS restringido a `CORS_ORIGIN` | `app.ts` |
| Archivos maliciosos / oversize | Validación MIME + límite 10 MB (multer) + error handler 413 | `routes/documents.ts` · `app.ts` |

---

## 10. Stack Tecnológico vs Componente del Sistema

| Tecnología | Frontend | Backend | Base de Datos | Criptografía | Seguridad |
|------------|:--------:|:-------:|:-------------:|:------------:|:---------:|
| SvelteKit 2 + Svelte 5 | ✅ | — | — | — | — |
| Express 4 + TypeScript | — | ✅ | — | — | — |
| SQLite (sql.js) | — | — | ✅ | — | — |
| Node.js `crypto` (RSA, AES, SHA) | — | — | — | ✅ | — |
| `qrcode` | — | ✅ | — | — | — |
| JWT + bcryptjs | — | — | — | — | ✅ |
| multer (subida de archivos) | — | ✅ | — | — | — |
| Python (extracción PDF/DOCX, opcional) | — | ⚠️ | — | — | — |
| Vitest + Supertest (pruebas) | — | ✅ | — | — | — |

---

## 11. Eventos de Auditoría Registrados

| Evento | Descripción | Origen |
|--------|-------------|--------|
| `USER_REGISTERED` | Alta de usuario | `auth.service.ts` |
| `LOGIN_SUCCESS` | Inicio de sesión correcto | `auth.service.ts` |
| `LOGIN_FAILED` | Intento de login fallido | `routes/auth.ts` |
| `DOCUMENT_UPLOAD` | Subida de documento (v1) | `document.service.ts` |
| `DOCUMENT_UPDATE` | Nueva versión oficial | `document.service.ts` |
| `DOCUMENT_VISIBILITY_CHANGED` | Cambio de visibilidad pública (service) | `document.service.ts` |
| `DOCUMENT_PROPOSAL_CREATED` | Propuesta creada (service) | `document.service.ts` |
| `DOCUMENT_PROPOSAL_ACCEPTED` | Propuesta aceptada → coautoría (service) | `document.service.ts` |
| `DOCUMENT_PROPOSAL_REJECTED` | Propuesta rechazada (service) | `document.service.ts` |

> **Nota técnica (bug corregido):** la migración de BD fallaba al arrancar sobre una base existente porque los índices que usan `coauthor_id` se creaban antes de agregar la columna. Se reordenó `migrate.ts` (primero `addColumnIfMissing`, luego índices) y el sistema arranca correctamente.