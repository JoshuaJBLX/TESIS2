# Arquitectura del Sistema

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

---

## 1. Estilo Arquitectónico

El SGD-FD adopta una **arquitectura monolítica modular en capas**, con
separación estricta entre interfaz, lógica de negocio, acceso a datos y
criptografía.

| Característica | Decisión |
|----------------|----------|
| Estilo | Monolito modular en capas (capas L, C, B, D) |
| Acoplamiento | Bajo entre capas; alto dentro de un módulo |
| Communication | HTTP/JSON sobre REST |
| Persistencia | Repositorio abstracto (`DbDriver`) con implementación SQLite |
| Autenticación | JWT stateless (access + refresh) |
| Seguridad | Claves RSA por usuario, cifradas con la contraseña del usuario |

**Justificación del monolito modular:** el sistema tiene una sola frontera
transaccional, un único equipo y un despliegue de escala pequeña. Un monolito
elimina la complejidad de la comunicación distribuida (latencia, reintentos,
consistencia) sin renunciar a la separación de responsabilidades. La
arquitectura por capas garantiza que la lógica criptográfica —el núcleo de
valor— esté aislada y sea verificable de forma independiente.

---

## 2. Capas

### 2.1. Capa de Presentación (Frontend)

**Tecnología:** SvelteKit 2 + Svelte 5 (Runes), TypeScript, Vite.

```
frontend/src/
├── routes/                    # Páginas (file-based routing de SvelteKit)
│   ├── +page.svelte           # Inicio
│   ├── login/                 # Autenticación
│   ├── register/
│   ├── documents/             # Listado y detalle
│   ├── verify/                # Verificación pública
│   ├── profile/[username]/    # Perfil público
│   └── audit/                 # Auditoría (solo admin)
├── lib/
│   ├── api.ts                 # Cliente HTTP (ApiClient)
│   ├── stores/                # Estado global (Svelte stores)
│   └── components/            # Componentes reutilizables
└── app.d.ts                   # Tipos de import.meta.env
```

Responsabilidades: presentación, validación de cliente, gestión de sesión en
`localStorage` y renovación transparente de tokens.

### 2.2. Capa de Lógica de Negocio (Backend)

**Tecnología:** Express 4.21.2, TypeScript, ESM.

```
backend/src/
├── app.ts                     # Composición de la aplicación
├── routes/                    # Capa L (HTTP)
│   ├── auth.ts                # /api/auth
│   ├── documents.ts           # /api/docs
│   ├── verify.ts              # /api/verify
│   ├── audit.ts               # /api/audit
│   └── users.ts               # /api/users
├── services/                  # Capa C (negocio)
│   ├── auth.service.ts
│   ├── document.service.ts
│   ├── audit.service.ts
│   └── document-analysis.ts   # Extracción de texto y diff
├── middleware/
│   ├── auth.ts                # authenticate / authenticateOptional / requireAdmin
│   └── rateLimit.ts           # Limitación de peticiones
├── crypto/                    # Núcleo criptográfico
│   ├── keyGenerator.ts        # Generación de pares RSA
│   ├── keyProtection.ts       # Cifrado/descifrado de la clave privada
│   ├── signature.ts           # Firma y verificación
│   └── verification.ts        # Verificación de documentos
├── db/                        # Capa D (datos)
│   ├── driver.ts              # Contrato DbDriver
│   ├── sqlite-driver.ts       # Implementación sql.js
│   ├── connection.ts          # Selección de motor
│   ├── query.ts               # Helpers de consulta
│   └── migrate.ts             # Esquema
└── models/types.ts            # Entidades y DTOs
```

### 2.3. Capa de Datos

Aplica el patrón **Repositorio** mediante el contrato `DbDriver`
(`backend/src/db/driver.ts:13`):

```typescript
export interface DbDriver {
  readonly engine: 'sqlite' | 'postgresql';
  run(sql: string, params?: unknown[]): void;
  exec(sql: string, params?: unknown[]): SqlResultSet[];
  save(): void;
  close(): void;
}
```

Los servicios dependen de la interfaz, nunca de `sql.js`. Esto permite migrar a
PostgreSQL sin reescribir la lógica de negocio, y es la base del plan de nube
descrito en §7.

---

## 3. Estructura de la Petición

```
 Cliente (SvelteKit)
      │  Authorization: Bearer <JWT>
      ▼
 ┌──────────────────────────────────────┐
 │ 1. helmet  — cabeceras de seguridad  │
 │ 2. cors     — origen permitido       │
 │ 3. express.json()                    │
 │ 4. rateLimit — 300 req / 15 min      │
 └──────────────────────────────────────┘
      ▼
 ┌──────────────────────────────────────┐
 │ 5. authenticate  — valida el JWT     │
 │ 6. requireAdmin  — valida el rol     │
 └──────────────────────────────────────┘
      ▼
 ┌──────────────────────────────────────┐
 │ 7. Ruta       — valida la entrada    │
 │ 8. Servicio   — regla de negocio     │
 │ 9. Crypto     — hash / firma         │
 │10. DbDriver   — persistencia        │
 │11. auditService — bitácora encadenada│
 └──────────────────────────────────────┘
      ▼
 { success, data?, error?, pagination? }
```

