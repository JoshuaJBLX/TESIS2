# Planificación Exhaustiva — Sistema de Gestión Documental con Firma Digital y Trazabilidad

> Componente técnico de tesis sobre seguridad documental.
> **Stack**: SvelteKit + Node.js/Express + SQLite + pnpm

---

## 1. Problema y Solución

### Problema

Los documentos se comparten por canales informales (WhatsApp, correo) sin garantía de que la versión recibida sea la auténtica o la más reciente. Esto permite manipulación de cláusulas sin que el firmante lo note.

### Solución

Repositorio centralizado con firma digital, trazabilidad y verificación pública.

---

## 2. Stack Tecnológico y Justificación

| Capa | Tecnología | Justificación Académica |
|------|------------|------------------------|
| Frontend | SvelteKit | Compilación a vanilla JS (sin runtime grande), rendimiento superior, adoptado por Switchery (iniene documentación académica creciente), rendering adaptativo (SSR + CSR) |
| Backend | Node.js + Express + TypeScript | Mismo lenguaje fullstack, excelente para I/O concurrente, librería crypto nativa robusta, amplio respaldo industrial |
| Base de datos | SQLite | Cero configuración, portátil (archivo único), suficiente para demo/tesis, migración fácil a PostgreSQL |
| Criptografía | Node.js `crypto` nativo | SHA-256 y RSA incluidos, sin dependencias externas, respaldado por OpenSSL |
| QR | `qrcode` (npm) | Generación eficiente, soporte SVG/PNG, ampliamente documentado |
| Auth | JWT + bcryptjs | Estándar de la industria (RFC 7519), tokens stateless, hash seguro de contraseñas |

### Alternativas Descartadas

| Alternativa | Razón de Descarte |
|-------------|-------------------|
| React/Next.js | Svelte es más ligero y transparente para sustentar (compilación estática vs runtime de React) |
| Python/Django | Curva de aprendizaje innecesaria, mismo lenguaje fullstack es más coherente |
| Java/Spring Boot | Verboso para proyecto académico |
| MongoDB | No garantiza integridad referencial ACID crítica para auditoría inmutable |
| MySQL | PostgreSQL tendría más sentido pero SQLite es suficiente para demo |

---

