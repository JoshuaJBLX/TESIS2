# Guía Técnica de Mantenimiento

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión del documento:** 1.0.0
**Fase:** 5 — Mantenimiento y Evaluación
**Naturaleza:** documento de referencia técnica para el desarrollador que mantiene el código

---

## 1. Propósito y Público Destinatario

Esta guía describe la estructura interna, las dependencias, los contratos de las capas y los puntos de extensión del SGD-FD. No sustituye al manual de usuario ni al plan de despliegue: su propósito es que una persona que no participó en el desarrollo pueda localizar una función, entender por qué existe y modificar el sistema sin romper los invariantes de firma y trazabilidad.

Está dirigida al perfil de desarrollador de nivel medio con conocimientos de TypeScript, Express y SvelteKit. Se presupone familiaridad con Git y con la ejecución de comandos de Node.js.

Tres advertencias preceden a todo el contenido:

1. La criptografía del proyecto se apoya exclusivamente en el módulo nativo `node:crypto`. No existen bibliotecas criptográficas de terceros en el árbol de dependencias.
2. La persistencia actual se resuelve con un único driver funcional sobre `sql.js`. La interfaz que lo abstrae es síncrona, y esa decisión condiciona el despliegue en nube.
3. La firma producida es criptográficamente válida dentro del perímetro del SGD-FD, pero no constituye firma electrónica certificada bajo la Ley N.° 27269. El detalle se desarrolla en la sección 11.4.

---

## 2. Arquitectura en una Página

El backend sigue una arquitectura de capas estrictas. Cada capa depende únicamente de la inferior y ninguna llama directamente a otra capa no adyacente.

| Capa | Ubicación | Responsabilidad | No debe hacer |
|-------|-----------|-----------------|---------------|
| Rutas HTTP | `backend/src/routes/` | Validar entrada, resolver autenticación, delegar, dar forma a la respuesta | Contener lógica de negocio ni acceso directo a SQL |
| Servicios | `backend/src/services/` | Reglas de negocio, orquestación de transacciones, escritura en bitácora | Conocer detalles de Express o del protocolo HTTP |
| Acceso a datos | `backend/src/db/` | Ejecutar sentencias, traducir marcadores de parámetros, serializar la base | Almacenar reglas de negocio |
| Criptografía | `backend/src/crypto/` | Generación de claves, firma, verificación, protección de la clave privada | Consultar la base de datos |
| Interfaz web | `frontend/src/routes/`, `frontend/src/lib/` | Presentación, cliente HTTP, estado de sesión | Reproducir reglas de validación del servidor |

El flujo de una escritura típica es: la ruta valida la petición, el servicio aplica la regla, `auditService.append` sella el evento en la cadena y la capa de datos persiste el conjunto. Ninguna ruta escribe en `audit_log` de forma directa.

El repositorio frontend es una aplicación SvelteKit con renderizado en el cliente para las rutas interactivas y un almacén de autenticación en `frontend/src/lib/stores/auth.ts`. El cliente HTTP reside en `frontend/src/lib/api.ts`, punto único de contacto con el backend.

El grafo completo de componentes, el despliegue y el modelo de datos se representan en [arquitectura.md](../../02_diseno_construccion/arquitectura/arquitectura.md), [diagrama_clases.md](../../06_diagramas_y_software/diagrama_clases.md) y [diagrama_despliegue.md](../../06_diagramas_y_software/diagrama_despliegue.md).

---

## 3. Pila de Dependencias

El proyecto declara 32 dependencias en total, todas bajo licencia libre. Las versiones siguientes se leyeron directamente de los archivos `package.json` de cada paquete.

### 3.1. Backend — dependencias de producción

| Paquete | Versión declarada | Función en el SGD-FD |
|---------|-------------------|-----------------------|
| `express` | 4.21.2 | Servidor HTTP y enrutado de las 25 respuestas de la API |
| `sql.js` | 1.12.0 | SQLite compilado a WebAssembly; motor del único driver activo |
| `bcryptjs` | 2.4.3 | Hash de contraseñas, coste 12 |
| `jsonwebtoken` | 9.0.2 | Emisión y validación de tokens de acceso y refresco |
| `multer` | 1.4.5-lts.1 | Recepción multipart de archivos en `uploads/` |
| `qrcode` | 1.5.4 | Generación de la imagen QR de cada documento |
| `helmet` | 8.0.0 | Cabeceras HTTP de seguridad |
| `cors` | 2.8.5 | Política de orígenes cruzados con lista explícita |
| `dotenv` | 16.4.7 | Carga de variables de entorno desde `.env` |
| `uuid` | 11.0.5 | Identificadores de versión 4 para usuarios, documentos y versiones |

