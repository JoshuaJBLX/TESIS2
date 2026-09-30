# DocuTrust — Frontend

Interfaz web del **SGD-FD** (Sistema de Gestión Documental con Firma Digital y
Trazabilidad). Es una SPA construida con **SvelteKit 2** y **Svelte 5** (runes),
que consume por HTTP la API del backend Express.

El frontend **no guarda datos**: toda la persistencia, la firma y la verificación
de integridad ocurren en el backend.

---

## 1. Requisitos Previos

| Requisito | Versión |
|-----------|---------|
| Node.js | 20 o superior |
| pnpm | 9 o superior |
| Backend en ejecución | `http://localhost:3000` |

Verifica tu entorno antes de continuar:

```sh
node --version
pnpm --version
```

---

## 2. Instalación

Desde esta carpeta:

```sh
pnpm install
```

El proyecto usa el campo `engines` con `engine-strict=true` (en `.npmrc`), por lo
que `pnpm install` **falla de forma intentional** si la versión de Node.js no
cumple el requisito. No elimines esa restricción para sortear el error.

---

## 3. Configuración del Entorno

Copia el archivo de ejemplo y ajústalo:

```sh
cp .env.example .env
```

```sh
# .env
# Desarrollo local: se puede dejar vacio, el cliente usa http://localhost:3000/api
VITE_API_URL=
# Solo si el backend vive en otro host o dominio
PUBLIC_API_ORIGIN=
```

| Variable | Prefijo | Para qué sirve |
|----------|---------|----------------|
| `VITE_API_URL` | `VITE_` | URL completa de la API, **incluyendo** el sufijo `/api`. Tiene prioridad sobre cualquier otra variable. |
| `PUBLIC_API_ORIGIN` | `PUBLIC_` | Origen del backend **sin** sufijo; el cliente agrega `/api` automáticamente. Útil en despliegues con dominio propio. |

Las dos variables están declaradas en `src/app.d.ts` como `ImportMetaEnv`, por lo
que el autocompletado de tipos funciona sin configuración adicional.

### Cómo se resuelve la URL base

`resolveApiBase()` en `src/lib/api.ts` aplica este orden de precedencia:

1. `VITE_API_URL`, si tiene contenido.
2. `PUBLIC_API_ORIGIN` + `/api`, si tiene contenido.
3. `http://localhost:3000/api` como valor por defecto.

En desarrollo local **no** se usa `window.location` como origen: el servidor de
Vite corre en el puerto 5173 y el backend en el 3000, y no hay proxy configurado
en `vite.config.ts`, de modo que `http://localhost:5173/api` no resolvería.

---

## 4. Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente. |
| `pnpm build` | Compila la aplicación para producción. |
| `pnpm preview` | Sirve localmente el resultado de `pnpm build`. |
| `pnpm test` | Ejecuta la suite una sola vez con Vitest. |
| `pnpm test:watch` | Modo interactivo de Vitest. |
| `pnpm check` | `svelte-check` sobre los tipos: `.svelte` y `.ts`. |
| `pnpm check:watch` | El anterior, en modo continuo. |
| `pnpm prepare` | `svelte-kit sync`; genera los tipos de SvelteKit. |

### Verificación completa

```sh
pnpm check   # 0 errores, 0 advertencias
pnpm test    # 22 pruebas en 2 archivos
pnpm build   # compila correctamente
```

---

## 5. Ejecución en Desarrollo

```sh
# 1. Backend, en otra terminal
cd ../backend && pnpm dev

# 2. Frontend
pnpm dev
```

La aplicación queda disponible en la URL que indique la consola, normalmente
`http://localhost:5173`.

---

## 6. Estructura del Proyecto

