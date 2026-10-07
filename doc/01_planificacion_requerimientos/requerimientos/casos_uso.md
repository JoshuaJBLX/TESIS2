# Casos de Uso

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 1 — Planificación y Requerimientos
**Notación:** Plantilla de casos de uso (IEEE 830 / UML 2.5.1), con escenario
principal, escenarios alternos y requisitos asociados.

---

## 0. Convenciones

| Elemento | Notación |
|----------|----------|
| Caso de uso | `CU-###` — *Nombre en verbo infinitivo* |
| Precondiciones | Estado que debe cumplirse antes del disparador |
| Disparador | Evento que inicia el caso de uso |
| Flujo principal | Secuencia de pasos numerados |
| Flujos alternos | Caminos alternativos o de excepción, numerados `<id>A`, `<id>E` |
| Postcondiciones | Estado garantizado al finalizar |
| RF | Requerimientos funcionales que lo sustentan |

### Actores del sistema

| Actor | Descripción |Tipo de acceso |
|-------|-------------|----------------|
| **Visitante** | Persona sin cuenta que navega, verifica o consulta documentos públicos. | Anónimo |
| **Usuario** | Titular de documentos. | Autenticado |
| **Colaborador** | Usuario registrado que propone cambios en documentos ajenos. | Autenticado |
| **Administrador** | Custodio de la bitácora de auditoría. | Autenticado + rol `admin` |
| **Sistema** | Procesos automáticos: migración, sellado, verificación de cadena. | Automático |
| **Receptor** | Persona externa que recibe un documento y debe verificarlo. | Anónimo |

### Matriz de relación actor ↔ caso de uso

| Caso de uso | Visitante | Usuario | Colaborador | Administrador |
|-------------|:---------:|:-------:|:-----------:|:-------------:|
| CU-001 Registrarse | ✔ | ✔ | ✔ | ✔ |
| CU-002 Iniciar sesión | ✔ | ✔ | ✔ | ✔ |
| CU-003 Renovar sesión | | ✔ | ✔ | ✔ |
| CU-004 Consultar perfil público | ✔ | ✔ | ✔ | ✔ |
| CU-005 Subir y firmar documento | | ✔ | ✔ | ✔ |
| CU-006 Actualizar documento (nueva versión) | | ✔ | | ✔ |
| CU-007 Consultar detalle de documento | | ✔ | ✔ | ✔ |
| CU-008 Consultar historial de versiones | | ✔ | | ✔ |
| CU-009 Obtener código QR | | ✔ | | ✔ |
| CU-010 Compartir documento | | ✔ | | ✔ |
| CU-011 Consultar documento público | ✔ | ✔ | ✔ | ✔ |
| CU-012 Descargar archivo de versión | ✔ | ✔ | ✔ | ✔ |
| CU-013 Crear propuesta de cambio | | | ✔ | ✔ |
| CU-014 Revisar propuestas recibidas | | ✔ | | ✔ |
| CU-015 Aceptar propuesta | | ✔ | | ✔ |
| CU-016 Rechazar propuesta | | ✔ | | ✔ |
| CU-017 Comparar versiones o propuestas | ✔ | ✔ | ✔ | ✔ |
| CU-018 Verificar documento subido | ✔ | ✔ | ✔ | ✔ |
| CU-019 Buscar documento por hash | ✔ | ✔ | ✔ | ✔ |
| CU-020 Verificar por URL / QR | ✔ | ✔ | ✔ | ✔ |
| CU-021 Consultar bitácora de auditoría | | | | ✔ |
| CU-022 Verificar integridad de cadena | | | | ✔ |

---

## 1. CASOS DE USO DE AUTENTICACIÓN

### CU-001 — Registrarse

| Campo | Valor |
|-------|-------|
| **Actor principal** | Visitante |
| **RF** | RF-001 |
| **Precondiciones** | El visitante no está registrado |
| **Disparador** | Necesita gestionar documentos firmados |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Visitante selecciona «Registrarse».
2. El sistema muestra el formulario con `username`, `email`, `password` y `fullName`.
3. El Visitante introduce sus datos y confirma.
4. El sistema valida que no falte ningún campo. Si falta alguno → `3A`.
5. El sistema valida la política de contraseñas. Si no se cumple → `3B`.
6. El sistema comprueba que el `username` y el `email` no existan. Si existen → `3C`.
7. El sistema genera un par de claves RSA-2048.
8. El sistema calcula el fingerprint SHA-256 de la clave pública.
9. El sistema cifra la clave privada con AES-256-GCM, con clave derivada por
   PBKDF2-HMAC-SHA512 (100 000 iteraciones) a partir de la contraseña.
10. El sistema almacena el usuario y sus claves.
11. El sistema registra el evento `USER_REGISTERED` en la bitácora encadenada.
12. El sistema muestra el fingerprint de la clave pública como confirmación.

**Flujos alternos**