Una aclaración necesaria: `bcryptjs` no es el módulo nativo `bcrypt`. Es una implementación escrita íntegramente en JavaScript puro, sin enlace a código nativo ni compilación en C. La consecuencia práctica es que su rendimiento es inferior al de la biblioteca nativa, y que el coste 12 resulta más costoso en tiempo de ejecución; a cambio, el proyecto no depende de herramientas de compilación nativas ni de binarios específicos de plataforma.

### 3.2. Backend — dependencias de desarrollo

| Paquete | Versión declarada | Uso |
|---------|-------------------|-----|
| `typescript` | 5.7.3 | Compilación y comprobación de tipos |
| `tsx` | 4.19.2 | Ejecución directa de TypeScript en desarrollo |
| `vitest` | 5.0.0 | Marco de pruebas |
| `vite` | 8.0.16 | Transpilado para las pruebas del backend |
| `supertest` | 7.2.2 | Peticiones HTTP contra la aplicación en las pruebas de integración |
| `@types/node` | 22.12.0 | Tipos del entorno de ejecución |
| `@types/express` | 5.0.0 | Tipos de Express |
| `@types/multer` | 1.4.12 | Tipos de Multer |
| `@types/bcryptjs` | 2.4.6 | Tipos de `bcryptjs` |
| `@types/cors` | 2.8.17 | Tipos de CORS |
| `@types/jsonwebtoken` | 9.0.7 | Tipos de JWT |
| `@types/qrcode` | 1.5.5 | Tipos de QR |
| `@types/uuid` | 10.0.0 | Tipos de UUID |
| `@types/supertest` | 7.2.1 | Tipos de Supertest |

Existe una inconsistencia conocida en `@types/express@^5` frente a `express@^4.21.2`: los tipos corresponden a la versión 5 del servidor que no es la que se ejecuta. Se detalla en la sección 11.5.

### 3.3. Frontend

| Paquete | Versión declarada | Uso |
|---------|-------------------|-----|
| `@sveltejs/kit` | 2.63.0 | Marco de la aplicación web |
| `svelte` | 5.56.1 | Componentes con reactividad de runes |
| `vite` | 8.0.16 | Empaquetado y transpilado |
| `@sveltejs/vite-plugin-svelte` | 7.1.2 | Complemento de Vite para Svelte |
| `@sveltejs/adapter-auto` | 7.0.1 | Adaptador de despliegue detectado automáticamente |
| `vitest` | 5.0.0 | Marco de pruebas |
| `svelte-check` | 4.6.0 | Comprobación de tipos en componentes |
| `typescript` | 6.0.3 | Base del sistema de tipos del frontend |

El análisis detallado de componentes, licencias y justificación de elección se encuentra en [software_utilizado.md](../../06_diagramas_y_software/software_utilizado.md) y en el grafo de paquetes en [diagrama_paquetes.md](../../06_diagramas_y_software/diagrama_paquetes.md).

---

## 4. Catálogo de Rutas HTTP y Eventos de Auditoría

La API expone 25 puntos de acceso: 24 declarados en los cinco enrutadores de `backend/src/routes/` y uno más, `GET /api/health`, definido directamente en `backend/src/app.ts`.

### 4.1. Sonda de estado

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/health` | No | Devuelve estado y marca de tiempo; usada en la verificación previa al despliegue |

### 4.2. Identidad: `/api/auth` (4 rutas)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/auth/register` | No | Alta de usuario, emisión del par de claves y sello `USER_REGISTERED` |
| POST | `/api/auth/login` | No | Validación de credenciales, emisión de tokens y sello del resultado |
| POST | `/api/auth/refresh` | Token de refresco | Renueva el token de acceso |
| GET | `/api/auth/me` | Token de acceso | Devuelve el perfil de la sesión activa |

