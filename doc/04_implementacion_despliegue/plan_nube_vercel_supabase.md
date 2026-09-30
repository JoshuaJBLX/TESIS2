# Plan de Nube — Vercel y Supabase

**Proyecto:** SGD-FD · **Versión:** 1.0.0
**Estado:** Planificado. No implementado.

---

## 1. Propósito

Describir con precisión qué se necesita para desplegar el SGD-FD en Vercel
utilizando Supabase como base de datos y almacenamiento, **por qué hoy no es
posible**, y en qué orden deben resolverse los bloqueos.

Este documento existe para evitar dos errores frecuentes: afirmar que el sistema
ya está en la nube, o afirmar que la nube es inalcanzable. Ninguna de las dos
cosas es cierta.

---

## 2. Arquitectura Actual frente a la Objetivo

| Componente | Actual (local) | Objetivo (nube) | Estado |
|------------|----------------|-----------------|:------:|
| Interfaz | Servidor de desarrollo de SvelteKit | Vercel con `adapter-vercel` | Pendiente |
| API | Proceso Express en Node | Vercel Functions | Pendiente |
| Base de datos | SQLite en memoria con `sql.js` | Supabase PostgreSQL | **Bloqueada** |
| Almacenamiento de archivos | `backend/uploads/` en disco | Supabase Storage | Pendiente |
| Autenticación | JWT propio | JWT propio (sin cambios) | Vigente |
| Criptografía | RSA-2048 y AES-256-GCM | Igual, con clave maestra en variables de entorno | Vigente |
| Verificación pública | Rutas sin autenticación | Igual, con acceso a la base remota | Depende de la base |

---

## 3. Inventario de Bloqueos

### 3.1. BLOQUEO-1 · La base de datos vive en memoria

`sql.js` implementa SQLite en WebAssembly dentro del proceso Node. La base
completa se carga en memoria y se descarga al archivo con `saveDatabase()`.

**Consecuencia en serverless:** cada invocación de la función puede ejecutarse
en una instancia distinta, con una base distinta y sin memoria compartida. Dos
peticiones simultáneas no verían los mismos datos.

**Estado actual del código:** `backend/src/db/connection.ts` falla de forma
explícita si se define `DATABASE_URL`:

```
DATABASE_URL esta definido pero el adaptador PostgreSQL todavia no esta
habilitado. Revise la documentacion de migracion.
```

Este comportamiento es deliberado. Un despliegue que acepte `DATABASE_URL` y
siga usando SQLite daría una falsa sensación de persistencia.

### 3.2. BLOQUEO-2 · La interfaz de datos es síncrona

`backend/src/db/driver.ts` define una interfaz síncrona:

```ts
interface DbDriver {
  run(sql: string, params?: unknown[]): void;
  all<T>(sql: string, params?: unknown[]): T[];
  get<T>(sql: string, params?: unknown[]): T | undefined;
  exec(sql: string): void;
  transaction(fn: () => void): void;
}
```

`pg` devuelve promesas. Implementar `PostgresDriver` sin cambiar la interfaz
obligaría a bloquear el event loop, lo que es inaceptable en un entorno
concurrentes.

**Efecto del cambio:** `run`, `all` y `get` deben pasar a devolver `Promise`, lo
que obliga a propagar `async/await` por `DocumentService`, `AuthService`,
`AuditService`, las cinco rutas y las 98 pruebas de backend.

### 3.3. BLOQUEO-3 · Los archivos están en el sistema de archivos local

`multer` escribe en `uploads/` y `uploads/temp/`. En Vercel el sistema de
archivos es de solo lectura y efímero: lo subido en una invocación no existe en
la siguiente.

**Afecta a:** subida de documentos, descarga de versiones, descarga de
propuestas, verificación de archivos subidos y generación de QR.

### 3.4. BLOQUEO-4 · Adaptador de despliegue ausente

`frontend/svelte.config.js` permite seleccionar el adaptador:

```js
const adapter = process.env.ADAPTER || 'auto';
```

Pero `frontend/package.json` no declara `@sveltejs/adapter-vercel` ni
`@sveltejs/adapter-node`. Con `ADAPTER=vercel` la compilación falla.

### 3.5. BLOQUEO-5 · dialecto SQL diferente

| Característica | SQLite (`sql.js`) | PostgreSQL (Supabase) |
|----------------|-------------------|------------------------|
| Autoincremental | `INTEGER PRIMARY KEY AUTOINCREMENT` | `UUID` o `BIGSERIAL` |
| Marcador de parámetro | `?` | `$1`, `$2` |
| Tipos de fecha | `TEXT` en ISO 8601 | `TIMESTAMPTZ` |
| Booleanos | `INTEGER` 0/1 | `BOOLEAN` nativo |
| `TEXT` para JSON | Correcto | `JSONB` con validación |