- **3A — Faltan campos:** el sistema indica qué campos son obligatorios y
  permanece en el formulario. *Extensión:* `REQ-001`.
- **3B — Contraseña débil:** el sistema enumera los requisitos incumplidos
  (≥ 12 caracteres, mayúscula, minúscula, dígito, símbolo). *Extensión:* `REQ-001`.
- **3C — Datos duplicados:** el sistema informa que el usuario o el correo ya
  están registrados. *Extensión:* `REQ-001`.
- **7E — Falla la generación de claves:** el sistema revierte la operación
  completa; no queda ningún usuario a medias. *Extensión:* `REQ-001`.

**Postcondiciones**

- Existe un registro en `users` con `role = 'user'` e `is_active = 1`.
- Existe un registro en `user_keys` con la clave privada cifrada.
- La bitácora contiene un evento `USER_REGISTERED`.

---

### CU-002 — Iniciar sesión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Visitante |
| **RF** | RF-002 |
| **Precondiciones** | El usuario existe y está activo |
| **Disparador** | Necesita acceder a su área privada |
| **Frecuencia** | Muy frecuente |

**Escenario principal**

1. El Visitante selecciona «Iniciar sesión».
2. El Visitante introduce `username` y `password`.
3. El sistema valida que no se superen los límites de tasa. Si se superan → `3A`.
4. El sistema busca el usuario y verifica que esté activo.
5. El sistema compara la contraseña con `bcryptjs.compareSync`.
6. El sistema emite un access token (15 min) y un refresh token (7 días), con
   secretos de firma distintos.
7. El sistema reinicia el contador de intentos fallidos de esa IP + usuario.
8. El sistema registra `LOGIN_SUCCESS` en la bitácora.
9. El sistema almacena los tokens en el navegador y navega al panel.

**Flujos alternos**

- **3A — Límite de tasa excedido:** responder HTTP 429 con `retryAfterSeconds`.
  *Extensión:* `REQ-002`, `REQ-026`.
- **4A — Usuario inexistente o inactivo:** responder HTTP 401 con
  `Credenciales inválidas`, **sin** indicar cuál de los dos casos ocurrió.
  *Extensión:* `REQ-002`.
- **5A — Contraseña incorrecta:** registrar `LOGIN_FAILED` con la IP, responder
  HTTP 401 con el mismo mensaje genérico e incrementar el contador de fallos.
  *Extensión:* `REQ-002`.
- **5B — Cuenta bloqueada por intentos previos:** responder HTTP 429 con
  `retryAfterSeconds = 900`. *Extensión:* `REQ-002`.

**Postcondiciones**

- El Visitante queda autenticado con rol `user` o `admin`.
- La bitácora contiene `LOGIN_SUCCESS` o `LOGIN_FAILED`.

---

### CU-003 — Renovar la sesión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario |
| **RF** | RF-003 |
| **Precondiciones** | El usuario tiene un refresh token vigente |
| **Disparador** | El access token expiró durante la navegación |
| **Frecuencia** | Automática |

**Escenario principal**

1. El cliente detecta un HTTP 401 en una petición autenticada.
2. El cliente envía el refresh token a `/api/auth/refresh`.
3. El sistema valida la firma del refresh token.
4. El sistema comprueba que el usuario siga existiendo y activo.
5. El sistema emite un access token nuevo.
6. El cliente persiste el token y reintenta **una sola vez** la petición original.

**Flujos alternos**

- **3A — Refresh token inválido o expirado:** responder HTTP 401; el cliente
  cierra la sesión y redirige al inicio de sesión. *Extensión:* `REQ-003`.
- **4A — Usuario desactivado:** responder HTTP 401. *Extensión:* `REQ-003`.

**Postcondiciones**

- El cliente dispone de un access token válido.
- Las peticiones en vuelo no se duplican (se serializa la renovación mediante
  `refreshPromise`).

---

### CU-004 — Consultar el perfil público de un usuario

| Campo | Valor |
|-------|-------|
| **Actor principal** | Visitante |
| **RF** | RF-013 |
| **Precondiciones** | El usuario existe y está activo |
| **Disparador** | Quiere ver los documentos que un usuario ha compartido |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Visitante navega a `/u/:username`.
2. El sistema busca el usuario con `is_active = 1`.
3. El sistema recupera los documentos con `is_public = 1`, cada uno con su última
   versión, firmante y coautor.
4. El sistema los ordena por `updated_at DESC`.
5. El Visitante ve el perfil con los documentos compartidos.

**Flujos alternos**

- **2A — Usuario inexistente o inactivo:** responder HTTP 404 `Usuario no encontrado`.
  *Extensión:* `REQ-013`.
- **3A — El usuario no ha compartido ningún documento:** mostrar un estado vacío
  explicativo. *Extensión:* `REQ-013`.

**Postcondiciones**