```text
frontend/
├── src/
│   ├── app.css                 # estilos globales
│   ├── app.d.ts                # tipos del entorno (ImportMetaEnv)
│   ├── app.html                # documento HTML base
│   ├── lib/
│   │   ├── api.ts              # cliente HTTP completo (553 lineas)
│   │   ├── api.test.ts         # 15 pruebas del cliente
│   │   ├── index.ts            # punto de entrada de $lib
│   │   ├── assets/favicon.svg
│   │   └── stores/
│   │       ├── auth.ts         # store de sesión (Svelte store)
│   │       └── auth.test.ts    # 7 pruebas del store
│   └── routes/
│       ├── +layout.svelte      # navegación ymontaje global (117 lineas)
│       ├── +page.svelte        # portada, redirige a /dashboard
│       ├── login/              # inicio de sesión
│       ├── register/           # registro de usuario
│       ├── dashboard/          # panel principal
│       ├── documents/          # listado y gestión de documentos
│       ├── documents/[id]/     # detalle: versiones, QR, visibilidad
│       ├── audit/              # bitácora de auditoría
│       ├── verify/             # verificación de autenticidad
│       ├── u/[username]/       # perfil público (sin autenticación)
│       └── v/[id]/             # vista pública de documento
├── static/robots.txt
├── .env.example
├── svelte.config.js
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## 7. Rutas

| Ruta | Acceso | Función |
|------|:------:|---------|
| `/` | Público | Portada; redirige a `/dashboard` |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de usuario |
| `/verify` | Público | Verificación de autenticidad de un documento |
| `/u/[username]` | Público | Perfil público del usuario |
| `/v/[id]` | Público | Vista pública de un documento |
| `/dashboard` | Requiere sesión | Panel principal |
| `/documents` | Requiere sesión | Listado y gestión de documentos |
| `/documents/[id]` | Requiere sesión | Detalle, versiones, QR y visibilidad |
| `/audit` | Requiere sesión | Bitácora de auditoría |

Navegación declarada en `src/routes/+layout.svelte`.

---

## 8. Capa de API

Todo el acceso al backend pasa por `src/lib/api.ts`, que expone una instancia
singleton `api`. Ningún componente hace `fetch` directo.

### Autenticación

- `api.login(username, password)` → devuelve `accessToken` y `refreshToken`.
- `api.register(username, email, password, fullName)` → devuelve el `publicKeyFingerprint` del usuario.
- `api.getMe()` → usuario de la sesión actual.
- `api.logout()` → descarta los tokens almacenados.
- `api.isAuthenticated()` / `api.getStoredUser()` → estado local de la sesión.

El `accessToken` viaja en la cabecera `Authorization`. Cuando una petición
devuelve 401, el cliente ejecuta `POST /auth/refresh` de forma transparente,
reintenta la operación original y solo entonces propaga el error al
componente. Esto evita que la UI tenga que distinguir entre un token caducado y
un fallo real del servidor.

### Documentos

| Método | Ruta |
|--------|------|
| `getDocuments()` | `GET /api/docs` |
| `getDocument(id)` | `GET /api/docs/{id}` |
| `getDocumentVersions(id)` | `GET /api/docs/{id}/versions` |
| `uploadDocument(...)` | `POST /api/docs` |
| `updateDocument(...)` | `PUT /api/docs/{id}` |
| `getDocumentQR(id)` | `GET /api/docs/{id}/qr` |
| `setDocumentVisibility(...)` | `POST /api/docs/{id}/visibility` |
| `downloadDocument(id)` / `downloadDocumentUrl(id)` | `GET /api/docs/{id}/file` |
| `getDocumentProposals(id)` / `createProposal(...)` | `GET`, `POST /api/docs/{id}/proposals` |
| `acceptProposal(...)` / `rejectProposal(...) | `POST .../proposals/{id}/accept`, `.../reject` |
| `downloadProposalUrl(...)` | `GET .../proposals/{id}/file` |
| `compareArtifacts(...)` | `POST /api/docs/compare` |

Las descargas usan `Blob` y `URL.createObjectURL`, de modo que el archivo se
entrega sin abandonar la aplicación.

### Perfil, verificación y auditoría

| Método | Ruta |
|--------|------|
| `getPublicProfile(username)` | `GET /api/users/{username}` |
| `getPublicDocument(id)` | `GET /api/docs/{id}/public` |
| `verifyDocument(...)` | `POST /api/verify` |
| `getVerificationInfo(id)` | `GET /api/verify/{documentId}` |
| `getAudit(...)` | `GET /api/audit` |
| `verifyAuditChain()` | `GET /api/audit/verify-chain` |

`getPublicProfile` y `getPublicDocument` usan el origen público del backend
(`PUBLIC_API_ORIGIN`), por lo que funcionan aunque el usuario no tenga sesión.

---

## 9. Store de Sesión

`src/lib/stores/auth.ts` implementa un store de Svelte (`writable`) con este
contrato:

```ts
{
  user: { id, username, role } | null;
  isAuthenticated: boolean;
  loading: boolean;
}
```

Expone `subscribe`, `init()`, `login()`, `register()` y `logout()`.

`init()` se invoca desde el layout: lee el usuario y el estado de autenticación
de `localStorage` a través de `api.getStoredUser()` y `api.isAuthenticated()`.
El campo `loading` permite que los componentes esperen a que la sesión se
hidrate antes de decidir si redirigir al usuario.

---

## 10. Adaptador de Despliegue

`svelte.config.js` resuelve el adaptador según la variable de entorno `ADAPTER`:

| `ADAPTER` | Adaptador usado | Cuándo |
|-----------|-----------------|--------|
| `node` | `@sveltejs/adapter-node` | Servidor propio con `pnpm preview` |
| `vercel` | `@sveltejs/adapter-vercel` | Despliegue en Vercel |
| (sin definir) | `@sveltejs/adapter-auto` | Detección automática en tiempo de build |

