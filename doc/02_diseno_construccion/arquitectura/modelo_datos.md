# Modelo de Datos

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

---

## 1. Esquema Relacional

El esquema se define en `backend/src/db/migrate.ts` y comprende **7 tablas**.

```
                          ┌──────────────┐
                          │    users     │
                          │──────────────│
                          │ PK id        │
                          │    username  │ (UQ)
                          │    email     │ (UQ)
                          │    password_hash
                          │    role      │ admin | user
                          │    full_name │
                          │    is_active │
                          └──────┬───────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │ 1:1          │ 1:N            │ 1:N
                 ▼              ▼                ▼
        ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐
        │   user_keys    │  │  documents  │  │  document_       │
        │────────────────│  │─────────────│  │  proposals       │
        │ PK id          │  │ PK id       │  │  (como proposed_ │
        │ FK user_id UQ  │  │    title    │  │   by)            │
        │    public_key  │  │    descr.   │  └────────┬─────────┘
        │    encrypted_  │  │ FK owner_id │           │ N:1
        │     private_key│  │    is_public│  ┌────────▼─────────┐
        │    algorithm   │  │    created  │  │  users           │
        │    fingerprint │  │    updated  │  │  (proposals)     │
        └────────────────┘  └──────┬──────┘  └──────────────────┘
                                    │ 1:N
                                    ▼
                          ┌──────────────────────┐
                          │  document_versions   │
                          │──────────────────────│
                          │ PK id                │
                          │ FK document_id (CAS) │
                          │    version_number    │ (UNIQUE conjunto)
                          │    file_name         │
                          │    file_path         │
                          │    file_size         │
                          │    mime_type         │
                          │    content_hash      │ ◀── SHA-256
                          │ FK uploaded_by       │
                          │ FK coauthor_id       │
                          │ FK source_proposal_id│
                          │    upload_date       │
                          │    change_description│
                          └──────────┬───────────┘
                                     │ 1:1
                                     ▼
                          ┌──────────────────────┐
                          │ document_signatures  │
                          │──────────────────────│
                          │ PK id                │
                          │ FK version_id (UQ)   │
                          │ FK signer_id         │
                          │    signature_value   │ ◀── RSA
                          │    signature_algorithm│
                          │    signed_at         │
                          └──────────────────────┘

                          ┌──────────────────────┐
                          │      audit_log       │  (append-only)
                          │──────────────────────│
                          │ PK id (AUTOINCREMENT)│
                          │    event_type        │
                          │    entity_type       │
                          │    entity_id         │
                          │    user_id           │
                          │    event_data        │
                          │    previous_hash     │ ◀── cadena
                          │    current_hash      │ ◀── SHA-256
                          │    created_at        │
                          └──────────────────────┘
                              ▲          ▲
                              │          │
                    sin FK:EntityType=Any (no hay integridad referencial
                    sobre entity_id por diseño: la bitácora registra
                    entidades de cualquier tipo, incluidas las eliminadas)
```

---

## 2. Diccionario de Datos

### 2.1. `users`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID v4 del usuario |
| `username` | TEXT | No | UQ | Identificador de acceso, 3–50 caracteres |
| `email` | TEXT | No | UQ | Correo, unicidad verificada |
| `password_hash` | TEXT | No | | Hash bcryptjs de la contraseña |
| `role` | TEXT | No | | `admin` \| `user` (CHECK) |
| `full_name` | TEXT | No | | Nombre completo |
| `created_at` | DATETIME | Sí | | `CURRENT_TIMESTAMP` por defecto |
| `is_active` | BOOLEAN | Sí | | `1` por defecto; baja lógica |

### 2.2. `user_keys`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID |
| `user_id` | TEXT | No | FK, UQ | Un par de claves por usuario (1:1) |
| `public_key` | TEXT | No | | Clave pública en PEM |
| `encrypted_private_key` | TEXT | No | | JSON con `encryptedData`, `iv`, `authTag` y `salt` en Base64 (AES-256-GCM) |
| `key_algorithm` | TEXT | No | | `RSA-2048` |
| `key_fingerprint` | TEXT | No | | SHA-256 de la clave pública, en pares hexadecimales separados por `:` |
| `created_at` | DATETIME | Sí | | |

### 2.3. `documents`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID |
| `title` | TEXT | No | | 1–200 caracteres |
| `description` | TEXT | Sí | | Texto libre |
| `owner_id` | TEXT | No | FK → `users.id` | Propietario |
| `is_public` | INTEGER | No | | `0` privado, `1` público (galería) |
| `created_at` | DATETIME | Sí | | |
| `updated_at` | DATETIME | Sí | | Se actualiza al crear una versión |

