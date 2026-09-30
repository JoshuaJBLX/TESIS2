# Estado del Progreso — Sistema de Gestión Documental con Firma Digital

> Última actualización: Fase B completada

---

## Resumen General

| Fase | Nombre | Estado |
|------|--------|--------|
| **A** | Fundamentos (Backend + Auth + Frontend básico) | Completada |
| **B** | Criptografía (Claves RSA + Firma + Verificación + QR) | Completada |
| **C** | Documentos (Versionado completo + historial) | Completada |
| **D** | Trazabilidad (Auditoría inmutable + cadena de hashes) | Completada |

---

## Fase A: Fundamentos

### Objetivo
Tener backend funcional con autenticación y frontend básico.

### Completado

- [x] Inicialización del proyecto con pnpm
- [x] Backend: Express + TypeScript + sql.js (WASM)
- [x] Base de datos SQLite con esquema completo (6 tablas)
- [x] Migración automática de base de datos
- [x] Servicio de autenticación: register, login, refresh
- [x] Middleware JWT para rutas protegidas
- [x] Seeds con 3 usuarios de prueba reales
- [x] Frontend: SvelteKit con páginas login, register, dashboard
- [x] Store de autenticación con persistencia en localStorage

### Archivos Creados

```
tesis-documental/
├── 02_planificacion.md
├── 01_readme.md
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env / .env.example
│   └── src/
│       ├── app.ts
│       ├── db/
│       │   ├── connection.ts
│       │   ├── migrate.ts
│       │   ├── seed.ts
│       │   └── query.ts
│       ├── models/types.ts
│       ├── middleware/auth.ts
│       ├── routes/auth.ts
│       └── services/auth.service.ts
└── frontend/
    ├── src/
    │   ├── lib/api.ts
    │   ├── lib/stores/auth.ts
    │   └── routes/
    │       ├── +layout.svelte
    │       ├── +page.svelte
    │       ├── login/+page.svelte
    │       ├── register/+page.svelte
    │       └── dashboard/+page.svelte
    └── ...
```

### Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!@#` | admin |
| `carlos` | `Carlos123!@#` | user |
| `maria` | `Maria123!@#` | user |

---

## Fase B: Criptografía

### Objetivo
Generación de claves, firma digital, verificación y QR.

### Completado

- [x] Generación de par de claves RSA-2048
- [x] Fingerprint SHA-256 de la clave pública
- [x] Cifrado de clave privada con AES-256-GCM
- [x] Derivación de clave con PBKDF2 (100,000 iteraciones + salt)
- [x] Integración de claves con registro de usuario
- [x] Seeds generan claves criptográficas para cada usuario
- [x] Firma digital de documentos (RSA-SHA256)
- [x] Verificación de integridad (hash SHA-256)
- [x] Verificación de firma digital
- [x] Generación de códigos QR (URL de verificación)
- [x] Upload de documentos con firma automática
- [x] Listado de documentos
- [x] Detalle de documento con última versión
- [x] Historial de versiones
- [x] Actualización de documentos (nueva versión + nueva firma)
- [x] Verificación pública sin autenticación (POST con archivo)
- [x] Página de verificación por URL (GET para QR scan)
- [x] Frontend: Página de documentos con upload
- [x] Frontend: Detalle de documento con historial
- [x] Frontend: Página de verificación pública

### Archivos Creados

```
backend/src/crypto/
├── keyGenerator.ts      ← Generación RSA-2048
├── keyProtection.ts     ← AES-256-GCM + PBKDF2
├── signature.ts         ← Firma de documentos
└── verification.ts      ← Verificación de firmas

backend/src/services/
└── document.service.ts  ← Upload, versionado, auditoría

backend/src/routes/
├── documents.ts         ← CRUD documentos + QR
└── verify.ts            ← Verificación pública

frontend/src/routes/
├── documents/
│   ├── +page.svelte     ← Lista + upload
│   └── [id]/
│       └── +page.svelte ← Detalle + historial + actualizar
└── verify/
    └── +page.svelte     ← Verificación pública
```

### Flujo Criptográfico Implementado

```
Registro:
  Password → PBKDF2 (100k, salt) → AES-256-GCM → encrypted_key (almacenada)

Firma:
  encrypted_key + Password → PBKDF2 → AES decrypt → privateKey (memoria)
  File → SHA-256 → sign(privateKey) → signature → store
  privateKey → cleanup (nunca en disco)

Verificación:
  File → SHA-256 → compare(stored_hash)
  File → SHA-256 → verify(publicKey, signature)
```