### 4.3. Documentos: `/api/docs` (15 rutas)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/docs` | Obligatoria | Lista los documentos visibles para la sesión |
| POST | `/api/docs` | Obligatoria | Sube el documento inicial con `multipart/form-data` |
| PUT | `/api/docs/:id` | Obligatoria | Añade una versión nueva y firma el contenido |
| GET | `/api/docs/:id` | Obligatoria | Detalle del documento, versiones y firmas |
| GET | `/api/docs/:id/versions` | Obligatoria | Historial de versiones con huellas SHA-256 |
| GET | `/api/docs/:id/qr` | Obligatoria | Genera la imagen QR que conduce a la vista pública |
| GET | `/api/docs/:id/public` | No | Vista pública pensada para el escaneo del QR |
| PATCH | `/api/docs/:id/visibility` | Obligatoria | Alterna entre documento privado y público |
| GET | `/api/docs/:id/file` | Opcional | Descarga el archivo respetando la visibilidad |
| GET | `/api/docs/:id/proposals` | Obligatoria | Lista propuestas de revisión pendientes y resueltas |
| POST | `/api/docs/:id/proposals` | Obligatoria | Registra una propuesta firmada por un coautor |
| GET | `/api/docs/:id/proposals/:proposalId/file` | Opcional | Descarga el archivo propuesto |
| POST | `/api/docs/:id/proposals/:proposalId/accept` | Obligatoria | Acepta la propuesta y genera la versión siguiente |
| POST | `/api/docs/:id/proposals/:proposalId/reject` | Obligatoria | Rechaza la propuesta dejando constancia |
| GET | `/api/docs/:id/compare` | Opcional | Compara dos versiones y señala sus diferencias |

### 4.4. Verificación: `/api/verify` (2 rutas)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/verify` | No | Verificación criptográfica real: recalcula la huella y valida la firma del archivo recibido |
| GET | `/api/verify/:documentId` | No | Ficha pública de verificación para el escaneo del QR; contiene el defecto abierto descrito en 11.3 |

`POST /api/verify` admite archivo mediante `multer` o, en su defecto, un identificador de documento, y devuelve uno de cinco estados: `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND` y `FOUND`.

### 4.5. Auditoría: `/api/audit` (2 rutas)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/audit` | Obligatoria | Consulta filtrable de la bitácora |
| GET | `/api/audit/verify-chain` | Obligatoria | Recorre la cadena y valida cada sello SHA-256 |

### 4.6. Perfil público: `/api/users` (1 ruta)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/users/:username` | No | Perfil del usuario, clave pública y huella de la clave |

### 4.7. Los nueve eventos de auditoría

| Evento | Momento de emisión | Entidad |
|--------|--------------------|---------|
| `USER_REGISTERED` | Alta de cuenta y emisión del par de claves | `user` |
| `LOGIN_SUCCESS` | Credenciales válidas | `auth` |
| `LOGIN_FAILED` | Credenciales inválidas o cuenta inactiva | `auth` |
| `DOCUMENT_UPLOAD` | Subida del documento inicial | `document` |
| `DOCUMENT_UPDATE` | Firma de una versión nueva | `document` |
| `DOCUMENT_VISIBILITY_CHANGED` | Cambio entre privado y público | `document` |
| `DOCUMENT_PROPOSAL_CREATED` | Registro de propuesta de coautoría | `document` |
| `DOCUMENT_PROPOSAL_ACCEPTED` | Aceptación de la propuesta | `document` |
| `DOCUMENT_PROPOSAL_REJECTED` | Rechazo de la propuesta | `document` |

La bitácora es de solo anexado: cada fila incluye `previous_hash` y `current_hash`, y el valor actual se calcula sobre la huella del evento anterior. No se ha implementado ninguna sentencia `UPDATE` ni `DELETE` sobre `audit_log`, de modo que alterar un registro histórico exige romper la cadena. Las contrapruebas de esta propiedad están en la sección 7.

---

## 5. Criptografía

Toda la criptografía del proyecto se resuelve con el módulo nativo `node:crypto`. No se incorpora ninguna biblioteca criptográfica de terceros, y la razón es deliberada: la cadena de suministro de dependencias se reduce a funciones de serialización, transporte y presentación, y ninguna de ellas participa en operaciones de seguridad.

