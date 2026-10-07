# Estado del Progreso v2.0 — Sistema de Gestión Documental con Firma Digital y Trazabilidad

> **Versión 2.0** — Revisión exhaustiva del código y verificación funcional por API (backend + frontend).
> 🟢 El sistema arranca y todos los endpoints verificados responden correctamente.

---

## 1. Resumen General

| Fase | Nombre | Estado | Detalle |
|------|--------|--------|---------|
| **A** | Fundamentos (auth + frontend básico) | ✅ **Completada** | Registro, login, refresh, JWT, sesión |
| **B** | Criptografía (RSA + firma + verificación + QR) | ✅ **Completada** | Claves, cifrado, firma, hash, QR |
| **C** | Documentos (versionado + historial) | ✅ **Completada** | Subir, listar, versionar, actualizar |
| **D** | Trazabilidad y Seguridad (auditoría inmutable + hardening) | ✅ **Completada** | Cadena de hashes, rate limiting, fuerza bruta |
| **E** | Colaboración (propuestas + comparación + visibilidad) | ✅ **Completada** | Servicios + rutas HTTP + UI en SvelteKit (ver §3) |

### Verificación funcional realizada (API real)

| Endpoint | Resultado |
|----------|-----------|
| `GET /api/health` | ✅ `ok` |
| `POST /api/auth/login` | ✅ token generado (admin) |
| `GET /api/auth/me` | ✅ usuario autenticado |
| `POST /api/auth/refresh` | ✅ nuevo accessToken (244 chars) |
| `GET /api/docs` | ✅ lista documentos |
| `GET /api/audit` | ✅ 5 items paginados |
| `GET /api/audit/verify-chain` | ✅ `valid=true`, **34 entradas** encadenadas (tras flujo E2E) |
| Flujo E2E colaborativo | ✅ doc público → propuesta (carlos) + propuesta (maria) → comparador (add=2/del=1) → aceptar (v2 + coautor=carlos) → rechazar (maria=rejected) → descarga anónima → perfil público |
| **E2E final tras rediseño UI** | ✅ **21/21 checks PASS**: descargas (pública anónima, por versión, privada con JWT, privada anónima → `403`), perfiles, propuestas, comparador, y todas las rutas UI (`/u`, `/v`, `/documents`, `/documents/[id]`, dashboard, verify) responden `200` |
| Backend (`vitest run`) | ✅ **12 archivos / 98 tests PASS** (unit, services e integración API con supertest + BD temp) |
| Frontend (`vitest run`) | ✅ **2 archivos / 22 tests PASS** (`api.test.ts`, `stores/auth.test.ts`) |
| `pnpm db:seed-documents` | ✅ crea 5 usuarios y **13 documentos de ejemplo** (versiones, propuestas pendientes/rechazadas/aceptadas con coautoría) |
| Frontend (`pnpm check`) | ✅ 0 errores / 0 warnings |
| Backend (`tsc --noEmit`) | ✅ 0 errores |

---

## 2. Fase D: Trazabilidad y Seguridad — Ahora COMPLETA

> Fase D había sido marcada como "Pendiente" en la v1. **Ya está implementada y verificada.**

### Completado

- [x] **Servicio de auditoría** (`services/audit.service.ts`): `append`, `list` (paginado + filtros), `count`, `verifyChain`
- [x] **Encadenamiento de hashes** SHA-256 entre registros (`previous_hash` → `current_hash`)
- [x] **Bloqueo físico de modificación**: triggers `audit_log_no_update` y `audit_log_no_delete` (append-only real)
- [x] **Endpoint** `GET /api/audit` (solo admin) con paginación (1-200) y filtros `eventType`, `entityType`, `from`, `to`
- [x] **Endpoint** `GET /api/audit/verify-chain` (solo admin)
- [x] **Panel de auditoría en frontend** (`/audit/+page.svelte`) con integridad de cadena visible
- [x] **Rate limiting**: login (20/15min), register (10/h), global API (300/15min) por IP
- [x] **Protección contra fuerza bruta**: 5 intentos fallidos → bloqueo 15 min por IP+usuario
- [x] **Helmet + CORS restringido** + manejo de errores (413/MIME)
- [x] **Logging seguro**: sin passwords/tokens/claves (eventos `[REDACTED]`)
- [x] **Renovación automática de token en frontend** (`api.ts`): reintento tras 401 usando refreshToken

