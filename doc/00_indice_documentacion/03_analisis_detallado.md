# Análisis Detallado del Sistema — DocuTrust

**Sistema de Gestión Documental con Firma Digital y Trazabilidad**

> Análisis integral del componente técnico de la tesis sobre seguridad documental. Este documento describe el **modelo de comportamiento**, el **modelo estructurado**, los **diagramas y el software utilizado**, los **requisitos funcionales y no funcionales**, los **requerimientos del sistema**, la **arquitectura** y el **diseño de la base de datos**, tomando como fuente el código fuente real (backend y frontend) y la documentación del repositorio.

---

## Índice

1. [Introducción](#1-introducción)
2. [Modelo de Comportamiento](#2-modelo-de-comportamiento)
3. [Modelo Estructurado](#3-modelo-estructurado)
4. [Diagramas y Software Utilizados](#4-diagramas-y-software-utilizados)
5. [Requisitos Funcionales](#5-requisitos-funcionales)
6. [Requisitos No Funcionales](#6-requisitos-no-funcionales)
7. [Requerimientos](#7-requerimientos)
8. [Arquitectura](#8-arquitectura)
9. [Base de Datos](#9-base-de-datos)

---

## 1. Introducción

### 1.1 Problema abordado

Los documentos (contratos, informes, reglamentos, planes, etc.) se comparten habitualmente por canales informales (WhatsApp, correo electrónico) **sin ninguna garantía** de que la versión recibida sea la auténtica o la más reciente. Esto permite la **manipulación de cláusulas** sin que el firmante lo note, generando riesgo de fraude documental, disputa sobre "cuál es la versión oficial" y pérdida de trazabilidad.

### 1.2 Solución propuesta

Un **repositorio centralizado** de documentos con:

- **Firma digital criptográfica** (par de claves asimétricas RSA-2048 por usuario) que otorga autenticidad y no repudio *dentro del sistema*.
- **Trazabilidad inmutable** mediante una bitácora de auditoría encadenada por hashes SHA-256 (append-only).
- **Verificación pública** de integridad y autenticidad de un archivo, sin necesidad de cuenta.
- **Colaboración controlada**: documentos públicos, propuestas de cambio firmadas, coautoría, comparación de versiones y perfiles públicos.

### 1.3 Nombre del sistema

Según la documentación interna, el sistema recibe el nombre de **DocuTrust**.

### 1.4 Alcance del análisis

El análisis abarca el **backend** (Node.js + Express + TypeScript sobre SQLite/sql.js), el **frontend** (SvelteKit + Svelte 5), la **integración entre ambos** (API REST) y las **pruebas automatizadas** (Vitest + Supertest), así como los scripts de migración y *seed* de la base de datos.

---

## 2. Modelo de Comportamiento

El modelo de comportamiento describe **qué hace el sistema** y **cómo reacciona** ante los estímulos de los actores (usuarios), expresado mediante casos de uso, diagramas de secuencia, de actividad y de estados.

### 2.1 Actores del sistema

| Actor | Descripción | Rutas habilitadas |
|-------|-------------|-------------------|
| **Visitante (anónimo)** | Usuario sin sesión. Puede verificar documentos, consultar perfiles públicos y descargar documentos públicos. | `POST /api/verify`, `GET /api/verify/:id`, `GET /api/users/:username`, `GET /api/docs/:id/public`, `GET /api/docs/:id/file` |
| **Usuario autenticado (`user`)** | Se registró e inició sesión. Gestiona sus documentos, los comparte, firma, propone cambios a documentos públicos y los compara. | Todos los de `user` + `POST/PUT/GET /api/docs…`, `PATCH /visibility`, propuestas |
| **Administrador (`admin`)** | Igual que `user` más el acceso exclusivo a la **auditoría** (bitácora y verificación de cadena). | `GET /api/audit`, `GET /api/audit/verify-chain` |
| **Sistema** | Actúa de forma automática: genera claves RSA al registrar, firma documentos con la contraseña del propietario, calcula hashes SHA-256, encadena la auditoría y genera códigos QR. | Interno (servicios y módulos `crypto/`) |

### 2.2 Diagrama de casos de uso (matriz)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          SISTEMA DocuTrust                           │
│                                                                      │
│  ┌───────────────────┐                                              │
│  │ Registrarse       │◄──── Visitante
│  │ Iniciar sesión    │◄──── Visitante
│  │ Recuperar token   │
│  └───────────────────┘
│
│  ┌───────────────────┐        ┌──────────────────┐
│  │ Subir documento   │►       │ Firmar (RSA-SHA256)│
│  │ Listar documentos │        └──────────────────┘
│  │ Ver detalle/hist. │
│  │ Nueva versión     │        ┌──────────────────┐
│  │ Generar QR        │        │ Verificar doc.   │◄──── Visitante
│  │ Compartir/Privado │        └──────────────────┘
│  │ Comparar versión  │
│  │ Proponer cambios  │◄──── cualquier user (doc público)
│  │ Aceptar/Rechazar  │◄──── propietario
│  └───────────────────┘
│
│  ┌───────────────────┐        ┌──────────────────┐
│  │ Ver auditoría     │◄──── Admin
│  │ Verificar cadena  │
│  └───────────────────┘
└──────────────────────────────────────────────────────────────────────┘
```

**Casos de uso principales:**

| # | Caso de uso | Actor | Precondición | Flujo principal (resumido) | Postcondición |
|---|-------------|-------|--------------|----------------------------|---------------|
| CU-01 | Registrar usuario | Visitante | No existir usuario/email | Envía username, email, password (≥12 con mayúscula, minúscula, dígito y especial), fullName → el sistema genera RSA-2048, cifra la clave privada con AES-256-GCM+PBKDF2 y registra `USER_REGISTERED` en auditoría | Usuario + claves creadas |
| CU-02 | Iniciar sesión | Visitante | Usuario activo | Envía username/password → valida con bcryptjs → emite accessToken (15 min) y refreshToken (7 días) → `LOGIN_SUCCESS` | Sesión JWT activa |
| CU-03 | Refrescar token | Usuario | refreshToken válido | Envía refreshToken → valida → emite nuevo accessToken | accessToken renovado |
| CU-04 | Subir documento firmado | Usuario | Sesión activa | Multipart (archivo ≤10 MB, PDF/DOC/DOCX/TXT) + título + contraseña → descifra clave privada en memoria → firma SHA-256 → guarda v1, hash, firma y genera QR | Documento v1 firmado |
| CU-05 | Crear nueva versión | Propietario | Doc propio | Sube archivo + descripción + contraseña → firma → crea vN+1 conservando la anterior → `DOCUMENT_UPDATE` | Nueva versión firmada |
| CU-06 | Compartir/Privar documento | Propietario | Doc propio | `PATCH /visibility` → cambia `is_public` → `DOCUMENT_VISIBILITY_CHANGED` | Acceso público reversible |
| CU-07 | Verificar documento | Visitante | Archivo y (opcional) ID | Recalcula SHA-256, compara hash almacenado y verifica firma con clave pública → `VALID / MANIPULATED / INVALID_SIGNATURE / NOT_FOUND` | Resultado de verificación |
| CU-08 | Proponer cambios | Usuario ≠ propietario | Doc público | Sube archivo firmado + descripción de cambios → `DOCUMENT_PROPOSAL_CREATED` (estado `pending`) | Propuesta pendiente |
| CU-09 | Aceptar propuesta | Propietario | Propuesta `pending` | Firma la propuesta como versión oficial → nueva versión con `coauthor_id` = proponente → `DOCUMENT_PROPOSAL_ACCEPTED` | Propuesta `accepted` + coautoría |
| CU-10 | Rechazar propuesta | Propietario | Propuesta `pending` | Rechaza y registra decisión → `DOCUMENT_PROPOSAL_REJECTED` | Propuesta `rejected` |
| CU-11 | Comparar artefactos | Propietario o público | Docs accesibles | Extrae texto (TXT nativo / PDF-DOCX con Python) → diff LCS línea a línea + metadatos | Resultado de comparación |
| CU-12 | Ver auditoría | Admin | Sesión admin | Lista eventos paginados con filtros y/o verifica integridad de la cadena | Estado de la cadena |

### 2.3 Diagramas de secuencia

**Secuencia 1 — Registro de usuario (relevante por la criptografía).**

```
Visitante            auth.route            AuthService          Crypto            BD (sql.js)      Auditoría
   │  POST /register      │                     │                   │                 │                │
   │─────────────────────►│                     │                   │                 │                │
   │                      │  register(DTO)      │                   │                 │                │
   │                      │────────────────────►│                   │                 │                │
   │                      │                     │ regenPassword     │                 │                │
   │                      │                     │──────────────────►│                 │                │
   │                      │                     │ generateKeyPair    │                 │                │
   │                      │                     │◄──────────────────│                 │                │
   │                      │                     │ encryptPrivateKey  │                 │                │
   │                      │                     │──────────────────►│                 │                │
   │                      │                     │  INSERT user+keys  │────────────────►│                │
   │                      │                     │  saveDatabase()    │────────────────►│                │
   │                      │                     │ append('USER_...') │────────────────────────────────►│
   │                      │◄─ {userId, role…}───│                   │                 │                │
   │◄── 201 Created───────│                     │                   │                 │                │
```

**Secuencia 2 — Firma de un documento al subirlo.**

```
Cliente (SvelteKit)     documents.route        document.service          crypto.signature      BD
   │  POST /api/docs (multipart)  │                    │                       │                 │
   │─────────────────────────────►│                    │                       │                 │
   │                              │ uploadDocument()   │                       │                 │
   │                              │───────────────────►│                       │                 │
   │                              │                    │ signFileForUser()     │                 │
   │                              │                    │  (descifra clave priv.│                 │
   │                              │                    │   con password)       │                 │
   │                              │                    │──────────────────────►│                 │
   │                              │                    │ signDocument(file)    │                 │
   │                              │                    │◄──── {signature, hash}│                 │
   │                              │                    │  INSERT doc+version+  │                 │
   │                              │                    │  firma                │────────────────►│
   │                              │                    │  append('DOC_UPLOAD') │                 │
   │                              │◄── UploadResult────│                       │                 │
   │◄─ 201 + verificationUrl + QR─│                    │                       │                 │
```

**Secuencia 3 — Verificación pública de un documento.**

```
Visitante           verify.route        crypto.verification        BD
   │  POST /api/verify (file+id)           │                          │
   │──────────────────────────────────────►│                          │
   │                                       │ get doc+version+firma    │
   │                                       │─────────────────────────►│
   │                                       │◄──── {hash, pubkey, sig} │
   │                                       │ verifyDocument(file)     │
   │                                       │  (recalcula SHA-256,     │
   │                                       │   compara hash, verifica │
   │                                       │   firma RSA)             │
   │◄── {status: VALID|MANIPULATED|...}────│                          │
```

**Secuencia 4 — Aceptación de una propuesta (coautoría).**

```
Propietario        documents.route            document.service                BD          Auditoría
   │ POST accept (password)      │                    │                          │                │
   │────────────────────────────►│                    │                          │                │
   │                             │ acceptProposal()   │                          │                │
   │                             │───────────────────►│                          │                │
   │                             │                    │ valida owner+pending     │                │
   │                             │                    │ firma propuesta como     │                │
   │                             │                    │ versión oficial          │                │
   │                             │                    │  INSERT vN+1 (coauthor=  │                │
   │                             │                    │  proponente)             │───────────────►│
   │                             │                    │  UPDATE propuesta=accepted│                │
   │                             │                    │  append('PROP_ACCEPTED') │                │
   │◄── {version, coauthorName}──│                    │                          │                │
```

### 2.4 Diagrama de actividad — Ciclo de vida de un documento

```
[Inicio]
   │
   ▼
[Visitante se registra / inicia sesión]
   │                      │
   ▼                      ▼
[Sube documento]    [Sistema genera claves RSA-2048
   │                y cifra clave privada]
   ▼
[Se calcula SHA-256 y se firma con la clave privada del usuario]
   │
   ▼
[Se almacena versión v1 + firma + hash y se genera el código QR]
   │
   ▼
┌─────────────────────────────── Estado del documento ───────────────────────────────┐
│                                                                                    │
│   Privado ◄──────────────────────────► Público (PATCH /visibility)                 │
│     │                                         │                                     │
│     │[propietario]                            │[cualquier user ≠ propietario]       │
│     │  nueva versión firmada                  ▼                                     │
│     │  (PUT /docs/:id)                [Crear propuesta firmada]                     │
│     │                                        │   pending                            │
│     │                                        ▼                                     │
│     │                             ┌─ Propietario decide ─┐                           │
│     │                             │                      │                          │
│     │                             ▼                      ▼                          │
│     │                      [Aceptar]              [Rechazar]                         │
│     │                             │                      │                          │
│     │                             ▼                      │                          │
│     │                    [Nueva versión oficial   [registro de la decisión]          │
│     │                     + coautor]                     │                          │
│     ▼                             ▼                      ▼                          │
└────►[Auditoría: evento encadenado con hash SHA-256]◄─────┘                          │
                             │
                             ▼
                        [Fin de la operación]
```

### 2.5 Diagrama de estados

**Estados de una propuesta de cambio (`document_proposals.status`).**

```
        [creada con firma]
              │
              ▼
        ┌──────────┐
   ┌───►│  pending │──┐
   │    └──────────┘  │
   │                  │ aceptar (firma propietario)
   │ rechazar         ▼        ┌────────────────────────┐
   │          ┌───────────┐    │ accepted               │
   │          │ rejected  │◄───│ + accepted_version_id  │
   │          └───────────┘    └────────────────────────┘
   └── (sin transición adicional: finito e irreversible)
```

**Estados de la sesión (JWT).**

```
[No autenticado] ──login──► [autenticado: access 15m + refresh 7d]
                                      │
            ┌─────────────────────────┼───────────────────────┐
            ▼                         ▼                       ▼
     [access vence a los 15m] [refresh vence a los 7d] [logout]
            │                         │
            ▼                         ▼
   [request con 401]          [se requiere login de nuevo]
            │
            ▼
   [el cliente renueva automáticamente con /auth/refresh y reintenta]
```

**Estados de un documento.** `Privado (is_public = 0)` ↔ `Público (is_public = 1)` — transición controlada solo por el propietario mediante `PATCH /api/docs/:id/visibility`.

### 2.6 Flujo de verificación (producto de la firma y el hash)

```
Archivo subido a /verify
        │
        ├── ¿documentId presente?
        │        ├── NO → buscar por SHA-256 del archivo en document_versions
        │        │           ├── coincidencia → status FOUND
        │        │           └── sin coincidencia → status NOT_FOUND
        │        └── SÍ → cargar documento y versión (última o específica)
        │                    ├── documento no existe → NOT_FOUND
        │                    ├── versión no existe → NOT_FOUND
        │                    ├── sin firma → NOT_FOUND
        │                    └── verificar:
        │                        ├── hash NO coincide → MANIPULATED
        │                        ├── hash OK y firma NO válida → INVALID_SIGNATURE
        │                        └── hash OK y firma válida → VALID
```

---

## 3. Modelo Estructurado

El modelo estructurado describe **cómo está organizado** el sistema: módulos, clases/servicios, paquetes, dependencias y el diccionario de datos.

### 3.1 Diagrama de paquetes y módulos del backend

```
backend/
├── src/
│   ├── app.ts                     → Orquestador: middlewares, rutas, error handler, arranque
│   ├── crypto/                    → Capa CRIPTOGRÁFICA
│   │   ├── keyGenerator.ts        → generateKeyPair('RSA-2048') + fingerprint SHA-256
│   │   ├── keyProtection.ts       → encryptPrivateKey / decryptPrivateKey (AES-256-GCM + PBKDF2)
│   │   ├── signature.ts           → calculateFileHash / signDocument (RSA-SHA256)
│   │   └── verification.ts        → verifyDocument (hash + firma)
│   ├── db/                        → Capa de PERSISTENCIA
│   │   ├── connection.ts          → initDatabase / getDatabase / saveDatabase (sql.js)
│   │   ├── migrate.ts             → runMigration (esquema, triggers, índices, columnas)
│   │   ├── query.ts               → queryOne / queryAll / run (helpers)
│   │   ├── seed.ts                → 3 usuarios demo (admin, carlos, maria)
│   │   ├── seed-documents.ts      → 5 usuarios y 13 documentos de ejemplo
│   │   └── repair-paths.ts        → repara rutas de archivos movidos
│   ├── middleware/                → Capa de SEGURIDAD transversal
│   │   ├── auth.ts                → authenticate, optionalAuthenticate, requireAdmin, authenticateOptional
│   │   └── rateLimit.ts           → createRateLimiter, bruteForceProtection
│   ├── models/types.ts            → Interfaz de datos del dominio (User, Document, Version, Proposal, Signature, AuditLog)
│   ├── routes/                    → Capa de PRESENTACIÓN HTTP (API REST)
│   │   ├── auth.ts                → /api/auth (register, login, refresh, me)
│   │   ├── documents.ts           → /api/docs (CRUD, QR, visibilidad, descargas, propuestas, compare, público)
│   │   ├── verify.ts              → /api/verify (verificación por archivo e info por ID)
│   │   ├── audit.ts               → /api/audit (bitácora + verify-chain, solo admin)
│   │   └── users.ts               → /api/users/:username (perfil público)
│   └── services/                  → Capa de NEGOCIO
│       ├── auth.service.ts        → register, login, refresh
│       ├── document.service.ts    → upload, update, visibility, versiones, propuestas, perfiles, descargas
│       ├── document-analysis.ts   → extracción de texto y diff LCS
│       └── audit.service.ts       → append, list, count, verifyChain
└── tests/                         → Suites de pruebas (98 tests)
    ├── helpers/                   → bootstrap.ts, db.ts
    ├── unit/                      → auth-middleware, crypto, document-analysis, rate-limit
    ├── services/                  → auth.service, audit.service, document.service
    └── integration/               → auth, documents, verify, audit, scenarios
```

### 3.2 Diagrama de paquetes del frontend

```
frontend/src/
├── app.css / app.html / app.d.ts         → Estilos globales, plantilla HTML, tipos
├── lib/
│   ├── api.ts                            → Cliente HTTP único (ApiClient) con renovación automática de JWT
│   ├── index.ts
│   ├── assets/favicon.svg
│   └── stores/auth.ts                    → Store global de autenticación (Svelte writable)
└── routes/                               → Sistema de rutas de SvelteKit
    ├── +layout.svelte                    → Layout con barra de navegación y sesión
    ├── +page.svelte                      → Landing / presentación
    ├── login/+page.svelte                → Inicio de sesión
    ├── register/+page.svelte             → Registro
    ├── dashboard/+page.svelte            → Panel de resumen
    ├── documents/+page.svelte            → Lista + subida
    ├── documents/[id]/+page.svelte       → Detalle, versiones, propuestas, red SVG y comparador
    ├── u/[username]/+page.svelte         → Perfil público del usuario
    ├── v/[id]/+page.svelte               → Vista pública de documento + envío de propuestas
    ├── verify/+page.svelte               → Verificación pública
    └── audit/+page.svelte                → Auditoría (admin)
```

### 3.3 Diagrama de componentes y dependencias

```
┌──────────────────────────── FRONTEND (SvelteKit) ────────────────────────────┐
│  Svelte 5 runas + Vite + svelte-check                                         │
│    auth store ──► ApiClient (api.ts) ──► localStorage (access/refresh token)  │
└──────────────┬─────────────────────────────────────────────────────────────┘
               │  HTTP/REST + JSON (fetch), multipart/form-data (subidas)
               │  Authorization: Bearer <accessToken>
               ▼
┌──────────────────────────── BACKEND (Express 4) ─────────────────────────────┐
│  helmet → cors → express.json → rate limiter global                          │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │ auth.ts   │  │ documents  │  │ verify.ts │  │ audit.ts │  │ users.ts   │ │
│  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│        ▼              ▼               ▼             ▼              ▼        │
│  auth.service   document.service  (query directa)  audit.service   document │
│                     │  │  │                                  │      .service│
│                     │  │  └──► document-analysis.ts          │              │
│                     │  └──► signature.ts ◄── keyProtection   │              │
│                     └────► qrcode (URL verificación)         │              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  crypto: keyGenerator · keyProtection · signature · verification    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  Capa de BD: connection.ts (sql.js/WASM) · query.ts · migrate.ts · seed* │
└───────┬─────────────────────────────────────────────────────────────┐
        ▼                                                             ▼
┌─ SQLite (database.sqlite) ──┐               ┌─ Sistema de archivos ──┐
│ users, user_keys, documents, │               │ uploads/ (versiones)    │
│ document_versions, proposals │               │ uploads/proposals/      │
│ document_signatures, audit_log│               │ uploads/temp/ (multer) │
└──────────────────────────────┘               └─────────────────────────┘
```

### 3.4 Diagrama de despliegue (físico)

```
┌─────────────── Equipo de desarrollo (local) ───────────────┐
│  ┌─ Navegador Web ─┐      ┌─ Node.js Runtime ─────────────┐ │
│  │  SPA SvelteKit  │◄────►│  Express + TypeScript + tsx   │ │
│  │  :5173 (Vite)   │ HTTP │  :3000                        │ │
│  └─────────────────┘      │  ├─ sql.js (SQLite en WASM)   │ │
│                           │  ├─ carpeta uploads/          │ │
│                           │  └─ .env                      │ │
│                           └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
(artefactos: código TS compilado a JS con `tsc`; frontend con `vite build`)
```

### 3.5 Interdependencias entre capas (resumen)

| Capa | Depende de | No debe depender de |
|------|------------|---------------------|
| `routes/` | `services/`, `middleware/`, `db/query` (solo en verify) | lógica criptográfica directa (excepto lectura) |
| `services/` | `crypto/`, `db/`, `models/types.ts` | Express/req/res |
| `middleware/` | `jsonwebtoken`, memoria (rate limit) | BD |
| `crypto/` | `node:crypto`, `fs` | Express, BD |
| `db/` | `sql.js` | Express |

---

## 4. Diagramas y Software Utilizados

### 4.1 Diagramas elaborados

Los diagramas del sistema son **diagramas UML y técnicos** que pueden construirse/reproducirse con la notación estándar. Se recogen aquí los tipos y su ubicación conceptual:

| Diagrama | Tipo | Contenido esencial | 
|----------|------|--------------------|
| Diagrama de componentes (arquitectura general) | UML de implementación | Frontend ↔ Backend ↔ BD ↔ Sistema de archivos (ver §8) |
| Diagrama de capas | Arquitectura en capas | `routes → services → crypto/db → sql.js` |
| Diagrama de despliegue | UML físico | SvelteKit (5173) y Express (3000) sobre Node.js, SQLite embebido |
| Diagrama Entidad-Relación | BD | 7 tablas y sus relaciones (ver §9) |
| Diagrama de casos de uso | UML comportamental | Actores (visitante/usuario/admin) frente a funcionalidades |
| Diagrama de secuencia | UML comportamental | Registro, firma, verificación, aceptación de propuestas |
| Diagrama de actividad | UML comportamental | Ciclo de vida de documento / propuesta |
| Diagrama de estados | UML comportamental | Estados de propuesta (`pending/accepted/rejected`) y sesión JWT |
| Gráfico de red de versiones y propuestas | Visualización propia (SVG) | Renderizado en el frontend (`/documents/[id]`) con nodos de versiones oficiales y propuestas según versión base y estado |

**Software para elaborar diagramas.** No se incluye en el repositorio un archivo de diagrama editable; los diagramas de este análisis y de la documentación están escritos en **notación de texto/markdown (ASCII)** y pueden re-elaborarse con cualquier herramienta UML (p. ej. **draw.io / diagrams.net**, **PlantUML**, **Lucidchart**, **StarUML**). El repositorio también contiene diagramas de secuencia/red representados de forma **procedural (SVG generado por el propio frontend)** para la red de versiones.

### 4.2 Software y herramientas utilizados (stack completo)

| Categoría | Software | Versión | Propósito |
|-----------|----------|---------|-----------|
| Runtime | **Node.js** | ≥ 20.19 (recomendado 22.x LTS) | Ejecución de backend y frontend; Vite 8 lo exige |
| Lenguaje | **TypeScript** | backend `^5.7.3` / frontend `^6.0.3` | Tipado estático en ambas capas |
| Framework | **Express** | `^4.21.2` | Servidor HTTP / API REST del backend |
| Framework | **SvelteKit** | `^2.63.0` + **Svelte** `^5.56.1` (Svelte 5) | Frontend reactivo compilado a JS |
| Bundler/Dev | **Vite** | `= 8.0.16` (fijado exacto) | Servidor de desarrollo y motor de tests |
| Base de datos | **SQLite vía sql.js** | `^1.12.0` | Motor SQL embebido en WebAssembly, archivo único |
| Criptografía | **Node.js `crypto`** (nativo/OpenSSL) | nativo | RSA-2048, AES-256-GCM, PBKDF2-SHA512, SHA-256, RSA-SHA256 |
| Sesión | **jsonwebtoken** | `^9.0.2` | JWT access (15m) + refresh (7d) |
| Hash contraseñas | **bcryptjs** | `^2.4.3` | Hash de contraseñas (12 salt rounds) |
| Subida de archivos | **multer** | `^1.4.5-lts.1` | Multipart, límite 10 MB, validación de MIME |
| QR | **qrcode** | `^1.5.4` | Generación de códigos QR (dataURL) con URL de verificación |
| Seguridad HTTP | **helmet** | `^8.0.0` | Cabeceras de seguridad, `nosniff`, opciones de protección |
| CORS | **cors** | `^2.8.5` | Orígenes permitidos restringidos (`CORS_ORIGIN`) |
| Entorno | **dotenv** | `^16.4.7` | Lectura de variables de entorno (`.env`) |
| IDs | **uuid** | `^11.0.5` | Identificadores únicos (uuid v4) |
| Pruebas | **Vitest** | `5.0.0` | Framework de tests (backend 98, frontend 17) |
| Pruebas HTTP | **Supertest** | `^7.2.2` | Tests de integración de la API |
| Check de tipos | **svelte-check** | `^4.6.0` | Verificación de tipos del markup Svelte |
| Dev runner | **tsx** | `^4.19.2` | Ejecución de TypeScript en caliente (`tsx watch`) |
| Gestor de paquetes | **pnpm** | 8.x–12.x | Bidireccional, eficiente, lockfile propio por proyecto |
| Extracción de texto (opcional) | **Python 3** + `pdfplumber` / `PyPDF2` | 3.8+ | Extracción de texto de PDF/DOCX para el comparador; con *fallback* a metadatos |
| OS de desarrollo | Windows (win32) | — | Entorno donde se ejecuta el proyecto (portátil vía pnpm) |

### 4.3 Versiones fijadas relevantes

- **Vite fijado a `8.0.16`** (exacto) en backend y frontend porque `vite@8.2.x` se publicó incompleto (faltaba `dist/node/chunks/node.js`), lo que rompía `vitest run`.
- Express `4.x`, Svelte `5.x` con runas, sql.js `1.x` (WASM), RSA-2048 / AES-256-GCM / PBKDF2-100k / SHA-256.

---

## 5. Requisitos Funcionales

Los **requisitos funcionales (RF)** especifican qué debe hacer el sistema. Cada uno se asocia con su implementación real en el código.

### 5.1 Autenticación y cuentas

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-01 | El sistema debe permitir que un visitante se **registre** con username, email, contraseña y nombre completo. | `routes/auth.ts:13` → `auth.service.ts:18` |
| RF-02 | La contraseña debe cumplir: **≥ 12 caracteres**, al menos una mayúscula, una minúscula, un número y un carácter especial (`@$!%*?&`). Si no cumple, se rechaza el registro. | `auth.service.ts:19-22` |
| RF-03 | El sistema debe impedir duplicidades de username o email. | `auth.service.ts:24-27` |
| RF-04 | Al registrar, el sistema debe **generar un par de claves RSA-2048** y almacenar la clave privada **cifrada** (AES-256-GCM + PBKDF2 con 100 000 iteraciones). | `keyGenerator.ts`, `keyProtection.ts`, `auth.service.ts:33-49` |
| RF-05 | El sistema debe permitir **iniciar sesión** con username y contraseña, verificando contra el hash bcryptjs (bcrypt). | `auth.service.ts:62-71` |
| RF-06 | Al autenticarse correctamente se deben emitir **accessToken (15 min)** y **refreshToken (7 días)** firmados con JWT. | `auth.service.ts:74-84` |
| RF-07 | El sistema debe permitir **refrescar** el accessToken con el refreshToken, siempre que el usuario siga activo. | `auth.service.ts:99-119` |
| RF-08 | El frontend debe **renovar automáticamente** la sesión ante un `401` y reintentar la petición original. | `frontend/src/lib/api.ts:181-252` |
| RF-09 | Debe existir un endpoint protegido `GET /api/auth/me` que devuelva el perfil del usuario autenticado. | `routes/auth.ts:104` |
| RF-10 | El sistema debe bloquear intentos de **fuerza bruta**: 5 fallos en 15 minutos por IP+usuario → bloqueo temporal (429 con `retryAfterSeconds: 900`). | `routes/auth.ts:40-47`, `rateLimit.ts:22-37` |
| RF-11 | El sistema debe limitar el **rate** de login (20/15 min), registro (10/h) y global de API (300/15 min) por IP. | `routes/auth.ts:8-9`, `app.ts:49` |

### 5.2 Criptografía y firma

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-12 | Cada usuario debe poseer un par de claves RSA-2048 únicas en el momento del registro. | `keyGenerator.ts:10-31` |
| RF-13 | La clave privada **nunca** debe almacenarse en texto plano ni enviarse al frontend; debe guardarse cifrada y descifrarse solo en memoria con la contraseña del usuario. | `keyProtection.ts`, `document.service.ts:202-211` |
| RF-14 | Al subir un documento, el sistema debe **calcular el hash SHA-256** del archivo y **firmar** ese hash con la clave privada del propietario (RSA-SHA256). | `signature.ts:16-35` |
| RF-15 | El sistema debe **verificar** un archivo: recalcula SHA-256, compara con el hash almacenado y verifica la firma con la clave pública del firmante. | `verification.ts:11-57` |
| RF-16 | La firma de cada versión debe quedar referenciada con su algoritmo (`RSA-SHA256`) y fecha (`signed_at`). | `migrate.ts` (tabla `document_signatures`), `document.service.ts:260-263` |
| RF-17 | El sistema debe generar un **código QR** por documento que enlace a `GET /api/verify/:documentId`. | `routes/documents.ts:82-96, 186-204` |

### 5.3 Gestión documental

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-18 | El usuario autenticado debe poder **subir** un documento (PDF, DOC, DOCX o TXT), indicando título y contraseña para firmar. | `routes/documents.ts:55-101` |
| RF-19 | La subida debe **validar el tipo MIME** (solo PDF, DOC, DOCX, texto) y el **tamaño máximo de 10 MB**. | `routes/documents.ts:13-16, 61` |
| RF-20 | Cada subida genera la **versión 1** del documento; la siguiente actualización genera **v2, v3…** conservando el historial. | `document.service.ts:233-237, 279-321` |
| RF-21 | El sistema debe permitir **listar** los documentos del usuario logueado (solo propios). | `document.service.ts:382-393` |
| RF-22 | Debe permitir consultar el **detalle** (última versión + firmante) y el **historial completo de versiones** con hash, firmante y (si existe) coautor. | `document.service.ts:395-427` |
| RF-23 | El propietario puede **actualizar** un documento creando una nueva versión firmada; se exige la contraseña para descifrar la clave. | `routes/documents.ts:104-149`, `document.service.ts:323-365` |

### 5.4 Compartición y colaboración

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-24 | El propietario puede **compartir** (marcar público) o **privatizar** un documento. | `document.service.ts:367-380`, `routes/documents.ts:222-230` |
| RF-25 | Cualquier visitante debe poder ver la **vista pública** de un documento con su historial. | `routes/documents.ts:207-219` |
| RF-26 | Un visitante o propietario debe poder **descargar** versiones; un propietario o proponente, descargar propuestas. La descarga de privados exige JWT. | `routes/documents.ts:233-241, 292-299`, `api.ts:365-414` |
| RF-27 | Un usuario (≠ propietario) puede **proponer cambios** firmados a un documento público, con descripción obligatoria, sobre una versión base (default: última). | `document.service.ts:473-560` |
| RF-28 | El propietario puede **aceptar** una propuesta pendiente: se crea una versión oficial firmada por él y con **coautoría** del proponente. | `document.service.ts:562-651` |
| RF-29 | El propietario puede **rechazar** una propuesta y registrar la decisión. | `document.service.ts:653-684` |
| RF-30 | Sobre documentos privados **no** se pueden crear propuestas. | `document.service.ts:497-499` |
| RF-31 | El sistema debe **comparar** dos artefactos (versión↔versión, versión↔propuesta, propuesta↔propuesta) con diff línea a línea (LCS), metadatos y resumen (adiciones/eliminaciones/iguales). | `document-analysis.ts`, `document.service.ts:818-842` |
| RF-32 | Se debe exponer un **perfil público** por usuario con sus documentos públicos y la firma/coautoría de la última versión. | `document.service.ts:746-786`, `routes/users.ts` |

### 5.5 Verificación

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-33 | El público (sin cuenta) debe poder **subir un archivo** y obtener el estado de verificación: `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND`. | `routes/verify.ts:11-153` |
| RF-34 | El sistema debe permitir **buscar por coincidencia de hash** (sin `documentId`) devolviendo `FOUND`/`NOT_FOUND`. | `routes/verify.ts:112-148` |
| RF-35 | `GET /api/verify/:documentId` debe exponer la **información pública de verificación** (título, versión actual, firmante) — útiles al escanear el QR. | `routes/verify.ts:156-199` |

### 5.6 Auditoría

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-36 | El sistema debe **registrar eventos** de auditoría de forma automática: `USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `DOCUMENT_UPLOAD`, `DOCUMENT_UPDATE`, `DOCUMENT_VISIBILITY_CHANGED`, `DOCUMENT_PROPOSAL_CREATED`, `DOCUMENT_PROPOSAL_ACCEPTED`, `DOCUMENT_PROPOSAL_REJECTED`. | `audit.service.ts`, puntos de inserción en servicios y rutas |
| RF-37 | La bitácora debe ser **append-only**: encadenada por hashes SHA-256 (`previous_hash` → `current_hash`) y con **triggers SQL** que impiden `UPDATE`/`DELETE`. | `audit.service.ts:30-39, 63-75`, `migrate.ts:139-140` |
| RF-38 | Solo el **admin** debe poder listar la bitácora (paginada 1-200, filtros por `eventType`, `entityType`, `from`, `to`) y **verificar la integridad** de la cadena. | `routes/audit.ts`, `audit.service.ts:41-75` |

### 5.7 Seguridad y robustez

| ID | Requisito funcional | Implementación |
|----|---------------------|----------------|
| RF-39 | Las rutas protegidas deben validar el **JWT Bearer** y rechazar con `401` si falta o es inválido. | `middleware/auth.ts:14-37` |
| RF-40 | Las rutas de administrador deben exigir rol `admin` (403 si no). | `middleware/auth.ts:59-68` |
| RF-41 | Los endpoints de descarga deben resolver permisos: público OR propietario OR proponente, mapeando errores a **403/404** (`fileErrorStatus`). | `routes/documents.ts:22-27`, `document.service.ts:686-744` |
| RF-42 | La API debe incluir **cabeceras de seguridad (Helmet)**, **CORS restringido** y **manejo de errores** para `413` (tamaño) y `400` (tipo de archivo). | `app.ts:37-68` |
| RF-43 | El sistema debe **sanear el logging** de datos sensibles (contraseñas, claves, tokens) — se redactan con `[REDACTED]`. | `routes/auth.ts:68` |

---

## 6. Requisitos No Funcionales

Los **requisitos no funcionales (RNF)** describen **cómo** debe comportarse el sistema en cuanto a calidad, seguridad, rendimiento y operación.

### 6.1 Seguridad

| ID | Requisito | Detalle / evidencia |
|----|-----------|---------------------|
| RNF-01 | Confidencialidad de claves | La clave privada RSA se almacena solo cifrada (AES-256-GCM) con clave derivada por **PBKDF2-SHA512, 100 000 iteraciones + salt**. Nunca se envía al cliente. |
| RNF-02 | Integridad de documentos | Cada versión almacena su `content_hash` (SHA-256); la verificación detecta cualquier alteración del contenido. |
| RNF-03 | Integridad de auditoría | Cadena de hashes encadenados + triggers de BD `RAISE(ABORT)` bloquean escritura borrado. `GET /api/audit/verify-chain` detecta dónde se rompe la cadena. |
| RNF-04 | No repudio (dentro del sistema) | Cada versión firmada tiene firmante, algoritmo, `signed_at` y un registro de auditoría inmutable. |
| RNF-05 | Protección contra fuerza bruta | 5 intentos fallidos/15 min por IP+usuario → bloqueo 15 min; rate limits por endpoint. |
| RNF-06 | Autenticación robusta | JWT (RFC 7519) con vida corta del access (15 min) y refresh (7 días); secreto configurable por `.env`. |
| RNF-07 | Cabeceras HTTP seguras | Helmet activa por defecto; `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` en descargas. |
| RNF-08 | Validación de entrada | MIME restringido (PDF/DOC/DOCX/TXT), tamaño máx. 10 MB, contraseñas con política de complejidad. |

### 6.2 Rendimiento y escalabilidad

| ID | Requisito | Detalle / evidencia |
|----|-----------|---------------------|
| RNF-09 | Respuesta ágil de API | Express con JSON ligero; consultas indexadas (índices en versiones, documentos, propuestas, auditoría, usuarios). |
| RNF-10 | Streaming de descargas | `fs.createReadStream(...).pipe(res)` para no cargar archivos completos en memoria. |
| RNF-11 | SQLite sin servidor | BD embebida (WASM) — cero latencia de red interna, suficiente para proyecto académico; migración sencilla a PostgreSQL. |
| RNF-12 | Límites de abuso | Rate limiting en memoria: global 300/15 min, login 20/15 min, registros 10/h. |

### 6.3 Portabilidad y operación

| ID | Requisito | Detalle / evidencia |
|----|-----------|---------------------|
| RNF-13 | Cero configuración de BD | SQLite regenera el archivo automáticamente en `backend/data/database.sqlite`. |
| RNF-14 | Migración idempotente | `pnpm db:migrate` con `CREATE IF NOT EXISTS` + `addColumnIfMissing` reordenado antes de índices (bug corregido). |
| RNF-15 | Portabilidad de archivos | Script `repair-paths.ts` repara rutas de `uploads/` si se mueve la carpeta. |
| RNF-16 | Dependencia Python opcional | La extracción PDF/DOCX usa Python si está instalado; si no, el comparador hace *fallback* a metadatos. |

### 6.4 Usabilidad y mantenibilidad

| ID | Requisito | Detalle / evidencia |
|----|-----------|---------------------|
| RNF-17 | UI clara y guiada | 11 páginas SvelteKit con flujos guiados (login con usuarios demo, dashboard, documentos, verificación, auditoría, colaboración). |
| RNF-18 | Código tipado | TypeScript en backend y frontend (Svelte 5), `tsc --noEmit` y `svelte-check` en 0 errores/warnings. |
| RNF-19 | Pruebas automatizadas | **98 tests backend** (unit, servicios, integración API con Supertest) + **22 tests frontend** (api.test.ts, auth.test.ts). |
| RNF-20 | Documentación completa | README, INSTALACION, EJECUCION, PLANIFICACION, PROGRESO 1.0/2.0 y FUNCIONALIDADES. |

### 6.5 Legal y normativo

| ID | Requisito | Detalle / evidencia |
|----|-----------|---------------------|
| RNF-21 | Advertencia legal explícita | El sistema **no constituye firma electrónica según la Ley 27269** peruana: no usa EC acreditada ni IOFE/RENIEC; proporciona autenticidad y no repudio dentro del propio sistema. |

---

## 7. Requerimientos

### 7.1 Requerimientos de software (para instalar/ejecutar)

| Requerimiento | Versión mínima | Notas |
|---------------|----------------|-------|
| Node.js | ≥ 20.19 (recomendado 22.x LTS) | Lo exige Vite 8 (`^20.19.0 || >=22.12.0`) |
| pnpm | 8.x o superior (probado 12.x) | Gestor de paquetes único para ambos proyectos |
| Python 3 | 3.8+ | **Opcional**: solo para extracción de texto PDF/DOCX del comparador |
| Git | — | Opcional, para clonar el repositorio |
| Navegador web | moderno | El frontend es SPA compilada a JS |

### 7.2 Variables de entorno (backend `.env`)

| Variable | Valor por defecto | Propósito |
|----------|-------------------|-----------|
| `NODE_ENV` | `development` | Modo de ejecución (en `test` no arranca el servidor) |
| `PORT` | `3000` | Puerto del backend |
| `JWT_SECRET` | (valor de ejemplo) | Secreto de firma del accessToken — **cambiar en producción** |
| `JWT_REFRESH_SECRET` | (valor de ejemplo) | Secreto del refreshToken — **cambiar en producción** |
| `JWT_EXPIRES_IN` | `15m` | Vida del accessToken |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Vida del refreshToken |
| `DB_PATH` | `./data/database.sqlite` | Ruta del archivo SQLite |
| `UPLOAD_DIR` | `./uploads` | Carpeta de documentos almacenados |
| `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Orígenes permitidos por CORS |

### 7.3 Requerimientos de datos de prueba (seed)

- `pnpm db:seed`: usuarios **admin** (rol admin), **carlos** y **maria** (rol user), cada uno con su par RSA-2048.

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | `Admin123!@#` | admin |
| carlos | `Carlos123!@#` | user |
| maria | `Maria123!@#` | user |

- `pnpm db:seed-documents`: agrega **lucia** y **pedro** + **13 documentos de ejemplo** con versiones, propuestas pendientes/aceptadas (coautoría) y rechazadas, públicos y privados, para poblar la interfaz y el comparador.

### 7.4 Requerimientos de ejecución

| Servicio | Comando | URL |
|----------|---------|-----|
| Backend | `cd backend && pnpm dev` | http://localhost:3000/api |
| Frontend | `cd frontend && pnpm dev` | http://localhost:5173 |
| Tests backend | `cd backend && pnpm test` | 12 archivos / 98 tests |
| Tests frontend | `cd frontend && pnpm test` | 2 archivos / 22 tests |
| Check tipos frontend | `cd frontend && pnpm check` | 0 errores / 0 warnings |
| Check tipos backend | `cd backend && npx tsc --noEmit` | 0 errores |
| Migración | `cd backend && pnpm db:migrate` | idempotente |
| Seed usuarios | `cd backend && pnpm db:seed` | — |
| Seed documentos | `cd backend && pnpm db:seed-documents` | — |
| Reset | `cd backend && pnpm db:reset` | migrar + sembrar |

### 7.5 Hardware mínimo sugerido

- Equipo con Node.js compatible (cualquier CPU moderna; el proyecto es ligero).
- **Disco**: pnpm + node_modules (~cientos de MB); los documentos se almacenan en `uploads/`.
- **RAM**: suficiente para Node.js + sql.js (WASM), sin requisito especial para el alcance académico.

---

## 8. Arquitectura

### 8.1 Estilo arquitectónico

El sistema sigue una **arquitectura cliente-servidor en capas**, con backend **modular por servicios** (capa REST → servicios → criptografía → persistencia) y frontend **SPA con SSR opcional** (SvelteKit). Es una arquitectura REST monolítica y **compilada**:

```
[Cliente SvelteKit :5173]  ⇄ (HTTP/JSON)  [API Express :3000]  ⇄ [sql.js / ficheros]
```

### 8.2 Diagrama de componentes (detallado)

```
┌───────────────────────────────────────────────────────────────┐
│                        USUARIOS                                │
│    Visitante · Usuario autenticado (user) · Administrador      │
└──────────────┬────────────────────────────────────────────────┘
               │ HTTPS/HTTP
┌──────────────▼────────────────────────────────────────────────┐
│                    FRONTEND (SvelteKit + Svelte 5)             │
│  +layout (nav+sesión)                                          │
│  Landing  · Login · Register · Dashboard                       │
│  Documents · DocumentDetail (red SVG + comparador + propuestas)│
│  PublicView /v · PublicProfile /u · Verify · Audit             │
│  lib/api.ts (ApiClient: refresh automático, descargas blob)    │
│  lib/stores/auth.ts (sesión persistida en localStorage)        │
└──────────────┬────────────────────────────────────────────────┘
               │ REST /api/*
┌──────────────▼────────────────────────────────────────────────┐
│               BACKEND (Express 4 + TypeScript)                 │
│  Middleware globales: Helmet · CORS(origin) · json · rate limit│
│  ├─ routes/auth        register · login · refresh · me         │
│  ├─ routes/documents   CRUD · QR · public · file · visibility  │
│  │                     proposals (create/list/file/accept/reject)│
│  │                     compare                                  │
│  ├─ routes/verify      verificación pública (archivo/hash/ID)  │
│  ├─ routes/audit       bitácora + verify-chain (admin)         │
│  └─ routes/users       perfil público                          │
│            │           │           │                           │
│            ▼           ▼           ▼                           │
│  ┌-services-┐  ┌-services-┐  ┌-crypto-┐  ┌-db-┐               │
│  │ auth     │  │ document │  │ RSA    │  │con.│  insert/query │
│  │ audit    │  │ analysis │  │ AES    │  │mig │  saveDatabase │
│  └──────────┘  └──────────┘  │ PBKDF2 │  │seed│               │
│                              │ SHA-256│  └────┘               │
│                              └────────┘                       │
└──────────────┬──────────────────────────────────┬─────────────┘
               ▼                                  ▼
   ┌──────────────────────────┐      ┌──────────────────────────┐
   │  SQLite (sql.js·WASM)    │      │  Sistema de archivos     │
   │  database.sqlite         │      │  uploads/ (versiones)    │
   │  7 tablas + triggers     │      │  uploads/proposals/      │
   │  + 15 índices            │      │  uploads/temp/           │
   └──────────────────────────┘      └──────────────────────────┘
```

### 8.3 Flujo de datos de un documento

1. **Subida**: el frontend envía `multipart/form-data` con el archivo → multer lo deposita en `uploads/temp/` → `document.service.uploadDocument` firma, calcula hash, mueve el archivo a `uploads/<versionId>-<nombre>`, inserta filas → `saveDatabase()` → devuelve QR + URL de verificación.
2. **Verificación**: el visitante sube el archivo → se recalcula hash y se valida la firma → respuesta `VALID/MANIPULATED/...`.
3. **Colaboración**: propuesta → `uploads/proposals/<proposalId>-<nombre>` → al aceptar se copia a `uploads/` como versión oficial con coautor.
4. **Auditoría**: cada operación llama a `auditService.append(...)` que encadena hashes y guarda la BD.

### 8.4 Arquitectura de la capa criptográfica (flujo)

```
Registro:
  Password ─► PBKDF2(100k, salt único) ─► key(32B) ─► AES-256-GCM ─► encrypted_private_key (almacenada)
Firma:
  encrypted_private_key + Password ─► PBKDF2 ─► descifrar en memoria ─► RSA-SHA256(sign(hash(archivo)))
Verificación:
  archivo ─► SHA-256 ─► comparar con content_hash ─► RSA verify con public_key
```

**Regla de oro**: la clave privada se descifra solo en memoria y **nunca** se persiste ni se transmite.

### 8.5 Decisiones arquitectónicas (justificación de diseño)

| Decisión | Elección | Alternativa descartada | Justificación |
|----------|----------|------------------------|---------------|
| Framework frontend | SvelteKit + Svelte 5 | React/Next.js | Compilación a JS (sin runtime grande), SSR+CSR, más ligero de sustentar |
| Backend | Node.js + Express + TS | Python/Django, Java/Spring, Hono | Mismo lenguaje full-stack, I/O concurrente, `crypto` nativo robusto |
| Base de datos | SQLite (sql.js) | PostgreSQL, MongoDB | Portabilidad, cero configuración, ACID para auditoría; fácil migración a PostgreSQL |
| Algoritmo asimétrico | RSA-2048 | ECDSA P-256 | Mayor compatibilidad y respaldo académico |
| Cifrado simétrico | AES-256-GCM | AES-256-CBC | GCM autentica (evita padding oracle) |
| Derivación de clave | PBKDF2 100k (SHA-512) | bcrypt (bcryptjs), scrypt | Estándar NIST, integrado en Node |
| Firma | RSA-SHA256 | ECDSA-SHA256 | Compatibilidad y documentación |
| Hash | SHA-256 | SHA-512, SHA-3 | Balance seguridad/rendimiento |
| Sesión | JWT access+refresh | Sesiones de servidor | Stateless, RFC 7519, renovación automática |
| Motor sql.js vs nativo | sql.js (WASM) | better-sqlite3 | Evita dependencias nativas (C++ Build Tools) |
| Comparación | LCS (programación dinámica) | Dependency diff | Determinista, sin dependencias extra |
| Extracción de texto | Python (pdfplumber/PyPDF2) | Librerías JS puras | Mejor calidad de texto; fallback a metadatos |
| Auditoría | Triggers SQL + cadena SHA-256 | Solo lógica | Doble barrera de integridad |

---

## 9. Base de Datos

### 9.1 Gestor y conexión

- **Motor**: SQLite embebido mediante **sql.js** (compilación WebAssembly de SQLite).
- **Conexión**: `db/connection.ts` carga el archivo `backend/data/database.sqlite` (o crea uno nuevo), activa `PRAGMA journal_mode = WAL` y `PRAGMA foreign_keys = ON`, y expone `getDatabase()`, `saveDatabase()` (exporta y escribe el archivo) y `closeDatabase()`.
- **Esquema**: creado y actualizado de forma **idempotente** por `db/migrate.ts` (`CREATE TABLE IF NOT EXISTS`, `addColumnIfMissing` y luego los índices).

### 9.2 Diagrama Entidad-Relación

```
users 1────1 user_keys
users 1────N documents (owner_id)
users 1────N document_versions (uploaded_by)
users 1────N document_proposals (proposed_by)
users 1────N document_signatures (signer_id)
documents 1────N document_versions
documents 1────N document_proposals
document_versions 1────1 document_signatures
document_versions 1────N document_proposals (base_version_id)
document_proposals 0..1──1 document_versions (accepted_version_id) → genera versión aceptada
audit_log: entidad independiente, encadenada por hashes (append-only)
```

### 9.3 Listado de tablas (7 tablas)

| Tabla | Rol en el sistema |
|-------|-------------------|
| `users` | Usuarios y sus credenciales (rol `admin`/`user`) |
| `user_keys` | Par de claves RSA-2048 del usuario (clave privada cifrada) |
| `documents` | Documento maestro (con visibilidad `is_public`) |
| `document_versions` | Versiones inmutables de cada documento (hash y firma por versión) |
| `document_proposals` | Propuestas de cambio firmadas (coautoría) |
| `document_signatures` | Firmas digitales por versión |
| `audit_log` | Bitácora inmutable encadenada por hashes |

### 9.4 Esquema SQL (implementado)

```sql
-- Usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Pares de claves criptográficas
CREATE TABLE IF NOT EXISTS user_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,   -- AES-256-GCM + PBKDF2 (JSON: data, iv, tag, salt)
    key_algorithm TEXT NOT NULL,
    key_fingerprint TEXT NOT NULL,         -- SHA-256 de la clave pública
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Documentos maestros
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,  -- 0 privado · 1 público (Fase E)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Versiones de documentos
CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    content_hash TEXT NOT NULL,            -- SHA-256 del archivo
    uploaded_by TEXT NOT NULL,
    coauthor_id TEXT,                      -- coautor (si proviene de propuesta aceptada)
    source_proposal_id TEXT,               -- propuesta que originó esta versión
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (coauthor_id) REFERENCES users(id),
    FOREIGN KEY (source_proposal_id) REFERENCES document_proposals(id),
    UNIQUE(document_id, version_number)
);

-- Propuestas de cambio (coautoría)
CREATE TABLE IF NOT EXISTS document_proposals (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    base_version_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    proposed_by TEXT NOT NULL,
    signature_value TEXT NOT NULL,
    signature_algorithm TEXT NOT NULL,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    reviewed_by TEXT,
    reviewed_at DATETIME,
    accepted_version_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (base_version_id) REFERENCES document_versions(id),
    FOREIGN KEY (proposed_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (accepted_version_id) REFERENCES document_versions(id)
);

-- Firmas digitales
CREATE TABLE IF NOT EXISTS document_signatures (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL UNIQUE,
    signer_id TEXT NOT NULL,
    signature_value TEXT NOT NULL,         -- Base64
    signature_algorithm TEXT NOT NULL,     -- 'RSA-SHA256'
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (signer_id) REFERENCES users(id)
);

-- Bitácora de auditoría (append-only, encadenada)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id TEXT,
    event_data TEXT NOT NULL,
    previous_hash TEXT,                    -- hash del evento anterior
    current_hash TEXT NOT NULL,            -- SHA-256 de este evento
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 9.5 Triggers de integridad (append-only)

```sql
-- Impide modificación de la bitácora
CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;

-- Impide borrado de la bitácora
CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;
```

### 9.6 Índices (rendimiento)

| Índice | Tabla | Columnas |
|--------|-------|----------|
| `idx_versions_document` | `document_versions` | `document_id` |
| `idx_versions_coauthor` | `document_versions` | `coauthor_id` |
| `idx_documents_owner_public` | `documents` | `owner_id, is_public` |
| `idx_proposals_document` | `document_proposals` | `document_id, status` |
| `idx_proposals_base_version` | `document_proposals` | `base_version_id` |
| `idx_proposals_creator` | `document_proposals` | `proposed_by` |
| `idx_audit_entity` | `audit_log` | `entity_type, entity_id` |
| `idx_audit_hash` | `audit_log` | `current_hash` |
| `idx_users_username` | `users` | `username` |
| `idx_users_email` | `users` | `email` |

### 9.7 Mecanismo de auditoría encadenada

```
Evento N:  previous_hash = current_hash(Evento N-1)
           payload = {eventType, entityType, entityId, userId, eventData, previousHash, timestamp}
           current_hash = SHA-256(canonical(payload))
Verificación de la cadena:
   para cada evento en orden asc:
       si previous_hash ≠ hash anterior real → cadena rota (brokenAt = id)
       si current_hash ≠ SHA-256(payload)      → cadena rota (corrupción)
```

### 9.8 Migración y datos de ejemplo

| Script | Acción |
|--------|--------|
| `pnpm db:migrate` | Crea/actualiza tablas, columnas, triggers e índices (idempotente). **Bug corregido**: los índices que usan `coauthor_id` se creaban antes de agregar la columna; se reordenó (primero `addColumnIfMissing`, luego índices). |
| `pnpm db:seed` | Puebla `admin`, `carlos`, `maria` con sus claves RSA-2048 (3 usuarios). |
| `pnpm db:seed-documents` | Crea/usa **5 usuarios** (agrega `lucia`, `pedro`) y siembra **13 documentos** con versiones, propuestas en distintos estados, coautorías y visibilidad pública/privada. |
| `pnpm db:reset` | Ejecuta migración + seed de usuarios. |
| `repair-paths.ts` | Recalcula `file_path` de `document_versions` y `document_proposals` si las rutas de `uploads/` quedaron rotas por mover la carpeta. |

### 9.9 Reglas de negocio reflejadas en la BD

- `users.role` restringe acceso a auditoría (`CHECK role IN ('admin','user')`).
- `documents.is_public` habilita/deshabilita propuestas y vistas públicas.
- `document_versions.UNIQUE(document_id, version_number)` garantiza versiones no duplicadas.
- `document_proposals.status` (pending/accepted/rejected) es **finito e irreversible** (una propuesta solo se procesa una vez).
- `document_signatures.version_id UNIQUE` garantiza **una firma por versión**.
- `audit_log` es **solo inserción** (doble barrera: lógica + triggers SQL).

---

## Anexo A — Resumen de endpoints (contrato de API)

| Método | Endpoint | Auth | Rol / Permiso | Descripción |
|--------|----------|:----:|---------------|-------------|
| GET | `/api/health` | no | público | Estado del servicio |
| POST | `/api/auth/register` | no | público | Registrar usuario + claves |
| POST | `/api/auth/login` | no | público | Iniciar sesión |
| POST | `/api/auth/refresh` | no | token | Renovar accessToken |
| GET | `/api/auth/me` | sí | user/admin | Perfil autenticado |
| GET | `/api/docs` | sí | user/admin | Listar documentos propios |
| POST | `/api/docs` | sí | user/admin | Subir y firmar (v1) |
| PUT | `/api/docs/:id` | sí | propietario | Nueva versión firmada |
| GET | `/api/docs/:id` | sí | propietario | Detalle + última versión |
| GET | `/api/docs/:id/versions` | sí | propietario | Historial de versiones |
| GET | `/api/docs/:id/qr` | sí | propietario | QR de verificación |
| GET | `/api/docs/:id/public` | no | público | Vista pública |
| GET | `/api/docs/:id/file?versionId=` | opcional | público/propietario | Descargar versión |
| PATCH | `/api/docs/:id/visibility` | sí | propietario | Compartir/privar |
| GET | `/api/docs/:id/proposals` | sí | propietario | Listar propuestas |
| POST | `/api/docs/:id/proposals` | sí | user (doc público) | Crear propuesta firmada |
| GET | `/api/docs/:id/proposals/:pid/file` | opcional | público/propietario/proponente | Descargar propuesta |
| POST | `/api/docs/:id/proposals/:pid/accept` | sí | propietario | Aceptar → coautoría |
| POST | `/api/docs/:id/proposals/:pid/reject` | sí | propietario | Rechazar |
| GET | `/api/docs/:id/compare` | opcional | público/propietario | Comparar artefactos |
| GET | `/api/users/:username` | no | público | Perfil público |
| POST | `/api/verify` | no | público | Verificar archivo |
| GET | `/api/verify/:documentId` | no | público | Info verificación (QR) |
| GET | `/api/audit` | sí | **admin** | Bitácora paginada/filtrable |
| GET | `/api/audit/verify-chain` | sí | **admin** | Verificar cadena |

---

## Anexo B — Resumen de pruebas automatizadas

| Suite | Archivos | Tests | Cobertura |
|-------|:--------:|:-----:|-----------|
| Backend (Vitest + Supertest) | 12 | **98** | Unit (auth-middleware, crypto, document-analysis, rate-limit), services (auth, audit, document), integración API (auth, documents, verify, audit, scenarios E2E colaborativas) |
| Frontend (Vitest) | 2 | **17** | `api.test.ts` (cliente HTTP, refresh, flujos) y `stores/auth.test.ts` (store de sesión) |

Verificación de calidad: backend `tsc --noEmit` → 0 errores; frontend `pnpm check` (svelte-check) → 0 errores / 0 warnings.

---

*Anexo: este documento fue generado a partir del análisis exhaustivo del código fuente del repositorio `Tesis2` (backend, frontend, base de datos, tests y documentación).*