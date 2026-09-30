# Sistema de Gestión Documental con Firma Digital y Trazabilidad

Componente técnico de tesis sobre seguridad documental.

## Problema

Los documentos se comparten por canales informales (WhatsApp, correo) sin garantía de que la versión recibida sea la auténtica o la más reciente, lo que permite manipulación de cláusulas sin que el firmante lo note.

## Solución

Repositorio centralizado con firma digital criptográfica, trazabilidad inmutable y verificación pública.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | SvelteKit |
| Backend | Node.js + Express + TypeScript |
| Base de datos | SQLite |
| Criptografía | Node.js crypto (RSA-2048, AES-256-GCM, SHA-256) |
| QR | qrcode (npm) |
| Auth | JWT + bcryptjs |
| Gestor de paquetes | pnpm |

## Inicio Rápido

### Prerrequisitos

- Node.js >= 18
- pnpm (instalar con `npm install -g pnpm`)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/JoshuaJBLX/TESIS2.git
cd Tesis2

# Instalar backend
cd backend
pnpm install

# Instalar frontend
cd ../frontend
pnpm install
```

### Configurar Variables de Entorno

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus valores
```

### Ejecutar

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

### Base de Datos

```bash
cd backend

# Crear esquema
pnpm db:migrate

# Poblar con datos de prueba
pnpm db:seed
```

## Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | Admin123!@# | admin |
| carlos | Carlos123!@# | user |
| maria | Maria123!@# | user |

## API Endpoints

### Autenticación (público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Refrescar token |

### Documentos (autenticado)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docs` | Listar documentos |
| POST | `/api/docs` | Subir documento |
| PUT | `/api/docs/:id` | Actualizar documento |
| GET | `/api/docs/:id` | Detalles del documento |
| GET | `/api/docs/:id/versions` | Historial de versiones |
| GET | `/api/docs/:id/qr` | Obtener código QR |

### Verificación (público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/verify` | Verificar documento subido |
| GET | `/api/verify/:documentId` | Info verificación por URL |

### Auditoría (admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/audit` | Bitácora de auditoría |
| GET | `/api/audit/verify-chain` | Verificar integridad cadena |

## Limitación Legal

> **Esta implementación NO constituye firma electrónica bajo la Ley 27269.** No utiliza una Entidad de Certificación acreditada ni la IOFE/RENIEC. Es una implementación propia de firma digital criptográfica que provee autenticidad y no repudio dentro del propio sistema.

## Documentación

- [01_planificacion.md](doc/00_indice_documentacion/01_planificacion.md) — Planificación exhaustiva del proyecto