### 5.1. Parámetros empleados

| Primitiva | Parámetro | Valor | Aplicación |
|-----------|-----------|-------|------------|
| RSA | Longitud de clave | 2048 bits | Par de claves por usuario |
| RSA | Relleno de firma | PKCS#1 v1.5 con SHA-256 | Firma de la huella del documento |
| SHA-256 | Longitud de resumen | 256 bits | Huella de contenido, huella de clave y sellos de la bitácora |
| PBKDF2 | Función | HMAC-SHA-512 | Derivación de la clave maestra |
| PBKDF2 | Iteraciones | 100 000 | Factor de coste deliberado |
| PBKDF2 | Longitud de sal | 16 bytes | Sal única por par de claves |
| PBKDF2 | Longitud derivada | 32 bytes | Clave maestra AES de 256 bits |
| AES | Modo | GCM, 256 bits | Cifrado de la clave privada |
| AES | Longitud de IV | 12 bytes | Vector de inicialización único por cifrado |
| AES | Etiqueta | `authTag` de 16 bytes | Detección de manipulación del texto cifrado |
| bcryptjs | Coste | 12 | Derivación de la contraseña del usuario |

### 5.2. Generación y protección de la clave privada

El proceso se ejecuta una vez por usuario, durante el registro, en `backend/src/crypto/keyGenerator.ts` y `backend/src/crypto/keyProtection.ts`:

1. `generateKeyPairSync('rsa', { modulusLength: 2048 })` produce el par de claves.
2. La clave privada se exporta a PEM y se cifra con AES-256-GCM.
3. La clave maestra se obtiene con `pbkdf2Sync` sobre la contraseña maestra, HMAC-SHA-512, 100 000 iteraciones y una sal aleatoria de 16 bytes.
4. El vector de inicialización se genera con `randomBytes(12)`.
5. `createCipheriv('aes-256-gcm', claveMaestra, iv)` cifra el texto y devuelve la etiqueta de autenticación.
6. El registro almacenado es un JSON con cuatro campos en Base64: `encryptedData`, `iv`, `authTag` y `salt`.

El texto almacenado es de esta forma:

```json
{
  "encryptedData": "base64...",
  "iv": "base64...",
  "authTag": "base64...",
  "salt": "base64..."
}
```

Para descifrar, el proceso inverso reproduce la sal, deriva la clave maestra con los mismos parámetros, crea `createDecipheriv`, fija la etiqueta con `setAuthTag` y procesa el texto. La etiqueta GCM hace que cualquier alteración del texto cifrado provoque un fallo de descifrado, y no una lectura silenciosa de datos corruptos.

La huella de la clave pública se almacena como el resumen SHA-256 de esa clave en PEM, presentado en pares hexadecimales separados por dos puntos. Es el valor que se muestra al usuario para que contraste las claves que intercambia.

### 5.3. Firma y verificación

El documento no se firma en bruto: se calcula su huella SHA-256 y la firma se aplica sobre ese resumen. La firma resultante se guarda en `document_signatures` junto con el algoritmo y la fecha. La verificación recalcula la huella del archivo recibido, la compara con `document_versions.content_hash` y valida la firma con la clave pública del firmante. Si la huella difiere, el estado es `MANIPULATED`; si coincide pero la firma no valida, es `INVALID_SIGNATURE`.

### 5.4. Contraseñas

Las contraseñas se almacenan con `bcryptjs` y coste 12. La política aplicada en el registro exige un mínimo de 12 caracteres, al menos una letra mayúscula, una minúscula, un dígito y un carácter especial del conjunto `@$!%*?&`. La política completa, los límites del limitador de tasa y los mecanismos de protección se desarrollan en [seguridad.md](../seguridad/seguridad.md).

---

## 6. Modelo de Datos

El esquema se define en `backend/src/db/migrate.ts` y comprende siete tablas. El diccionario completo, con tipos, nulabilidad y claves, está en [modelo_datos.md](../../02_diseno_construccion/arquitectura/modelo_datos.md).

