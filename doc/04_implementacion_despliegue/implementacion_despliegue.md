# Fase 4 — Implementación y Despliegue

**Proyecto:** SGD-FD · **Versión:** 1.0.0

---

## 1. Propósito

Documentar cómo se instala, configura, ejecuta y despliega el SGD-FD, tanto en
el entorno local actual como en el entorno de nube previsto.

La distinción entre **lo que funciona hoy** y **lo que está planificado** es el
eje de este documento.

---

## 2. Estado del Despliegue

| Escenario | Estado | Verificabilidad |
|-----------|:------:|-----------------|
| Desarrollo local (backend y frontend) | **Operativo** | Ejecutado y probado |
| Pruebas automatizadas | **Operativo** | 120 de 120 |
| Compilación de producción local | **Operativo** | `pnpm build` en ambos proyectos |
| Despliegue en Vercel (frontend) | **No desplegado** | Faltan adaptadores instalados |
| Despliegue del backend como función serverless | **No implementado** | Bloqueado por persistencia síncrona |
| Base de datos en Supabase | **No configurado** | `DATABASE_URL` produce error explícito |
| Almacenamiento de archivos en Supabase Storage | **No configurado** | El sistema usa el sistema de archivos local |

> **Advertencia:** este documento **no certifica que el sistema esté desplegado
> en la nube**. La arquitectura de nube es un plan con trabajo pendiente
> identificado, no un hecho consumado.

---

## 3. Requisitos del Entorno

### 3.1. Software requerido

| Componente | Versión mínima | Verificación |
|------------|:--------------:|--------------|
| Node.js | 18 | `node --version` |
| pnpm | 8 | `pnpm --version` |
| Navegador moderno | — | Compatible con ES2022 |

### 3.2. Requisitos de recursos

| Recurso | Necesario | Observación |
|---------|:---------:|-------------|
| Memoria del proceso | 256 MB mínimo | `sql.js` carga la base completa en memoria |
| Disco | 100 MB + documentos | `uploads/` y el archivo SQLite |
| Puertos | 3000 (API), 5173 (interfaz) | Configurables por entorno |

---

## 4. Instalación Local

### 4.1. Preparación

```bash
cd Tesis2
cd backend  && pnpm install
cd ../frontend && pnpm install
```

### 4.2. Configuración del backend

`backend/.env` (copiar de `backend/.env.example`):

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|:-----------:|-------------------|-------------|
| `PORT` | No | `3000` | Puerto de la API |
| `JWT_SECRET` | **Sí** | — | Secreto de firma de tokens |
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `DATABASE_URL` | No | — | Si se define, exige un driver PostgreSQL **no implementado** |
| `FRONTEND_URL` | No | `http://localhost:5173` | Origen permitido por CORS |

> **Advertencia crítica:** si `DATABASE_URL` está definido, el arranque falla con
> el mensaje `DATABASE_URL esta definido pero el adaptador PostgreSQL todavia
> no esta habilitado`. Esto es intencional: evita una falsa sensación de que el
> sistema usa PostgreSQL cuando en realidad sigue con SQLite en memoria.

### 4.3. Configuración del frontend

`frontend/.env` (copiar de `frontend/.env.example`):

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|:-----------:|-------------------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000/api` | URL completa de la API |
| `PUBLIC_API_ORIGIN` | No | — | Solo origen; el cliente añade `/api` |

**Precedencia de resolución** (cubierta por 5 pruebas en `api.test.ts`):

1. Si existe `VITE_API_URL`, se usa tal cual.
2. Si no, y existe `PUBLIC_API_ORIGIN`, se concatena `/api`.
3. Si no existe ninguna, se usa `http://localhost:3000/api`.

> El cliente **nunca** usa el origen desde el que se sirve la interfaz. En
> desarrollo, la interfaz se sirve en el puerto 5173 y la API escucha en el 3000;
> asumir el mismo origen produciría fallos de conexión.

### 4.4. Ejecución

```bash
# Terminal 1 — API
cd backend && pnpm dev     # http://localhost:3000

# Terminal 2 — Interfaz
cd frontend && pnpm dev    # http://localhost:5173
```