---

## 3. Fase E (Nueva): Colaboración Documental — Ahora COMPLETA

> **Novedad desde v1:** el backend ya incorporaba la capa de servicios de colaboración; en esta revisión se **expuso por la API y se construyó la interfaz completa en SvelteKit**.

### Completado a nivel de Servicio y Base de Datos

- [x] Esquema ampliado:
  - `documents.is_public` (columna)
  - `document_versions.coauthor_id` + `document_versions.source_proposal_id` (columnas)
  - Tabla `document_proposals` (estados `pending` / `accepted` / `rejected`)
  - `document_signatures.signed_at` explícito
  - Índices para versiones, propuestas, coautoría, auditoría, usuarios
- [x] `setDocumentVisibility` — compartir/privado (con auditoría `DOCUMENT_VISIBILITY_CHANGED`)
- [x] `createProposal` — usuario no propietario firma un archivo y propone cambios a un documento público (auditoría `DOCUMENT_PROPOSAL_CREATED`)
- [x] `acceptProposal` — el propietario acepta → se crea versión oficial con firma del propietario Y coautoría del proponente (auditoría `DOCUMENT_PROPOSAL_ACCEPTED`)
- [x] `rejectProposal` — rechazo con registro de decisión (auditoría `DOCUMENT_PROPOSAL_REJECTED`)
- [x] `getDocumentProposals` — listado ordenado (pending → accepted → rejected)
- [x] `getPublicProfile` — perfil público con documentos visibles, firmante y coautor
- [x] **Análisis y comparación de artefactos** (`services/document-analysis.ts`):
  - Extracción de texto: TXT/MD/CSV/JSON/XML/YAML/LOG (nativo) y PDF/DOCX (vía Python pdfplumber/PyPDF2/XML++)
  - Algoritmo LCS para diff línea a línea (iguales / insertadas / eliminadas)
  - Comparación de metadatos: nombre, MIME, tamaño, hash, origen
  - `compareDocumentArtifacts` (versión↔versión, versión↔propuesta, propuesta↔propuesta) con control de permisos
- [x] Pasarela de descargas con permisos: `resolveVersionFile` (público OR propietario) y `resolveProposalFile` (público OR propietario OR proponente)

### Completado a nivel de Rutas HTTP

- [x] `PATCH /api/docs/:id/visibility` — compartir/privado (propietario)
- [x] `GET /api/docs/:id/public` — vista pública de documento (sin sesión)
- [x] `GET /api/docs/:id/file?versionId=` — descarga de una versión (auth opcional; público o propietario)
- [x] `POST /api/docs/:id/proposals` — crear propuesta firmada (multer + validación MIME/10MB)
- [x] `GET /api/docs/:id/proposals` — listar (propietario)
- [x] `GET /api/docs/:id/proposals/:pid/file` — descargar propuesta (público/propietario/proponente)
- [x] `POST /api/docs/:id/proposals/:pid/accept` — aceptar con contraseña del propietario (firma nueva versión + coautor)
- [x] `POST /api/docs/:id/proposals/:pid/reject` — rechazar
- [x] `GET /api/docs/:id/compare?sourceType=&sourceId=&targetType=&targetId=` — comparador
- [x] `GET /api/users/:username` — perfil público
- [x] Middleware `authenticateOptional` — permite descargas públicas sin forzar sesión

### Completado a nivel de Frontend (SvelteKit)