| Tabla | Filas | Claves foráneas | Función |
|-------|-------|-----------------|---------|
| `users` | 8 | ninguna | Identidad, credencial y rol; la baja es lógica mediante `is_active` |
| `user_keys` | 8 | `user_id` hacia `users`, única | Par de claves por usuario, con la privada cifrada |
| `documents` | 7 | `owner_id` hacia `users` | Documento lógico y su visibilidad |
| `document_versions` | 9 | `document_id` hacia `documents` con borrado en cascada, `uploaded_by`, `coauthor_id`, `source_proposal_id` | Versión física, huella y procedencia |
| `document_proposals` | 13 | `document_id` hacia `documents`, `base_version_id` y `proposed_by` | Propuesta de coautoría y su estado de revisión |
| `document_signatures` | 9 | `version_id` hacia `document_versions` única, `signer_id` | Firma de cada versión, una por versión |
| `audit_log` | 42 | ninguna por diseño | Bitácora de solo anexado encadenada |

Relaciones derivadas: un usuario posee un documento y un par de claves; un documento tiene muchas versiones y muchas propuestas; cada versión tiene exactamente una firma; una propuesta aceptada materializa una versión nueva y conserva la referencia en `source_proposal_id`. La tabla `audit_log` no declara claves foráneas sobre `entity_id` de forma deliberada: la bitácora registra entidades de cualquier tipo, incluidas las que se han eliminado, y atar la fila a su entidad impediría conservar el rastro histórico.

---

## 7. Sistema de Pruebas

### 7.1. Ejecución

Las pruebas del backend se ejecutan desde `backend/` con `npm test` o `npx vitest run`; las del frontend, desde `frontend/`, con el mismo comando. Los resultados que se registran a continuación corresponden a la última ejecución completa verificada sobre el código y no a estimaciones.

### 7.2. Resultados medidos

| Nivel | Ubicación | Archivos | Casos | Resultado |
|-------|-----------|:--------:|------:|-----------|
| Unitarias, backend | `tests/unit/` | 4 | 37 | 37 aprobados |
| Servicios, backend | `tests/services/` | 3 | 23 | 23 aprobados |
| API e integración, backend | `tests/integration/` | 5 | 33 | 33 aprobados |
| Aceptación, backend | `tests/integration/scenarios.test.ts` | 1 | 5 | 5 aprobados |
| **Subtotal backend** | | **12** | **98** | **98 aprobados** |
| Cliente HTTP, frontend | `src/lib/api.test.ts` | 1 | 15 | 15 aprobados |
| Estado de autenticación, frontend | `src/lib/stores/auth.test.ts` | 1 | 7 | 7 aprobados |
| **Subtotal frontend** | | **2** | **22** | **22 aprobados** |
| **Total** | | **14** | **120** | **120 aprobados** |

La tasa de fallos observada es cero sobre 120 casos ejecutados, sin pruebas ignoradas ni omitidas. La cifra de casos aprobados es una medida de ejecución, no una medida de cobertura de requisitos: dos requisitos pueden cumplirse sin que exista prueba alguna que lo demuestre, y esa distinción se analiza en [matriz_trazabilidad.md](../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md).

### 7.3. Qué cubre cada nivel

El nivel unitario aísla funciones sin base de datos: generación y descifrado de claves, firma y verificación, validación de contraseñas, aplicación del limitador de tasa y análisis de metadatos del documento. El nivel de servicios trabaja con la base de datos real en memoria y comprueba reglas de negocio: autenticación, ciclo de vida documental y construcción de la cadena de auditoría. El nivel de API conduce la aplicación Express completa mediante Supertest, atraviesa la autenticación real y valida códigos de estado, formas de respuesta y efectos sobre la bitácora. El nivel de aceptación encadena varios de esos flujos en el mismo archivo para comprobar recorridos completos de subida, firma, propuesta, aceptación y verificación.

El diseño de la suite y su relación con la norma aplicada se documentan en [matriz_pruebas.md](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) y en [aplicacion_iso_29119.md](../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md).

---

## 8. Comandos de Desarrollo y Verificación

