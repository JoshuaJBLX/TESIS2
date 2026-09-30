# Guía de Instalación — DocuTrust

**Sistema de Gestión Documental con Firma Digital y Trazabilidad**

> Guía paso a paso para instalar **todas las dependencias** necesarias y poner el sistema en marcha desde cero.

---

## 1. Requisitos previos

| Software | Versión mínima | Notas |
|----------|----------------|-------|
| **Node.js** | `>= 20.19` (recomendado: 22.x LTS o superior) | Vite 8 lo exige (`^20.19.0 || >=22.12.0`). Comprueba con `node -v` |
| **pnpm** | 8.x o superior (probado con 12.x) | Manager de paquetes usado por ambos proyectos. Comprueba con `pnpm -v` |
| **Python 3** (opcional) | 3.8+ | Solo para la extracción de **texto de PDF/DOCX** en el comparador. Si no se instala, el comparador funciona igualmente y hace *fallback* a metadatos |
| **Git** (opcional) | — | Solo si se descarga el repositorio por Git |

### Instalar Node.js

Descargar el instalador LTS desde <https://nodejs.org> o mediante gestores:

```bash
# Windows (winget)
winget install OpenJS.NodeJS.LTS

# macOS / Linux (fnm o nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

### Instalar pnpm

```bash
npm install -g pnpm
# o, si tienes Node.js >= 16.10 (Corepack):
corepack enable
```

### Python (opcional, solo comparador PDF/DOCX)

```bash
python -m pip install pdfplumber PyPDF2
```

> En Windows el backend llama a `python` directamente. Verifica con `python --version`.

---

## 2. Estructura del proyecto

```
Tesis2/
├── backend/          → API Express + TypeScript (puerto 3000) + SQLite
│   ├── package.json  → dependencias propias (proyecto pnpm independiente)
│   └── pnpm-lock.yaml
├── frontend/         → SvelteKit + Svelte 5 + Vite (puerto 5173)
│   ├── package.json  → dependencias propias (proyecto pnpm independiente)
│   └── pnpm-lock.yaml
├── 05_instalacion.md    → este documento
├── 08_progreso_2_0.md    → estado del proyecto y verificación
└── 03_funcionalidades.md
```

> **Importante:** cada proyecto (backend y frontend) se instala por separado. Ejecuta los comandos dentro de cada carpeta.

---

## 3. Instalación del Backend

```bash
cd backend
pnpm install
```

Esto instala **todas** las dependencias listadas en `backend/package.json`:

**Dependencias de producción**

| Paquete | Propósito |
|---------|-----------|
| `express` `^4.21.2` | Servidor HTTP/API REST |
| `cors` `^2.8.5` | CORS restringido al origen del frontend |
| `helmet` `^8.0.0` | Headers de seguridad |
| `dotenv` `^16.4.7` | Lectura de variables de entorno (`.env`) |
| `jsonwebtoken` `^9.0.2` | Sesiones JWT (access + refresh) |
| `bcryptjs` `^2.4.3` | Hash de contraseñas |
| `multer` `^1.4.5-lts.2` | Subida de archivos (PDF/Word/TXT, máx. 10 MB) |
| `qrcode` `^1.5.4` | Generación de códigos QR de verificación |
| `sql.js` `^1.12.0` | Motor SQLite embebido (WebAssembly) |
| `uuid` `^11.0.5` | Identificadores únicos |

**Dependencias de desarrollo**

| Paquete | Propósito |
|---------|-----------|
| `typescript` `^5.7.3` + `@types/*` | Tipos y compilación |
| `tsx` `^4.19.2` | Ejecución de TypeScript en caliente (`tsx watch`) |
| `vitest` `5.0.0` | Framework de pruebas |
| `supertest` `^7.2.2` + `@types/supertest` | Pruebas de integración HTTP |
| `vite` `= 8.0.16` | Motor interno de Vitest (ver "Solución de problemas") |

---

## 4. Instalación del Frontend

```bash
cd frontend
pnpm install
```

**Dependencias de desarrollo** (`frontend/package.json`):

| Paquete | Propósito |
|---------|-----------|
| `@sveltejs/kit` `^2.63.0` + `@sveltejs/adapter-auto` | Framework SvelteKit |
| `@sveltejs/vite-plugin-svelte` `^7.1.2` | Integración Svelte + Vite |
| `svelte` `^5.56.1` (Svelte 5) | Framework de componentes (runas) |
| `svelte-check` `^4.6.0` | Verificación de tipos del markup (`pnpm check`) |
| `typescript` `^6.0.3` | Tipos |
| `vite` `= 8.0.16` | Servidor de desarrollo (fijado exacto, ver Solución de problemas) |
| `vitest` `^5.0.0` | Pruebas unitarias |

---

## 5. Configuración del entorno (Backend)

```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
```

Edita `.env` si es necesario (los valores por defecto funcionan fuera de caja):

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tesis-documental-jwt-secret-2025-change-in-production
JWT_REFRESH_SECRET=tesis-documental-refresh-secret-2025-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DB_PATH=./data/database.sqlite
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **En producción** cambia `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores largos y aleatorios.

---

## 6. Base de datos

El sistema usa **SQLite (sql.js)**, no requiere instalación de un servidor de BD. El archivo se crea automáticamente en `backend/data/database.sqlite`.

### Crear / actualizar el esquema

```bash
cd backend
pnpm db:migrate      # idempotente: crea tablas, columnas e índices
```

### Poblar datos de demostración

```bash
pnpm db:seed             # usuarios admin/carlos/maria con claves RSA-2048
```

**Datos demo (opcional y recomendado):**

```bash
pnpm db:seed-documents   # 5 usuarios y 13 documentos de ejemplo
                         # (versiones, propuestas, coautorías, docs públicos/privados)
```

Si quieres borrar y volver a sembrar desde cero:

```bash
pnpm db:reset            # migrar + sembrar usuarios
```

---

## 7. Puesta en marcha

Abre **dos terminales** (backend y frontend a la vez):

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
pnpm dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
pnpm dev
```

Abre <http://localhost:5173> en el navegador.

### Verificar que todo funciona

```bash
# Health del backend
curl http://localhost:3000/api/health
# → {"status":"ok",...}

# Frontend responde
curl -I http://localhost:5173/
```

### Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!@#` | admin |
| `carlos` | `Carlos123!@#` | user |
| `maria` | `Maria123!@#` | user |
| `lucia` | `Lucia123!@#` | user (seed de documentos) |
| `pedro` | `Pedro123!@#` | user (seed de documentos) |

---

## 8. Pruebas automatizadas

Ambos proyectos incluyen suites con **Vitest**.

```bash
# Backend — 12 archivos / 98 tests (unit, servicios e integración API)
cd backend
pnpm test

# Frontend — 2 archivos / 22 tests
cd frontend
pnpm test
```

Verificación de tipos:

```bash
cd frontend && pnpm check      # svelte-check → 0 errores / 0 warnings
cd backend  && npx tsc --noEmit # → 0 errores
```

---

## 9. Solución de problemas

### 1. `vitest run` falla con `ERR_MODULE_NOT_FOUND ... vite/dist/node/chunks/node.js`

**Causa:** la versión publicada de `vite@8.2.x` viene incompleta (falta el chunk `node.js`), por lo que Vitest no puede cargar Vite programáticamente. `vite dev` sí funciona.

**Solución:** mantener **Vite fijado a `8.0.16` (exacto)**, como ya figura en ambos `package.json`:

```bash
cd backend;  pnpm add -D vite@8.0.16
cd frontend; pnpm add -D vite@8.0.16
```

### 2. `ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR`

Al reinstalar dependencias mientras el servidor de desarrollo está corriendo, Windows bloquea `node_modules`. Detén los procesos de Node y reintenta:

```bash
# Windows
taskkill /F /IM node.exe
```

### 3. El comparador no extrae el texto de un PDF/DOCX

Instala la dependencia Python opcional:

```bash
python -m pip install pdfplumber PyPDF2
```

Sin Python el comparador funciona igualmente mostrando diferencias de **metadatos** (nombre, tamaño, hash, origen) en lugar del diff de texto.

### 4. Cambio de contraseñas requerido por JWT

Si los tokens quedan inválidos tras cambiar un secreto en `.env`, reinicia el backend (los tokens existentes expirarán; el frontend renueva la sesión automáticamente con el refresh token).

### 5. Rutas de archivos rotas tras mover la carpeta

Si los documentos "no se encuentran" al descargar, ejecuta el reparador de rutas:

```bash
cd backend
pnpm exec tsx src/db/repair-paths.ts
```

---

## 10. Notas finales

- **Solo pnpm**: no uses `npm`/`yarn` sobre estos proyectos (existe `pnpm-lock.yaml` en cada uno).
- **Puertos**: backend `3000`, frontend `5173` (en `.env` / `vite.config.ts`).
- **Base de datos**: *no* requiere instalación; es un archivo `SQLite` gestionado por `sql.js`.
- **Dependencia Python** es opcional; todo lo demás se instala exclusivamente con pnpm.
- Stack completo: **SvelteKit 2 + Svelte 5 + Vite + Express 4 + TypeScript + SQLite (sql.js) + Vitest/Supertest**.