- [x] `/documents/[id]` reescrito: **compartir** (toggle + copiar enlace público), **panel de propuestas** (descargar / aceptar con contraseña / rechazar), **red de versiones y propuestas** (gráfico SVG tipo red neuronal: versión oficial + propuestas colgando de su versión base, coloreadas por estado), **comparador** (selector base/objetivo entre versiones y propuestas, diff línea a línea + metadatos), descarga por versión, coautor visible en historial
- [x] `/u/[username]` — **perfil público** de usuario con documentos públicos y descargas
- [x] `/v/[id]` — **vista pública** de documento: historial, descargas y formulario "Enviar propuesta" (para usuarios con sesión que no son propietarios)
- [x] `/documents` — botón **descargar versión actual** + etiqueta de visibilidad
- [x] `api.ts` — métodos nuevos: `setDocumentVisibility`, `getPublicDocument`, `getPublicProfile`, `getDocumentProposals`, `createProposal`, `acceptProposal`, `rejectProposal`, `compareArtifacts`, URLs de descarga
- [x] `pnpm check` → **0 errores / 0 warnings**
- [x] **Rediseño de la UI colaborativa**: `/u/[username]` (banner con gradiente, avatar, stats, grid de documentos), `/v/[id]` (header con CTA de descarga, línea de tiempo de versiones, formulario de propuesta), `/documents/[id]` (chips, barra de compartir, estado, red SVG y comparador con botón intercambiar), `/dashboard` (franja "Colaboración" con enlaces a compartir / perfil / verificar)
- [x] **Descargas de privados desde el navegador**: `downloadFileWithAuth` (fetch + blob + refresh) en `api.ts`; la pasarela de descargas responde `403`/`404` vía `fileErrorStatus`

### Pendiente (fuera de alcance de la Fase E)

- [ ] Documentar dependencia de Python para extracción PDF/DOCX (opcional, con fallback a metadatos)
- [ ] HTML de página de verificación por QR más rica

---

## 4. Estado del Código por Capa

| Capa | Archivos | Estado |
|------|----------|--------|
| **app / middleware** | `app.ts`, `middleware/auth.ts` (incl. `authenticateOptional`), `middleware/rateLimit.ts` | ✅ Funcional |
| **Rutas expuestas** | `routes/auth.ts`, `routes/documents.ts` (visibilidad, descargas, propuestas, compare, público), `routes/users.ts`, `routes/verify.ts`, `routes/audit.ts` | ✅ Verificadas por API (incl. E2E Fase E) |
| **Servicios** | `auth.service.ts`, `document.service.ts` (~840 líneas), `audit.service.ts`, `document-analysis.ts` | ✅ Incluye features Fase E expuestos |
| **Criptografía** | `keyGenerator.ts`, `keyProtection.ts`, `signature.ts`, `verification.ts` | ✅ Verificada (RSA-2048, AES-256-GCM, PBKDF2, SHA-256) |
| **Base de datos** | `connection.ts`, `migrate.ts`, `query.ts`, `seed.ts`, `seed-documents.ts`, `repair-paths.ts` | ✅ Migración idempotente/actualizable + seed de demo (13 docs) + reparador de rutas |
| **Frontend** | `api.ts` (refresh automático + métodos colaborativos), **11 páginas** SvelteKit (/u, /v nuevos) | ✅ `pnpm check` sin errores/warnings |

### Estructura actual de archivos

```
tesis-documental/
├── README.md
├── 04_instalacion.md       ← guía de instalación de dependencias (nuevo)
├── 05_ejecucion.md         ← acceso rápido a pnpm dev
├── 01_planificacion.md
├── 06_progreso.md          ← v1 (desactualizada)
├── 07_progreso_2_0.md       ← v2 (este documento)
├── 02_funcionalidades.md   ← cuadros de doble entrada actualizados
├── backend/
│   ├── .env / .env.example
│   ├── src/
│   │   ├── app.ts
│   │   ├── crypto/        keyGenerator, keyProtection, signature, verification
│   │   ├── db/            connection, migrate, query, seed, seed-documents, repair-paths
│   │   ├── middleware/    auth, rateLimit
│   │   ├── models/        types
│   │   ├── routes/        auth, documents, users, verify, audit
│   │   └── services/      auth.service, document.service, document-analysis, audit.service
│   ├── tests/             vitest: helpers, unit, services, integration (98 tests)
│   └── data/database.sqlite · uploads/
└── frontend/
    ├── src/lib/           api.ts, stores/auth.ts (+ api.test.ts, auth.test.ts)
    └── src/routes/        +layout, +page, login, register, dashboard,
                           documents, documents/[id],
                           u/[username], v/[id], verify, audit
```

---

## 5. Endpoints de la API (Verificados)