La conversión de marcadores ya está preparada: el `driver.ts` traduce `?` al
formato del motor. Falta el dialecto del esquema y la traducción de tipos.

---

## 4. Plan de Migración por Iteraciones

### Iteración 1 · Preparación del frontend (Esfuerzo bajo)

| Tarea | Archivo | Resultado |
|-------|---------|-----------|
| Instalar `@sveltejs/adapter-vercel` | `frontend/package.json` | Compilación en modo vercel |
| Declarar la variable `ADAPTER` en la documentación | `frontend/.env.example` | Selección explícita |
| Fijar el origen permitido en CORS | `backend/src/config` | Dominio de Vercel aceptado |

**Criterio de éxito:** `ADAPTER=vercel pnpm build` genera el bundle de Vercel.

### Iteración 2 · Capa de datos asíncrona (Esfuerzo alto)

| Tarea | Alcance |
|-------|---------|
| Convertir `DbDriver` a asíncrono | `db/driver.ts` |
| Actualizar `SqliteDriver` | `db/sqlite-driver.ts` |
| Actualizar los tres servicios | `services/*.ts` |
| Actualizar las cinco rutas | `routes/*.ts` |
| Actualizar las 98 pruebas | `backend/tests/**` |

**Criterio de éxito:** las 120 pruebas siguen pasando con la interfaz asíncrona
y `pnpm build` no produce errores de tipos.

> Este paso no cambia el comportamiento observable: es una refactorización
> interna. La discipline de pruebas permite ejecutarlo con confianza.

### Iteración 3 · Driver de PostgreSQL (Esfuerzo alto)

| Tarea | Detalle |
|-------|---------|
| Añadir la dependencia `pg` | `backend/package.json` |
| Implementar `PostgresDriver` | Mismos métodos, promesas |
| Traducir el esquema | 7 tablas, tipos de PostgreSQL |
| Traducir el DDL | `CREATE TABLE` con tipos nativos |
| Definir el bootstrap | Ejecutar el esquema si la base está vacía |

**Criterio de éxito:** las 120 pruebas pasan contra PostgreSQL en lugar de
SQLite. Este es el paso decisivo: si las pruebas pasan en ambos motores, la
abstracción se ha probado de verdad.

### Iteración 4 · Almacenamiento en Supabase Storage (Esfuerzo medio)

| Tarea | Detalle |
|-------|---------|
| Crear el bucket | `documents`, `proposals`, `temp` |
| Implementar la subida | SDK de Supabase o API REST |
| Implementar la descarga | URL firmada con caducidad |
| Sustituir las rutas de `uploads/` | Rutas y servicios |
| Limpiar archivos temporales | Verificación y propuestas rechazadas |

**Criterio de éxito:** un documento subido en una invocación se descarga
correctamente en otra.

### Iteración 5 · Configuración de Vercel (Esfuerzo medio)

| Tarea | Detalle |
|-------|---------|
| Enlazar el proyecto | Repositorio e integración con Vercel |
| Configurar el backend | Empaquetado como función |
| Definir `vercel.json` | Rutas, reescrituras, tiempo máximo |
| Configurar variables de entorno | `JWT_SECRET`, `DATABASE_URL`, claves de Supabase |
| Verificar CORS | Dominio de producción |

**Criterio de éxito:** el flujo completo —registro, emisión, verificación
pública— funciona desde el dominio desplegado.

### Iteración 6 · Verificación en Nube (Esfuerzo bajo)

| Tarea | Detalle |
|-------|---------|
| Ejecutar la suite contra la nube | 120 pruebas adaptadas |
| Verificar la bitácora | `GET /api/audit/verify-chain` con `valid: true` |
| Comprobar el QR | Escaneo real desde el documento impreso |
| Medir tiempos de respuesta | Establecer línea base |

---

## 5. Esquema Traducido a PostgreSQL

### 5.1. Cabecera y tipos

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  owner_id        UUID NOT NULL REFERENCES users(id),
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.2. Correspondencia de tipos

| Tipo en SQLite | Tipo en PostgreSQL | Notas |
|----------------|-------------------|-------|
| `TEXT` para fechas | `TIMESTAMPTZ` | Evita ambigüedad de zona horaria |
| `INTEGER` 0/1 para booleanos | `BOOLEAN` | Nativo en PostgreSQL |
| `TEXT` con JSON | `JSONB` | Consultable por índice |
| `TEXT` con hexadecimal | `TEXT` o `BYTEA` | Si se mantiene el formato hexadecimal |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `UUID` | Evita colisiones entre réplicas |

### 5.3. Índices recomendados

