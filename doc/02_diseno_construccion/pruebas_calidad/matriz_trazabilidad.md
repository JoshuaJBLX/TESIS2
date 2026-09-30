# Matriz de Trazabilidad

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

Relaciona cada requerimiento con su implementación, la prueba que lo verifica,
el caso de uso y la historia de usuario correspondientes.

**Volumen del catálogo:**

| Elemento | Cantidad |
|----------|:--------:|
| Requerimientos funcionales (RF-001 … RF-027) | 27 |
| Requerimientos no funcionales (RNF-001 … RNF-044) | 44 |
| Casos de uso (CU-001 … CU-024) | 24 |
| Historias de usuario (US-001 … US-033) | 33 |
| Pruebas automatizadas | 120 |

---

## 1. RF ↔ Prueba ↔ Código ↔ CU ↔ US

| RF | Descripción | CU | US | Pruebas que lo verifican | Implementación |
|----|-------------|----|----|---------------------------|----------------|
| RF-001 | Registro con emisión de clave criptográfica | CU-001 | US-001 | `auth.service`: *registra un usuario y crea su par de claves RSA*; `auth.api`: *registra un usuario y devuelve sus claves*, *rechaza registro con contraseña débil*, *rechaza registro con campos faltantes*, *rechaza usuarios duplicados*; `crypto`: *genera un par RSA-2048 con fingerprint SHA-256 formateado* | `services/auth.service.ts`, `crypto/keyGenerator.ts` |
| RF-002 | Inicio de sesión y emisión de tokens | CU-002 | US-002 | `auth.service`: *inicia sesión y devuelve tokens de acceso y refresco*, *rechaza credenciales incorrectas*; `auth.api`: *inicia sesión y devuelve access + refresh tokens*, *rechaza credenciales inválidas*, *bloquea la cuenta tras 5 intentos fallidos consecutivos*; `api`: *login exitoso guarda tokens, usuario y marca sesión*, *login fallido no marca sesión* | `services/auth.service.ts`, `routes/auth.ts` |
| RF-003 | Renovación del token de acceso | CU-003 | US-003 | `auth.service`: *refresca el access token con un refresh token válido*, *rechaza refresh tokens inválidos*; `auth.api`: *refresca el access token*, *rechaza refresh tokens inexistentes*; `api`: *renueva el token ante un 401 y reintenta con el token nuevo*, *no reintenta si el refresh falla* | `routes/auth.ts`, `lib/api.ts` |
| RF-004 | Consulta de la sesión actual | CU-002 | US-005 | `auth.api`: *GET /me requiere autenticación*; `auth-middleware`: *autentica usuarios con un token válido*, *rechaza peticiones sin cabecera Authorization*, *rechaza cabeceras que no usan Bearer*, *rechaza tokens inválidos o expirados*; `api`: *añade el token Authorization a las peticiones autenticadas* | `routes/auth.ts`, `middleware/auth.ts` |
| RF-005 | Listado de documentos del propietario | CU-007 | US-009 | `documents.api`: *lista documentos y muestra detalles*, *exige autenticación para listar documentos*; `document.service`: *comparte y deja de compartir documentos* | `services/document.service.ts`, `routes/documents.ts` |
| RF-006 | Subida y firma del documento inicial (v1) | CU-005 | US-007 | `document.service`: *sube un documento, lo firma y crea la versión 1*, *rechaza subir un documento con contraseña equivocada*; `documents.api`: *sube un documento firmado y genera su QR*, *rechaza la subida sin contraseña de firma*, *rechaza tipos de archivo no permitidos*; `crypto`: *firma un documento con RSA-SHA256 y devuelve su hash* | `services/document.service.ts`, `crypto/signature.ts` |
| RF-007 | Creación de una nueva versión firmada | CU-006 | US-008 | `document.service`: *crea la version 2 al actualizar y mantiene el historial*; `documents.api`: *crea la versión 2 al actualizar el documento*; `document.service`: *solo el propietario puede actualizar documentos privados* | `services/document.service.ts` |
| RF-008 | Consulta del detalle de un documento | CU-007 | US-009 | `documents.api`: *lista documentos y muestra detalles*; `document.service`: *resuelve el archivo de una versión y valida permisos de descarga* | `routes/documents.ts` |
| RF-009 | Historial de versiones | CU-008 | US-009 | `document.service`: *crea la version 2 al actualizar y mantiene el historial* | `services/document.service.ts` |
| RF-010 | Emisión del código QR de verificación | CU-009 | US-010 | `documents.api`: *sube un documento firmado y genera su QR* | `services/document.service.ts` |
| RF-011 | Compartición y privacidad del documento | CU-010 | US-014 | `document.service`: *comparte y deja de compartir documentos*; `documents.api`: *comparte un documento y lo expone en el perfil público*, *prohibe compartir documentos ajenos*; `scenarios`: *5) Permisos: un documento ajeno no puede modificarse ni compartirse* | `services/document.service.ts` |
| RF-012 | Vista pública de un documento compartido | CU-011 | US-015 | `documents.api`: *comparte un documento y lo expone en el perfil público*, *bloquea la descarga de documentos privados ajenos* | `routes/documents.ts`, `routes/users.ts` |
| RF-013 | Perfil público de usuario | CU-004 | US-015 | `documents.api`: *comparte un documento y lo expone en el perfil público* | `routes/users.ts` |
| RF-014 | Descarga del archivo de una versión | CU-012 | US-011 | `documents.api`: *descarga el archivo de una versión con autenticación*, *bloquea la descarga de documentos privados ajenos*; `document.service`: *resuelve el archivo de una versión y valida permisos de descarga*; `api`: *genera las URLs de descarga con los parámetros correctos* | `routes/documents.ts`, `lib/api.ts` |
| RF-015 | Creación de una propuesta firmada | CU-013 | US-016 | `document.service`: *crea, acepta y rechaza propuestas firmadas*, *solo acepta propuestas en documentos públicos*; `documents.api`: *gestiona propuestas: crear, rechazar y aceptar*, *no permite propuestas en documentos privados*; `scenarios`: *2) Colaboración con coautor…* | `services/document.service.ts` |
| RF-016 | Listado de propuestas | CU-014 | US-017 | `document.service`: *crea, acepta y rechaza propuestas firmadas*; `documents.api`: *gestiona propuestas: crear, rechazar y aceptar* | `services/document.service.ts` |
| RF-017 | Aceptación de una propuesta | CU-015 | US-018 | `document.service`: *crea, acepta y rechaza propuestas firmadas*; `documents.api`: *gestiona propuestas: crear, rechazar y aceptar*; `scenarios`: *2) Colaboración con coautor: propuestas creadas, rechazadas y aceptadas como versión 2* | `services/document.service.ts` |
| RF-018 | Rechazo de una propuesta | CU-016 | US-019 | `document.service`: *crea, acepta y rechaza propuestas firmadas*; `documents.api`: *gestiona propuestas: crear, rechazar y aceptar* | `services/document.service.ts` |
| RF-019 | Descarga del archivo de una propuesta | CU-013 | US-016 | `document.service`: *un tercero puede descargar propuestas de documentos públicos*; `api`: *genera las URLs de descarga con los parámetros correctos* | `routes/documents.ts` |
| RF-020 | Comparación de artefactos documentales | CU-017 | US-020 | `document-analysis`: *reporta archivos idénticos sin adiciones ni eliminaciones*, *detecta adiciones, eliminaciones y cambios entre versiones*, *registra diferencias de metadatos*, *no registra metadatos cuando los archivos coinciden*, *no muestra diffs de línea cuando no hay texto extraíble*, *maneja comparaciones con archivos vacíos sin romperse*; `document.service`: *compara dos versiones de un documento de texto*, *niega comparaciones entre artefactos inexistentes*; `documents.api`: *compara versiones de texto* | `services/document-analysis.ts` |
| RF-021 | Verificación de un archivo contra un documento conocido | CU-018, CU-023 | US-021, US-025 | `verify.api`: *verifica como VALID un archivo íntegro*, *detecta MANIPULATED si el contenido cambió*, *rechaza la verificación sin archivo*; `crypto`: *verifica como válido un documento firmado e íntegro*, *detecta manipulación del contenido (hash no coincide)* | `routes/verify.ts`, `crypto/verification.ts` |
| RF-022 | Búsqueda de coincidencias por hash | CU-019 | US-022 | `verify.api`: *localiza coincidencias por hash sin indicar documento*; `crypto`: *es sensible a cambios mínimos de contenido* | `routes/verify.ts` |
| RF-023 | Verificación por URL o código QR | CU-020 | US-023 | `verify.api`: *devuelve la información pública de verificación de un documento*, *reporta NOT_FOUND para documentos desconocidos*; `crypto`: *detecta firma inválida cuando se usa otra clave pública* | `routes/verify.ts` |
| RF-024 | Consulta de la bitácora de auditoría | CU-021 | US-026 | `audit.service`: *lista y filtra eventos*; `audit.api`: *lista eventos generados por el uso del sistema*, *filtra por tipo de evento*, *exige rol de administrador* | `routes/audit.ts`, `services/audit.service.ts` |
| RF-025 | Verificación de integridad de la cadena de auditoría | CU-022 | US-027, US-028 | `audit.service`: *encadena los eventos con hashes SHA-256*, *verifica la cadena completa como válida*, *detecta una manipulación si se rompe el encadenamiento*, *es de solo-append: no se pueden actualizar ni borrar registros*; `audit.api`: *verifica la integridad de la cadena de auditoría* | `services/audit.service.ts`, `db/migrate.ts` |
| RF-026 | Rate limiting y protección de fuerza bruta | CU-001, CU-002 | US-004 | `rate-limit`: *permite solicitudes dentro del límite y llama a next*, *rechaza con 429 una vez superado el límite*, *expone cabeceras de límite*, *reinicia el contador al vencer la ventana*, *cuenta intentos fallidos y bloquea tras el máximo*, *succeeded() limpia el acumulador*, *expira el bloqueo al pasar la ventana* | `middleware/rateLimit.ts` |
| RF-027 | Sonda de estado del servicio | — | US-033 | Cubierto indirectamente: las pruebas de integración levantan la aplicación completa | `app.ts` |