| Método | Endpoint | Auth | Rol | Estado |
|--------|----------|------|-----|--------|
| GET | `/api/health` | No | — | ✅ |
| POST | `/api/auth/register` | No | — | ✅ |
| POST | `/api/auth/login` | No | — | ✅ |
| POST | `/api/auth/refresh` | No | — | ✅ |
| GET | `/api/auth/me` | Sí | user/admin | ✅ |
| GET | `/api/docs` | Sí | user/admin | ✅ |
| POST | `/api/docs` | Sí | user/admin | ✅ |
| PUT | `/api/docs/:id` | Sí | user/admin | ✅ |
| GET | `/api/docs/:id` | Sí | user/admin | ✅ |
| GET | `/api/docs/:id/versions` | Sí | user/admin | ✅ |
| GET | `/api/docs/:id/qr` | Sí | user/admin | ✅ |
| GET | `/api/docs/:id/public` | No | — | ✅ |
| GET | `/api/docs/:id/file` | Opcional | público/propietario | ✅ |
| PATCH | `/api/docs/:id/visibility` | Sí | propietario | ✅ |
| GET | `/api/docs/:id/proposals` | Sí | propietario | ✅ |
| POST | `/api/docs/:id/proposals` | Sí | user (doc público) | ✅ |
| GET | `/api/docs/:id/proposals/:pid/file` | Opcional | público/propietario/proponente | ✅ |
| POST | `/api/docs/:id/proposals/:pid/accept` | Sí | propietario | ✅ |
| POST | `/api/docs/:id/proposals/:pid/reject` | Sí | propietario | ✅ |
| GET | `/api/docs/:id/compare` | Opcional | público/propietario | ✅ |
| GET | `/api/users/:username` | No | — | ✅ |
| POST | `/api/verify` | No | — | ✅ |
| GET | `/api/verify/:documentId` | No | — | ✅ |
| GET | `/api/audit` | Sí | **admin** | ✅ |
| GET | `/api/audit/verify-chain` | Sí | **admin** | ✅ |

---

## 6. Base de Datos Actualizada

| Tabla | Columnas clave actuales | Estado |
|-------|-------------------------|--------|
| `users` | id, username, email, password_hash, role, full_name, is_active | ✅ |
| `user_keys` | user_id, public_key, encrypted_private_key, key_algorithm, key_fingerprint | ✅ |
| `documents` | **+ `is_public`** | ✅ |
| `document_versions` | **+ `coauthor_id`, `source_proposal_id`** | ✅ |
| `document_proposals` | estado `pending/accepted/rejected`, revisión, versión aceptada | ✅ |
| `document_signatures` | **+ `signed_at`** explícito | ✅ |
| `audit_log` | cadena de hashes + triggers append-only | ✅ |

Índices creados: versiones (documento, coautor), documentos (owner+public), propuestas (documento+estado, base, creador), auditoría (entidad, hash), usuarios (username, email).

### Migración

- **Script**: `pnpm db:migrate` (idempotente: `CREATE IF NOT EXISTS` + `addColumnIfMissing`)
- **Seeds**: `pnpm db:seed` (3 usuarios con claves RSA-2048)

### ⚠️ Bug corregido en esta revisión

La migración **fallaba al arrancar** sobre una base de datos preexistente:

```
Error: no such column: coauthor_id
  at runMigration (migrate.ts:143)
```

**Causa:** los `CREATE INDEX` (coautoría, visibilidad) se ejecutaban *antes* de `addColumnIfMissing`, y la BD existente aún no tenía las columnas nuevas.

**Solución:** reordenar `migrate.ts` → primero `addColumnIfMissing`, luego los índices. Verificado: el backend arranca y la API responde.

### ⚠️ Bug corregido en esta revisión (v2.0 Fase E)

Los endpoints `PATCH /visibility` y `POST /proposals/:pid/reject` llamaban a métodos `async` **sin `await`**, por lo que la respuesta serializaba una `Promise` como `data: {}` (el cambio sí se aplicaba en BD pero la API no lo devolvía). Se añadió `await` en los handlers y la respuesta ahora incluye `{documentId, isPublic}` / `{proposalId, status}`.