### 2.4. `document_versions`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID |
| `document_id` | TEXT | No | FK → `documents.id` **ON DELETE CASCADE** | |
| `version_number` | INTEGER | No | UQ con `document_id` | Secuencial desde 1 |
| `file_name` | TEXT | No | | Nombre original |
| `file_path` | TEXT | No | | Ruta relativa en `uploads/` |
| `file_size` | INTEGER | No | | Bytes; ≤ 10 485 760 |
| `mime_type` | TEXT | No | | PDF, DOCX, TXT o imagen |
| `content_hash` | TEXT | No | | SHA-256 en hexadecimal |
| `uploaded_by` | TEXT | No | FK → `users.id` | |
| `coauthor_id` | TEXT | Sí | FK → `users.id` | Autor de la propuesta aceptada |
| `source_proposal_id` | TEXT | Sí | FK → `document_proposals.id` | Trazabilidad del cambio |
| `upload_date` | DATETIME | Sí | | |
| `change_description` | TEXT | Sí | | Motivo del cambio |

### 2.5. `document_proposals`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID |
| `document_id` | TEXT | No | FK → `documents.id` **CASCADE** | |
| `base_version_id` | TEXT | No | FK → `document_versions.id` | Versión sobre la que se propone |
| `file_name` | TEXT | No | | |
| `file_path` | TEXT | No | | Ruta en `uploads/proposals/` |
| `file_size` | INTEGER | No | | |
| `mime_type` | TEXT | No | | |
| `content_hash` | TEXT | No | | SHA-256 de la propuesta |
| `proposed_by` | TEXT | No | FK → `users.id` | |
| `signature_value` | TEXT | No | | Firma propia de la propuesta |
| `signature_algorithm` | TEXT | No | | `RSA-SHA256` |
| `signed_at` | DATETIME | Sí | | |
| `change_description` | TEXT | No | | Obligatorio |
| `status` | TEXT | No | | `pending` \| `accepted` \| `rejected` (CHECK) |
| `reviewed_by` | TEXT | Sí | FK → `users.id` | Solo el propietario |
| `reviewed_at` | DATETIME | Sí | | |
| `accepted_version_id` | TEXT | Sí | FK → `document_versions.id` | Versión resultante |
| `created_at` | DATETIME | Sí | | |

### 2.6. `document_signatures`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | TEXT | No | PK | UUID |
| `version_id` | TEXT | No | FK → `document_versions.id` **CASCADE**, UQ | Una firma por versión |
| `signer_id` | TEXT | No | FK → `users.id` | Firmante efectivo |
| `signature_value` | TEXT | No | | Base64 de la firma RSA |
| `signature_algorithm` | TEXT | No | | `RSA-SHA256` |
| `signed_at` | DATETIME | Sí | | |

### 2.7. `audit_log`

| Columna | Tipo | Nulo | Clave | Descripción |
|---------|------|:----:|-------|-------------|
| `id` | INTEGER | No | PK AUTOINCREMENT | Secuencial; ningún hueco entre entradas |
| `event_type` | TEXT | No | | `DOCUMENT_CREATED`, `VERSION_CREATED`, `LOGIN_SUCCESS`, … |
| `entity_type` | TEXT | No | | `document`, `user`, `proposal`, `system` |
| `entity_id` | TEXT | No | | Sin FK por diseño (§4) |
| `user_id` | TEXT | Sí | | `null` en eventos de sistema |
| `event_data` | TEXT | No | | JSON con los detalles |
| `previous_hash` | TEXT | Sí | | `null` en la primera entrada |
| `current_hash` | TEXT | No | | SHA-256 encadenado |
| `created_at` | DATETIME | Sí | | |

---

## 3. Reglas de Integridad

| Regla | Implementación |
|-------|----------------|
| Clave primaria en todas las tablas | `id` (TEXT UUID) o `id` (INTEGER) |
| Unicidad del nombre de usuario | `UNIQUE` en `users.username` |
| Unicidad del correo | `UNIQUE` en `users.email` |
| Un solo par de claves por usuario | `UNIQUE` en `user_keys.user_id` |
| Versionado sin saltos ni duplicados | `UNIQUE(document_id, version_number)` |
| Una firma por versión | `UNIQUE` en `document_signatures.version_id` |
| Rol válido | `CHECK (role IN ('admin','user'))` |
| Estado de propuesta válido | `CHECK (status IN ('pending','accepted','rejected'))` |
| Integridad referencial | `PRAGMA foreign_keys = ON` (`connection.ts:44`) |
| Borrado en cascada de hijos | `ON DELETE CASCADE` en versiones, firmas y propuestas |
| Bitácora inmutable | Triggers `BEFORE UPDATE` / `BEFORE DELETE` con `RAISE(ABORT)` |

---

## 4. Decisiones de Modelado