---

## 5. Compilación de Producción

```bash
cd backend  && pnpm build    # genera dist/
cd frontend && pnpm build    # genera build/
```

| Componente | Artefacto | Observación |
|------------|-----------|-------------|
| Backend | `backend/dist/` | JavaScript compilado con TypeScript |
| Frontend | `frontend/build/` | Aplicación SvelteKit estática |

### 5.1. Variables de entorno en producción

| Componente | Variables |
|------------|-----------|
| Backend | `JWT_SECRET` (obligatoria y única), `PORT`, `NODE_ENV=production` |
| Frontend | `VITE_API_URL` con la URL pública de la API |

`JWT_SECRET` es la única variable realmente crítica: sin ella el sistema no
arranca, y con una clave débil o compartida los tokens serían falsificables.

---

## 6. Verificación Post-Instalación

### 6.1. Lista de comprobación

| # | Comprobación | Comando o acción | Resultado esperado |
|:--:|---------------|-----------------|-------------------|
| 1 | El backend compila | `cd backend && pnpm build` | Sin errores |
| 2 | El frontend compila | `cd frontend && pnpm build` | Sin errores |
| 3 | No hay errores de tipos | `npx tsc --noEmit` | 0 errores |
| 4 | Las pruebas pasan | `pnpm test` | 120 de 120 |
| 5 | La API responde | `curl http://localhost:3000/api/health` | Estado activo |
| 6 | Se puede registrar un usuario | `POST /api/auth/register` | `201` |
| 7 | Se puede emitir un documento | `POST /api/docs` | `201` con hash, firma y QR |
| 8 | El documento verifica correctamente | `POST /api/verify` | `VALID` |
| 9 | La alteración se detecta | `POST /api/verify` con archivo alterado | `MANIPULATED` |
| 10 | La bitácora está íntegra | `GET /api/audit/verify-chain` | `valid: true` |

### 6.2. Script de verificación

```bash
cd backend  && npx tsc --noEmit && pnpm test && pnpm build
cd frontend && pnpm test && pnpm build
```

---

## 7. Plan de Nube: Vercel y Supabase

El detalle completo de la migración está en
[`plan_nube_vercel_supabase.md`](plan_nube_vercel_supabase.md). Este apartado
resume su estado y sus bloqueos.

### 7.1. Objetivo

| Componente | Local (actual) | Nube (objetivo) |
|------------|----------------|-----------------|
| Interfaz | SvelteKit dev server | Vercel, con `@sveltejs/adapter-vercel` |
| API | Express en Node | Vercel Functions |
| Base de datos | SQLite en memoria | Supabase PostgreSQL |
| Archivos | `backend/uploads/` | Supabase Storage |
| Secretos | `.env` local | Variables de entorno de Vercel |

### 7.2. Lo que falta

| # | Tarea | Bloqueo | Esfuerzo |
|:-:|-------|---------|:--------:|
| 1 | Instalar `@sveltejs/adapter-vercel` | Dependencia ausente | Bajo |
| 2 | Implementar `PostgresDriver` | La interfaz `DbDriver` es síncrona | **Alto** |
| 3 | Convertir la capa de datos a asíncrona | Afecta a todos los servicios | **Alto** |
| 4 | Migrar el esquema a PostgreSQL | Tipos `AUTOINCREMENT`, `?` frente a `$1` | Medio |
| 5 | Implementar almacenamiento en Supabase Storage | `uploads/` no es apto para serverless | Medio |
| 6 | Configurar CORS para el dominio de Vercel | Orígenes actualmente fijos | Bajo |
| 7 | Definir el empaquetado del backend como función | Sin `vercel.json` validado | Medio |
| 8 | Resolver la verificación por QR sin backend persistente | Depende de 2 y 3 | Medio |

### 7.3. Riesgos del despliegue en nube

| # | Riesgo | Severidad |
|---|--------|:---------:|
| R-1 | La base en memoria no persiste entre invocaciones serverless | **Crítica** |
| R-2 | Los archivos locales se pierden en cada invocación | **Crítica** |
| R-3 | La clave privada depende de la contraseña del usuario, no de un KMS | Media |
| R-4 | `saveDatabase()` escribe en cada operación: inviable en serverless | Alta |
| R-5 | La verificación pública necesita que la base esté disponible | Alta |

