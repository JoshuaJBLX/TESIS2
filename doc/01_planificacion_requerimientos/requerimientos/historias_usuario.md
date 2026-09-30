# Historias de Usuario

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 1 — Planificación y Requerimientos
**Convenciones:**historias en formato *usuario → acción → beneficio*, con criterios
de aceptación derivados de los `REQ-###`.

---

## 0. Jerarquía de Épicas

```
EP-001  Gestión de Identidad y Acceso
  ├── US-001 … US-006
  │
EP-002  Gestión de Documentos y Versionado
  ├── US-007 … US-013
  │
EP-003  Compartir y Colaborar
  ├── US-014 … US-020
  │
EP-004  Verificación de Autenticidad
  ├── US-021 … US-025
  │
EP-005  Auditoría y Trazabilidad
  ├── US-026 … US-030
  │
EP-006  Calidad Operativa
  └── US-031 … US-033
```

  Épica   Nombre   Épicas   RF   Historias  
 ------- -------- -------- ---- ----------- 
  EP-001   Gestión de Identidad y Acceso   1   RF-001 … RF-004, RF-026   6  
  EP-002   Gestión de Documentos y Versionado   2   RF-005 … RF-010, RF-014   7  
  EP-003   Compartir y Colaborar   3   RF-011 … RF-013, RF-015 … RF-020   7  
  EP-004   Verificación de Autenticidad   4   RF-021 … RF-023   5  
  EP-005   Auditoría y Trazabilidad   5   RF-024, RF-025   5  
  EP-006   Calidad Operativa   6   RF-027, RNF-001 … RNF-044   3  

**Puntos de historia (escala Fibonacci):** 1, 2, 3, 5, 8, 13.
**Total estimado:** 187 puntos · Velocidad de referencia: 1 punto/día de trabajo efectivo.

---

## 1. EP-001 — Gestión de Identidad y Acceso

### US-001 — Registro de usuario

> **Como** persona que necesita gestionar documentos con garantía de autenticidad,
> **quiero** crear una cuenta y recibir automáticamente mis credenciales de firma,
> **para** poder firmar los documentos que subo desde el primer momento.

**Puntos:** 5 · **Épica:** EP-001 · **RF:** RF-001

**Criterios de aceptación**

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un usuario nuevo, cuando se registra con datos válidos, entonces recibe `userId`, `username`, `role = user` y el fingerprint de su clave pública.   `auth.service.test.ts`  
  2   Dado un registro sin `username`, `email`, `password` o `fullName`, cuando se envía, entonces responde HTTP 400.   `auth.api.test.ts`  
  3   Dado una contraseña de menos de 12 caracteres o sin mayúscula, minúscula, dígito o símbolo, cuando se envía, entonces responde HTTP 400 con el requisito incumplido.   `auth.service.test.ts`  
  4   Dado un `username` o `email` ya existente, cuando se envía, entonces responde HTTP 400 `El nombre de usuario o email ya está registrado`.   `auth.service.test.ts`  
  5   Dado un registro exitoso, entonces se generan las filas `users` y `user_keys`, y un evento `USER_REGISTERED` en la bitácora.   `audit.service.test.ts`  
  6   Dado cualquier registro, entonces la respuesta **nunca** incluye la clave privada ni su forma cifrada.   `auth.api.test.ts`  

---

### US-002 — Inicio de sesión

> **Como** usuario registrado, **quiero** iniciar sesión con mi nombre de usuario y
> contraseña, **para** acceder a mis documentos.

**Puntos:** 3 · **Épica:** EP-001 · **RF:** RF-002

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado credenciales válidas, cuando se iniciar sesión, entonces se reciben `accessToken`, `refreshToken` y el perfil del usuario.   `auth.api.test.ts`  
  2   Dado credenciales inválidas, cuando se inicia sesión, entonces responde HTTP 401 con el mensaje genérico `Credenciales inválidas`, sin revelar si el usuario existe.   `auth.service.test.ts`  
  3   Dado un login exitoso, entonces se registra `LOGIN_SUCCESS` en la bitácora.   `audit.service.test.ts`  
  4   Dado un login fallido, entonces se registra `LOGIN_FAILED` con la IP y sin la contraseña.   `auth.api.test.ts`  
  5   Dado un usuario con `is_active = 0`, entonces el login es rechazado.   `auth.service.test.ts`  

