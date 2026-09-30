# Catálogo de Casos de Prueba

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0

Los nombres de prueba de esta tabla son **los literales reales** de los
archivos de prueba del repositorio. La correspondencia con los requerimientos
está en [`matriz_trazabilidad.md`](matriz_trazabilidad.md).

**Ejecución verificada:**

| Suite | Archivo | Pruebas |
|-------|---------|:-------:|
| Criptografía | `backend/tests/unit/crypto.test.ts` | 12 |
| Análisis documental | `backend/tests/unit/document-analysis.test.ts` | 9 |
| Middleware de autenticación | `backend/tests/unit/auth-middleware.test.ts` | 9 |
| Rate limiting | `backend/tests/unit/rate-limit.test.ts` | 7 |
| Servicio de autenticación | `backend/tests/services/auth.service.test.ts` | 7 |
| Servicio de documentos | `backend/tests/services/document.service.test.ts` | 11 |
| Servicio de auditoría | `backend/tests/services/audit.service.test.ts` | 5 |
| API de autenticación | `backend/tests/integration/auth.api.test.ts` | 10 |
| API de documentos | `backend/tests/integration/documents.api.test.ts` | 13 |
| API de verificación | `backend/tests/integration/verify.api.test.ts` | 6 |
| API de auditoría | `backend/tests/integration/audit.api.test.ts` | 4 |
| Escenarios multusuario | `backend/tests/integration/scenarios.test.ts` | 5 |
| **Subtotal backend** | **12 archivos** | **98** |
| Cliente HTTP | `frontend/src/lib/api.test.ts` | 15 |
| Almacén de sesión | `frontend/src/lib/stores/auth.test.ts` | 7 |
| **Subtotal frontend** | **2 archivos** | **22** |
| **Total** | **14 archivos** | **120** |

---

## 1. Criptografía — `backend/tests/unit/crypto.test.ts` (12)

### 1.1 `keyGenerator` (2)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | genera un par RSA-2048 con fingerprint SHA-256 formateado | Longitud del módulo, formato PEM y huella en pares hexadecimales separados por `:` |
| 2 | genera pares distintos en cada llamada | Unicidad de la generación aleatoria |

### 1.2 `keyProtection` (4)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 3 | cifra y descifra la clave privada con la misma contraseña | Simetría del cifrado AES-256-GCM con PBKDF2 |
| 4 | lanza error si la contraseña es incorrecta (auth GCM) | El `authTag` detecta una contraseña errónea; la clave no se filtra |
| 5 | pack/unpack conserva la estructura | `packEncryptedKey` / `unpackEncryptedKey` son inversas |
| 6 | usa salts aleatorias: dos cifrados del mismo texto difieren | Cada cifrado usa un `salt` y un `iv` distintos |

### 1.3 `signature` (3)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 7 | calcula un hash SHA-256 de 64 caracteres hex | Longitud y alfabeto del hash |
| 8 | es sensible a cambios mínimos de contenido | Un solo byte distinto produce otro hash |
| 9 | firma un documento con RSA-SHA256 y devuelve su hash | Firma verificable y hash devuelto |

### 1.4 `verification` (3)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 10 | verifica como válido un documento firmado e íntegro | Resultado `true` en el camino feliz |
| 11 | detecta manipulación del contenido (hash no coincide) | `false` cuando el contenido cambió |
| 12 | detecta firma inválida cuando se usa otra clave pública | `false` cuando la clave no corresponde |

---

## 2. Análisis documental — `backend/tests/unit/document-analysis.test.ts` (9)

### 2.1 `extractComparableText` (3)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | lee archivos de texto sin depender de Python | La extracción es pura en Node |
| 2 | marca archivos binarios sin texto legible | Degradación controlada, sin excepción |
| 3 | falla de forma segura si el archivo no existe | Manejo de `ENOENT` sin romper la interfaz |

