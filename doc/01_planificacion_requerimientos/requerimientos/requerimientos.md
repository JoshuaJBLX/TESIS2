# Documento de Requerimientos de Software

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Acrónimo:** SGD-FD
**Versión:** 1.0.0
**Fecha:** 2026-09-29
**Fase del ciclo de vida:** 1 — Planificación y Requerimientos

---

## 0. Tabla de Contenido

1. [Control del Documento](#1-control-del-documento)
2. [Propósito](#2-propósito)
3. [Alcance del Producto](#3-alcance-del-producto)
4. [Referencias](#4-referencias)
5. [Funcionalidades del Producto](#5-funcionalidades-del-producto)
6. [Clases y Características de Usuarios](#6-clases-y-características-de-usuarios)
7. [Entorno Operativo](#7-entorno-operativo)
8. [Requerimientos Funcionales](#8-requerimientos-funcionales)
9. [Reglas de Negocio](#9-reglas-de-negocio)
10. [Requerimientos de Interfaces Externas](#10-requerimientos-de-interfaces-externas)
11. [Requerimientos No Funcionales](#11-requerimientos-no-funcionales)
12. [Trazabilidad](#12-trazabilidad)
13. [Glosario](#13-glosario)

---

## 1. Control del Documento

### 1.1. Historial de Versiones

| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 0.1.0 | 2026-08-01 | Investigador | Plantilla de estructura documental |
| 1.0.0 | 2026-09-29 | Investigador | Elicitación, especificación y trazabilidad de RF y RNF |

### 1.2. Información del Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | Sistema de Gestión Documental con Firma Digital y Trazabilidad |
| Versión del producto | 1.0.0 |
| Tipo de sistema | Aplicación web (SPA + API REST) |
| Metodología | Cascada con prototipado incremental y TDD/BDD |
| Estándares aplicados | ISO/IEC 25010, ISO/IEC 29119, ISO/IEC 27001, IEEE 830, UML 2.5.1 |
| Persistencia | SQLite (sql.js) en local; PostgreSQL/Supabase en nube |
| Estado | Implementado y verificado (98 pruebas automatizadas, 12 suites) |

### 1.3. Aprobaciones

| Rol | Nombre | Fecha | Estado |
|-----|--------|-------|--------|
| Autor | Investigador principal | 2026-09-29 | Aprobado |
| Revisor metodológico | Director de tesis | — | Pendiente |
| Aprobador académico | Jury de sustentación | — | Pendiente |

---

## 2. Propósito

Este documento especifica **qué** debe hacer el Sistema de Gestión Documental con
Firma Digital (SGD-FD) y **con qué restricciones de calidad**, sin describir
**cómo** se implementa (ese propósito corresponde a los documentos de diseño de
`02_diseno_construccion/`).

El documento cubre la totalidad de los requerimientos funcionales (RF) y no
funcionales (RNF) del producto, y establece la línea base contra la cual se
verifica la aceptación y se miden los atributos de calidad.

---

## 3. Alcance del Producto

### 3.1. Descripción del Producto

SGD-FD es un repositorio documental centralizado que resuelve el problema de
distribución de documentos por canales informales (WhatsApp, correo), donde el
destinatario no tiene garantía de haber recibido la versión auténtica ni la más
reciente.

Cada documento se almacena como una **cadena de versiones inmutables**. Cada
versión se sella criptográficamente con la **clave privada del usuario**, que se
genera en su registro y se cifra con la contraseña del propio usuario mediante
PBKDF2 + AES-256-GCM. El sistema:

1. Sella cada versión con **RSA-SHA256** y registra su huella **SHA-256**.
2. Encadena cada evento en una **bitácora de auditoría** con hash encadenados, de
   modo que cualquier alteración retroactiva rompe la cadena de forma detectable.
3. Permite **verificación pública** sin necesidad de cuenta: por URL/QR o
   subiendo el archivo recibido.
4. Soporta **coautoría gobernada**: un tercero registrado envía una *propuesta*
   firmada sobre un documento compartido; solo el propietario la convierte en
   versión oficial firmándola con su propia clave.

### 3.2. Tipo de Sistema

| Dimensión | Clasificación |
|-----------|---------------|
| Categoría | Sistema de información transaccional (OLTP) |
| Arquitectura | Monolito modular en dos tiers (cliente-servidor) |
| Modelo de despliegue | Web application |
| Estilo de interacción | REST + SPA |
| Persistencia | Relacional, esquema normalizado hasta 3FN |
| concurrence | Baja-media, orientada a transacciones de usuario |

### 3.3. Usuarios Objetivo

| Usuario | Descripción | Acceso |
|---------|-------------|--------|
| **Usuario registrado (`user`)** | Titular de documentos. Firma, versiona, comparte, propone cambios. | Autenticado |
| **Coautor (`user`)** | Usuario registrado que envía propuestas sobre documentos públicos ajenos. | Autenticado |
| **Verificador anónimo** | Receptor de un documento que debe confirmar su autenticidad. | Público, sin cuenta |
| **Administrador (`admin`)** | Custodio de la bitácora. Consulta y valida la cadena de auditoría. | Autenticado + rol |

### 3.4. Fuera de Alcance

Los siguientes elementos quedan **explícitamente excluidos** de esta versión:

| # | Exclusión | Justificación |
|---|-----------|---------------|
| 1 | Firma electrónica bajo la **Ley N.° 27269** (Perú) | Requiere Entidad de Certificación acreditada ante INDECOPI y respaldado por la IOFE/RENIEC |
| 2 | Sellado de tiempo por TSA (autoridad de sellado de tiempo) | El campo `signed_at` es declarativo, no certificate por TSA |
| 3 | Certificados X.509 emitidos por AC | El fingerprint de clave pública sustituye al certificado |
| 4 | Firma manuscrita o captura de trazo | Solo firma criptográfica |
| 5 | Cifrado en reposo del repositorio de archivos | Solo la clave privada se cifra en reposo |
| 6 | Notificaciones por correo o SMS | No hay servicio de mensajería |
| 7 | Editor de documentos en línea | El sistema versiona, no edita |
| 8 | Multi-tenancy y organizaciones | Modelo de un solo tenant |
| 9 | Aplicación móvil nativa | Solo cliente web responsive |
| 10 | Integración con el sistema de gestión documental del Estado | Fuera del objetivo de la tesis |

---

## 4. Referencias

| Código | Norma / Documento | Aplicación |
|--------|------------------|------------|
| NORM-001 | ISO/IEC 25010:2011 — Calidad del producto de software | RNF, métricas |
| NORM-002 | ISO/IEC 25019:2013 — Ingeniería de calidad | Guía de construcción de RNF |
| NORM-003 | ISO/IEC 29119-1/2/3:2018 — Proceso de pruebas | Plan y ejecución de pruebas |
| NORM-004 | ISO/IEC 27001:2022 — Seguridad de la información | Controles de seguridad |
| NORM-005 | IEEE 830-1998 — Requisitos de software | Estructura de este documento |
| NORM-006 | UML 2.5.1 (OMG, 2017) — Lenguaje de modelado | Diagramas de la fase 2 |
| NORM-007 | RFC 7519 — JSON Web Token (JWT) | Autenticación |
| NORM-008 | RFC 8017 (PKCS #1 v2.2) — PKCS #8 | Formato de clave privada |
| NORM-009 | FIPS 180-4 — SHA-2 | Hash de contenido y de cadena |
| NORM-010 | FIPS 197 — AES | Cifrado de la clave privada |
| NORM-011 | RFC 8017 — RSA PKCS #1 v2.2 | Firma digital |
| NORM-012 | Ley N.° 27269 (Perú) — Firmas electrónicas | Marco legal de referencia |
| NORM-013 | Ley N.° 29733 (Perú) — Protección de datos personales | Tratamiento de datos de usuario |

---

## 5. Funcionalidades del Producto

El catálogo completo de funcionalidades con su código `FUNC-###` se encuentra en
[`funcionalidades.md`](./funcionalidades.md). Resumen por subsistema:

| Subsistema | Funcionalidades | RF asociados |
|------------|-----------------|--------------|
| **Autenticación** | FUNC-001 a FUNC-005 | RF-001 … RF-004 |
| **Gestión documental** | FUNC-006 a FUNC-012 | RF-005 … RF-013 |
| **Versionado** | FUNC-013 a FUNC-014 | RF-007, RF-009 |
| **Coautoría** | FUNC-015 a FUNC-018 | RF-015 … RF-019 |
| **Comparación** | FUNC-019 | RF-020 |
| **Verificación pública** | FUNC-020 a FUNC-022 | RF-021 … RF-023 |
| **Auditoría** | FUNC-023 a FUNC-025 | RF-024 … RF-025 |
| **Seguridad transversal** | FUNC-026 a FUNC-027 | RF-026, RF-027 |

---

## 6. Clases y Características de Usuarios

### 6.1. Matriz de Permisos

| Capacidad | Anónimo | `user` | `admin` |
|-----------|:-------:|:------:|:-------:|
| Registrarse e iniciar sesión | ✔ | ✔ | ✔ |
| Subir y firmar documentos | ✖ | ✔ | ✔ |
| Versionar documento propio | ✖ | ✔ | ✔ |
| Descargar documento privado propio | ✖ | ✔ | ✔ |
| Descargar documento público de terceros | ✔ | ✔ | ✔ |
| Compartir documento propio | ✖ | ✔ | ✔ |
| Crear propuesta sobre documento público ajeno | ✖ | ✔ | ✔ |
| Aceptar / rechazar propuestas (documento propio) | ✖ | ✔ | ✔ |
| Comparar artefactos de documento público | ✔ | ✔ | ✔ |
| Verificar documento por archivo o URL | ✔ | ✔ | ✔ |
| Consultar bitácora de auditoría | ✖ | ✖ | ✔ |
| Verificar cadena de auditoría | ✖ | ✖ | ✔ |

### 6.2. Modelo de Control de Acceso

El control se aplica en **dos niveles**, tal como se observa en
`backend/src/middleware/auth.ts` y `backend/src/services/document.service.ts`:

- **Nivel de ruta (autenticación):** `authenticate`, `authenticateOptional`,
  `requireAdmin` resuelven la identidad a partir del JWT y, en el caso de
  auditoría, exigen rol `admin`.
- **Nivel de servicio (autorización):** cada método de `DocumentService` valida
  la relación `owner_id == userId` antes de mutar. Devolver un documento vacío
  (`[]`, `null`) en lugar de un error 403 evita filtrar la existencia de
  documentos privados.

---

## 7. Entorno Operativo

### 7.1. Hardware

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| Procesador | 2 vCPU | 4 vCPU |
| Memoria RAM | 2 GB | 4 GB |
| Disco | 5 GB | 20 GB (crecimiento por versiones) |
| Almacenamiento de objetos | — | Bucket S3-compatible para escala |

> La generación de un par RSA-2048 es la operación más costosa del sistema
> (~100–400 ms). Se ejecuta una sola vez por usuario, en el registro.

### 7.2. Software

| Capa | Tecnología | Versión |
|------|------------|---------|
| Runtime | Node.js | ≥ 18 (probado 20.x) |
| Gestor de paquetes | pnpm | 9.x |
| Lenguaje backend | TypeScript (ESM) | 5.7 |
| Framework backend | Express | 4.21 |
| Framework frontend | SvelteKit / Svelte 5 (runes) | 2.63 / 5.56 |
| Base de datos local | SQLite vía sql.js | 1.12 |
| Base de datos nube | PostgreSQL (Supabase) | ≥ 15 |
| Pruebas | Vitest + Supertest | 5.x / 7.x |

### 7.3. Navegadores Soportados

Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (requiere `fetch`, `FormData`,
`URL.createObjectURL` y soporte de Web Crypto en el cliente).

---

## 8. Requerimientos Funcionales

**Convención de prioridad:** `Alta` (imprescindible para la aceptación) ·
`Media` (valorable) · `Baja` (deseable).
**Convención de traza:** cada RF declara los componentes que lo implementan.

---

### 8.1. Módulo de Autenticación

#### RF-001 — Registro de usuario con emisión de clave criptográfica

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Anónimo |
| **Precondición** | El usuario no existe con ese `username` ni ese `email` |
| **Disparador** | `POST /api/auth/register` |
| **Postcondición** | Existen las filas `users` y `user_keys`; se registra el evento `USER_REGISTERED` en la bitácora |

**Reglas de aceptación**

1. El sistema debe rechazar el registro si falta `username`, `email`,
   `password` o `fullName` (HTTP 400).
2. La contraseña debe cumplir la expresión regular
   `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$`:
   mínimo 12 caracteres, con al menos una minúscula, una mayúscula, un dígito y
   un carácter especial.
3. El sistema debe generar un par de claves RSA-2048 (SPKI pública, PKCS#8
   privada) y calcular el fingerprint SHA-256 de la clave pública.
4. La clave privada debe almacenarse cifrada con AES-256-GCM, con clave derivada
   por PBKDF2-HMAC-SHA512 (100 000 iteraciones, salt de 16 bytes) a partir de la
   contraseña del usuario.
5. El hash de la contraseña debe calcularse con bcryptjs, factor de coste 12.
6. El rol inicial asignado debe ser `user`.
7. La respuesta debe incluir `userId`, `username`, `role` y
   `publicKeyFingerprint`; nunca debe incluir la clave privada ni su forma
   cifrada.
8. El registro debe estar limitado a 10 intentos por IP por hora (HTTP 429).

**Implementación:** `backend/src/services/auth.service.ts` (AuthService.register),
`backend/src/crypto/keyGenerator.ts`, `backend/src/crypto/keyProtection.ts`,
`backend/src/routes/auth.ts:13`.

---

#### RF-002 — Inicio de sesión y emisión de tokens

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Usuario registrado activo |
| **Precondición** | `is_active = 1` |
| **Disparador** | `POST /api/auth/login` |
| **Postcondición** | Se emiten `accessToken` y `refreshToken`; se registra `LOGIN_SUCCESS` |

**Reglas de aceptación**

1. El sistema debe emitir un **access token** firmado con `JWT_SECRET`, con
   expiración por defecto de 15 minutos.
2. El sistema debe emitir un **refresh token** firmado con `JWT_REFRESH_SECRET`
   —secreto distinto al de acceso— con expiración por defecto de 7 días.
3. El payload de ambos tokens debe contener `user.id`, `user.username` y
   `user.role`, y **no** debe contener datos sensibles.
4. Ante credenciales inválidas el sistema debe responder HTTP 401 con un mensaje
   genérico (`Credenciales inválidas`) que no revele si el usuario existe.
5. La verificación debe usar `bcryptjs.compareSync` sobre `password_hash`.
6. El sistema debe aplicar protección de fuerza bruta: máximo 5 intentos
   fallidos por combinación IP+usuario en 15 minutos; al superarlos, responder
   HTTP 429 con `retryAfterSeconds`.
7. Cada intento fallido debe registrarse en la bitácora como `LOGIN_FAILED` con
   la IP de origen, sin incluir la contraseña.
8. El límite de tasa general del login es de 20 peticiones por IP cada 15 min.

**Implementación:** `auth.service.ts` (AuthService.login),
`backend/src/middleware/rateLimit.ts` (bruteForceProtection),
`backend/src/routes/auth.ts:40`.

---

#### RF-003 — Renovación del token de acceso

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Usuario con refresh token vigente |
| **Disparador** | `POST /api/auth/refresh` |
| **Postcondición** | Se emite un nuevo access token; el anterior caduca |

**Reglas de aceptación**

1. El sistema debe validar el refresh token contra `JWT_REFRESH_SECRET`.
2. El usuario asociado debe existir y estar activo.
3. Ante un refresh token inválido o expirado, responder HTTP 401 con
   `Refresh token inválido o expirado`.
4. El token renovado debe conservar la misma estructura de payload que el
   access token original.

---

#### RF-004 — Consulta de la sesión actual

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Autenticado |
| **Disparador** | `GET /api/auth/me` |

**Reglas de aceptación**

1. El endpoint debe exigir un access token válido (`authenticate`).
2. Debe devolver `id`, `username` y `role` del usuario del token.
3. Sin token válido debe responder HTTP 401.

---

### 8.2. Módulo de Gestión Documental

#### RF-005 — Listado de documentos del propietario

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Autenticado |
| **Disparador** | `GET /api/docs` |

**Reglas de aceptación**

1. El sistema debe devolver exclusivamente los documentos cuyo `owner_id` sea el
   usuario autenticado; los documentos públicos ajenos se excluyen del listado
   personal.
2. Cada ítem debe incluir `current_version`, calculado como
   `MAX(version_number)`.
3. El orden debe ser `updated_at DESC`.
4. El endpoint debe exigir autenticación.

---

#### RF-006 — Subida y firma del documento inicial (versión 1)

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Autenticado |
| **Disparador** | `POST /api/docs` (`multipart/form-data`, campo `file`) |
| **Postcondición** | Se crean `documents`, `document_versions` (v1) y `document_signatures`; se genera el QR |

**Reglas de aceptación**

1. Los campos `title` y `password` son obligatorios; sin ellos, HTTP 400.
2. Los tipos MIME admitidos son **exactamente**: `application/pdf`,
   `application/msword`,
   `application/vnd.openxmlformats-officedocument.wordprocessingml.document` y
   `text/plain`. Cualquier otro tipo, o un archivo vacío, produce HTTP 400.
3. El tamaño máximo es 10 MB; su exceso produce HTTP 413.
4. El sistema debe descifrar la clave privada del usuario con la contraseña
   suministrada y firmar el archivo con RSA-SHA256.
5. Si la contraseña es incorrecta, el descifrado falla y la operación se aborta
   **antes** de escribir en la base de datos (HTTP 400).
6. El documento se crea con `is_public = 0`.
7. La respuesta debe incluir `documentId`, `versionId`, `versionNumber`,
   `contentHash`, la firma (`algorithm`, `signedAt`), `verificationUrl` y el
   código QR como Data URL de 256 px.
8. Debe registrarse el evento `DOCUMENT_UPLOAD` con título, versión y hash.
9. El archivo se almacena en `uploads/<versionId>-<nombreOriginal>`.

---

#### RF-007 — Creación de una nueva versión firmada

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Propietario del documento |
| **Disparador** | `PUT /api/docs/:id` |
| **Postcondición** | Se inserta una versión con `version_number = MAX+1` |

**Reglas de aceptación**

1. Solo el propietario puede actualizar: otro usuario recibe HTTP 400 con
   `No tienes permisos para modificar este documento`.
2. `password` es obligatorio.
3. `version_number` debe ser el máximo existente más uno, garantizando que las
   versiones anteriores **no se modifican ni se eliminan**.
4. `change_description` es opcional y se persiste como trazabilidad del cambio.
5. La nueva versión se firma de forma independiente con la clave del propietario.
6. Debe actualizarse `documents.updated_at` y registrarse `DOCUMENT_UPDATE`.
7. La respuesta debe incluir el nuevo QR asociado al mismo `documentId`.

---

#### RF-008 — Consulta del detalle de un documento

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Propietario |
| **Disparador** | `GET /api/docs/:id` |

**Reglas de aceptación**

1. Sin autenticación o con `userId` que no sea el propietario, el sistema debe
   devolver `null`; la ruta lo traduce a HTTP 404 (`Documento no encontrado`),
   evitando revelar la existencia del recurso.
2. Cuando el documento existe y es del propietario, la respuesta incluye
   `latestVersion` con la versión más alta, su `content_hash`, el firmante
   (`signer_username`), el coautor (`coauthor_username`) y la firma.

---

#### RF-009 — Historial de versiones

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Propietario |
| **Disparador** | `GET /api/docs/:id/versions` |

**Reglas de aceptación**

1. Devuelve todas las versiones ordenadas por `version_number DESC`.
2. Cada versión debe exponer `uploader_username`, `signer_username`,
   `coauthor_username`, `signature_algorithm`, `signed_at`, `content_hash` y
   `change_description`.
3. Las firmas se unen con `LEFT JOIN` para no perder versiones históricas
   aunque la firma se registre después.
4. Si el documento no pertenece al usuario, se devuelve una lista vacía.

---

#### RF-010 — Emisión del código QR de verificación

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Propietario |
| **Disparador** | `GET /api/docs/:id/qr` |

**Reglas de aceptación**

1. El QR debe codificar la URL
   `{protocol}://{host}/api/verify/{documentId}`.
2. Se genera con `QRCode.toDataURL` a 256 px y margen 2.
3. La operación exige que el documento exista y sea del solicitante.

---

### 8.3. Módulo de Visibilidad y Perfil Público

#### RF-011 — Compartición y privacidad del documento

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Propietario |
| **Disparador** | `PATCH /api/docs/:id/visibility` con `{ "isPublic": true|false }` |

**Reglas de aceptación**

1. Solo el propietario puede alternar la visibilidad; en caso contrario HTTP 400
   con `No tienes permisos para compartir este documento`.
2. El sistema debe registrar `DOCUMENT_VISIBILITY_CHANGED` con el nuevo valor.
3. El cambio debe reflejarse inmediatamente en `updated_at`.

---

#### RF-012 — Vista pública de un documento compartido

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Anónimo o autenticado |
| **Disparador** | `GET /api/docs/:id/public` |

**Reglas de aceptación**

1. El endpoint **no requiere autenticación**.
2. Si el documento no existe o `is_public = 0`, responder HTTP 404 con
   `Documento no encontrado o no disponible públicamente` — la misma respuesta
   para ambos casos, sin distinguir el motivo.
3. Si existe y es público, devolver el documento y el listado de versiones.

---

#### RF-013 — Perfil público de usuario

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Anónimo |
| **Disparador** | `GET /api/users/:username` |

**Reglas de aceptación**

1. El endpoint no requiere autenticación.
2. Solo debe devolver usuarios con `is_active = 1`; los demás, HTTP 404.
3. La respuesta debe incluir únicamente los documentos con `is_public = 1`,
   con su última versión, firmante y coautor.
4. **No** debe exponer `email`, `password_hash` ni claves de ningún usuario.
5. El orden debe ser `updated_at DESC`.

---

### 8.4. Módulo de Descarga

#### RF-014 — Descarga del archivo de una versión

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Propietario, o cualquier usuario/anónimo si el documento es público |
| **Disparador** | `GET /api/docs/:id/file?versionId=<id>` (`authenticateOptional`) |

**Reglas de aceptación**

1. Si no se envía `versionId`, se sirve la **última versión**.
2. El `versionId` debe pertenecer al documento indicado; un identificador de
   otro documento produce `Versión no encontrada`.
3. La descarga de un documento privado por parte de un tercero no propietario
   debe responder HTTP 403 (`No tienes permisos para descargar este documento`).
4. La descarga de un documento inexistente debe responder HTTP 404.
5. La respuesta debe enviar `Content-Type`, `Content-Length` y
   `Content-Disposition: attachment; filename*=UTF-8''<nombre codificado>`, además
   de `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`.
6. El archivo se transmite mediante `fs.createReadStream`, sin cargar el
   documento completo en memoria.

---

### 8.5. Módulo de Coautoría (Propuestas)

#### RF-015 — Creación de una propuesta firmada

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Usuario registrado ≠ propietario |
| **Disparador** | `POST /api/docs/:id/proposals` |
| **Postcondición** | Se crea `document_proposals` con `status = 'pending'` |

**Reglas de aceptación**

1. El documento debe existir y tener `is_public = 1`; en caso contrario HTTP 400
   con `El documento no esta compartido para recibir propuestas`.
2. El propietario no puede proponer sobre su propio documento; debe usar
   `PUT /api/docs/:id`.
3. `changeDescription` y `password` son obligatorios; una descripción vacía o
   solo con espacios produce HTTP 400.
4. La versión base es la última versión del documento, salvo que se indique
   `baseVersionId` explícitamente.
5. El archivo de la propuesta se firma con la clave privada del proponente, lo
   que acredita su autoría incluso si el propietario nunca acepta la propuesta.
6. El archivo se almacena en `uploads/proposals/<proposalId>-<nombre>`.
7. Debe registrarse `DOCUMENT_PROPOSAL_CREATED` con `proposalId`, `baseVersionId`
   y `hash`.

---

#### RF-016 — Listado de propuestas

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Propietario |
| **Disparador** | `GET /api/docs/:id/proposals` |

**Reglas de aceptación**

1. El orden debe priorizar las propuestas `pending`, luego `accepted`, y
   finalmente `rejected`; dentro de cada grupo, `created_at DESC`.
2. Cada propuesta debe incluir los datos de la versión base:
   `base_version_number`, `base_file_name`, `base_content_hash` y
   `base_upload_date`, para que el propietario pueda compararla.
3. Solo el propietario obtiene propuestas; cualquier otro usuario recibe `[]`.

---

#### RF-017 — Aceptación de una propuesta

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Propietario |
| **Disparador** | `POST /api/docs/:id/proposals/:proposalId/accept` |
| **Postcondición** | Nueva versión oficial firmada por el propietario; propuesta `accepted` |

**Reglas de aceptación**

1. Solo el propietario puede aceptar; en caso contrario HTTP 400.
2. `password` es obligatoria: la aceptación implica una **nueva firma** del
   propietario sobre el contenido propuesto.
3. La propuesta debe estar en `pending`; si ya fue procesada, HTTP 400 con
   `La propuesta ya fue procesada`.
4. El sistema debe:
   1. Firmar `proposal.file_path` con la clave del propietario.
   2. Copiar el archivo a `uploads/<versionId>-<nombre>`.
   3. Insertar la nueva versión con `version_number = MAX+1`,
      `uploaded_by = propietario`, `coauthor_id = proponente` y
      `source_proposal_id = proposalId`.
   4. Insertar la firma del propietario.
   5. Actualizar la propuesta a `accepted`, con `reviewed_by`, `reviewed_at` y
      `accepted_version_id`.
5. La respuesta debe incluir `coauthorUsername` para reconocer la autoría
   conjunta.
6. Debe registrarse `DOCUMENT_PROPOSAL_ACCEPTED` con `coauthorId`.

> **Atribución de autoría.** Tras la aceptación, la versión registra dos
> actores: el propietario como firmante (`document_signatures.signer_id`) y el
> proponente como coautor (`document_versions.coauthor_id`). La firma
> criptográfica es del propietario, que es quien asume la responsabilidad del
> contenido final.

---

#### RF-018 — Rechazo de una propuesta

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Propietario |
| **Disparador** | `POST /api/docs/:id/proposals/:proposalId/reject` |

**Reglas de aceptación**

1. Solo el propietario puede rechazar; en caso contrario HTTP 400.
2. La propuesta debe estar en `pending`; si ya fue procesada, HTTP 400.
3. Se actualiza `status = 'rejected'` con `reviewed_by` y `reviewed_at`.
4. **El archivo y la firma del proponente se conservan**: evidencia de que la
   propuesta existió, aunque no haya sido aceptada.
5. Debe registrarse `DOCUMENT_PROPOSAL_REJECTED`.

---

#### RF-019 — Descarga del archivo de una propuesta

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Proponente, propietario, o cualquiera si el documento es público |
| **Disparador** | `GET /api/docs/:id/proposals/:proposalId/file` (`authenticateOptional`) |

**Reglas de aceptación**

1. El proponente siempre puede descargar su propia propuesta.
2. El propietario puede descargarla si el documento es público o si es el suyo.
3. En cualquier otro caso, HTTP 403.
4. Si la propuesta no pertenece al documento indicado, HTTP 404.

---

### 8.6. Módulo de Comparación

#### RF-020 — Comparación de artefactos documentales

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Media |
| **Actor** | Propietario, o cualquier usuario/anónimo si el documento es público |
| **Disparador** | `GET /api/docs/:id/compare?sourceType&sourceId&targetType&targetId` |

**Reglas de aceptación**

1. Se deben exigir los cuatro parámetros; si falta alguno, HTTP 400 con
   `Parámetros de comparación inválidos`.
2. `sourceType` y `targetType` solo admiten `version` o `proposal`.
3. La comparación debe estar autorizada: documento público o propietario.
4. La respuesta debe incluir:
   - `metadata`: diferencias de nombre, MIME, tamaño, hash y origen.
   - `lineDiffs`: diferencias línea a línea de tipo `equal`, `insert` o `delete`.
   - `summary`: contadores `additions`, `deletions`, `unchanged` y `textReady`.
5. La extracción de texto debe degradar con elegancia:
   - `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.yaml`, `.yml`, `.log` → lectura
     directa en Node.
   - `.pdf` → `pdfplumber`, con respaldo a `PyPDF2`.
   - `.docx` → descompresión de `word/document.xml` y recorrido de nodos `<w:t>`.
   - Cualquier otro → modo `binary`, sin diff textual.
6. Si no se puede extraer texto, `supported` debe ser `false` y `note` debe
   explicar que solo se muestra la comparación de metadatos.

---

### 8.7. Módulo de Verificación Pública

#### RF-021 — Verificación de un archivo contra un documento conocido

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Anónimo |
| **Disparador** | `POST /api/verify` con `file` y, opcionalmente, `documentId` y `versionNumber` |

**Reglas de aceptación**

1. El endpoint no requiere autenticación.
2. Si se indica `documentId` y no existe, responder con `status: 'NOT_FOUND'` y
   HTTP 404.
3. Si se indica `versionNumber`, se verifica esa versión; en caso contrario, la
   más reciente.
4. El sistema debe calcular el SHA-256 del archivo recibido y compararlo con
   `content_hash` de la versión almacenada.
5. El estado devuelto debe ser exactamente uno de:
   - `VALID` — hash coincide y la firma es válida.
   - `MANIPULATED` — el hash no coincide (el contenido fue alterado).
   - `INVALID_SIGNATURE` — el hash coincide pero la firma no valida.
6. La respuesta debe incluir `hashMatch`, `signatureValid`, `signedBy` y
   `signedAt`, además de un mensaje legible en español.

---

#### RF-022 — Búsqueda de coincidencias por hash

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Anónimo |
| **Disparador** | `POST /api/verify` con `file` y **sin** `documentId` |

**Reglas de aceptación**

1. El sistema debe calcular el SHA-256 del archivo y buscar la versión con ese
   `content_hash`.
2. Si hay coincidencia, responder `status: 'FOUND'` con `documentId`, `title`,
   `version` y `lastModified`, tomando la coincidencia más reciente por
   `upload_date`.
3. Si no hay coincidencia, responder `status: 'NOT_FOUND'` con la lista `matches`
   vacía.
4. Este modo es la vía de **reporte de documento falso**: si el receptor tiene
   el archivo pero no el QR, de todos modos puede saber si es auténtico.

---

#### RF-023 — Verificación por URL o código QR

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Anónimo |
| **Disparador** | `GET /api/verify/:documentId` |

**Reglas de aceptación**

1. El endpoint no requiere autenticación y es el destino del código QR.
2. Si el documento no existe, HTTP 404.
3. Debe devolver el título, la versión vigente, `lastModified`, el firmante de la
   última versión (`signedAt`, `signer_username`) y las instrucciones para
   verificar subiendo el archivo.
4. Cuando no exista firma para la última versión, `signedBy` debe reportar
   `Unknown` en lugar de fallar.

---

### 8.8. Módulo de Auditoría

#### RF-024 — Consulta de la bitácora de auditoría

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Administrador |
| **Disparador** | `GET /api/audit` |

**Reglas de aceptación**

1. El acceso debe exigir `authenticate` **y** `requireAdmin`; un usuario con rol
   `user` recibe HTTP 403 con `Se requieren permisos de administrador`.
2. Debe admitir los filtros `eventType`, `entityType`, `from` y `to`.
3. La paginación debe usar `limit` y `offset`, con `limit` acotado al rango
   [1, 200] y valor por defecto 50; valores no numéricos caen al valor por
   defecto sin fallar.
4. La respuesta debe incluir `pagination: { limit, offset, total }` y el objeto
   `filters` aplicado.
5. El orden debe ser `id DESC` (más reciente primero).
6. Cada entrada debe exponer `previous_hash` y `current_hash` para que el
   administrador pueda recomputar la cadena de forma independiente.

---

#### RF-025 — Verificación de integridad de la cadena de auditoría

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Administrador |
| **Disparador** | `GET /api/audit/verify-chain` |

**Reglas de aceptación**

1. El sistema debe recorrer la bitácora en orden `id ASC` y, para cada entrada,
   comprobar que `previous_hash` coincide con el `current_hash` de la entrada
   anterior.
2. Debe recomputar `SHA-256(canonical(entrada))` y compararlo con `current_hash`.
3. Si la cadena es íntegra, responder HTTP 200 con `{ valid: true, entries, brokenAt: null }`.
4. Si se detecta una ruptura, responder HTTP 409 con `valid: false`, el
   identificador de la primera entrada rota (`brokenAt`) y el motivo
   (`previous_hash no coincide`, `current_hash no coincide` o
   `event_data inválido`).
5. La primera entrada de la cadena debe tener `previous_hash = NULL`.

---

### 8.9. Módulos Transversales

#### RF-026 — Rate limiting y protección de fuerza bruta

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Alta |
| **Actor** | Cualquier cliente |
| **Precondición** | `NODE_ENV ≠ test` implícito; el middleware es global |

**Reglas de aceptación**

1. El sistema debe aplicar un límite global de 300 peticiones por IP cada 15
   minutos sobre el prefijo `/api`.
2. Deben existir límites específicos y más estrictos: 20/15 min para login y
   10/60 min para registro.
3. Al superar un límite, responder HTTP 429 con `retryAfterSeconds` y los
   encabezados `RateLimit-Limit`, `RateLimit-Remaining` y `RateLimit-Reset`.
4. La clave de conteo debe ser la IP de origen (`req.ip`).

---

#### RF-027 — Sonda de estado del servicio

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Baja |
| **Actor** | Supervisión / balanceador |
| **Disparador** | `GET /api/health` |

**Reglas de aceptación**

1. Debe responder `{ "status": "ok", "timestamp": "<ISO-8601>" }` con HTTP 200.
2. No debe requerir autenticación.

---

## 9. Reglas de Negocio

| Código | Regla | Origen |
|--------|-------|--------|
| RN-01 | Todo documento tiene al menos una versión firmada; no existe documento sin firma. | `uploadDocument` inserta versión y firma en la misma operación. |
| RN-02 | Las versiones son inmutables: nunca se actualizan ni se borran. | No existe ruta `DELETE` de versiones. |
| RN-03 | `version_number` es un entero positivo, consecutivo y único por documento. | `UNIQUE(document_id, version_number)`. |
| RN-04 | Solo el propietario crea versiones oficiales, salvo al aceptar una propuesta. | `updateDocument` valida `owner_id`. |
| RN-05 | Solo se aceptan propuestas sobre documentos públicos. | `createProposal` valida `is_public`. |
| RN-06 | Solo se procesa una propuesta una vez. | `acceptProposal`/`rejectProposal` exigen `status = 'pending'`. |
| RN-07 | Firmar requiere la contraseña del firmante, siempre. | Descifrado AES-256-GCM de la clave privada. |
| RN-08 | La clave privada nunca sale del servidor ni se almacena en claro. | `user_keys.encrypted_private_key`; sin endpoint de exportación. |
| RN-09 | La bitácora es de solo inserción. | Triggers `audit_log_no_update` y `audit_log_no_delete` con `RAISE(ABORT, …)`. |
| RN-10 | Cada entrada de auditoría encadena su hash con el de la anterior. | `previous_hash` / `current_hash`. |
| RN-11 | Un documento privado es invisible para terceros, incluso en su existencia. | `getDocument` devuelve `null`; rutas traducen a 404. |
| RN-12 | Un documento público es legible por cualquiera, autenticado o no. | `authenticateOptional` + validación de `is_public`. |
| RN-13 | La aceptación de una propuesta genera una firma nueva del propietario. | `signFileForUser` se invoca en `acceptProposal`. |
| RN-14 | El contenido publicado es exactamente el contenido firmado. | Se firma el mismo archivo que se almacena. |
| RN-15 | El hash SHA-256 es la identidad del contenido. | `content_hash` por versión. |

---

## 10. Requerimientos de Interfaces Externas

### 10.1. Interfaces de Usuario

| ID | Interfaz | RF |
|----|----------|-----|
| IU-01 | Landing page con propósito, stack y acceso a registro/verificación | — |
| IU-02 | Formulario de registro con validación de contraseña en vivo | RF-001 |
| IU-03 | Formulario de inicio de sesión con mensajes de bloqueo | RF-002 |
| IU-04 | Panel principal: lista de documentos, contador de versiones, acciones | RF-005 |
| IU-05 | Formulario de subida con drag & drop, título, descripción y contraseña de firma | RF-006 |
| IU-06 | Detalle de documento: versiones, firmantes, coautores, QR, verificación pública | RF-008, RF-009, RF-010 |
| IU-07 | Panel de versiones con diff línea a línea y metadatos | RF-020 |
| IU-08 | Bandeja de propuestas con comparar / aceptar / rechazar | RF-015 … RF-018 |
| IU-09 | Verificador público: arrastrar archivo o escanear QR | RF-021 … RF-023 |
| IU-10 | Perfil público con los documentos compartidos | RF-013 |
| IU-11 | Consola de auditoría con filtros y verificación de cadena | RF-024, RF-025 |

### 10.2. Interfaces de Software

| ID | Interfaz | Dirección | RF |
|----|----------|-----------|-----|
| IE-01 | REST API HTTP/JSON bajo `/api` | Cliente → Servidor | Todos |
| IE-02 | Carga de archivos `multipart/form-data` (multer) | Cliente → Servidor | RF-006, RF-007, RF-015 |
| IE-03 | Flujo de archivos por streaming en disco | Servidor → Disco | RF-014, RF-019 |
| IE-04 | `sql.js` / SQLite (local) | App → BD | RF-005 … RF-025 |
| IE-05 | PostgreSQL vía Supabase (nube) | App → BD | RF-005 … RF-025 |
| IE-06 | Bucket de almacenamiento de objetos (nube) | App → Objetos | RF-014 |
| IE-07 | Generador de QR `qrcode` | App → Biblioteca | RF-006, RF-007, RF-010 |
| IE-08 | Intérprete Python para extracción de texto (opcional) | App → SO | RF-020 |
| IE-09 | API REST de Supabase / PostgREST (alternativa) | App → Nube | — |

### 10.3. Interfaces de Hardware

Ninguna. El sistema no interactúa directamente con hardware; el acceso a
cámara del navegador se usa de forma opcional para leer el código QR.

### 10.4. Interfaces de Comunicación

| ID | Protocolo | Puerto | Notas |
|----|-----------|--------|-------|
| IC-01 | HTTP/1.1 | 3000 | API del backend |
| IC-02 | HTTP/1.1 | 5173 | Servidor de desarrollo de Vite |
| IC-03 | HTTPS | 443 | Vercel (frontend) y Supabase (PostgreSQL, REST, Auth) |
| IC-04 | PostgreSQL | 5432 | Conexión directa a la base de datos en la nube |
| IC-05 | SMTP/POP3 | — | **No implementado** (ver Fuera de Alcance, punto 6) |

---

## 11. Requerimientos No Funcionales

**Convención:** cada RNF declara una métrica verificable, un método de medición
y el RNF-ISO/IEC 25010 asociado.

---

### 11.1. Rendimiento

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-001** | El cálculo de hash y firma de un documento de ≤ 10 MB debe completarse en ≤ 3 s. | p95 < 3 000 ms | Medición sobre `POST /api/docs` con PDF de 10 MB. |
| **RNF-002** | El listado de documentos con hasta 500 registros debe responder en ≤ 500 ms. | p95 < 500 ms | Medición sobre `GET /api/docs` con índice `idx_documents_owner_public`. |
| **RNF-003** | La verificación de un documento debe responder en ≤ 2 s. | p95 < 2 000 ms | Medición sobre `POST /api/verify`. |
| **RNF-004** | El registro de un usuario (incluida la generación RSA-2048) debe completarse en ≤ 5 s. | p95 < 5 000 ms | Medición sobre `POST /api/auth/register`. |
| **RNF-005** | La descarga no debe cargar el archivo completo en memoria. | Uso de memoria constante | `fs.createReadStream` en `streamFile`. |

### 11.2. Seguridad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-006** | Toda clave privada debe almacenarse cifrada con AES-256-GCM y clave derivada por PBKDF2 con ≥ 100 000 iteraciones. | 100 % de claves cifradas | `user_keys.encrypted_private_key`; prueba `crypto.test.ts`. |
| **RNF-007** | El hash de contraseñas debe usar un algoritmo-adaptativo con factor de coste ≥ 12. | 100 % de usuarios | `bcryptjs.hashSync(pw, 12)`; prueba `auth.service.test.ts`. |
| **RNF-008** | El sistema debe rechazar contraseñas de menos de 12 caracteres o sin las 4 clases de caracteres. | 100 % de rechazos | Expresión regular en `register`. |
| **RNF-009** | Los tokens de acceso y refresco deben firmarse con secretos distintos. | 2 secretos independientes | `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`; prueba de separación. |
| **RNF-010** | El acceso de tokens expirados debe rechazarse. | 100 % | `jwt.verify` con `expiresIn`; prueba `auth-middleware.test.ts`. |
| **RNF-011** | Un documento privado no debe ser descargable por un tercero. | 0 fugas | Prueba `bloquea la descarga de documentos privados ajenos`. |
| **RNF-012** | Un documento no compartido no debe ser modificable por un tercero. | 0 fugas | Prueba `solo el propietario puede actualizar documentos privados`. |
| **RNF-013** | La bitácora de auditoría debe ser inmutable frente a `UPDATE` y `DELETE`. | 0 modificaciones | Triggers `RAISE(ABORT, 'audit_log is append-only')`. |
| **RNF-014** | Toda alteración de la cadena de auditoría debe ser detectable. | Detección al 100 % | `verifyChain`; prueba `audit.service.test.ts`. |
| **RNF-015** | El sistema debe aplicar rate limiting por IP en autenticación y globalmente. | 100 % de rutas | `rateLimit.test.ts`. |
| **RNF-016** | El sistema debe aplicar cabeceras de seguridad HTTP. | 100 % | `helmet()`; `vercel.json` para el frontend. |
| **RNF-017** | El CORS debe restringirse a orígenes explícitos o locales. | Lista blanca | `allowedOrigins()` + `isLocalDevOrigin()`. |
| **RNF-018** | El sistema no debe exponer datos personales de terceros en endpoints públicos. | 0 fugas | `getPublicProfile` excluye `email` y `password_hash`. |

### 11.3. Usabilidad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-019** | Todas las acciones de firma deben explicar por qué se solicita la contraseña. | 100 % | Textos de interfaz en `documents/[id]/+page.svelte`. |
| **RNF-020** | Los resultados de verificación deben ser legibles en español, sin jerga criptográfica. | 100 % | Mensajes `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`. |
| **RNF-021** | La interfaz debe ser utilizable en pantallas de 360 px de ancho. | Diseño responsive | CSS de `app.css`. |
| **RNF-022** | La descarga de documentos privados debe funcionar sin exponer el token en la URL. | Flujo `Blob` | `downloadFileWithAuth` en `api.ts`. |
| **RNF-023** | Los errores de la API deben ser uniformes: `{ success: false, error }`. | 100 % | Todas las rutas. |

### 11.4. Mantenibilidad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-024** | El código fuente debe estar escrito en un lenguaje con tipado estático. | 100 % TypeScript | `tsconfig.json` con `strict: true`. |
| **RNF-025** | El código debe compilar sin errores de tipado. | 0 errores | `pnpm build` (tsc) — exit code 0. |
| **RNF-026** | La lógica de negocio debe estar separada de las rutas HTTP. | 3 capas | `routes/` → `services/` → `db/`. |
| **RNF-027** | El acceso a datos debe ser intercambiable sin tocar la lógica de negocio. | 1 contrato | Interfaz `DbDriver` en `db/driver.ts`. |
| **RNF-028** | Todo identificador de requerimiento debe ser trazable a código y a prueba. | 100 % | Matriz de trazabilidad. |
| **RNF-029** | El esquema de base de datos debe migrar de forma idempotente. | Reejecutable | `CREATE TABLE IF NOT EXISTS`, `addColumnIfMissing`. |
| **RNF-030** | El proyecto debe seguir una convención de nombres de archivo coherente. | 100 % | Convenciones documentadas. |

### 11.5. Portabilidad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-031** | El sistema debe operar íntegramente en Windows, Linux y macOS. | 3 SO | Rutas relativas; sin dependencias de plataforma. |
| **RNF-032** | El sistema debe operar localmente sin servicios externos. | 0 dependencias cloud | SQLite en archivo. |
| **RNF-033** | El frontend debe poder apuntar a cualquier host de backend por configuración. | 0 valores hardcodeados | `VITE_API_URL` / `PUBLIC_API_ORIGIN`. |
| **RNF-034** | El despliegue en la nube no debe requerir cambios de código. | Solo variables de entorno | Sección 5 de Implementación. |
| **RNF-035** | El formato de la base de datos debe ser portable entre motores. | SQL estándar | DDL en `migrate.ts` portable a PostgreSQL. |

### 11.6. Disponibilidad y Escalabilidad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-036** | El backend debe cerrar limpiamente ante `SIGINT`/`SIGTERM`, persistiendo la base. | 0 corrupción | `closeDatabase()` en `app.ts`. |
| **RNF-037** | El sistema debe soportar al menos 1 000 documentos y 10 000 versiones. | Sin degradación | Índices en `migrate.ts`. |
| **RNF-038** | La bitácora debe escalar a 100 000 entradas verificables. | ≤ 10 s | `verifyChain` con recorrido secuencial. |
| **RNF-039** | La descarga de documentos debe escalar mediante streaming. | Memoria constante | `createReadStream`. |
| **RNF-040** | El sistema debe exponer un endpoint de salud para balanceo. | HTTP 200 | `GET /api/health`. |

### 11.7. Trazabilidad

| ID | Requerimiento | Métrica | Verificación |
|----|---------------|---------|--------------|
| **RNF-041** | Toda operación de escritura debe generar un evento de auditoría. | 100 % | 11 tipos de evento definidos. |
| **RNF-042** | Cada versión debe conservar su hash, su firma y su autor. | 100 % | `document_versions` + `document_signatures`. |
| **RNF-043** | Cada propuesta debe conservar su firma aunque sea rechazada. | 100 % | No se borra al rechazar. |
| **RNF-044** | La autoría conjunta debe quedar registrada al aceptar una propuesta. | 100 % | `coauthor_id` en la nueva versión. |

---

## 12. Trazabilidad

### 12.1. Requerimiento → Implementación → Prueba

| RF | Implementación principal | Suite de prueba |
|----|------------------------|-----------------|
| RF-001 | `services/auth.service.ts` | `auth.service.test.ts`, `auth.api.test.ts` |
| RF-002 | `services/auth.service.ts`, `routes/auth.ts` | `auth.service.test.ts`, `auth.api.test.ts`, `rate-limit.test.ts` |
| RF-003 | `services/auth.service.ts` | `auth.api.test.ts` |
| RF-004 | `routes/auth.ts` | `auth.api.test.ts` |
| RF-005 | `services/document.service.ts` | `documents.api.test.ts` |
| RF-006 | `services/document.service.ts`, `routes/documents.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-007 | `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-008 | `services/document.service.ts` | `documents.api.test.ts` |
| RF-009 | `services/document.service.ts` | `documents.api.test.ts` |
| RF-010 | `routes/documents.ts` | `documents.api.test.ts` |
| RF-011 | `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-012 | `routes/documents.ts` | `documents.api.test.ts` |
| RF-013 | `services/document.service.ts`, `routes/users.ts` | `documents.api.test.ts` |
| RF-014 | `routes/documents.ts`, `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-015 | `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-016 | `services/document.service.ts` | `documents.api.test.ts` |
| RF-017 | `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts`, `scenarios.test.ts` |
| RF-018 | `services/document.service.ts` | `documents.api.test.ts`, `document.service.test.ts` |
| RF-019 | `routes/documents.ts` | `document.service.test.ts` |
| RF-020 | `services/document-analysis.ts` | `document-analysis.test.ts`, `documents.api.test.ts` |
| RF-021 | `routes/verify.ts`, `crypto/verification.ts` | `verify.api.test.ts`, `crypto.test.ts` |
| RF-022 | `routes/verify.ts` | `verify.api.test.ts` |
| RF-023 | `routes/verify.ts` | `verify.api.test.ts` |
| RF-024 | `routes/audit.ts`, `services/audit.service.ts` | `audit.service.test.ts`, `audit.api.test.ts` |
| RF-025 | `services/audit.service.ts` | `audit.service.test.ts`, `audit.api.test.ts`, `scenarios.test.ts` |
| RF-026 | `middleware/rateLimit.ts` | `rate-limit.test.ts` |
| RF-027 | `app.ts` | Verificación manual en Implementación |

### 12.2. Tipos de Evento de Auditoría

| `event_type` | Entidad | Se emite en |
|--------------|----------|-------------|
| `USER_REGISTERED` | `user` | RF-001 |
| `LOGIN_SUCCESS` | `auth` | RF-002 |
| `LOGIN_FAILED` | `auth` | RF-002 |
| `DOCUMENT_UPLOAD` | `document` | RF-006 |
| `DOCUMENT_UPDATE` | `document` | RF-007 |
| `DOCUMENT_VISIBILITY_CHANGED` | `document` | RF-011 |
| `DOCUMENT_PROPOSAL_CREATED` | `document` | RF-015 |
| `DOCUMENT_PROPOSAL_ACCEPTED` | `document` | RF-017 |
| `DOCUMENT_PROPOSAL_REJECTED` | `document` | RF-018 |

---

## 13. Glosario

| Término | Definición |
|---------|------------|
| **Autenticidad** | Garantía de que un documento es atribuible a su autor declarado. |
| **Clave privada** | Clave RSA del usuario, almacenada cifrada; nunca se transmite. |
| **Clave pública** | Clave RSA distribuible; se usa para verificar firmas. |
| **Coautor** | Usuario cuya propuesta fue aceptada y quedó registrada en la versión resultante. |
| **Cadena de auditoría** | Secuencia de eventos de la bitácora cuyos hashes se enlazan entre sí. |
| **Contenido íntegro** | Documento cuyo SHA-256 coincide con el registrado al firmarlo. |
| **Documento** | Entidad lógica con título y propietario, que agrupa una o más versiones. |
| **Firma digital** | Firma criptográfica RSA-SHA256 sobre el hash SHA-256 del contenido. |
| **Hash (huella)** | Valor de salida de SHA-256 en hexadecimal, de 64 caracteres. |
| **No repudio** | Imposibilidad de negar que se emitió una firma, por depender de la clave privada. |
| **Propuesta** | Cambio propuesto y firmado por un tercero sobre un documento público. |
| **QR** | Código QR que codifica la URL pública de verificación de un documento. |
| **Trazabilidad** | Capacidad de reconstruir quién hizo qué, cuándo y sobre qué versión. |
| **Versión** | Instantánea inmutable de un documento, con hash y firma propios. |
| **Verificación** | Proceso de contrastar un archivo recibido contra lo registrado. |

---

**Documentos relacionados**

- [`funcionalidades.md`](./funcionalidades.md) — Catálogo FUNC-###
- [`historias_usuario.md`](./historias_usuario.md) — Épicas e historias US-###
- [`casos_uso.md`](./casos_uso.md) — Casos de uso CU-###
- [`../../02_diseno_construccion/modelos_uml/comportamiento/diagrama_casos_uso.md`](../../06_diagramas_y_software/diagrama_casos_uso.md) — Diagrama de casos de uso