### ⚠️ Bug corregido en el pase de diseño (v2.0 UI)

1. **Descargas de documentos privados rotas en el navegador**: los enlaces `<a download>` no envían `Authorization`, así que un propietario no podía descargar un documento privado desde la interfaz. Se añadió `downloadFileWithAuth` en `api.ts` (fetch + blob + reintento tras `401` con refresh) y se reemplazaron los enlaces por botones de descarga autenticada en `/documents`, `/documents/[id]` y el historial.
2. **Códigos de estado en la pasarela de descargas**: los errores de permisos/archivo se devolvían como `400` genérico. Ahora `fileErrorStatus` mapea a `403` ("No tienes permisos") y `404` (no encontrado) en `GET /docs/:id/file` y `GET /docs/:id/proposals/:pid/file`.
3. **Diseño de las nuevas páginas**: se rediseñaron `/u/[username]` (banner con gradiente, avatar, stats, grid de documentos) y `/v/[id]` (header con CTA de descarga, línea de tiempo de versiones, formulario de propuesta). El detalle `/documents/[id]` se reescribió con chips, barra de compartir, estado, red SVG y comparador con selector intercambiable. El dashboard ganó una franja de "Colaboración" que enlaza a compartir/perfil/verificar.

### ⚠️ Bugs corregidos en la revisión de tests (v2.0 infraestructura)

4. **Vitest no arrancaba**: `vite@8.2.2` se publica sin `dist/node/chunks/node.js` (el paquete está incompleto), por lo que `vitest run` fallaba con `ERR_MODULE_NOT_FOUND` en `vite/dist/node/index.js`. Solución: fijar `vite@8.0.16` (exacto) en backend y frontend. Efecto colateral: `vite dev` sigue funcionando igual.
5. **Suite de tests del backend incompleta**: los tests en `backend/tests/` (vitest + supertest) existían pero faltaban dependencias y script. Se añadieron `vitest`, `supertest`, `@types/supertest`, el script `pnpm test` y `vitest.config.ts`. Verificado: **98/98 PASS** y **17/17 PASS** en frontend.
6. **`MaxListenersExceededWarning` en tests**: `app.ts` registraba manejadores de `SIGINT`/`SIGTERM` a nivel de módulo; al importar la app repetidamente (`vi.resetModules`) se acumulaban listeners. Los manejadores ahora solo se registran cuando `app.ts` es el entry point (`isMainModule()`), junto al arranque.
7. **Nuevos scripts funcionales**: `pnpm db:seed-documents` (poblado de 13 documentos con versiones/propuestas/coautorías) y `src/db/repair-paths.ts` (repara rutas de archivos movidas), ambos verificados en tiempo de ejecución.

### ⚠️ Bugs corregidos en la ronda de enlaces (v2.1)

8. **El enlace público estaba hardcodeado a `http://localhost:5173`**: en `/documents/[id]`, la dirección visible en la barra de compartir y el texto que escribía «Copiar enlace» usaban esa URL fija, así que en cualquier otro entorno se copiaba un enlace inexistente. Ambos se construyen ahora con `$page.url.origin`.
9. **El panel de confirmación tras subir un documento enlazaba a la URL equivocada**: `documents/+page.svelte` mostraba un panel con el QR y `verificationUrl` devueltos por el backend, cuyo valor apunta a `http://<backend>/api/verify/<id>` (una dirección de API, no de la interfaz). Se eliminó el panel; el QR y el enlace público siguen disponibles en la barra de compartir del detalle.
10. **Carácter `¿` residual** en el cambio de la última versión de `/v/[id]` y `/documents/[id]`, introducido en el commit inicial. Corregido.

---

## 7. Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!@#` | admin |
| `carlos` | `Carlos123!@#` | user |
| `maria` | `Maria123!@#` | user |

---

## 8. Cómo Ejecutar

> **Instalación desde cero (nuevo):** sigue la guía paso a paso en [`04_instalacion.md`](./04_instalacion.md) (requisitos, dependencias, `.env`, BD, tests y solución de problemas).

```bash
# Terminal 1 — Backend (puerto 3000)
cd backend && pnpm dev

# Terminal 2 — Frontend (puerto 5173)
cd frontend && pnpm dev

# Abrir http://localhost:5173
```