---

### US-003 — Renovación de sesión

> **Como** usuario con la sesión abierta, **quiero** que mi access token se renueve
> automáticamente, **para** no perder mi trabajo cada 15 minutos.

**Puntos:** 3 · **Épica:** EP-001 · **RF:** RF-003

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un refresh token válido, cuando se envía, entonces se recibe un access token nuevo.   `auth.api.test.ts`  
  2   Dado un refresh token expirado o con firma inválida, entonces responde HTTP 401.   `auth.api.test.ts`  
  3   Dado un refresh token de un usuario desactivado, entonces responde HTTP 401.   `auth.service.test.ts`  
  4   Dado un access token expirado en una llamada cliente, entonces el cliente reintenta **una sola vez** tras renovar.   `src/lib/api.ts` (`refreshPromise`)  

---

### US-004 — Bloqueo por intentos fallidos

> **Como** administrador de la seguridad, **quiero** que los intentos de acceso se
> limiten, **para** impedir ataques de fuerza bruta.

**Puntos:** 3 · **Épica:** EP-001 · **RF:** RF-002, RF-026

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dados 5 intentos fallidos para la misma IP + usuario en 15 minutos, cuando se intenta de nuevo, entonces responde HTTP 429 con `retryAfterSeconds`.   `rate-limit.test.ts`  
  2   Dado un login exitoso, entonces el contador de fallos se reinicia.   `rate-limit.test.ts`  
  3   Dado más de 20 logins desde una IP en 15 minutos, entonces responde HTTP 429.   `rate-limit.test.ts`  
  4   Dado más de 10 registros desde una IP en 1 hora, entonces responde HTTP 429.   `rate-limit.test.ts`  

---

### US-005 — Consulta de identidad

> **Como** cliente de la aplicación, **quiero** conocer quién está autenticado,
> **para** mostrar su nombre y ocultar las acciones no permitidas.

**Puntos:** 1 · **Épica:** EP-001 · **RF:** RF-004

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un access token válido, cuando se consulta `/api/auth/me`, entonces devuelve `id`, `username` y `role`.   `auth.api.test.ts`  
  2   Dado un token ausente o inválido, entonces responde HTTP 401.   `auth-middleware.test.ts`  

---

### US-006 — Restricción por rol

> **Como** administrador, **quiero** que solo mi rol acceda a la bitácora,
> **para** que los usuarios normales no puedan auditar el sistema.

**Puntos:** 2 · **Épica:** EP-001 · **RF:** RF-024

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un token de rol `user`, cuando se solicita `/api/audit`, entonces responde HTTP 403 `Se requieren permisos de administrador`.   `audit.api.test.ts`  
  2   Dado un token de rol `admin`, cuando se solicita `/api/audit`, entonces responde HTTP 200.   `audit.api.test.ts`  

---

## 2. EP-002 — Gestión de Documentos y Versionado

### US-007 — Subida de documento con firma

> **Como** titular de un documento, **quiero** subir un archivo y firmarlo con mi
> clave, **para** que quede sellado criptográficamente desde el momento en que lo
> registro.

**Puntos:** 8 · **Épica:** EP-002 · **RF:** RF-006

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un PDF de 2 MB, título y contraseña correctos, cuando se sube, entonces responde HTTP 201 con `documentId`, `versionId`, `versionNumber = 1`, `contentHash`, `verificationUrl` y `qrCode`.   `documents.api.test.ts`  
  2   Dado un archivo `.exe` o `.zip`, cuando se sube, entonces responde HTTP 400 `Tipo de archivo no permitido o archivo vacío`.   `documents.api.test.ts`  
  3   Dado un archivo mayor a 10 MB, cuando se sube, entonces responde HTTP 413.   Validación de `multer`  
  4   Sin `title` o sin `password`, entonces responde HTTP 400.   `documents.api.test.ts`  
  5   Dado una contraseña incorrecta, cuando se sube, entonces la operación falla y **no** se crea ninguna fila en `documents` ni en `document_versions`.   `document.service.test.ts`  
  6   Dado un archivo vacío (`size = 0`), entonces responde HTTP 400.   `documents.api.test.ts`  
  7   Entonces el evento `DOCUMENT_UPLOAD` se registra con título, versión y hash.   `audit.service.test.ts`  

---

### US-008 — Versionado de documentos