Para usar un adaptador concreto hay que **instalar su paquete** además de definir
la variable:

```sh
pnpm add -D @sveltejs/adapter-node
$env:ADAPTER = 'node'
```

El paquete por defecto es `adapter-auto`; es el único que está instalado. Antes
de desplegar en un servidor propio o en Vercel hay que instalar el adaptador
correspondiente.

Además, el proyecto fuerza el uso de **runes** en todo el código propio
(`compilerOptions.runes`), desactivándolo solo dentro de `node_modules`.

---

## 11. Pruebas

```sh
pnpm test
```

Vitest corre en entorno `node` e incluye `src/**/*.test.ts`. El alias `$lib` se
declara explícitamente en `vitest.config.ts` para que los tests resuelvan igual
que el código de la aplicación.

Estado actual: **22 pruebas en 2 archivos**, todas en verde.

| Archivo | Pruebas | Cubre |
|---------|:-------:|-------|
| `src/lib/api.test.ts` | 15 | `resolveApiBase()`, construcción de URL, cabeceras y prefijo de API |
| `src/lib/stores/auth.test.ts` | 7 | Login, registro, logout, `init()` y persistencia de sesión |

La suite no monta componentes Svelte ni necesita el backend en ejecución.

---

## 12. Configuración de TypeScript

`tsconfig.json` extiende el archivo generado por SvelteKit
(`.svelte-kit/tsconfig.json`) y añade `strict`, `checkJs` y
`rewriteRelativeImportExtensions`. `moduleResolution` es `bundler`.

El alias `$lib` lo define SvelteKit, no este archivo. Para cambiar opciones
globales conviene editar el `tsconfig.json` generado por el framework en lugar
del del proyecto.

---

## 13. Problemas Frecuentes

**`ERR_PNPM_UNSUPPORTED_ENGINE` al instalar**
La versión de Node.js no cumple el requisito declarado. Revisa
`engines` en `package.json` y actualiza Node.js.

**`Module not found: $lib/...` en el editor**
Falta ejecutar `pnpm prepare` para que SvelteKit genere `.svelte-kit/tsconfig.json`
con los alias. También sirve reiniciar el servidor de TypeScript del editor.

**La interfaz carga pero toda llamada falla**
Comprueba que el backend esté escuchando en el puerto 3000 y que
`VITE_API_URL` no apunte a otro sitio. Recuerda que en desarrollo local se
necesita el sufijo `/api` si optas por escribir la URL completa.

**CORS bloqueando las peticiones**
El backend debe permitir el origen del frontend. Verifica la configuración de
CORS en el backend y que el puerto que abre Vite sea el que esperas.

**`adapter-auto` no encuentra plataforma durante el build**
`adapter-auto` solo funciona en plataformas que detecta. Para producción,
instala `@sveltejs/adapter-node` o `@sveltejs/adapter-vercel` y define `ADAPTER`.

---

## 14. Documentación del Proyecto

La documentación completa vive en la carpeta `doc/` de la raíz del repositorio,
organizada por fases del ciclo de vida. El punto de partida es el índice:

```text
../doc/00_indice_documentacion/00_indice_documentacion.md
```

Los documentos más relevantes para quien modifica este frontend son:

| Documento | Ruta |
|-----------|------|
| Índice general | [`00_indice_documentacion.md`](../doc/00_indice_documentacion/00_indice_documentacion.md) |
| Guía técnica de operación | [`guia_tecnica.md`](../doc/05_mantenimiento_evaluacion/operacion/guia_tecnica.md) |
| Manual de usuario | [`manual_usuario.md`](../doc/05_mantenimiento_evaluacion/operacion/manual_usuario.md) |
| Arquitectura del sistema | [`arquitectura.md`](../doc/02_diseno_construccion/arquitectura/arquitectura.md) |
| Análisis técnico | [`analisis_tecnico.md`](../doc/02_diseno_construccion/arquitectura/analisis_tecnico.md) |
| Matriz de pruebas | [`matriz_pruebas.md`](../doc/02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) |
| Inventario de software | [`software_utilizado.md`](../doc/06_diagramas_y_software/software_utilizado.md) |
| Guía de instalación del proyecto | [`04_instalacion.md`](../doc/00_indice_documentacion/04_instalacion.md) |
| Guía de ejecución del proyecto | [`05_ejecucion.md`](../doc/00_indice_documentacion/05_ejecucion.md) |

---

## 15. Licencia

Software académico desarrollado para un trabajo de tesis. Consulta
[`software_utilizado.md`](../doc/06_diagramas_y_software/software_utilizado.md)
para el detalle de dependencias de terceros y sus licencias.