### Testeos Realizados (CLI)

```
1. LOGIN OK: admin
2. UPLOAD: Documento firmado con RSA-SHA256 + QR generado
3. LIST: 2 documentos
4. DETAIL: Contrato de Arrendamiento - Owner: admin
5. VERSIONS: 1 versión
6. QR: URL generada correctamente
7. PUBLIC VERIFY (QR): Signed by admin
8. PUBLIC VERIFY (FILE): VALID - Hash OK, Firma OK
9. MANIPULATED FILE: MANIPULATED - Hash no coincide
```

---

## Fase C: Documentos (Cubierta en B)

La funcionalidad de documentos ya fue implementada en la Fase B:

- [x] Upload de archivos con validación
- [x] Sistema de versionado automático (v1, v2, v3...)
- [x] Firma automática por versión
- [x] Listado y consulta de documentos
- [x] Detalle con última versión
- [x] Historial completo de versiones
- [x] Actualización crea nueva versión firmada
- [x] Verificación pública sin autenticación
- [x] Código QR por documento

---

## Fase D: Trazabilidad (Completada)

### Por Implementar

- [x] Servicio de auditoría (audit log append-only)
- [x] Encadenamiento de hashes entre registros
- [x] Verificación de integridad de la cadena
- [x] Endpoint GET /api/audit (solo admin, filtros y paginación)
- [x] Endpoint GET /api/audit/verify-chain (solo admin)
- [x] Panel de auditoría en frontend
- [x] Rate limiting en memoria
- [x] Protección contra fuerza bruta
- [x] Logging seguro (sin datos sensibles)

---

## Stack Tecnológico Final

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | SvelteKit | 2.x + Svelte 5 |
| Backend | Node.js + Express | 4.x + TypeScript |
| Base de datos | SQLite (sql.js WASM) | 1.14.x |
| Criptografía | Node.js crypto | nativo |
| Firma digital | RSA-2048 + SHA-256 | nativo |
| Cifrado clave privada | AES-256-GCM + PBKDF2 | nativo |
| QR | qrcode | 1.5.x |
| Auth | JWT + bcryptjs | 9.x + 2.x |
| Gestor de paquetes | pnpm | 11.x |

---

## Decisiones Técnicas Documentadas

| Decisión | Elección | Alternativa Descartada | Justificación |
|----------|----------|------------------------|---------------|
| Framework frontend | SvelteKit | React/Next.js | Compilación estática más transparente, sin runtime overhead |
| Base de datos | SQLite (sql.js) | PostgreSQL, MongoDB | Portabilidad, cero configuración, sin compilación nativa |
| Algoritmo asimétrico | RSA-2048 | ECDSA P-256 | Mayor compatibilidad, más ampliamente estudiado |
| Hash | SHA-256 | SHA-512, SHA-3 | Balance seguridad/rendimiento |
| Cifrado simétrico | AES-256-GCM | AES-256-CBC | GCM incluye autenticación |
| Derivación de clave | PBKDF2 100k | bcrypt (bcryptjs), scrypt | Estándar NIST, integrado en Node.js |
| Firma | RSA-SHA256 | ECDSA-SHA256 | Mayor soporte de compatibilidad |
| Auth | JWT | Sesiones | Stateless, estándar RFC 7519 |
| BD nativa | sql.js (WASM) | better-sqlite3 | Requiere Visual Studio C++ Build Tools |

---

## Limitación Legal Declarada

> **Esta implementación NO constituye firma electrónica bajo la Ley 27269.** No utiliza una Entidad de Certificación acreditada ni la Infraestructura Oficial de Firma Electrónica (IOFE)/RENIEC. Es una implementación propia de firma digital criptográfica (par de claves asimétricas RSA-2048 por usuario) que provee autenticidad y no repudio **dentro del propio sistema**, no validez legal plena.

---

## Cómo Ejecutar

```bash
# Instalar dependencias
cd tesis-documental/backend && pnpm install
cd ../frontend && pnpm install

# Base de datos
cd backend
pnpm db:migrate
pnpm db:seed

# Ejecutar
# Terminal 1
cd backend && pnpm dev

# Terminal 2
cd frontend && pnpm dev

# Abrir http://localhost:5173
```