> **Como** titular de un documento, **quiero** subir una versión corregida sin
> perder la anterior, **para** conservar el historial completo de la evolución.

**Puntos:** 5 · **Épica:** EP-002 · **RF:** RF-007

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento propio, cuando se sube una versión 2, entonces `versionNumber = 2` y la versión 1 sigue existiendo con su hash original.   `document.service.test.ts`  
  2   Dado un documento ajeno, cuando se intenta actualizar, entonces responde HTTP 400 `No tienes permisos para modificar este documento`.   `document.service.test.ts`  
  3   Entonces `documents.updated_at` se actualiza y se registra `DOCUMENT_UPDATE`.   `audit.service.test.ts`  
  4   La `changeDescription` se persiste y es visible en el historial.   `documents.api.test.ts`  
  5   Cada versión tiene su propia firma y su propio hash.   `crypto.test.ts`  

---

### US-009 — Consulta de detalle e historial

> **Como** titular de un documento, **quiero** ver su ficha y el historial de
> versiones, **para** saber qué versión está vigente y quién la firmó.

**Puntos:** 3 · **Épica:** EP-002 · **RF:** RF-008, RF-009

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento propio, cuando se consulta el detalle, entonces incluye `latestVersion` con `content_hash`, firmante y coautor.   `documents.api.test.ts`  
  2   Dado un documento ajeno o privado, cuando se consulta, entonces responde HTTP 404, sin revelar su existencia.   `documents.api.test.ts`  
  3   Dado un documento con 3 versiones, cuando se consulta el historial, entonces se devuelven 3 ítems ordenados de la más reciente a la más antigua.   `scenarios.test.ts` (escenario 1)  

---

### US-010 — Código QR de verificación

> **Como** titular de un documento, **quiero** obtener un código QR, **para**
> adjuntarlo a las copias impresas o a los correos que distribuyo.

**Puntos:** 2 · **Épica:** EP-002 · **RF:** RF-010

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento propio, cuando se solicita el QR, entonces se recibe un Data URL de imagen y la `verificationUrl` correspondiente.   `documents.api.test.ts`  
  2   El QR codifica exactamente `{protocolo}://{host}/api/verify/{documentId}`.   `documents.api.test.ts`  

---

### US-011 — Descarga de archivos

> **Como** destinatario autorizado, **quiero** descargar el archivo de una versión,
> **para** leerlo sin depender de la aplicación.

**Puntos:** 5 · **Épica:** EP-002 · **RF:** RF-014

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento propio y un `versionId` válido, cuando se descarga, entonces responde el archivo con su `Content-Type` y `Content-Disposition` correctos.   `documents.api.test.ts`  
  2   Sin `versionId`, entonces se descarga la última versión.   `documents.api.test.ts`  
  3   Dado un documento privado de un tercero, cuando se intenta descargar sin token, entonces responde HTTP 403.   `documents.api.test.ts`  
  4   Dado un `versionId` de otro documento, entonces responde HTTP 404 `Versión no encontrada`.   `document.service.test.ts`  
  5   La descarga se realiza por streaming, sin cargar el archivo completo en memoria.   Inspección de `streamFile`  

---

### US-012 — Confirmación de que la descarga es legítima

> **Como** titular de un documento privado, **quiero** que la descarga exija mi
> token sin exponerlo en la URL, **para** que el enlace no pueda ser reutilizado.

**Puntos:** 3 · **Épica:** EP-002 · **RF:** RF-014, RNF-022

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   El token viaja en la cabecera `Authorization`, nunca como parámetro de consulta.   `src/lib/api.ts` (`downloadFileWithAuth`)  
  2   Ante un 401 durante la descarga, el cliente renueva el token y reintenta **una vez**.   `src/lib/api.ts`  
  3   El objeto descargable se libera con `URL.revokeObjectURL` para no filtrar memoria.   `src/lib/api.ts`  

---

### US-013 — Conocimiento de los límites del sistema

> **Como** titular de un documento, **quiero** saber de antemano qué formatos y
> tamaños admite el sistema, **para** no fallar al subir.

**Puntos:** 1 · **Épica:** EP-002 · **RF:** RF-006

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   El formulario de subida indica los formatos admitidos y el límite de 10 MB antes de enviar.   `documents/+page.svelte`  
  2   El cliente rechaza localmente un archivo no admitido, sin consumir ancho de banda.   `documents/+page.svelte`  