### 2.2 `compareComparableArtifacts` (6)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 4 | reporta archivos idénticos sin adiciones ni eliminaciones | Conteo en cero |
| 5 | detecta adiciones, eliminaciones y cambios entre versiones | Diff línea a línea correcto |
| 6 | no muestra diffs de línea cuando no hay texto extraíble | `textReady = false` sin diff espurio |
| 7 | registra diferencias de metadatos (nombre, tamaño, hash, origen) | Comparación de metadatos |
| 8 | no registra metadatos cuando los archivos coinciden | Ausencia de ruido |
| 9 | maneja comparaciones con archivos vacíos sin romperse | Caso límite de 0 bytes |

---

## 3. Middleware de autenticación — `backend/tests/unit/auth-middleware.test.ts` (9)

### 3.1 `authenticate` (4)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | rechaza peticiones sin cabecera Authorization | 401 |
| 2 | rechaza cabeceras que no usan Bearer | 401 |
| 3 | rechaza tokens inválidos o expirados | 401 |
| 4 | autentica usuarios con un token válido | `next()` y `req.user` asignado |

### 3.2 `authenticateOptional` (3)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 5 | continua si no hay token | `next()` sin usuario |
| 6 | ignora tokens inválidos y continúa | Comportamiento opcional permisivo |
| 7 | asigna el usuario cuando el token es válido | `req.user` poblado |

### 3.3 `requireAdmin` (2)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 8 | bloquea usuarios sin rol admin con 403 | 403 para rol `user` |
| 9 | permite a administradores continuar | `next()` para rol `admin` |

---

## 4. Rate limiting — `backend/tests/unit/rate-limit.test.ts` (7)

### 4.1 `createRateLimiter` (4)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | permite solicitudes dentro del límite y llama a next | Sin bloqueo prematuro |
| 2 | rechaza con 429 una vez superado el límite | Respuesta y estado 429 |
| 3 | expone cabeceras de límite | `X-RateLimit-*` y `Retry-After` |
| 4 | reinicia el contador al vencer la ventana | Comportamiento de ventana deslizante |

### 4.2 `bruteForceProtection` (3)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 5 | cuenta intentos fallidos y bloquea tras el máximo | Bloqueo tras 5 intentos |
| 6 | succeeded() limpia el acumulador | Un acierto reinicia el contador |
| 7 | expira el bloqueo al pasar la ventana | El bloqueo es temporal |

---

## 5. Servicio de autenticación — `backend/tests/services/auth.service.test.ts` (7)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | registra un usuario y crea su par de claves RSA | Filas `users` y `user_keys`; huella devuelta |
| 2 | rechaza contraseñas que no cumplen la política de seguridad | Patrón de 12 caracteres con 4 clases |
| 3 | rechaza usuarios duplicados por username o email | Unicidad en ambos campos |
| 4 | inicia sesión y devuelve tokens de acceso y refresco | Emisión de ambos tokens |
| 5 | rechaza credenciales incorrectas | 401 con mensaje genérico |
| 6 | refresca el access token con un refresh token válido | Rotación correcta |
| 7 | rechaza refresh tokens inválidos | Rechazo sin revelar información |

---

## 6. Servicio de documentos — `backend/tests/services/document.service.test.ts` (11)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | sube un documento, lo firma y crea la versión 1 | Versión 1, hash y firma |
| 2 | rechaza subir un documento con contraseña equivocada | Validación de la contraseña de firma |
| 3 | crea la version 2 al actualizar y mantiene el historial | Numeración correlativa y conservación de la v1 |
| 4 | solo el propietario puede actualizar documentos privados | Autorización a nivel de servicio |
| 5 | comparte y deja de compartir documentos | Alternancia de `is_public` |
| 6 | resuelve el archivo de una versión y valida permisos de descarga | Ruta del archivo y control de acceso |
| 7 | solo acepta propuestas en documentos públicos | Restricción de coautoría |
| 8 | crea, acepta y rechaza propuestas firmadas | Máquina de estados de la propuesta |
| 9 | un tercero puede descargar propuestas de documentos públicos | Acceso de solo lectura |
| 10 | compara dos versiones de un documento de texto | Diff calculado |
| 11 | niega comparaciones entre artefactos inexistentes | Rechazo sin fugar existencia |