El formato de respuesta es **uniforme en toda la API**:

```jsonc
// Éxito
{ "success": true, "data": { }, "pagination": { } }

// Error
{ "success": false, "error": "mensaje" }
```

---

## 4. Decisiones de Arquitectura (ADR)

### ADR-001 — Clave privada por usuario, cifrada con su contraseña

| | |
|---|---|
| **Contexto** | Requerir no repudio: la firma debe impedir que el servidor falsifique. |
| **Decisión** | Cada usuario genera un par RSA-2048 en su registro. La clave privada se cifra con AES-256-GCM usando una clave derivada (PBKDF2-HMAC-SHA512, 100 000 iteraciones) de su contraseña, y se almacena serializada en JSON en `user_keys.encrypted_private_key`. |
| **Consecuencia positiva** | El servidor no posee la clave privada en claro. Un atacante con acceso total a la base de datos no puede firmar sin conocer la contraseña. |
| **Consecuencia negativa** | Si el usuario olvida su contraseña, su clave privada es irrecuperable (riesgo `RK-10`, aceptado). |
| **Alternativa descartada** | Almacenar la clave privada del servidor: violaría el no repudio. |

### ADR-002 — SHA-256 sobre el contenido, firma RSA-SHA256 sobre el hash

| | |
|---|---|
| **Contexto** | Un documento puede pesar hasta 10 MB; firmarlo directamente es inviable. |
| **Decisión** | `content_hash = SHA256(bytes)`. Se firma el hash, no el archivo. |
| **Consecuencia positiva** | Firma rápida y tamaño constante; verificar reescala idénticamente. |
| **Consecuencia negativa** | La fuerza criptográfica queda ligada a SHA-256 y RSA-2048. |

### ADR-003 — Bitácora encadenada por hash

| | |
|---|---|
| **Contexto** | Un atacante con acceso a la base de datos podría alterar filas de auditoría. |
| **Decisión** | Cada entrada almacena `previous_hash` y `current_hash = SHA256(id + event + data + previous_hash)`. Se añaden triggers `BEFORE UPDATE` y `BEFORE DELETE` que abortan la operación (`backend/src/db/migrate.ts:139`). |
| **Consecuencia positiva** | Cualquier alteración retroactiva rompe la cadena y es detectable con `GET /api/audit/verify-chain`. |
| **Consecuencia negativa** | No resiste a un atacante que controle el motor de base de datos y reescriba toda la cadena de forma consistente. Se acepta como limitación documentada. |

### ADR-004 — Monolito modular en lugar de microservicios

| | |
|---|---|
| **Decisión** | Un solo proceso Express. |
| **Justificación** | Dominio pequeño, un solo equipo, sin necesidad de escalar partes independientemente. |

### ADR-005 — SQLite en memoria con `sql.js` y persistencia explícita

| | |
|---|---|
| **Contexto** | Se requiere portabilidad sin instalación de servidor de base de datos. |
| **Decisión** | `sql.js` mantiene la base en memoria y se serializa a disco con `saveDatabase()`. |
| **Consecuencia positiva** | Cero dependencias externas; la base es un archivo que se puede copiar, versionar o borrar. |
| **Consecuencia negativa** | Toda la base reside en memoria; el límite práctico es el tamaño del heap de Node. Además, el sistema de archivos de Vercel es efímero, por lo que **no sirve para producción serverless**. |

---

## 5. Seguridad

| Capa | Control | Implementación |
|------|---------|----------------|
| Transporte | HTTPS en producción | A cargo de Vercel |
| Contraseñas | bcryptjs | `auth.service.ts` |
| Sesión | JWT de acceso (corto) + refresh | `auth.ts` |
| Autorización | Roles `admin` / `user`; propietario / coautor | `requireAdmin`, `document.service.ts` |
| Reposo (documentos) | Hash SHA-256 + firma | `signature.ts` |
| Reposo (claves) | AES-256-GCM + PBKDF2 | `keyProtection.ts` |
| Fuerza bruta | Rate limit global 300/15 min | `rateLimit.ts` |
| Auditoría | Bitácora encadenada y append-only | `audit.service.ts` |
| Cabeceras | helmet | `app.ts:37` |
| CORS | Lista blanca + origen local | `app.ts:19` |

---

## 6. Verificación Pública

El caso de uso diferenciador —verificar sin cuenta— se implementa con tres vías:

```
                   ┌──────────────────────┐
                   │   GET /v/{id}        │◀── QR impreso
  Impresión ──────▶│  (o /verify?id=)     │   en el documento
                   └──────────┬───────────┘
                              ▼
                   ┌──────────────────────┐
                   │ verifyDocument()     │
                   │  1. hash del archivo │
                   │  2. ¿coincide?       │
                   │  3. ¿firma válida?   │
                   └──────────┬───────────┘
                              ▼
              VALID │ MANIPULATED │ INVALID_SIGNATURE │ NOT_FOUND
```