| Propósito | Comando | Directorio | Resultado esperado verificado |
|-----------|---------|-------------|----------------------------------|
| Instalar dependencias del backend | `npm install` | `backend/` | Sin errores |
| Instalar dependencias del frontend | `pnpm install` | `frontend/` | Sin errores |
| Levantar el backend en desarrollo | `npm run dev` | `backend/` | Reinicio automático con `tsx watch` |
| Levantar el frontend en desarrollo | `pnpm dev` | `frontend/` | Servidor de Vite disponible |
| Crear el esquema | `npm run db:migrate` | `backend/` | Siete tablas creadas |
| Cargar datos de ejemplo | `npm run db:seed` | `backend/` | Datos iniciales insertados |
| Restablecer la base de datos | `npm run db:reset` | `backend/` | Migración y carga desde cero |
| Ejecutar pruebas del backend | `npx vitest run` | `backend/` | 98 casos aprobados en 12 archivos |
| Ejecutar pruebas del frontend | `pnpm test` | `frontend/` | 22 casos aprobados en 2 archivos |
| Comprobar tipos del backend | `npx tsc --noEmit` | `backend/` | 0 errores |
| Comprobar tipos del frontend | `npx svelte-check` | `frontend/` | 0 errores y 0 advertencias |
| Compilar el backend | `npm run build` | `backend/` | Compilación correcta en `dist/` |
| Compilar el frontend | `pnpm build` | `frontend/` | Compilación correcta, con el aviso esperado de `adapter-auto` al no detectar entorno de producción |

El aviso del frontend no es un fallo. `adapter-auto` inspecciona las variables de entorno en busca de un destino de despliegue conocido y, al no encontrar ninguno en un entorno local, informa que la compilación se ha realizado sin adaptador concreto. El modo esperado de resolverlo es instalar y seleccionar explícitamente el adaptador del destino elegido, como se explica en [guia_despliegue_produccion.md](guia_despliegue_produccion.md).

---

## 9. Convenciones de Código y Puntos de Extensión

### 9.1. Convenciones

El backend usa módulos ES con la extensión `.js` en los imports, es decir TypeScript de tipo `nodenext`: un archivo importa `../services/audit.service.js` aunque el fuente sea `.ts`. Todo acceso a datos pasa por `backend/src/db/query.ts`; ejecutar SQL dentro de una ruta está prohibido por convención. Las entidades están tipadas en `backend/src/models/types.ts` y las consultas se.parametrize siempre con `?`, nunca por concatenación. En el frontend las variables de entorno privadas se leen con `$env/dynamic/private` y las públicas con `$env/dynamic/public`.

### 9.2. Cómo añadir una ruta

1. Defina el controlador en el enrutador correspondiente y aplique `authenticate` si exige sesión.
2. Delegue en un servicio; la ruta no debe contener reglas de negocio.
3. Si la operación altera el estado del sistema, selle el evento con `auditService.append` usando un tipo de evento ya registrado.
4. Escriba la prueba de integración en `tests/integration/` comprobando código de estado, forma de respuesta y presencia del evento en la bitácora.
5. Actualice el catálogo de la sección 4 de este documento.

### 9.3. Cómo añadir un evento de auditoría

El tipo de evento es una cadena libre en la firma de `auditService.append`, de modo que un valor nuevo funciona sin modificar el servicio. Aun así, el cambio debe añadirse a la enumeración de la sección 4.7, documentarse en la bitácora funcional y cubrirse con una prueba que compruebe que `previous_hash` de la fila siguiente encadena con `current_hash` de la nueva. No se debe añadir ninguna vía de actualización o eliminación sobre `audit_log`.

### 9.4. Cómo añadir un driver

La interfaz `DbDriver` declara cuatro operaciones: `run`, `exec`, `save` y `close`, más la propiedad de solo lectura `engine`. Un motor nuevo debe implementar ese contrato en `backend/src/db/` y ser seleccionado en `connection.ts`. La conversión de marcadores de `?` a `$1, $2` ya está resuelta y exportada como `toPositionalPlaceholders`. Antes de habilitar un segundo motor hay que resolver la limitación descrita en 11.2, porque el contrato actual es síncrono y la mayoría de los controladores PostgreSQL de la ecosistema son asíncronos.

---

## 10. Diagnóstico y Mantenimiento