> **Conclusión sobre la nube:** el despliegue en Vercel + Supabase **no es
> una opción de configuración**, sino un proyecto de refactorización de la capa
> de datos. Hasta que los puntos 2, 3 y 5 estén resueltos, el sistema solo opera
> de forma fiable en un servidor con estado.

---

## 8. Plan de Copias de Seguridad

### 8.1. Estado actual

| Elemento | ¿Respaldado? | Observación |
|----------|:------------:|-------------|
| Base de datos SQLite | Manual | Copiar `backend/data/*.db` con el servicio detenido |
| Archivos subidos | Manual | Copiar `backend/uploads/` |
| Claves privadas | Sí, implícitamente | Cifradas en la base de datos; sin copia aparte |
| Bitácora de auditoría | Manual | Incluida en la copia de la base |

### 8.2. Procedimiento

```bash
# 1. Detener el servicio para evitar una copia inconsistente
# 2. Copiar el directorio de datos
cp -r backend/data      respaldo_$(date +%Y%m%d)/
cp -r backend/uploads    respaldo_$(date +%Y%m%d)_uploads/
# 3. Verificar la integridad de la copia
cd backend && node -e "const s=require('sql.js'); /* abrir y contar tablas */"
```

> **Advertencia:** mientras `sql.js` mantenga la base en memoria, la copia del
> archivo `.db` solo es coherente si el servicio está detenido. No existe
> volcado en caliente.

### 8.3. Verificación de una copia restaurada

| Comprobación | Criterio |
|--------------|----------|
| El archivo abre | Sin error de SQLite |
| Las tablas existen | 7 tablas presentes |
| La bitácora es válida | `verifyChain()` devuelve `valid: true` |
| Un documento verifica | `POST /api/verify` devuelve `VALID` |

La última comprobación es la relevante: una copia que abre pero cuya bitácora
está rota indica una restauración incompleta.

---

## 9. Monitorización

### 9.1. Estado actual

No hay monitorización automatizada. La salud del sistema se comprueba de forma
manual mediante la bitácora de auditoría y el registro de consola.

### 9.2. Qué debería instrumentarse

| Señal | Fuente | Umbral de alerta |
|-------|--------|------------------|
| Errores 5xx | Registro de acceso | Más de 5 por minuto |
| Verificaciones `MANIPULATED` inesperadas | `audit_log` | Más de 10 por hora |
| Cadena de auditoría rota | `GET /api/audit/verify-chain` | Inmediata |
| Tamaño de la base de datos | Archivo `.db` | Más de 500 MB |
| Fallos de escritura en disco | `saveDatabase()` | Inmediata |

---

## 10. Conclusiones

El SGD-FD está **operativo y verificado en entorno local**: compila, pasa sus
120 pruebas y cumple la lista de 10 comprobaciones de la sección 6.1.

El despliegue en Vercel con Supabase es un **plan documentado con bloqueos
identificados**, no una capacidad disponible. Los dos bloqueos críticos —base
de datos en memoria y almacenamiento local de archivos— requieren refactorizar
la capa de datos antes de plantear siquiera una migración.

Presentar la nube como capacidad actual del sistema sería inexacto. Presentar
la nube como inalcanzable también sería inexacto: el trabajo necesario está
acotado y descrito.

---

## 11. Referencias Cruzadas

- [`plan_nube_vercel_supabase.md`](plan_nube_vercel_supabase.md) — Plan detallado de nube
- [`../03_desarrollo_codificacion/desarrollo_codificacion.md`](../03_desarrollo_codificacion/desarrollo_codificacion.md) — Desarrollo y codificación
- [`../02_diseno_construccion/arquitectura/arquitectura.md`](../02_diseno_construccion/arquitectura/arquitectura.md) — Arquitectura
- [`../05_mantenimiento_evaluacion/operacion/guia_despliegue_produccion.md`](../05_mantenimiento_evaluacion/operacion/guia_despliegue_produccion.md) — Guía de despliegue a producción