---

## 3. EP-003 — Compartir y Colaborar

### US-014 — Compartir un documento

> **Como** titular de un documento, **quiero** volverlo público, **para** que
> cualquier persona pueda leerlo y los colaboradores puedan proponer cambios.

**Puntos:** 3 · **Épica:** EP-003 · **RF:** RF-011

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento propio, cuando se comparte, entonces `is_public = 1`.   `document.service.test.ts`  
  2   Dado un documento ajeno, cuando se intenta compartir, entonces responde HTTP 400.   `documents.api.test.ts`  
  3   Entonces se registra `DOCUMENT_VISIBILITY_CHANGED`.   `audit.service.test.ts`  
  4   El documento aparece en el perfil público del usuario.   `documents.api.test.ts`  

---

### US-015 — Consulta pública sin cuenta

> **Como** receptor de un documento, **quiero** consultar su contenido sin crear
> una cuenta, **para** evitar fricción al revisar lo que me enviaron.

**Puntos:** 3 · **Épica:** EP-003 · **RF:** RF-012, RF-013

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento público, cuando se consulta `/api/docs/:id/public` sin token, entonces responde HTTP 200 con el documento y sus versiones.   `documents.api.test.ts`  
  2   Dado un documento privado o inexistente, entonces responde HTTP 404 con el mismo mensaje en ambos casos.   `documents.api.test.ts`  
  3   Dado un perfil público, entonces no expone `email` ni `password_hash` de ningún usuario.   `documents.api.test.ts`  

---

### US-016 — Crear una propuesta de cambio

> **Como** colaborador externo, **quiero** proponer una modificación firmada de un
> documento público, **para** aportar correcciones sin alterar el documento
> original.

**Puntos:** 8 · **Épica:** EP-003 · **RF:** RF-015

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un documento público y un usuario distinto del propietario, cuando se envía un archivo con descripción y contraseña, entonces responde HTTP 201 con `proposalId` y `contentHash`.   `documents.api.test.ts`  
  2   Dado un documento privado, entonces responde HTTP 400 `El documento no esta compartido para recibir propuestas`.   `documents.api.test.ts`  
  3   Dado el propietario del documento, entonces debe usar la actualización directa; la propuesta propia se rechaza.   `document.service.test.ts`  
  4   Sin `changeDescription`, o con una cadena vacía, entonces responde HTTP 400.   `document.service.test.ts`  
  5   La propuesta se firma con la clave del proponente, de modo que su autoría queda probada aunque sea rechazada.   `crypto.test.ts`  
  6   Entonces se registra `DOCUMENT_PROPOSAL_CREATED` con `proposalId` y `baseVersionId`.   `audit.service.test.ts`  

---

### US-017 — Revisar la bandeja de propuestas

> **Como** titular de un documento, **quiero** ver las propuestas pendientes
> primero y con los datos de la versión base, **para** decidir con informed
> rapidez.

**Puntos:** 3 · **Épica:** EP-003 · **RF:** RF-016

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   El orden es `pending` → `accepted` → `rejected`, y dentro de cada grupo por fecha descendente.   `documents.api.test.ts`  
  2   Cada propuesta incluye `base_version_number`, `base_file_name` y `base_content_hash`.   `documents.api.test.ts`  
  3   Solo el propietario obtiene propuestas; un tercero obtiene una lista vacía.   `document.service.test.ts`  

---

### US-018 — Aceptar una propuesta

> **Como** titular de un documento, **quiero** aceptar una propuesta y firmarla,
> **para** que el cambio quede respaldado por mi firma y por la autoría del
> colaborador.

**Puntos:** 8 · **Épica:** EP-003 · **RF:** RF-017

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado una propuesta `pending` y la contraseña correcta del propietario, cuando se acepta, entonces se crea una versión nueva firmada por el propietario.   `document.service.test.ts`  
  2   La nueva versión registra `coauthor_id = proponente` y `source_proposal_id = propuesta`.   `scenarios.test.ts` (escenario 2)  
  3   La propuesta pasa a `accepted` con `reviewed_by`, `reviewed_at` y `accepted_version_id`.   `documents.api.test.ts`  
  4   Sin `password`, entonces responde HTTP 400.   `documents.api.test.ts`  
  5   Dado un documento ajeno, entonces responde HTTP 400.   `document.service.test.ts`  
  6   Dada una propuesta ya procesada, entonces responde HTTP 400 `La propuesta ya fue procesada`.   `document.service.test.ts`  
  7   La respuesta incluye `coauthorUsername`.   `scenarios.test.ts`  