**Cobertura: 27/27 requerimientos funcionales con al menos una prueba o
verificación asociada (100 %).**

---

## 2. RNF ↔ Evidencia

| RNF | Descripción abreviada | Evidencia |
|-----|----------------------|-----------|
| RNF-001 | Hash y firma de 10 MB en ≤ 3 s | `validacion_experimental.md` §3 |
| RNF-002 | Listado de 500 documentos en ≤ 500 ms | `validacion_experimental.md` §3 |
| RNF-003 | Verificación en ≤ 2 s | `validacion_experimental.md` §3 |
| RNF-004 | Registro con RSA-2048 en ≤ 5 s | `auth.service`: *registra un usuario y crea su par de claves RSA* (1,7 s) |
| RNF-005 | Descarga sin cargar el archivo completo | `routes/documents.ts` usa `fs.createReadStream` |
| RNF-006 | Clave privada cifrada con AES-256-GCM + PBKDF2 | `crypto/keyProtection.ts`; pruebas de cifrado/descifrado |
| RNF-007 | bcryptjs con factor de coste ≥ 12 | `auth.service.ts:30` |
| RNF-008 | Contraseñas de ≥ 12 caracteres con 4 clases | `auth.service.ts:19`; pruebas de contraseña débil |
| RNF-009 | Secretos distintos para acceso y refresco | `services/auth.service.ts` |
| RNF-010 | Rechazo de tokens expirados | `auth-middleware`: *rechaza tokens inválidos o expirados* |
| RNF-011 | Un privado no se descarga por un tercero | `documents.api`: *bloquea la descarga de documentos privados ajenos* |
| RNF-012 | Un documento ajeno no se modifica | `document.service`: *solo el propietario puede actualizar documentos privados*; `scenarios`: *5) Permisos…* |
| RNF-013 | Bitácora inmutable ante UPDATE y DELETE | `audit.service`: *es de solo-append…* (triggers) |
| RNF-014 | Toda alteración de la cadena es detectable | `audit.service`: *detecta una manipulación si se rompe el encadenamiento* |
| RNF-015 | Rate limiting por IP | `rate-limit.test.ts` (7 pruebas) |
| RNF-016 | Cabeceras de seguridad HTTP | `app.ts:37` (`helmet()`) |
| RNF-017 | CORS restringido | `app.ts:19` (`allowedOrigins`) |
| RNF-018 | Sin datos personales de terceros en endpoints públicos | `routes/users.ts` expone solo campos públicos |
| RNF-019 | Explicación de por qué se pide la contraseña | Textos de la interfaz |
| RNF-020 | Mensajes de verificación legibles | `routes/verify.ts` devuelve `message` en español |
| RNF-021 | Utilizable a 360 px de ancho | CSS responsive del frontend |
| RNF-022 | Descarga sin exponer el token en la URL | `api.ts` (`downloadFileWithAuth` con cabecera) |
| RNF-023 | Errores uniformes `{ success, error }` | Todas las rutas; `app.ts:63` |
| RNF-024 | Tipado estático | 100 % TypeScript |
| RNF-025 | Compila sin errores de tipado | `tsc --noEmit` → exit code 0 |
| RNF-026 | Negocio separado de HTTP | `routes/` → `services/` |
| RNF-027 | Acceso a datos intercambiable | Interfaz `DbDriver` |
| RNF-028 | Trazabilidad total de requerimientos | Este documento |
| RNF-029 | Migración idempotente | `CREATE TABLE IF NOT EXISTS` + `addColumnIfMissing` |
| RNF-030 | Convención de nombres coherente | `*.service.ts`, `*.test.ts`, `kebab-case` en carpetas |
| RNF-031 | Funciona en Windows, Linux y macOS | Rutas relativas; sin rutas absolutas |
| RNF-032 | Opera localmente sin servicios externos | SQLite en archivo |
| RNF-033 | Frontend configurable hacia cualquier host | `resolveApiBase()` en `lib/api.ts` + 5 pruebas |
| RNF-034 | Nube sin cambios de código | Contrato `DbDriver`; ver estado real en `arquitectura.md` §7.3 |
| RNF-035 | Esquema portable entre motores | DDL en `migrate.ts`; tabla de traducción en `modelo_datos.md` §6 |
| RNF-036 | Cierre limpio ante SIGINT/SIGTERM | `app.ts:110` y `app.ts:115` |
| RNF-037 | ≥ 1 000 documentos y 10 000 versiones | Índices en 9 columnas; paginación |
| RNF-038 | Bitácora verificable a 100 000 entradas | `verifyChain` con recorrido lineal |
| RNF-039 | Descarga con streaming | `fs.createReadStream` |
| RNF-040 | Endpoint de salud | `GET /api/health` (`app.ts:52`) |
| RNF-041 | Toda escritura genera evento de auditoría | 11 tipos de evento en `audit.service.ts` |
| RNF-042 | Cada versión conserva hash, firma y autor | `document_versions` + `document_signatures` |
| RNF-043 | Las propuestas conservan su firma al rechazarse | No se borra la fila al rechazar |
| RNF-044 | La autoría conjunta queda registrada | `coauthor_id` y `source_proposal_id` |