| Índice | Tabla | Columnas | Motivo |
|--------|-------|----------|--------|
| `idx_documents_owner` | `documents` | `owner_id` | Listado por propietario |
| `idx_versions_document` | `document_versions` | `document_id, version_number DESC` | Obtener la versión vigente |
| `uq_versions_number` | `document_versions` | `document_id, version_number` **único** | Garantiza numeración sin duplicados |
| `idx_versions_hash` | `document_versions` | `content_hash` | Búsqueda de documentos falsos |
| `idx_signatures_version` | `document_signatures` | `version_id` | Verificación |
| `idx_audit_created` | `audit_log` | `created_at DESC` | Listado y filtros |
| `idx_proposals_document` | `version_proposals` | `document_id, status` | Bandeja de propuestas |

> El índice único `uq_versions_number` no es una optimización: es la garantía de
> que no existirán dos versiones con el mismo número. En un entorno con
> réplicas, es la única defensa real contra una condición de carrera.

---

## 6. Seguridad en la Nube

| Aspecto | Práctica recomendada |
|---------|----------------------|
| `JWT_SECRET` | Variable de entorno de Vercel, nunca en el repositorio |
| Claves de Supabase | Variables de entorno con alcance de producción |
| Conexión a la base | Pool de conexiones con límite máximo |
| SSL | Obligatorio para la conexión a PostgreSQL |
| CORS | Lista blanca explícita del dominio de producción |
| Archivos privados | Buckets no públicos con URL firmadas |
| Archivos temporales | Caducidad automática en menos de 24 horas |
| Copias de seguridad | Puntos de recuperación de Supabase con retención de 7 días |

### 6.1. Clave maestra de cifrado

En la nube, la contraseña del usuario sigue descifrando su clave privada: el
cifrado no cambia. Lo que sí cambia es dónde se guarda la base de datos, que
debe residir en un servicio con copias de seguridad y control de acceso.

**Advertencia:** el patrón actual vincula la clave privada a la contraseña del
usuario y no a un KMS. Quien conozca esa contraseña puede descifrar la clave.
Es una decisión de diseño coherente con la ausencia de recuperación
(`RK-10`), pero debe documentarse como tal.

---

## 7. Estimacion de Esfuerzo

| Iteración | Esfuerzo estimado | Riesgo |
|:---------:|:-----------------:|:------:|
| 1. Adaptador de frontend | Bajo | Bajo |
| 2. Capa de datos asíncrona | **Alto** | **Alto** — afecta a todo el backend |
| 3. Driver de PostgreSQL | **Alto** | Medio — mecánica, pero extensa |
| 4. Storage | Medio | Medio |
| 5. Configuración de Vercel | Medio | Bajo |
| 6. Verificación | Bajo | Bajo |

**Total estimado: 4 a 6 iteraciones.** La iteración 2 es la crítica: sin ella,
las demás no pueden empezar.

---

## 8. Alternativa Intermedia

Si el objetivo es la nube sin asumir el costo del refactor, existe una ruta
intermedia:

| Opción | Descripción | Costo |
|--------|-------------|:-----:|
| Servidor Node tradicional | Hospedar el backend completo (Express + `sql.js`) en una VM con disco persistente | Bajo |
| Contenedor | Docker con volumen persistente para `data/` y `uploads/` | Medio |
| Railway, Render o Fly.io | Plataformas que mantienen procesos Node con estado | Bajo |

Esta opción funciona **con el código actual sin modificarlo**, a cambio de perder
las ventajas de escalado elástico de las funciones serverless. Para una
organización de tamaño pequeño, es probablemente la opción correcta.

---

## 9. Conclusiones

El despliegue en Vercel con Supabase es factible, pero exige **refactorizar la
capa de datos**, no solo cambiar variables de entorno. Los cinco bloqueos
identificados son reales y el más determinante es la sincronia de la interfaz
`DbDriver`.

La documentación del proyecto trata `DATABASE_URL` como un error explícito en
lugar de una opción silenciosamente ignorada. Ese comportamiento es correcto:
evita que un despliegue aparentemente configurado con PostgreSQL siga
funcionando con datos en memoria y sin persistencia.

Si la prioridad es tener el sistema en producción antes que escalar, la opción
intermedia de la sección 8 evita por completo el refactor de las iteraciones 2 y
3.

---

## 10. Referencias Cruzadas

- [`implementacion_despliegue.md`](implementacion_despliegue.md) — Implementación y despliegue
- [`../02_diseno_construccion/arquitectura/modelo_datos.md`](../02_diseno_construccion/arquitectura/modelo_datos.md) — Modelo de datos
- [`../02_diseno_construccion/arquitectura/arquitectura.md`](../02_diseno_construccion/arquitectura/arquitectura.md) — Arquitectura
- [`../03_desarrollo_codificacion/desarrollo_codificacion.md`](../03_desarrollo_codificacion/desarrollo_codificacion.md) — Desarrollo y codificación
