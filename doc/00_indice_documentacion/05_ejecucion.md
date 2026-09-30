# Guía de Ejecución — DocuTrust

> Acceso rápido para poner el sistema en marcha. Para la **instalación desde cero** (Node.js, pnpm, dependencias, `.env`) consulta primero [`04_instalacion.md`](./04_instalacion.md).

---

## 1. Preparar la base de datos (opcional, solo la primera vez)

> _Nota de portabilidad: todos los comandos usan rutas relativas a la carpeta `Tesis2`. En tu dispositivo entra a la carpeta donde esté descomprimido el proyecto, p. ej. `cd "ruta\a\Tesis2"`, antes de ejecutarlos._

```bash
cd backend
pnpm db:migrate        # crea/actualiza el esquema SQLite
pnpm db:seed           # usuarios admin/carlos/maria (claves RSA-2048)
pnpm db:seed-documents # (recomendado) 13 documentos de ejemplo, 5 usuarios
```

> Si ya existe `backend/data/database.sqlite`, la migración es idempotente y no borra datos.

---

## 2. Levantar los servicios

Abre **dos terminales** y ejecuta:

```bash
# Terminal 1 — Backend (puerto 3000)
cd backend
pnpm dev
```

```bash
# Terminal 2 — Frontend (puerto 5173)
cd frontend
pnpm dev
```

Luego abre <http://localhost:5173> en el navegador.

| Servicio | URL | Notas |
|----------|-----|-------|
| Frontend (SvelteKit) | http://localhost:5173 | interfaz web |
| Backend (Express API) | http://localhost:3000/api | `health` en `/api/health` |

---

## 3. Verificar que todo funciona

```bash
# Health del backend
curl http://localhost:3000/api/health
# → {"status":"ok",...}

# El frontend responde
curl -I http://localhost:5173/
```

---

## 4. Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!@#` | admin |
| `carlos` | `Carlos123!@#` | user |
| `maria` | `Maria123!@#` | user |
| `lucia` | `Lucia123!@#` | user (seed de documentos) |
| `pedro` | `Pedro123!@#` | user (seed de documentos) |

> `admin` accede además al panel de auditoría (`/audit`).

---

## 5. Ejecutar las pruebas

```bash
cd backend && pnpm test     # 12 archivos / 98 tests
cd frontend && pnpm test    # 2 archivos / 22 tests

cd frontend && pnpm check   # svelte-check → 0 errores / 0 warnings
cd backend && npx tsc --noEmit
```

---

## 6. Solución rápida de problemas

| Problema | Solución |
|----------|----------|
| Puerto 3000/5173 ocupado | Detén otros procesos Node: `taskkill /F /IM node.exe`, y vuelve a `pnpm dev` |
| Vitest no arranca (`vite/dist/node/chunks/node.js`) | Vite debe estar fijado en `8.0.16`: `pnpm add -D vite@8.0.16` |
| Descargas de documentos privados fallan | Entra con sesión iniciada (la descarga privada requiere JWT; el frontend lo envía automáticamente) |
| Documentos "no encontrados" tras mover la carpeta | `cd backend && pnpm exec tsx src/db/repair-paths.ts` |
| Comparador sin texto de PDF/DOCX | Instala Python: `python -m pip install pdfplumber PyPDF2` |

---

## 7. Reset total (borrar y volver a sembrar)

```bash
cd backend
pnpm db:reset            # migrar + sembrar usuarios desde cero
pnpm db:seed-documents   # (opcional) volver a sembrar documentos de ejemplo
```

> ⚠️ `db:reset` no elimina el archivo de la BD; si quieres empezar limpio de verdad, borra `backend/data/database.sqlite` antes de migrar.