### 4.1. ¿Por qué `entity_id` no tiene clave foránea en `audit_log`?

Porque la bitácora debe **sobrevivir** a la entidad que registra. Si un
documento se elimina, sus eventos permanecen como prueba de que existió. Una
FK con `CASCADE` destruiría precisamente la evidencia que la bitácora debe
conservar. La integridad referencial se sacrifica deliberadamente en aras de la
trazabilidad.

### 4.2. ¿Por qué `document_versions` no tiene `is_current`?

Porque la versión vigente es siempre la de mayor `version_number`, y ese dato
ya está indexado por `UNIQUE(document_id, version_number)`. Un campo
`is_current` adicional sería redundante y susceptible a inconsistencia
(¿qué pasa si dos filas lo tienen activo?).

### 4.3. ¿Por qué el borrado de documentos es en cascada?

Cuando un propietario elimina un documento, las versiones, firmas y propuestas
asociadas dejan de tener sentido. Conservar firmas de documentos inexistentes
generaría ruido criptográfico. La operación es **rara, explícita y auditada**.

### 4.4. ¿Por qué `INTEGER` en lugar de `BOOLEAN` para `is_public`?

`sql.js` expone los booleanos como enteros. Unificar la representación evita
conversiones en el DTO, que en el cliente se traduce a `is_public: number`
(`frontend/src/lib/api.ts:143`).

---

## 5. Diagrama de Dominio Conceptual

```
        ┌──────────────────┐
        │       Persona    │ ◀──── entidad usuaria
        └────────┬─────────┘
                 │ 1:1
        ┌────────▼─────────┐
        │   Credenciales   │
        │ (RSA-2048)       │
        │  · pública       │
        │  · privada cifr. │
        │  · huella        │
        └────────┬─────────┘
                 │ firma
    ┌────────────▼────────────┐
    │     Documento           │
    │  · título               │
    │  · descripción          │
    │  · visibilidad          │
    └────────────┬────────────┘
                 │ 1:N
    ┌────────────▼────────────────────────┐
    │          Versión                    │
    │  · número (inmutable, secuencial)   │
    │  · archivo + ruta                   │
    │  · hash SHA-256  ◀── contenido     │
    │  · autor / coautor                  │
    └────────────┬────────────────────────┘
                 │ 1:1
    ┌────────────▼────────────┐
    │        Firma            │
    │  · valor RSA            │
    │  · algoritmo            │
    │  · firmante             │
    │  · fecha                │
    └─────────────────────────┘

    ┌─────────────────────────┐        ┌──────────────────────┐
    │       Propuesta         │───────▶│     Revisión        │
    │  · base (versión)       │        │  · aceptar /         │
    │  · archivo + hash       │        │    rechazar          │
    │  · estado               │        │  · revisor           │
    └─────────────────────────┘        └──────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │                  Evento de Auditoría                   │
    │  Actor · Entidad · Acción · Datos · Hash previo · Hash  │
    └─────────────────────────────────────────────────────────┘
```

---

## 6. Migración a PostgreSQL (Supabase)

El esquema se traduce según esta tabla:

| SQLite actual | PostgreSQL | Observación |
|---------------|------------|-------------|
| `TEXT` (UUID) | `TEXT` o `UUID` | Recomendado `UUID` con `pgcrypto` |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` | `audit_log.id` |
| `BOOLEAN DEFAULT 1` | `BOOLEAN DEFAULT true` | `users.is_active` |
| `INTEGER` (0/1) como bandera | `BOOLEAN` | `documents.is_public` |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMPTZ DEFAULT now()` | Todas las marcas de tiempo |
| `CHECK (x IN ('a','b'))` | Igual, con `ENUM` como alternativa | Idéntico |
| `PRAGMA table_info` | `information_schema.columns` | `addColumnIfMissing` |
| `RAISE(ABORT, …)` | `RAISE EXCEPTION` en trigger `plpgsql` | Los triggers de inmutabilidad se replican |
| `ON DELETE CASCADE` | Igual | Compatible |
| `saveDatabase()` a fichero | Transacción de PostgreSQL | Desaparece el cuello de botella principal |

**Script de traducción**: pendiente de escritura junto con la implementación
del `PostgresDriver`. Ver
[`../../04_implementacion_despliegue/plan_nube_vercel_supabase.md`](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md).

---

**Documentos relacionados**

- [`../arquitectura/arquitectura.md`](../arquitectura/arquitectura.md) — Arquitectura del sistema
- [`../../05_mantenimiento_evaluacion/referencia/glosario_tecnico.md`](../../05_mantenimiento_evaluacion/referencia/glosario_tecnico.md) — Glosario
- `backend/src/db/migrate.ts` — Fuente de verdad del esquema