---

### US-019 — Rechazar una propuesta

> **Como** titular de un documento, **quiero** rechazar una propuesta, **para**
> dejar constancia de que la evalué y no la acepté.

**Puntos:** 3 · **Épica:** EP-003 · **RF:** RF-018

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   La propuesta pasa a `rejected` con `reviewed_by` y `reviewed_at`.   `document.service.test.ts`  
  2   El archivo y la firma del proponente se conservan como evidencia.   `document.service.test.ts`  
  3   Entonces se registra `DOCUMENT_PROPOSAL_REJECTED`.   `audit.service.test.ts`  

---

### US-020 — Comparar versiones antes de decidir

> **Como** titular o verificador, **quiero** ver las diferencias exactas entre dos
> versiones o propuestas, **para** detectar cláusulas alteradas.

**Puntos:** 8 · **Épica:** EP-003 · **RF:** RF-020

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dados dos artefactos de texto, cuando se comparan, entonces el diff muestra líneas `insert`, `delete` y `equal`.   `document-analysis.test.ts`  
  2   La respuesta incluye los contadores `additions`, `deletions` y `unchanged`.   `documents.api.test.ts`  
  3   La respuesta incluye diferencias de metadatos (nombre, MIME, tamaño, hash, origen).   `document-analysis.test.ts`  
  4   Si falta cualquiera de los cuatro parámetros, entonces responde HTTP 400.   `documents.api.test.ts`  
  5   Si el documento es privado y el solicitante no es el propietario, entonces se rechaza.   `document.service.test.ts`  
  6   Si no se puede extraer texto, entonces `supported = false` y se informa que solo hay comparación de metadatos.   `document-analysis.test.ts`  
  7   Comparar un artefacto inexistente responde con error descriptive.   `document.service.test.ts`  

---

## 4. EP-004 — Verificación de Autenticidad

### US-021 — Verificar un documento recibido

> **Como** receptor de un documento, **quiero** subir el archivo que me llegó para
> comprobar si es auténtico, **para** no firmar ni archivar algo que fue alterado.

**Puntos:** 8 · **Épica:** EP-004 · **RF:** RF-021

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un archivo idéntico a la versión registrada, cuando se verifica, entonces responde `status: 'VALID'` con `hashMatch = true` y `signatureValid = true`.   `verify.api.test.ts`  
  2   Dado un archivo con un solo byte alterado, entonces responde `status: 'MANIPULATED'`.   `verify.api.test.ts`  
  3   Entonces el mensaje es comprensible: `El documento ha sido manipulado (hash no coincide)`.   `verify.api.test.ts`  
  4   Dado un `documentId` inexistente, entonces responde `status: 'NOT_FOUND'`.   `verify.api.test.ts`  
  5   La respuesta indica `signedBy` y `signedAt` del firmante.   `verify.api.test.ts`  
  6   La verificación **no requiere** cuenta.   `verify.api.test.ts`  

---

### US-022 — Detectar documentos falsos

> **Como** receptor desconfiado, **quiero** saber si un archivo que me deliveries
> proviene o no de este repositorio, **para** detectar falsificaciones completas.

**Puntos:** 5 · **Épica:** EP-004 · **RF:** RF-022

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un archivo cuyo hash coincide con alguna versión, cuando se verifica sin `documentId`, entonces responde `status: 'FOUND'` con el documento, título, versión y fecha.   `verify.api.test.ts`  
  2   Dado un archivo cuyo hash no existe en el repositorio, entonces responde `status: 'NOT_FOUND'` con `matches: []`.   `verify.api.test.ts`  
  3   Si hay varias coincidencias, se devuelve la más reciente por `upload_date`.   `verify.api.test.ts`  

---

### US-023 — Escanear el código QR

> **Como** receptor de un documento impreso, **quiero** escanear el QR y ver los
> datos de verificación en el teléfono, **para** comprobar la autenticidad sin
> tener el archivo digital.