- Ningún dato personal sensible (correo, hash de contraseña, claves) ha salido
  del servidor.

---

## 2. CASOS DE USO DE GESTIÓN DOCUMENTAL

### CU-005 — Subir y firmar un documento

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario |
| **RF** | RF-006 |
| **Precondiciones** | El Usuario está autenticado y tiene claves generadas |
| **Disparador** | Tiene un documento que quiere registrar y firmar |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Usuario selecciona «Subir documento».
2. El Usuario elige un archivo PDF, DOC, DOCX o TXT de hasta 10 MB.
3. El Usuario introduce el título, la descripción opcional y la contraseña de firma.
4. El Usuario confirma.
5. El sistema valida que el archivo exista, no esté vacío y su MIME esté en la
   lista admitida. Si no → `5A` / `5B` / `5C`.
6. El sistema descifra la clave privada del usuario con la contraseña suministrada.
7. El sistema calcula el SHA-256 del contenido.
8. El sistema firma el hash con RSA-SHA256.
9. El sistema crea el documento con `is_public = 0`.
10. El sistema almacena el archivo como `<versionId>-<nombre>`.
11. El sistema inserta la versión 1 con su hash, tamaño y MIME.
12. El sistema inserta la firma de la versión 1.
13. El sistema genera el QR de verificación.
14. El sistema registra `DOCUMENT_UPLOAD`.
15. El documento aparece de inmediato en el listado, marcado como **privado**.
    El QR y el enlace público no se muestran aquí: aparecen en el detalle
    `/documents/[id]` (barra de compartir) cuando el propietario decide
    compartir el documento.

**Flujos alternos**

- **5A — Sin archivo:** HTTP 400 `No se proporcionó archivo`.
- **5B — MIME no admitido o archivo vacío:** HTTP 400 `Tipo de archivo no permitido
  o archivo vacío`; el archivo temporal se elimina.
- **5C — Archivo mayor a 10 MB:** HTTP 413 `El archivo supera el límite de 10 MB`.
- **5D — Faltan título o contraseña:** HTTP 400 `Título y contraseña son requeridos`.
- **6A — Contraseña incorrecta:** el descifrado falla; la operación se aborta
  **antes** de escribir en la base y se devuelve HTTP 400. No queda ningún
  documento creado.
- **6B — El usuario no tiene claves generadas:** HTTP 400
  `No se encontraron claves criptograficas para el usuario`.

**Postcondiciones**

- El documento existe con exactamente una versión firmada.
- El archivo almacenado es **idéntico** al firmado.
- La bitácora contiene `DOCUMENT_UPLOAD` con título, versión y hash.

---

### CU-006 — Actualizar un documento con una nueva versión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario (propietario) |
| **RF** | RF-007 |
| **Precondiciones** | El documento existe y pertenece al Usuario |
| **Disparador** | Ha corregido el documento y quiere publicar la versión 2 |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Usuario abre el detalle del documento.
2. El Usuario selecciona «Nueva versión».
3. El Usuario elige el archivo corregido y describe el cambio.
4. El Usuario introduce su contraseña de firma y confirma.
5. El sistema verifica la propiedad del documento. Si no es el propietario → `5A`.
6. El sistema descifra la clave privada y firma el nuevo contenido.
7. El sistema calcula `version_number = MAX + 1`.
8. El sistema inserta la nueva versión **sin tocar las anteriores**.
9. El sistema inserta la firma de la nueva versión.
10. El sistema actualiza `documents.updated_at`.
11. El sistema registra `DOCUMENT_UPDATE` con versión, hash y descripción.
12. El sistema muestra la confirmación con el QR actualizado.

**Flujos alternos**

- **5A — No es el propietario:** HTTP 400
  `No tienes permisos para modificar este documento`.
- **4A — Sin contraseña:** HTTP 400 `Contraseña requerida para firmar`.
- **6A — Contraseña incorrecta:** la operación se aborta sin escribir nada.
- **4B — Archivo inválido:** HTTP 400; se conserva la versión anterior intacta.

**Postcondiciones**

- El documento tiene `n + 1` versiones.
- Las versiones 1 … n conservan sus hashes y firmas originales.
- La bitácora contiene `DOCUMENT_UPDATE`.

---

### CU-007 — Consultar el detalle de un documento

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario |
| **RF** | RF-008 |
| **Precondiciones** | El Usuario está autenticado |
| **Disparador** | Quiere revisar la ficha de un documento propio |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Usuario selecciona un documento de su panel.
2. El sistema verifica que le pertenezca.
3. El sistema recupera el documento con el nombre de su propietario.
4. El sistema recupera la versión más alta con su firma y su coautor.
5. El Usuario ve la ficha: título, descripción, versión vigente, hash, firmante,
   coautor, fecha y QR.

**Flujos alternos**