| Síntoma | Causa probable | Comprobación y solución |
|---------|----------------|-------------------------|
| El arranque falla indicando que `DATABASE_URL` está definido pero el adaptador PostgreSQL no está habilitado | Variable de entorno presente sin driver correspondiente | Retire `DATABASE_URL` del archivo `.env`; el error es deliberado y se emite desde `connection.ts` |
| `pnpm build` termina con un aviso sobre `adapter-auto` | No se detecta entorno de despliegue en producción | Comportamiento esperado en local; instale el adaptador explícito antes de desplegar |
| `ADAPTER=node` o `ADAPTER=vercel` no cambian el resultado de la compilación | Solo está instalado `adapter-auto` | Instale el adaptador correspondiente y configúrelo en `svelte.config.js` |
| Un documento subido no aparece tras reiniciar el servidor | `uploads/` y la base serializada guardan rutas absolutas que dejaron de coincidir | Ejecute la reparación de rutas incluida en `backend/src/db/repair-paths.ts` |
| La base de datos parece vacía tras un cierre abrupto | La serialización de `sql.js` ocurre al cerrar y no en cada escritura | Cierre el proceso con `SIGINT` o `SIGTERM`; ambos están registrados en `app.ts` |
| Un archivo supera el límite y devuelve estado 413 | El manejador de errores de `app.ts` rechaza archivos mayores de 10 MB | Reducir el archivo o ajustar el límite en la configuración de Multer |
| Una petición recibe estado 429 de forma inesperada | Limitador de 300 peticiones por 15 minutos sobre `/api`, más bloqueo por intentos fallidos | Esperar la expiración; el bloqueo por login fallido expira solo, sin reinicio manual |
| La verificación de un QR declara siempre la firma válida | Defecto abierto en `GET /api/verify/:documentId` | La comprobación criptográfica real está en `POST /api/verify`; ver 11.3 |
| `svelte-check` informa de tipos inexistentes de Express | Desajuste entre `@types/express@5` y `express@4` | Alinear a `@types/express@4` antes de apoyar la verificación en ese resultado |

---

## 11. Deuda Técnica y Limitaciones Conocidas

### 11.1. Cobertura funcional por capa

| Capa | Casos cubiertos | Total | Cobertura |
|------|-----------------:|------:|----------:|
| Identidad | 6 | 6 | 100 % |
| Emisión y firma | 8 | 8 | 100 % |
| Versionado | 5 | 5 | 100 % |
| Visibilidad | 4 | 4 | 100 % |
| Coautoría | 6 | 6 | 100 % |
| Verificación | 5 | 5 | 100 % |
| Auditoría | 5 | 5 | 100 % |
| Interfaz de usuario | 3 | 7 | 43 % |

La cobertura declarada es del 96 % sobre el total de casos, pero se trata de una medida de cobertura de casos de prueba, no de cobertura de código ni de eficiencia de defectos. El 43 % de la interfaz de usuario es una brecha real y no una estimación: faltan pruebas de cuatro recorridos de interfaz, entre ellos el de verificación pública alcanzado desde el QR, precisamente el que expone el defecto abierto.

### 11.2. Cinco bloqueos para operar en producción

| Identificador | Bloqueo | Efecto | Condición de resolución |
|---------------|---------|--------|-------------------------|
| B1 | La interfaz `DbDriver` es síncrona | Impide adoptar PostgreSQL sin rediseñar la capa de acceso a datos | Declarar el contrato en términos asíncronos y propagar el cambio a servicios y rutas |
| B2 | Solo está instalado `adapter-auto` | `ADAPTER=node` y `ADAPTER=vercel` fallan al fijarse | Añadir y configurar el adaptador del destino elegido |
| B3 | `uploads/` reside en el sistema de archivos local y efímero | Los archivos se pierden en reinicios de plataforma sin disco persistente | Sustituir por almacenamiento de objetos o montar un volumen persistente |
| B4 | `vercel.json` no se validó desplegando | La configuración de despliegue existe pero no está probada contra la plataforma | Ejecutar un despliegue de prueba y corregir lo que aparezca |
| B5 | La base vive en memoria y se serializa a archivo | Volumen de datos acotado por memoria del proceso | Resolver B1 y migrar a motor cliente-servidor |