---

## 3. US ↔ Escenario de Aceptación

| US | Descripción | Escenario / prueba de aceptación |
|----|-------------|---------------------------------|
| US-001 | Registro de usuario | `auth.api`: *registra un usuario y devuelve sus claves* |
| US-002 | Inicio de sesión | `auth.api`: *inicia sesión y devuelve access + refresh tokens* |
| US-003 | Renovación de sesión | `api`: *renueva el token ante un 401 y reintenta con el token nuevo* |
| US-004 | Bloqueo por intentos fallidos | `auth.api`: *bloquea la cuenta tras 5 intentos fallidos consecutivos* |
| US-005 | Consulta de identidad | `auth.api`: *GET /me requiere autenticación* |
| US-006 | Restricción por rol | `auth-middleware`: *bloquea usuarios sin rol admin con 403* |
| US-007 | Subida con firma | `documents.api`: *sube un documento firmado y genera su QR* |
| US-008 | Versionado | `documents.api`: *crea la versión 2 al actualizar el documento* |
| US-009 | Detalle e historial | `documents.api`: *lista documentos y muestra detalles* |
| US-010 | Código QR | `documents.api`: *sube un documento firmado y genera su QR* |
| US-011 | Descarga de archivos | `documents.api`: *descarga el archivo de una versión con autenticación* |
| US-012 | Confirmación de descarga legítima | `verify.api`: *verifica como VALID un archivo íntegro* |
| US-013 | Conocimiento de los límites | Enunciado en `../../../README.md` y en la interfaz |
| US-014 | Compartir | `documents.api`: *comparte un documento y lo expone en el perfil público* |
| US-015 | Consulta pública sin cuenta | `documents.api`: *comparte un documento y lo expone en el perfil público* |
| US-016 | Crear propuesta | `documents.api`: *gestiona propuestas: crear, rechazar y aceptar* |
| US-017 | Bandeja de propuestas | `documents.api`: *gestiona propuestas: crear, rechazar y aceptar* |
| US-018 | Aceptar propuesta | `scenarios`: *2) Colaboración con coautor…* |
| US-019 | Rechazar propuesta | `scenarios`: *2) Colaboración con coautor…* |
| US-020 | Comparar versiones | `documents.api`: *compara versiones de texto* |
| US-021 | Verificar un documento recibido | `verify.api`: *verifica como VALID un archivo íntegro* |
| US-022 | Detectar documentos falsos | `verify.api`: *localiza coincidencias por hash sin indicar documento* |
| US-023 | Escanear el QR | `verify.api`: *devuelve la información pública de verificación de un documento* |
| US-024 | Mensajes comprensibles | `verify.api`: ver `message` en las respuestas |
| US-025 | Verificar en cualquier formato | `verify.api`: *verifica como VALID un archivo íntegro* |
| US-026 | Consultar la bitácora | `audit.api`: *lista eventos generados por el uso del sistema* |
| US-027 | Verificar la cadena | `audit.api`: *verifica la integridad de la cadena de auditoría* |
| US-028 | Inmutabilidad de la bitácora | `audit.service`: *es de solo-append…* |
| US-029 | Registro de eventos de seguridad | `auth.api`: *bloquea la cuenta tras 5 intentos fallidos consecutivos* |
| US-030 | Trazabilidad de la autoría conjunta | `document.service`: *crea, acepta y rechaza propuestas firmadas* |
| US-031 | Respuesta rápida | `validacion_experimental.md` §3 |
| US-032 | Portabilidad entre entornos | 5 pruebas de `resolveApiBase()` |
| US-033 | Estado del servicio | `GET /api/health` |