| Vía | Uso |
|-----|-----|
| `/v/{id}` | Escaneo del QR. |
| Carga del archivo | Detección de **documentos falsos**: se sube una copia y se busca su hash en el registro. |
| Hash impreso | Comparación manual con cualquier visor de hash. |

---

## 7. Arquitectura Cloud (Vercel + Supabase) — Estado Real

> **Esta sección describe una arquitectura objetivo, no una implementación
> existente. El estado real se documenta en §7.3.**

### 7.1. Arquitectura Objetivo

```
        Vercel                     Supabase
 ┌───────────────┐          ┌──────────────────────┐
 │  SvelteKit    │  HTTPS   │  PostgreSQL           │
 │  (adapter-    │─────────▶│  (datos, RLS)         │
 │   vercel)     │          │                       │
 │               │          │  Storage              │
 │  Express API  │─────────▶│  (documentos firmados)│
 │  (serverless) │          │                       │
 └───────────────┘          │  Auth (opcional)      │
                            └──────────────────────┘
```

### 7.2. Migración requerida

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Contrato `DbDriver` con `run`/`exec`/`save`/`close` | **Hecho** |
| 2 | Conversión de `?` a `$1…$n` para PostgreSQL | **Hecho** (`toPositionalPlaceholders`) |
| 3 | Implementación `PostgresDriver` | **Pendiente** |
| 4 | Refactorización de la capa de datos a asíncrona (`await db.exec(...)`) | **Pendiente** |
| 5 | Portabilidad de las consultas: `AUTOINCREMENT` → `BIGSERIAL`, `TEXT` → `TEXT`, booleanos `INTEGER` → `BOOLEAN` | **Pendiente** |
| 6 | Sustitución de `uploads/` por Supabase Storage | **Pendiente** |
| 7 | `@sveltejs/adapter-vercel` y despliegue del backend serverless | **Pendiente** |
| 8 | `DATABASE_URL` y claves de Supabase en el entorno de Vercel | **Pendiente** |

### 7.3. Estado Actual y Motivo del Bloqueo

| Aspecto | Estado | Motivo |
|---------|--------|--------|
| Capa de datos | SQLite (`sql.js`), síncrona | El motor `sql.js` es síncrono por diseño; una conexión `pg` es asíncrona. |
| Comportamiento con `DATABASE_URL` | Lanza un error explícito | Se prefiere un fallo ruidoso a un despliegue que aparenta funcionar y pierde datos. |
| Almacenamiento de archivos | `backend/uploads/` | El sistema de archivos de Vercel es de solo lectura y efímero. |
| `vercel.json` | Preparado, **no validado** | No se ha ejecutado un despliegue real. |
| Adaptadores Vercel | No instalados | `ADAPTER=node\|vercel` falla hasta añadir `@sveltejs/adapter-node` / `adapter-vercel`. |

**Mensaje emitido por `backend/src/db/connection.ts:25`:**

> `DATABASE_URL esta definido pero el adaptador PostgreSQL todavia no esta habilitado. […] Para continuar en local, elimine DATABASE_URL y use DB_PATH.`

Detalle completo en
[`../../04_implementacion_despliegue/plan_nube_vercel_supabase.md`](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md).

---

## 8. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                        │
│   SvelteKit 2 + Svelte 5 + TypeScript + Vite                    │
│   Rutas · Componentes · Stores · Cliente HTTP                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS · JSON · Authorization: Bearer <JWT>
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CAPA DE LÓGICA DE NEGOCIO                      │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │  Rutas   │→│  Servicios   │→│  Crypto   │→│  Auditoría   │  │
│  │ (auth,   │ │ (auth, doc,  │ │ (keyGen,  │ │ (encadenada, │  │
│  │  docs,   │ │  analysis)   │ │  sign,    │ │  append-only)│  │
│  │  verify, │ │              │ │  verify)  │ │              │  │
│  │  audit,  │ └──────────────┘ └───────────┘ └──────────────┘  │
│  │  users)  │                                                 │
│  └──────────┘                                                 │
│  Middleware: helmet · cors · json · rateLimit · authenticate   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  SQL parametrizado
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE DATOS (Repositorio)                │
│   contrato DbDriver  ──►  SqliteDriver (sql.js)                 │
│   migrate · query · seed                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌────────────────┐                   ┌──────────────────────┐
│  SQLite        │                   │  Filesystem          │
│  data/         │                   │  uploads/            │
│  database.sqlite│                  │   ├── proposals/     │
└────────────────┘                   │   └── temp/          │
                                     └──────────────────────┘
```

---

**Documentos relacionados**

- [`analisis_tecnico.md`](analisis_tecnico.md) — Análisis técnico de la arquitectura
- [`modelo_datos.md`](modelo_datos.md) — Modelo de datos
- [`../iso_aplicada/aplicacion_iso_29119.md`](../pruebas_calidad/aplicacion_iso_29119.md) — Normas aplicadas