El arranque del backend incluye una salvaguarda deliberada: si se fija `DATABASE_URL` sin adaptador PostgreSQL habilitado, el proceso termina con el mensaje `DATABASE_URL esta definido pero el adaptador PostgreSQL todavia no esta habilitado`. Se ha preferido un fallo explícito en el arranque frente a un comportamiento silencioso que aparentaría persistencia real.

### 11.3. Defecto abierto de mayor impacto

`GET /api/verify/:documentId` devuelve `signature.valid: true` como valor fijo, sin comprobar criptográficamente el archivo. La comprobación real, que recalcula la huella SHA-256 y valida la firma con la clave pública del firmante, reside en `POST /api/verify`. La ruta GET existe para responder al escaneo del código QR, donde no se dispone del archivo, y su respuesta es una ficha informativa del documento.

El defecto es engañoso porque un lector que solo use el QR obtiene una afirmación de validez sin fundamento criptográfico. La corrección consiste en eliminar el campo `valid` fijo y sustituirlo por el resultado de la verificación efectiva, o bien por una indicación explícita de que se trata de un dato declarativo y no verificado. Mientras no se corrija, ninguna afirmación sobre la firma mostrada en la vista pública debe considerarse evidencia de validez.

### 11.4. Límite legal

La firma del SGD-FD es criptográficamente válida dentro del perímetro del sistema, pero no es firma electrónica certificada bajo la Ley N.° 27269. El sistema no incorpora Autoridad de Certificación acreditada ni sello de tiempo confiable. No está certificado bajo ninguna norma y no se ha realizado auditoría externa de seguridad. Esta limitación debe reproducirse sin atenuaciones en toda documentación y en la propia interfaz.

### 11.5. Inconsistencias menores

`@types/express@^5` no corresponde a `express@^4.21.2`, por lo que la comprobación de tipos del backend se apoya en tipos de una versión que no es la instalada. `multer@1.4.5-lts.1` permanece en su rama de mantenimiento, sin funcionalidad nueva, y su mantenimiento de seguridad depende de un tercero. Ninguna de las dos incidencias afecta al comportamiento en ejecución, y ambas son de corrección acotada.

---

## 12. Referencias Cruzadas

**Diseño y arquitectura**
- [arquitectura.md](../../02_diseno_construccion/arquitectura/arquitectura.md) — vistas del sistema y decisiones de arquitectura
- [modelo_datos.md](../../02_diseno_construccion/arquitectura/modelo_datos.md) — diccionario de datos completo de las siete tablas
- [diagrama_clases.md](../../06_diagramas_y_software/diagrama_clases.md) — clases y relaciones del backend

**Software y despliegue**
- [software_utilizado.md](../../06_diagramas_y_software/software_utilizado.md) — inventario, licencias y justificación de cada dependencia
- [diagrama_paquetes.md](../../06_diagramas_y_software/diagrama_paquetes.md) — grafo de dependencias entre paquetes
- [diagrama_despliegue.md](../../06_diagramas_y_software/diagrama_despliegue.md) — topología de despliegue
- [implementacion_despliegue.md](../../04_implementacion_despliegue/implementacion_despliegue.md) — procedimiento de puesta en marcha

**Calidad y pruebas**
- [matriz_pruebas.md](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) — catálogo de casos por nivel
- [matriz_trazabilidad.md](../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) — relación entre requisitos y pruebas
- [metricas_calidad.md](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) — indicadores de calidad y su origen
- [validacion_experimental.md](../../02_diseno_construccion/pruebas_calidad/validacion_experimental.md) — protocolo de validación ejecutado
- [aplicacion_iso_29119.md](../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md) — correspondencia con la norma de pruebas

**Seguridad, normas y operación**
- [seguridad.md](../seguridad/seguridad.md) — controles implementados y amenazas analizadas
- [aplicacion_iso_27000.md](../iso_aplicada/aplicacion_iso_27000.md) — correspondencia con la familia de normas de seguridad
- [manual_usuario.md](manual_usuario.md) — guía de uso del sistema
- [guia_despliegue_produccion.md](guia_despliegue_produccion.md) — procedimiento de despliegue y sus condiciones previas
- [roadmap_produccion.md](roadmap_produccion.md) — hoja de ruta posterior a la entrega
- [glosario_tecnico.md](../referencia/glosario_tecnico.md) — definiciones de términos técnicos