---

## 7. Servicio de auditoría — `backend/tests/services/audit.service.test.ts` (5)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | encadena los eventos con hashes SHA-256 | Cada hash referencia al anterior |
| 2 | verifica la cadena completa como válida | `valid = true` |
| 3 | detecta una manipulación si se rompe el encadenamiento | Detección de alteración |
| 4 | es de solo-append: no se pueden actualizar ni borrar registros | Triggers `BEFORE UPDATE` / `BEFORE DELETE` |
| 5 | lista y filtra eventos | Filtros por tipo de evento |

---

## 8. API de autenticación — `backend/tests/integration/auth.api.test.ts` (10)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | registra un usuario y devuelve sus claves | 201 y datos de las claves |
| 2 | rechaza registro con contraseña débil | 400 |
| 3 | rechaza registro con campos faltantes | 400 |
| 4 | rechaza usuarios duplicados | 409 |
| 5 | inicia sesión y devuelve access + refresh tokens | 200 y cuerpo esperado |
| 6 | rechaza credenciales inválidas | 401 |
| 7 | refresca el access token | 200 y token nuevo |
| 8 | rechaza refresh tokens inexistentes | 401 |
| 9 | bloquea la cuenta tras 5 intentos fallidos consecutivos | Protección de fuerza bruta extremo a extremo |
| 10 | GET /me requiere autenticación | 401 sin token |

---

## 9. API de documentos — `backend/tests/integration/documents.api.test.ts` (13)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | exige autenticación para listar documentos | 401 sin token |
| 2 | sube un documento firmado y genera su QR | 201 con hash, firma y QR |
| 3 | rechaza tipos de archivo no permitidos | 400 por MIME |
| 4 | rechaza la subida sin contraseña de firma | 400 |
| 5 | crea la versión 2 al actualizar el documento | Versionado |
| 6 | lista documentos y muestra detalles | 200 con datos del propietario |
| 7 | descarga el archivo de una versión con autenticación | 200 y `Content-Disposition` |
| 8 | bloquea la descarga de documentos privados ajenos | Aislamiento entre usuarios |
| 9 | comparte un documento y lo expone en el perfil público | Visibilidad y perfil |
| 10 | gestiona propuestas: crear, rechazar y aceptar | Ciclo completo de la propuesta |
| 11 | no permite propuestas en documentos privados | Restricción de coautoría |
| 12 | compara versiones de texto | Respuesta de comparación |
| 13 | prohibe compartir documentos ajenos | Autorización |

---

## 10. API de verificación — `backend/tests/integration/verify.api.test.ts` (6)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | verifica como VALID un archivo íntegro | Estado `VALID` |
| 2 | detecta MANIPULATED si el contenido cambió | Estado `MANIPULATED` |
| 3 | localiza coincidencias por hash sin indicar documento | Búsqueda de documentos falsos |
| 4 | reporta NOT_FOUND para documentos desconocidos | Estado `NOT_FOUND` |
| 5 | devuelve la información pública de verificación de un documento | Verificación por URL/QR |
| 6 | rechaza la verificación sin archivo | 400 |

---

## 11. API de auditoría — `backend/tests/integration/audit.api.test.ts` (4)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | exige rol de administrador | 403 para usuario normal |
| 2 | lista eventos generados por el uso del sistema | 200 y contenido coherente |
| 3 | filtra por tipo de evento | Filtros aplicados |
| 4 | verifica la integridad de la cadena de auditoría | `valid = true` |

---