---

## 4. Escenarios Multiusuario (`tests/integration/scenarios.test.ts`)

| # | Escenario | Requerimientos cubiertos |
|---|-----------|--------------------|
| 1 | Evolución completa de un documento a través de 3 versiones | RF-006, RF-007, RF-009 |
| 2 | Colaboración con coautor: propuestas creadas, rechazadas y aceptadas como versión 2 | RF-015 … RF-019 |
| 3 | Ciclo de vida con varios usuarios: privado → público → propuesta → nueva versión | RF-011, RF-012, RF-015, RF-017 |
| 4 | El administrador audita toda la actividad y verifica la cadena | RF-024, RF-025 |
| 5 | Permisos: un documento ajeno no puede modificarse ni compartirse | RF-011, RNF-012 |

---

## 5. Fase del Ciclo de Vida ↔ Artefacto

| Fase | Artefacto | Ubicación |
|------|-----------|-----------|
| 1. Planificación | RF, RNF, funcionalidades, historias, casos de uso | `doc/01_planificacion_requerimientos/requerimientos/` |
| 1. Planificación | Estado del arte, metodología, sustentación | `doc/01_planificacion_requerimientos/` |
| 2. Diseño | Arquitectura, análisis técnico, modelo de datos | `doc/02_diseno_construccion/arquitectura/` |
| 2. Diseño | Procesos AS-IS / TO-BE, métricas, ISO 29119 | `doc/02_diseno_construccion/` |
| 2. Diseño | Plan de pruebas, matrices, TDD, BDD | `doc/02_diseno_construccion/pruebas_calidad/` |
| 3. Desarrollo | Codificación, convenciones | `doc/03_desarrollo_codificacion/` |
| 4. Pruebas | Resultados y validación experimental | `doc/02_diseno_construccion/pruebas_calidad/` |
| 5. Despliegue | Guías, configuración, plan de nube | `doc/04_implementacion_despliegue/` |
| 6. Mantenimiento | Operación, seguridad, ISO 27001 | `doc/05_mantenimiento_evaluacion/` |
| 7. Evaluación | Métricas finales y conclusiones | `doc/05_mantenimiento_evaluacion/` |
| Transversal | Diagramas UML y software utilizado | `doc/06_diagramas_y_software/` |

---

**Documentos relacionados**

- [`matriz_pruebas.md`](matriz_pruebas.md) — Catálogo detallado de casos
- [`../../01_planificacion_requerimientos/requerimientos/requerimientos.md`](../../01_planificacion_requerimientos/requerimientos/requerimientos.md) — Catálogo de requerimientos