- **2A — El documento no existe o no le pertenece:** el servicio devuelve `null` y
  la ruta responde HTTP 404 `Documento no encontrado`. La indistinguishable entre
  ambos casos es intencional: no se revela la existencia de documentos ajenos.
  *Extensión:* `REQ-008`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-008 — Consultar el historial de versiones

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario |
| **RF** | RF-009 |
| **Precondiciones** | El documento pertenece al Usuario |
| **Disparador** | Quiere ver cómo evolucionó el documento |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Usuario abre la sección «Versiones» del documento.
2. El sistema verifica la propiedad. Si no corresponde → `2A`.
3. El sistema consulta todas las versiones con `LEFT JOIN` a firmas, autores y coautores.
4. El sistema las ordena por `version_number DESC`.
5. El Usuario ve, por cada versión: número, nombre, tamaño, hash, firmante,
   coautor, fecha y descripción del cambio.

**Flujos alternos**

- **2A — El documento no le pertenece:** devolver una lista vacía (no un error),
  para no confirmar la existencia del documento. *Extensión:* `REQ-009`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-009 — Obtener el código QR de verificación

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario |
| **RF** | RF-010 |
| **Precondiciones** | El documento pertenece al Usuario |
| **Disparador** | Quiere distribuir el documento con su QR |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Usuario pulsa «Ver QR» en el detalle del documento.
2. El sistema verifica la propiedad del documento.
3. El sistema construye la URL `{protocolo}://{host}/api/verify/{documentId}`.
4. El sistema genera el QR como Data URL de 256 px con margen 2.
5. El Usuario ve el código y puede descargarlo o compartirlo.

**Flujos alternos**

- **2A — Documento inexistente o ajeno:** HTTP 404 `Documento no encontrado`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

## 3. CASOS DE USO DE COMPARTIR Y COLABORAR

### CU-010 — Compartir un documento

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario (propietario) |
| **RF** | RF-011 |
| **Precondiciones** | El documento pertenece al Usuario |
| **Disparador** | Quiere que terceros puedan consultar el documento y proponer cambios |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Usuario activa el interruptor «Compartir».
2. El sistema envía `PATCH /api/docs/:id/visibility` con `isPublic: true`.
3. El sistema verifica la propiedad. Si no es el propietario → `3A`.
4. El sistema establece `is_public = 1` y actualiza `updated_at`.
5. El sistema registra `DOCUMENT_VISIBILITY_CHANGED`.
6. El documento pasa a estar visible en el perfil público y admite propuestas.

**Flujos alternos**

- **3A — No es el propietario:** HTTP 400
  `No tienes permisos para compartir este documento`.
- **1A — Dejar de compartir:** el mismo flujo con `isPublic: false`; el documento
  deja de ser accesible y deja de admitir propuestas.

**Postcondiciones**

- `is_public` refleja la decisión del propietario.
- La bitácora contiene `DOCUMENT_VISIBILITY_CHANGED`.

---

### CU-011 — Consultar un documento público

| Campo | Valor |
|-------|-------|
| **Actor principal** | Receptor |
| **RF** | RF-012 |
| **Precondiciones** | El documento existe y `is_public = 1` |
| **Disparador** | Ha recibido el enlace o el QR y quiere ver el contenido |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Receptor abre el enlace público o escanea el QR.
2. El sistema busca el documento.
3. El sistema comprueba que `is_public = 1`.
4. El sistema devuelve el documento y su listado de versiones.
5. El Receptor ve el contenido, la versión vigente, el firmante y el coautor.

**Flujos alternos**

- **2A / 3A — El documento no existe o es privado:** HTTP 404 con el **mismo**
  mensaje `Documento no encontrado o no disponible públicamente`. La
  indistinguibilidad impide enumerar documentos privados. *Extensión:* `REQ-012`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-012 — Descargar el archivo de una versión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario, Colaborador o Receptor |
| **RF** | RF-014 |
| **Precondiciones** | Existe una versión solicitada del documento |
| **Disparador** | Necesita el archivo en su sistema local |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El actor pulsa «Descargar» en una versión concreta.
2. El cliente solicita `/api/docs/:id/file?versionId=<id>` con su token, si lo tiene.
3. El sistema determina la versión: la indicada, o la última si no se indica.
4. El sistema verifica que el `versionId` pertenezca al documento. Si no → `4A`.
5. El sistema comprueba el acceso:
   - documento público → permitido para cualquiera; o
   - el solicitante es el propietario → permitido.
   En caso contrario → `5A`.