**Puntos:** 3 · **Épica:** EP-004 · **RF:** RF-023

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado un `documentId` existente, cuando se consulta `/api/verify/:id`, entonces devuelve título, versión vigente, `lastModified` y firmante.   `verify.api.test.ts`  
  2   Dado un `documentId` inexistente, entonces responde HTTP 404.   `verify.api.test.ts`  
  3   Si la última versión no tiene firma, `signedBy` reporta `Unknown` en lugar de fallar.   Inspección de `routes/verify.ts`  

---

### US-024 — Mensajes de verificación comprensibles

> **Como** receptor sin conocimientos técnicos, **quiero** entender el resultado
> de la verificación sin jerga criptográfica, **para** confiar o desconfiar con
> fundamento.

**Puntos:** 2 · **Épica:** EP-004 · **RF:** RF-020, RNF-020

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Los cinco estados posibles tienen un mensaje en español y un indicador visual distinto.   `verify/+page.svelte`  
  2   Cuando el documento está manipulado, la interfaz explica qué significa y qué hacer.   `verify/+page.svelte`  

---

### US-025 — Verificar en cualquier formato

> **Como** receptor, **quiero** verificar también documentos en DOCX o PDF, **para**
> no depender del formato con el que el autor lo exportó.

**Puntos:** 5 · **Épica:** EP-004 · **RF:** RF-020

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Un `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.yaml`, `.yml` o `.log` se extrae en modo nativo.   `document-analysis.test.ts`  
  2   Un `.pdf` se extrae con `pdfplumber`, con respaldo automático a `PyPDF2`.   `document-analysis.test.ts`  
  3   Un `.docx` se extrae descomprimiendo `word/document.xml` y leyendo los nodos `<w:t>`.   `document-analysis.test.ts`  
  4   Un formato no soportado degrada a comparación de solo metadatos, sin error.   `document-analysis.test.ts`  

---

## 5. EP-005 — Auditoría y Trazabilidad

### US-026 — Consultar la bitácora

> **Como** administrador, **quiero** consultar todos los eventos del sistema con
> filtros, **para** investigar un incidente.

**Puntos:** 3 · **Épica:** EP-005 · **RF:** RF-024

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Entonces se devuelven los eventos ordenados del más reciente al más antiguo, con `previous_hash` y `current_hash`.   `audit.service.test.ts`  
  2   Los filtros `eventType`, `entityType`, `from` y `to` se aplican correctamente.   `audit.service.test.ts`  
  3   `limit` se acota al rango [1, 200]; un valor no numérico cae a 50 sin fallar.   `audit.api.test.ts`  
  4   La respuesta incluye `pagination.total` y el objeto `filters` aplicado.   `audit.api.test.ts`  

---

### US-027 — Verificar la integridad de la cadena

> **Como** administrador, **quiero** comprobar que la bitácora no fue alterada,
> **para** confiar en la trazabilidad que ofrece el sistema.

**Puntos:** 5 · **Épica:** EP-005 · **RF:** RF-025

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Dado una bitácora íntegra, cuando se verifica, entonces responde HTTP 200 con `valid: true` y el total de entradas.   `audit.service.test.ts`  
  2   Dada una entrada con `current_hash` alterado, entonces responde HTTP 409 con `brokenAt` igual al identificador de esa entrada.   `audit.service.test.ts`  
  3   Dada una entrada con `previous_hash` alterado, entonces responde HTTP 409 con el motivo `previous_hash no coincide`.   `audit.service.test.ts`  
  4   Entonces se informa el número de entradas revisadas.   `audit.api.test.ts`  

---

### US-028 — Inmutabilidad de la bitácora

> **Como** administrador responsable de la auditoría, **quiero** que la bitácora no
> pueda modificarse ni borrarse, **para** que su valor probatorio se mantenga.

**Puntos:** 3 · **Épica:** EP-005 · **RF:** RF-024, RNF-013

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Un `UPDATE` sobre `audit_log` falla con el mensaje `audit_log is append-only`.   `migrate.ts` (trigger)  
  2   Un `DELETE` sobre `audit_log` falla con el mismo mensaje.   `migrate.ts` (trigger)  
  3   Ninguna ruta de la aplicación expone operaciones de modificación o borrado de la bitácora.   `routes/audit.ts`  

---

### US-029 — Registro de eventos de seguridad

> **Como** administrador, **quiero** registro de cada inicio de sesión fallido con su
> IP, **para** detectar ataques de credenciales.