## 3. Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SvelteKit)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Login    │  │ Upload   │  │ History  │  │ Verify   │   │
│  │ Register │  │ Documents│  │ Panel    │  │ Public   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Express)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ Documents│  │ Audit    │  │ Verify   │   │
│  │ Module   │  │ Module   │  │ Module   │  │ Module   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Crypto Service (firma/hash)             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     BASE DE DATOS (SQLite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ users    │  │ documents│  │ versions │  │ audit_log│   │
│  │ keys     │  │          │  │ signatures│  │ (append) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Modelo de Datos

### Esquema SQL

```sql
-- Usuarios
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Par de claves criptográficas
CREATE TABLE user_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    key_algorithm TEXT NOT NULL,
    key_fingerprint TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Documentos maestros
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Versiones de documentos
CREATE TABLE document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    UNIQUE(document_id, version_number)
);

-- Firmas digitales
CREATE TABLE document_signatures (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL UNIQUE,
    signer_id TEXT NOT NULL,
    signature_value TEXT NOT NULL,
    signature_algorithm TEXT NOT NULL,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (signer_id) REFERENCES users(id)
);

-- Bitácora de auditoría (append-only, encadenada)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id TEXT,
    event_data TEXT NOT NULL,
    previous_hash TEXT,
    current_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Diagrama ER

```
users 1────1 user_keys
users 1────N documents (owner_id)
users 1────N document_versions (uploaded_by)
users 1────N document_signatures (signer_id)
documents 1────N document_versions
document_versions 1────1 document_signatures
audit_log (independiente, encadenada por hashes)
```

---

## 5. Flujo Criptográfico

### Generación de Claves

- **Algoritmo**: RSA-2048 (mayor compatibilidad y documentación académica)
- **Fingerprint**: SHA-256 de la clave pública (identificador único)
- **Protección de clave privada**: Cifrada con AES-256-GCM, key derivation PBKDF2 (100k iteraciones + salt único)

### Firma de Documentos

1. Leer contenido del archivo
2. Calcular SHA-256 del contenido
3. Firmar el hash con la clave privada del usuario
4. Almacenar firma (Base64), no la clave privada

### Verificación

1. Recalcular SHA-256 del archivo recibido
2. Comparar con hash original almacenado
3. Verificar firma con clave pública del firmante
4. Retornar: íntegro / manipulado / no encontrado

### Protección de Clave Privada

```
Registro: Password → PBKDF2 → Key → AES-256-GCM → encrypted_key (almacenada)
Firma: encrypted_key + Password → PBKDF2 → Key → descifrar → firmar (en memoria) → limpiar
```

**La clave privada NUNCA se almacena en texto plano.**

---

## 6. Diseño de API

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/refresh` | No | Refrescar token |
| GET | `/api/users/me` | Sí | Perfil del usuario |
| GET | `/api/docs` | Sí | Listar documentos |
| POST | `/api/docs` | Sí | Subir documento |
| PUT | `/api/docs/:id` | Sí | Actualizar (nueva versión) |
| GET | `/api/docs/:id` | Sí | Detalles del documento |
| GET | `/api/docs/:id/versions` | Sí | Historial de versiones |
| GET | `/api/docs/:id/qr` | Sí | Obtener código QR |
| POST | `/api/verify` | **No** | Verificar documento |
| GET | `/api/verify/:documentId` | **No** | Info verificación por URL |
| GET | `/api/audit` | Admin | Bitácora de auditoría |
| GET | `/api/audit/verify-chain` | Admin | Verificar integridad cadena |

---

## 7. Consideraciones de Seguridad

### Matriz de Amenazas

| Amenaza | Nivel | Contramedida |
|---------|-------|--------------|
| Suplantación de identidad | Crítico | Validación de email, registro restringido |
| Robo de clave privada | Crítico | Cifrado AES-256-GCM + PBKDF2, nunca en texto plano |
| Ataque de repetición | Alto | Rate limiting + Idempotency keys |
| Manipulación de auditoría | Alto | Cadena de hashes SHA-256 (append-only) |
| XSS | Medio | Sanitización de entradas |
| Fuerza bruta | Medio | Bloqueo temporal + límite de intentos |
| Path traversal | Medio | Nombres aleatorios de archivo + validación MIME |

### Logging Seguro

Nunca loggear: passwords, claves privadas, tokens. Usar campos `[REDACTED]`.

---

## 8. Plan de Implementación Incremental

### Fase A: Fundamentos (Semanas 1-2)

**Objetivo**: Backend con autenticación + frontend básico.

- [ ] Inicializar proyecto backend (Express + TypeScript + pnpm)
- [ ] Configurar SQLite + esquema de BD
- [ ] Implementar modelo de usuarios
- [ ] Implementar auth (register, login, refresh)
- [ ] Implementar middleware JWT
- [ ] Crear seeds con datos reales
- [ ] Inicializar frontend SvelteKit
- [ ] Crear páginas: login, register, dashboard
- [ ] Integración frontend-backend

**Entregable**: MVP 0.1 — Login/Register funcional.

### Fase B: Criptografía (Semanas 3-4)

**Objetivo**: Generación de claves y firma digital.

- [ ] Implementar generación de claves RSA-2048
- [ ] Implementar cifrado de clave privada (AES-256-GCM)
- [ ] Integrar claves con registro de usuario
- [ ] Implementar firma de documentos
- [ ] Implementar verificación de firma
- [ ] Implementar generación de QR

**Entregable**: MVP 0.2 — Firma digital funcional.

### Fase C: Documentos (Semanas 5-6) — Completada

**Objetivo**: Gestión completa de documentos con versionado.

- [ ] Upload de archivos con validación
- [ ] Sistema de versionado automático
- [ ] Firma automática por versión
- [ ] Listado y consulta de documentos
- [ ] Verificación pública sin autenticación
- [ ] Panel de verificación con QR

**Entregable**: MVP 0.3 — Gestión documental completa.

### Fase D: Trazabilidad (Semanas 7-8) — Completada

**Objetivo**: Auditoría inmutable con cadena de hashes.

- [ ] Implementar audit log service
- [ ] Cadena de hashes encadenados
- [ ] Verificación de integridad de cadena
- [ ] Panel de auditoría (admin)
- [ ] Rate limiting y brute force protection
- [ ] Documentación final

**Entregable**: MVP 1.0 — Sistema completo para tesis.

---

## 9. Limitación Declarada

> **Esta implementación NO constituye firma electrónica bajo la Ley 27269 (Ley de Firmas y Documentos Electrónicos).** No utiliza una Entidad de Certificación acreditada ni la Infraestructura Oficial de Firma Electrónica (IOFE)/RENIEC. Es una implementación propia de firma digital criptográfica (par de claves asimétricas RSA-2048 por usuario) que provee autenticidad y no repudio **dentro del propio sistema**, no validez legal plena.

---

## 10. Decisiones de Diseño (para Capítulo de Metodología)

| Decisión | Elección | Alternativa Descartada | Justificación |
|----------|----------|------------------------|---------------|
| Framework frontend | SvelteKit | React/Next.js | Compilación estática más transparente para sustentar, sin runtime overhead |
| Backend | Express | Hono, Koa | Mayor documentación y comunidad, ampliamente estudiado |
| Base de datos | SQLite | PostgreSQL, MongoDB | Portabilidad, cero configuración, suficiente para demo académica |
| Algoritmo asimétrico | RSA-2048 | ECDSA P-256 | Mayor compatibilidad, más ampliamente estudiado en literatura académica |
| Hash | SHA-256 | SHA-512, SHA-3 | Balance seguridad/rendimiento, suficiente para documentos |
| Cifrado simétrico | AES-256-GCM | AES-256-CBC | GCM incluye autenticación, previene padding oracle attacks |
| Derivación de clave | PBKDF2 100k | bcrypt (bcryptjs), scrypt | Estándar NIST, integrado en Node.js crypto |
| Firma | RSA-SHA256 | ECDSA-SHA256 | Mayor soporte de compatibilidad |
| Auth | JWT | Sesiones stateless, estándar RFC 7519 |
| Gestor de paquetes | pnpm | npm, yarn | Más eficiente en disco, estricto por defecto |