6. El sistema abre un flujo de lectura del archivo.
7. El sistema responde con `Content-Type`, `Content-Length`,
   `Content-Disposition`, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`.
8. El cliente recibe el `Blob`, lo guarda y dispara la descarga.

**Flujos alternos**

- **4A — Versión inexistente o ajena al documento:** HTTP 404 `Versión no encontrada`.
- **5A — Documento privado de un tercero:** HTTP 403
  `No tienes permisos para descargar este documento`.
- **2A — Documento inexistente:** HTTP 404 `Documento no encontrado`.
- **2B — Archivo ausente en el repositorio:** HTTP 404
  `Archivo no encontrado en el repositorio`.
- **7A — Access token expirado:** el cliente renueva el token y reintenta una vez.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-013 — Crear una propuesta de cambio

| Campo | Valor |
|-------|-------|
| **Actor principal** | Colaborador |
| **RF** | RF-015 |
| **Precondiciones** | El Colaborador está registrado; el documento existe y es público; el Colaborador no es el propietario |
| **Disparador** | Ha detectado un error o una mejora en el documento |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Colaborador abre la vista pública del documento.
2. El Colaborador selecciona «Proponer cambios».
3. El Colaborador elige el archivo modificado y describe los cambios.
4. El Colaborador introduce su contraseña de firma y confirma.
5. El sistema comprueba que el documento esté compartido. Si no → `5A`.
6. El sistema comprueba que el Colaborador no sea el propietario. Si lo es → `5B`.
7. El sistema valida que la descripción no esté vacía. Si lo está → `5C`.
8. El sistema determina la versión base: la última, o la indicada en
   `baseVersionId`.
9. El sistema descifra la clave del Colaborador y firma el contenido propuesto.
10. El sistema almacena el archivo en `uploads/proposals/`.
11. El sistema inserta la propuesta con `status = 'pending'`.
12. El sistema registra `DOCUMENT_PROPOSAL_CREATED`.
13. El Colaborador recibe la confirmación con el hash de su propuesta.

**Flujos alternos**

- **5A — Documento no compartido:** HTTP 400
  `El documento no esta compartido para recibir propuestas`.
- **5B — El solicitante es el propietario:** HTTP 400
  `El propietario puede actualizar este documento directamente`.
- **5C — Descripción vacía o en blanco:** HTTP 400 `Debes describir los cambios propuestos`.
- **4A — Archivo inválido o vacío:** HTTP 400.
- **4B — Sin contraseña:** HTTP 400.
- **9A — Contraseña incorrecta:** la operación se aborta sin escribir nada.
- **8A — Versión base inexistente:** HTTP 400
  `No se encontro la version base para la propuesta`.

**Postcondiciones**

- Existe una propuesta `pending` firmada por el Colaborador.
- El documento original **no** ha sido modificado.

---

### CU-014 — Revisar las propuestas recibidas

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario (propietario) |
| **RF** | RF-016 |
| **Precondiciones** | El documento pertenece al Usuario |
| **Disparador** | Ha compartido el documento y espera sugerencias |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Usuario abre la pestaña «Propuestas» del documento.
2. El sistema verifica la propiedad. Si no corresponde → `2A`.
3. El sistema consulta las propuestas con los datos de sus autores, revisores y
   versiones base.
4. El sistema las ordena: pendientes primero, luego aceptadas, luego rechazadas.
5. El Usuario ve, por cada propuesta: autor, descripción, hash, fecha, estado y
   los datos de la versión base.

**Flujos alternos**

- **2A — El documento no le pertenece:** devolver una lista vacía. *Extensión:* `REQ-016`.
- **4A — Sin propuestas:** mostrar un estado vacío explicativo.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-015 — Aceptar una propuesta

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario (propietario) |
| **RF** | RF-017 |
| **Precondiciones** | Existe una propuesta `pending` sobre un documento propio |
| **Disparador** | Ha revisado la propuesta y la considera válida |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Usuario selecciona «Aceptar» en una propuesta.
2. El sistema pide confirmar con su contraseña de firma.
3. El Usuario introduce la contraseña.
4. El sistema verifica que el documento le pertenezca. Si no → `4A`.
5. El sistema recupera la propuesta. Si no existe → `5A`.
6. El sistema comprueba que esté en `pending`. Si ya fue procesada → `5B`.
7. El sistema descifra la clave del propietario y **firma el contenido de la
   propuesta**.
8. El sistema copia el archivo a `uploads/<versionId>-<nombre>`.
9. El sistema inserta la nueva versión con `version_number = MAX + 1`,
   `uploaded_by = propietario`, `coauthor_id = proponente` y
   `source_proposal_id = propuesta`.
10. El sistema inserta la firma del propietario sobre esa versión.
11. El sistema marca la propuesta como `accepted` con revisor, fecha y
    `accepted_version_id`.
12. El sistema registra `DOCUMENT_PROPOSAL_ACCEPTED` con `coauthorId`.
13. El Usuario ve la confirmación con la nueva versión y el nombre del coautor.

**Flujos alternos**

- **3A — Sin contraseña:** HTTP 400 `Contraseña requerida para firmar la nueva versión`.
- **4A — No es el propietario:** HTTP 400
  `No tienes permisos para aceptar propuestas de este documento`.
- **5A — Propuesta inexistente:** HTTP 400 `Propuesta no encontrada`.
- **5B — Propuesta ya procesada:** HTTP 400 `La propuesta ya fue procesada`.
- **7A — Contraseña incorrecta:** la operación se aborta sin escribir nada.

**Postcondiciones**

- El documento tiene una versión más.
- La firma criptográfica de esa versión es del **propietario**.
- `coauthor_id` acredita al Colaborador como autor de la contribución.
- La propuesta queda en `accepted` y **no** puede reprocesarse.

---

### CU-016 — Rechazar una propuesta

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario (propietario) |
| **RF** | RF-018 |
| **Precondiciones** | Existe una propuesta `pending` sobre un documento propio |
| **Disparador** | Ha evaluado la propuesta y no la considera procedente |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Usuario selecciona «Rechazar» en una propuesta.
2. El sistema pide confirmar la acción.
3. El Usuario confirma.
4. El sistema verifica la propiedad. Si no → `4A`.
5. El sistema comprueba que la propuesta esté en `pending`. Si no → `5A`.
6. El sistema establece `status = 'rejected'` con revisor y fecha.
7. El sistema registra `DOCUMENT_PROPOSAL_REJECTED`.
8. El archivo y la firma del proponente se conservan.

**Flujos alternos**

- **4A — No es el propietario:** HTTP 400
  `No tienes permisos para rechazar propuestas de este documento`.
- **5A — Propuesta inexistente o ya procesada:** HTTP 400.

**Postcondiciones**

- La propuesta está en `rejected`.
- El documento **no** ha cambiado.
- La firma del proponente se conserva como evidencia de que la propuesta existió.

---

### CU-017 — Comparar versiones o propuestas

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario, Colaborador o Receptor |
| **RF** | RF-020 |
| **Precondiciones** | Los dos artefactos pertenecen al mismo documento |
| **Disparador** | Quiere ver exactamente qué cambió |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El actor selecciona dos artefactos del documento.
2. El sistema valida que estén presentes los cuatro parámetros. Si falta alguno → `2A`.
3. El sistema comprueba el acceso: documento público, o propietario. En caso
   contrario → `3A`.
4. El sistema extrae el texto de ambos artefactos según su formato.
5. El sistema calcula las diferencias de metadatos: nombre, MIME, tamaño, hash y origen.
6. El sistema calcula el diff línea a línea mediante programación dinámica (LCS).
7. El sistema responde con `metadata`, `lineDiffs`, `summary` y la nota de soporte.

**Flujos alternos**

- **2A — Parámetros inválidos:** HTTP 400 `Parámetros de comparación inválidos`.
- **3A — Documento privado de un tercero:** HTTP 400
  `No tienes permisos para comparar este documento`.
- **4A — PDF:** extraer con `pdfplumber`; si falla, reintentar con `PyPDF2`.
- **4B — DOCX:** descomprimir `word/document.xml` y leer los nodos `<w:t>`.
- **4C — Formato binario o extracción fallida:** `supported = false`, sin
  `lineDiffs`, y `note` explicando que solo hay comparación de metadatos.
- **4D — Artefacto inexistente:** HTTP 400
  `No se pudo encontrar uno de los archivos a comparar`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

## 4. CASOS DE USO DE VERIFICACIÓN

### CU-018 — Verificar un documento subido

| Campo | Valor |
|-------|-------|
| **Actor principal** | Receptor |
| **RF** | RF-021 |
| **Precondiciones** | El Receptor tiene el archivo y conoce el `documentId` (o el QR) |
| **Disparador** | Ha recibido un documento y quiere confirmar su autenticidad |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Receptor arrastra el archivo en el verificador público.
2. El sistema recibe el archivo, el `documentId` y opcionalmente el `versionNumber`.
3. El sistema busca el documento. Si no existe → `3A`.
4. El sistema selecciona la versión indicada o la más reciente.
5. El sistema recupera la firma y la clave pública del firmante.
6. El sistema calcula el SHA-256 del archivo recibido.
7. El sistema compara el hash con `content_hash`. Si difieren → `7A`.
8. El sistema verifica la firma con la clave pública.
9. El sistema responde `status: 'VALID'` con `signedBy` y `signedAt`.
10. El Receptor ve la confirmación de que el documento es íntegro y vigente.

**Flujos alternos**

- **3A — Documento inexistente:** HTTP 404 con `status: 'NOT_FOUND'`.
- **4A — Versión inexistente:** HTTP 404 con `status: 'NOT_FOUND'`.
- **5A — Sin firma para esa versión:** HTTP 404 con
  `status: 'NOT_FOUND'` y el mensaje `Firma no encontrada para esta versión`.
- **7A — El hash no coincide:** responder `status: 'MANIPULATED'` con
  `El documento ha sido manipulado (hash no coincide)`. **Este es el caso
  crítico**: el contenido fue alterado después de firmarse.
- **8A — El hash coincide pero la firma no valida:** responder
  `status: 'INVALID_SIGNATURE'` con `Firma digital inválida`, lo que sugiere
  suplantación del firmante.

**Postcondiciones**

- No se ha modificado ningún dato del repositorio.
- El archivo subido se conserva únicamente como temporal de multer.

---

### CU-019 — Buscar un documento por su contenido

| Campo | Valor |
|-------|-------|
| **Actor principal** | Receptor |
| **RF** | RF-022 |
| **Precondiciones** | El Receptor tiene el archivo pero **no** el `documentId` |
| **Disparador** | Quiere saber si el archivo proviene de este repositorio |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Receptor arrastra el archivo **sin** indicar documento.
2. El sistema calcula su SHA-256.
3. El sistema busca la versión más reciente con ese `content_hash`.
4. El sistema responde `status: 'FOUND'` con `documentId`, `title`, `version` y
   `lastModified`.
5. El Receptor sabe que el archivo es auténtico y a qué documento pertenece.

**Flujos alternos**

- **3A — Sin coincidencias:** responder `status: 'NOT_FOUND'` con `matches: []` y
  el mensaje `No se encontró coincidencia en el repositorio`. Esto revela un
  documento falso o una versión que nunca fue registrada.

**Postcondiciones**

- No se ha modificado ningún dato del repositorio.

---

### CU-020 — Verificar por URL o código QR

| Campo | Valor |
|-------|-------|
| **Actor principal** | Receptor |
| **RF** | RF-023 |
| **Precondiciones** | El documento existe |
| **Disparador** | El Receptor escanea el QR o abre el enlace |
| **Frecuencia** | Frecuente |

**Escenario principal**

1. El Receptor escanea el QR con la cámara del teléfono o abre el enlace.
2. El sistema busca el documento por su identificador.
3. El sistema recupera la última versión con su firma y su firmante.
4. El sistema responde con el título, la versión vigente, `lastModified`,
   `signedBy`, `signedAt` y las instrucciones de verificación.
5. El Receptor decide si dispone del archivo para completar la verificación.

**Flujos alternos**

- **2A — Documento inexistente:** HTTP 404 `Documento no encontrado`.
- **3A — La última versión no tiene firma:** `signedBy` reporta `Unknown` en
  lugar de fallar. *Extensión:* `REQ-023`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

## 5. CASOS DE USO DE AUDITORÍA

### CU-021 — Consultar la bitácora de auditoría

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **RF** | RF-024 |
| **Precondiciones** | El Administrador está autenticado con rol `admin` |
| **Disparador** | Necesita investigar la actividad del sistema |
| **Frecuencia** | Ocasional |

**Escenario principal**

1. El Administrador abre la consola de auditoría.
2. El sistema exige `authenticate` y luego `requireAdmin`. Si el rol no es `admin` → `2A`.
3. El Administrador ajusta los filtros opcionales `eventType`, `entityType`, `from` y `to`.
4. El sistema consulta con esos filtros, `limit` acotado a [1, 200] y `offset`.
5. El sistema cuenta el total de entradas que cumplen el filtro.
6. El Administrador ve la lista de eventos con `previous_hash` y `current_hash`, y
   la paginación.

**Flujos alternos**

- **2A — Rol insuficiente:** HTTP 403 `Se requieren permisos de administrador`.
- **4A — `limit` no numérico:** se usa 50 sin error.
- **4B — `offset` negativo:** se normaliza a 0 sin error.
- **5A — Sin coincidencias:** devolver una lista vacía con `total = 0`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-022 — Verificar la integridad de la cadena de auditoría

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **RF** | RF-025 |
| **Precondiciones** | La bitácora contiene al menos una entrada |
| **Disparador** | Quiere confirmar que nadie ha alterado el historial |
| **Frecuencia** | Periódica |

**Escenario principal**

1. El Administrador pulsa «Verificar cadena».
2. El sistema exige rol `admin`. Si no lo tiene → `2A`.
3. El sistema lee todas las entradas en orden `id ASC`.
4. Para la primera entrada, comprueba que `previous_hash` sea `NULL`.
5. Para cada entrada, comprueba que `previous_hash` coincida con el `current_hash`
   de la anterior. Si no → `5A`.
6. Recomputa `SHA-256(canonical(entrada))` y lo compara con `current_hash`. Si no → `5B`.
7. El sistema responde HTTP 200 con `valid: true` y el total de entradas revisadas.

**Flujos alternos**

- **2A — Rol insuficiente:** HTTP 403.
- **5A — Cadena rota por `previous_hash`:** HTTP 409 con
  `valid: false`, `brokenAt` y el motivo `previous_hash no coincide`.
- **5B — Cadena rota por `current_hash`:** HTTP 409 con
  `valid: false`, `brokenAt` y el motivo `current_hash no coincide`.
- **5C — `event_data` corrupto:** HTTP 409 con el motivo `event_data inválido`.
- **3A — Bitácora vacía:** responder `valid: true` con `entries: 0`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

## 6. Casos de Uso del Sistema

### CU-023 — Verificar la cadena de integridad de un archivo (automático)

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema |
| **RF** | RF-021, RNF-002 |
| **Disparador** | Se solicita una verificación o se registra una versión |

**Escenario principal**

1. El Sistema obtiene los bytes del archivo.
2. El Sistema calcula `SHA-256(bytes)` en hexadecimal.
3. El Sistema compara el resultado con el `content_hash` almacenado.
4. Si coinciden, calcula el hash binario y verifica la firma con la clave pública
   del firmante.
5. Devuelve `isValid`, `hashMatch` y `signatureMatch`.

**Postcondiciones**

- No se ha modificado ningún dato.

---

### CU-024 — Aplicar la migración de esquema (automático)

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema |
| **RF** | RNF-029 |
| **Disparador** | Arranque del backend o `pnpm db:migrate` |

**Escenario principal**

1. El Sistema inicializa la base de datos desde el archivo o crea una nueva.
2. Activa `PRAGMA journal_mode = WAL` y `PRAGMA foreign_keys = ON`.
3. Crea las 7 tablas con `CREATE TABLE IF NOT EXISTS`.
4. Crea los 2 triggers de inmutabilidad de la bitácora.
5. Añade las columnas faltantes mediante `addColumnIfMissing` (inspección con
   `PRAGMA table_info`).
6. Crea los 9 índices con `CREATE INDEX IF NOT EXISTS`.
7. Persiste el resultado.

**Flujos alternos**

- **6A — La base ya estaba migrada:** todas las operaciones son no-op gracias a
  `IF NOT EXISTS`; la migración es idempotente y puede repetirse.

**Postcondiciones**

- El esquema está completo y consistente.

---

## 7. Matriz de Trazabilidad Caso de Uso ↔ Requerimiento ↔ Prueba

| CU | RF | Endpoint | Prueba automatizada |
|----|----|----------|---------------------|
| CU-001 | RF-001 | `POST /api/auth/register` | `auth.service.test.ts` |
| CU-002 | RF-002 | `POST /api/auth/login` | `auth.service.test.ts`, `auth.api.test.ts` |
| CU-003 | RF-003 | `POST /api/auth/refresh` | `auth.api.test.ts` |
| CU-004 | RF-013 | `GET /api/users/:username` | `documents.api.test.ts` |
| CU-005 | RF-006 | `POST /api/docs` | `documents.api.test.ts`, `document.service.test.ts` |
| CU-006 | RF-007 | `PUT /api/docs/:id` | `document.service.test.ts`, `scenarios.test.ts` |
| CU-007 | RF-008 | `GET /api/docs/:id` | `documents.api.test.ts` |
| CU-008 | RF-009 | `GET /api/docs/:id/versions` | `documents.api.test.ts` |
| CU-009 | RF-010 | `GET /api/docs/:id/qr` | `documents.api.test.ts` |
| CU-010 | RF-011 | `PATCH /api/docs/:id/visibility` | `document.service.test.ts` |
| CU-011 | RF-012 | `GET /api/docs/:id/public` | `documents.api.test.ts` |
| CU-012 | RF-014 | `GET /api/docs/:id/file` | `documents.api.test.ts` |
| CU-013 | RF-015 | `POST /api/docs/:id/proposals` | `document.service.test.ts` |
| CU-014 | RF-016 | `GET /api/docs/:id/proposals` | `documents.api.test.ts` |
| CU-015 | RF-017 | `POST .../accept` | `document.service.test.ts`, `scenarios.test.ts` |
| CU-016 | RF-018 | `POST .../reject` | `document.service.test.ts` |
| CU-017 | RF-020 | `GET /api/docs/:id/compare` | `document-analysis.test.ts` |
| CU-018 | RF-021 | `POST /api/verify` | `verify.api.test.ts` |
| CU-019 | RF-022 | `POST /api/verify` | `verify.api.test.ts` |
| CU-020 | RF-023 | `GET /api/verify/:documentId` | `verify.api.test.ts` |
| CU-021 | RF-024 | `GET /api/audit` | `audit.api.test.ts` |
| CU-022 | RF-025 | `GET /api/audit/verify-chain` | `audit.service.test.ts` |
| CU-023 | RF-021 | interno | `crypto.test.ts` |
| CU-024 | RNF-029 | interno | `tests/helpers/db.ts` |

---

**Documentos relacionados**

- [`requerimientos.md`](./requerimientos.md) — Documento maestro de RF y RNF
- [`historias_usuario.md`](./historias_usuario.md) — Épicas e historias US-###
- [`../../02_diseno_construccion/modelos_uml/comportamiento/diagrama_casos_uso.md`](../../06_diagramas_y_software/diagrama_casos_uso.md) — Representación gráfica de estos casos