**Puntos:** 3 · **Épica:** EP-005 · **RF:** RF-002

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   Cada intento fallido genera un evento `LOGIN_FAILED` con `username` e `ip`.   `auth.api.test.ts`  
  2   La contraseña nunca aparece en `event_data`.   `audit.service.test.ts`  
  3   El evento se genera aunque la IP no pueda determinarse; en ese caso se registra `unknown`.   `routes/auth.ts`  

---

### US-030 — Trazabilidad de la autoría conjunta

> **Como** titular de un documento, **quiero** que se registre quién propuso cada
> cambio, **para** reconocer el trabajo de los colaboradores.

**Puntos:** 3 · **Épica:** EP-005 · **RF:** RF-017

  #   Criterio   Verificable con  
 --- ---------- ----------------- 
  1   La versión creada por aceptación expone `coauthor_username`.   `documents.api.test.ts`  
  2   La versión creada por actualización directa expone `coauthor_username = null`.   `document.service.test.ts`  
  3   La versión conserva `source_proposal_id` como vínculo con la propuesta de origen.   `document.service.test.ts`  

---

## 6. EP-006 — Calidad Operativa

### US-031 — Respuesta rápida

> **Como** usuario del sistema, **quiero** que las operaciones respondan con
> rapidez, **para** no perder tiempo esperando.

**Puntos:** 5 · **Épica:** EP-006 · **RF:** RNF-001 … RNF-005

  #   Criterio   Objetivo   Verificación  
 --- ---------- ---------- -------------- 
  1   Firma de un documento de ≤ 10 MB   p95 < 3 000 ms   `validacion_experimental.md`  
  2   Listado de 500 documentos   p95 < 500 ms   `validacion_experimental.md`  
  3   Verificación de un documento   p95 < 2 000 ms   `validacion_experimental.md`  
  4   Registro con generación RSA-2048   p95 < 5 000 ms   `validacion_experimental.md`  
  5   La descarga mantiene memoria constante   `createReadStream`   Inspección de código  

---

### US-032 — Portabilidad entre entornos

> **Como** evaluador, **quiero** ejecutar el sistema localmente y también desplegarlo
> en la nube sin cambios de código, **para** que la evaluación y la demostración
> sean viables en cualquier contexto.

**Puntos:** 5 · **Épica:** EP-006 · **RF:** RNF-031 … RNF-035

  #   Criterio   Verificación  
 --- ---------- -------------- 
  1   El sistema opera en Windows, Linux y macOS sin cambios.   `despliegue_local.md`  
  2   El sistema opera íntegramente en local, sin servicios externos.   `despliegue_local.md`  
  3   La URL del backend se configura por variable de entorno, sin recompilar.   `frontend/.env.example`  
  4   El esquema es portable a PostgreSQL sin reescribir las tablas.   `schema_postgresql.sql`  
  5   Existe un procedimiento documentado para desplegar en Vercel y Supabase.   `plan_nube_vercel_supabase.md`  

---

### US-033 — Comprobación del estado del servicio

> **Como** responsable del despliegue, **quiero** consultar el estado del servicio
> mediante un endpoint, **para** automatizar la supervisión.

**Puntos:** 1 · **Épica:** EP-006 · **RF:** RF-027

  #   Criterio   Verificación  
 --- ---------- -------------- 
  1   `GET /api/health` responde 200 con `{ status, timestamp }` sin autenticación.   `despliegue_local.md`  
  2   La marca de tiempo está en formato ISO-8601.   Inspección de `app.ts`  

---

## 7. Métricas de la Iteración

  Métrica   Valor  
 --------- ------- 
  Historias de usuario   33  
  Épicas   6  
  Puntos de historia   187  
  Historias completadas   33 (100 %)  
  Puntos completados   187 (100 %)  
  Pruebas automatizadas   120 (98 backend + 22 frontend)  
  Suites de prueba   14 (12 backend + 2 frontend)  
  Cobertura funcional   29 de 29 funcionalidades ✔  
  Defectos abiertos   0  
  Defectos cerrados   3 (ver `evaluacion.md`)  

---

**Documentos relacionados**

- [`requerimientos.md`](./requerimientos.md) — RF y RNF de origen
- [`funcionalidades.md`](./funcionalidades.md) — Catálogo FUNC-###
- [`casos_uso.md`](./casos_uso.md) — Casos de uso derivados de estas historias