### Comandos útiles

```bash
pnpm db:migrate        # crear/actualizar esquema
pnpm db:seed           # poblar usuarios demo (admin/carlos/maria)
pnpm db:seed-documents # sembrar 13 documentos de ejemplo (5 usuarios) en backend/
pnpm db:reset          # migrar + sembrar desde cero
pnpm exec tsx src/db/repair-paths.ts   # reparar rutas de archivos movidas (backend/)
pnpm test              # backend: vitest (98 tests) · frontend: vitest (22 tests)
pnpm check             # (frontend) svelte-check
```

---

## 9. Decisiones Técnicas (Actualizado)

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Comparación textual | LCS (programación dinámica) | Diff determinista línea a línea, sin dependencias extra |
| Extracción PDF/DOCX | Python (`pdfplumber` / `PyPDF2` / XML) | Mejor calidad de texto que librerías JS puras; fallback a metadatos si no hay Python |
| Auditoría inmutable | Triggers SQL `RAISE(ABORT)` + cadena SHA-256 | Doble barrera: lógica + motor de BD |
| Refresh de sesión | Reintento automático con refreshToken en cliente | Elimina el error "Token inválido o expirado" por expiración de 15 min |
| Sesión JWT | access 15m + refresh 7d | Tiempos de vida corto/largo estándar |
| Permisos de descarga | `authenticateOptional` + pasarela en servicio (público / propietario / proponente) | Una ruta sirve a visitantes y a propietarios sin bifurcar la API |

---

## 10. Limitación Legal Declarada

> **Esta implementación NO constituye firma electrónica bajo la Ley 27269.** No utiliza una Entidad de Certificación acreditada ni la Infraestructura Oficial de Firma Electrónica (IOFE)/RENIEC. Es una implementación propia de firma digital criptográfica (par de claves asimétricas RSA-2048 por usuario) que provee autenticidad y no repudio **dentro del propio sistema**, no validez legal plena.

---

## 11. Ronda de mejoras: enlaces por versión

**Objetivo:** que cada versión del historial tenga su propio enlace público, compartible de forma aislada.

### Implementado

- **Nueva ruta `/v/[id]/[version]`** (`frontend/src/routes/v/[id]/[version]/+page.svelte`): acepta `v2`, `V2` o `2`. **Sin cambios de backend**: reutiliza `GET /api/docs/:id/public` y filtra en cliente por `version_number`. Muestra solo esa versión con el título compuesto `Manual Colaborativo (V2 · Agrego el capitulo C de reportes)`, su huella SHA-256, algoritmo de firma, fecha de registro, quién la subió, un botón de descarga propio (`?versionId=`) y un enlace a `/v/[id]` (historial completo).
- **Enlace «Abrir ↗» por versión** en la línea de tiempo de `/v/[id]` y en la de `/documents/[id]`, con `title` que identifica a qué versión apunta.
- **Barra de compartir corregida**: la URL pública y «Copiar enlace» derivan de `$page.url.origin`.
- **Panel de éxito de subida retirado** de `/documents`.

### Verificación

| Comprobación | Resultado |
|--------------|-----------|
| `svelte-check` | ✅ 0 errores / 0 warnings |
| Frontend (`vitest run`) | ✅ 2 archivos / **22 tests PASS** |
| Backend (`vitest run`) | ✅ 12 archivos / **98 tests PASS** |
| `vite build` | ✅ genera `entries/pages/v/_id_/_version_/_page.svelte.js` |
| Enrutado (Chrome headless) | ✅ `/v/<id>` y `/v/<id>/v2` → `200`; `/v/<id>/v2/extra` → `404` |
| Vista pública | ✅ título compuesto correcto y descarga con `versionId` de la versión 2 |
| Detalle autenticado (admin) | ✅ ambos enlaces «Abrir ↗», **0 errores JS**, «Copiar enlace» copia `http://localhost:5173/v/<id>` |

---

## 12. Verificación de diagramas PlantUML

**Objetivo:** que los **34** diagramas del repositorio (los 26 de `doc/06_diagramas_y_software/` y los 8 de [`08_fundamentos_ingenieria_software.md`](08_fundamentos_ingenieria_software.md)) se rendericen sin error en los dos visores públicos de referencia.