## 12. Escenarios multusuario — `backend/tests/integration/scenarios.test.ts` (5)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | 1) Evolución completa de un documento a través de 3 versiones | Versionado y trazabilidad completa |
| 2 | 2) Colaboración con coautor: propuestas creadas, rechazadas y aceptadas como versión 2 | Coautoría gobernada |
| 3 | 3) Ciclo de vida con varios usuarios: privado → público → propuesta → nueva versión | Flujo de negocio íntegro |
| 4 | 4) El administrador audita toda la actividad y verifica la cadena | Auditoría completa |
| 5 | 5) Permisos: un documento ajeno no puede modificarse ni compartirse | Aislamiento entre usuarios |

---

## 13. Cliente HTTP — `frontend/src/lib/api.test.ts` (15)

### 13.1 `ApiClient` (10)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | login exitoso guarda tokens, usuario y marca sesión | Estado en `localStorage` |
| 2 | login fallido propaga el error y no marca sesión | Propagación del error |
| 3 | register envía los datos y devuelve el userId | Cuerpo del `FormData`/JSON |
| 4 | añade el token Authorization a las peticiones autenticadas | Cabecera `Bearer` |
| 5 | refresca el token ante un 401 y reintenta con el token nuevo | 3 llamadas: original, refresh, reintento |
| 6 | no reintenta si el refresh falla | 2 llamadas y error propagado |
| 7 | logout limpia tokens y estado | Almacenamiento vacío |
| 8 | devuelve error de conexión si fetch lanza | Mensaje de error de red |
| 9 | getAudit agrupa el data y la paginación | Forma `{ items, pagination }` |
| 10 | genera las URLs de descarga con los parámetros correctos | Construcción de URLs |

### 13.2 `resolveApiBase` (5)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 11 | usa el backend del puerto 3000 por defecto en desarrollo local | `http://localhost:3000/api` |
| 12 | no usa el origen del cliente en desarrollo (puerto 5173) | Evita `http://localhost:5173/api`, que no resuelve |
| 13 | respeta VITE_API_URL y normaliza la barra final | Barras finales eliminadas |
| 14 | añade /api a PUBLIC_API_ORIGIN cuando no se define VITE_API_URL | Composición del origen |
| 15 | da prioridad a VITE_API_URL sobre PUBLIC_API_ORIGIN | Precedencia documentada |

---

## 14. Almacén de sesión — `frontend/src/lib/stores/auth.test.ts` (7)

| # | Nombre de la prueba | Verifica |
|---|--------------------|----------|
| 1 | init restaura la sesión guardada | Rehidratación desde `localStorage` |
| 2 | No restaura sesión si no hay datos | Estado anónimo |
| 3 | Almacena el usuario tras el login | Sincronización del store |
| 4 | Limpia el estado tras el logout | Estado inicial restaurado |
| 5 | Expone el estado de carga durante el login | `loading = true` |
| 6 | Expone el error del login | Mensaje disponible |
| 7 | Mantiene `loading = false` al terminar | Cleanup del estado de carga |

---

## 15. Resumen de Cobertura

| Nivel | Suites | Pruebas | % del total |
|-------|:------:|:-------:|:-----------:|
| Unitarias (backend) | 4 | 37 | 30,8 % |
| Servicios (integración de datos) | 3 | 23 | 19,2 % |
| API HTTP (sistema) | 4 | 33 | 27,5 % |
| Escenarios de aceptación | 1 | 5 | 4,2 % |
| Cliente (frontend) | 2 | 22 | 18,3 % |
| **Total** | **14** | **120** | **100 %** |

**Resultado de la última ejecución verificada:**

```
 backend  → Test Files 12 passed (12) · Tests 98 passed (98)
 frontend → Test Files  2 passed ( 2) · Tests 22 passed (22)
```

- Pruebas fallando: **0**
- Pruebas omitidas: **0**
- Pruebas pendientes: **0**

---

**Documentos relacionados**

- [`matriz_trazabilidad.md`](matriz_trazabilidad.md) — Trazabilidad con requerimientos
- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md`](../../01_planificacion_requerimientos/metodologia/metodologia_pruebas.md) — Estrategia de pruebas