### Servicios probados

| Servicio | Endpoint | Comprobación |
|----------|----------|--------------|
| PlantUML oficial | `https://www.plantuml.com/plantuml/svg/<codificado>` | HTTP `200` y SVG sin marcas de error |
| Kroki | `https://kroki.io/plantuml/svg` (POST, `text/plain`) | HTTP `200` y SVG sin marcas de error |

### Defectos encontrados y corregidos

| # | Defecto | Alcance | Corrección |
|---|---------|---------|------------|
| 1 | **Dos o más carriles declarados en una sola línea** (`\|#F5F5F5\|Emisor\|#E8F4E8\|Sistema\|`). PlantUML no lo reconoce, asume *diagrama de secuencia* y falla con `Syntax Error? (Assumed diagram type: sequence)`. | Los 6 diagramas de `diagrama_actividades.md` | Un carril por línea, con su color en la primera posición: `\|#F5F5F5\|Emisor\|` + `\|#E8F4E8\|Sistema\|` |
| 2 | **Acciones escritas con sintaxis de carril**: `\|Calcular SHA-256\ndel contenido;` y `\|SGD-FD : Calcular hash y firmar;` creaban carriles con nombre de tarea en vez de cajas de actividad, y los carriles reales (Emisor, Sistema…) no se entraban nunca. | 41 acciones repartidas en 5 de los 6 diagramas de actividades | `\|Lane\|` seguido de `:acción;`, con el cambio de carril explícito en cada tramo de rol |
| 3 | **Etiqueta partida por una línea que empieza por `=`**: PlantUML descarta silenciosamente el `=` inicial de una línea dentro de `:…;`, por lo que `version_number\n= MAX + 1` se renderizaba como `version_number  MAX + 1`. | 1 acción (`actividad_version`) | Escrita en una sola línea: `:Calcular version_number = MAX + 1;` |

### Verificación final (uno por uno) - `doc/06_diagramas_y_software/`

| Comprobación | Resultado |
|--------------|-----------|
| Bloques ` ```plantuml ` localizados | ✅ **26** en 8 archivos, todos dentro de fence |
| Render en `kroki.io` | ✅ **26/26** con HTTP `200` |
| Render en `www.plantuml.com` | ✅ **26/26** con HTTP `200` |
| SVG sin marcas de error (`Syntax Error`, `Assumed diagram type`…) | ✅ **26/26** |
| Dimensiones y volumen plausibles (7 KB – 39 KB, 14 – 110 etiquetas de texto) | ✅ **26/26** |
| Etiquetas de los 6 diagramas de actividades presentes en el SVG | ✅ **163/163** (26 + 33 + 20 + 32 + 14 + 38) |
| Términos de contenido del fuente ausentes del SVG renderizado | ✅ **0** en los 26 (los alias declarados con `as CU01`, `as AuthSvc`, etc. no se renderizan por diseño) |

### Verificación final (uno por uno) - `08_fundamentos_ingenieria_software.md`

| Comprobación | Resultado |
|--------------|-----------|
| Bloques ` ```plantuml ` localizados | ✅ **8** en 1 archivo, todos dentro de fence |
| Render en `kroki.io` | ✅ **8/8** con HTTP `200` |
| Render en `www.plantuml.com` | ✅ **8/8** con HTTP `200` |
| SVG sin marcas de error (`Syntax Error`, `Assumed diagram type`…) | ✅ **8/8** |
| Etiquetas del fuente localizadas en el SVG renderizado | ✅ **8/8** (acciones, etiquetas de flecha, nombres entrecomillados y notas de entregable) |
| Diagramas cubiertos | Proceso de 8 pasos, ciclo SDLC, MVC, N-Layer, secuencia, entidad-relación, flujo Git y pipeline CI/CD |

### Total del repositorio

| Comprobación | Resultado |
|--------------|-----------|
| Bloques ` ```plantuml ` en el repo | ✅ **34** en 9 archivos |
| Render en ambos servicios | ✅ **34/34** |
| Diagramas con error | ✅ **0** |

---