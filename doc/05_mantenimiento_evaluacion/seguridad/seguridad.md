# Seguridad del Sistema — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0 · **Ámbito:** Backend Node.js + Express 4.21.2 + TypeScript; frontend SvelteKit 2.63 / Svelte 5.56

> Documento elaborado a partir de la verificación directa del código fuente. Describe la seguridad tal como fue implementada; no es una auditoría externa ni una certificación.

## 0. Tabla de Contenido

1. Alcance y marco normativo · 2. Control de acceso · 3. Política de contraseñas · 4. Criptografía y protección de claves · 5. OWASP Top 10 (2021) · 6. Validación de entrada · 7. Sesiones y limitador de tasa · 8. Cabeceras de seguridad y CORS · 9. Bitácora e integridad de registros · 10. Variables de entorno y secretos · 11. Riesgos abiertos y vulnerabilidades conocidas · 12. Respuesta a incidentes · 13. Limitación legal · 14. Referencias cruzadas

## 1. Alcance y marco normativo

El SGD-FD administra documentos con tres propiedades críticas: confidencialidad, integridad y trazabilidad. La integridad es la propiedad central, porque el valor del sistema reside en poder demostrar que un documento no ha sido alterado desde su firma.

| Norma o referencia | Relación con el SGD-FD | Aplicación |
|--------------------|------------------------|------------|
| ISO/IEC 27001:2022 | Estándar de seguridad de la información | Autoevaluación por dominios; véase [aplicación ISO 27000](../iso_aplicada/aplicacion_iso_27000.md) |
| OWASP Top 10 (2021) | Catálogo de riesgos de aplicación web | Sección 5 |
| ISO/IEC 29119 | Estándar de pruebas de software | Verificación de firma y de la cadena de auditoría |
| Ley N.° 27269 (Perú) | Ley de Firmas y Certificaciones Digitales | **No cumplida**: el SGD-FD no emite firma certificada. Véase sección 13 |

### 1.1. Superficie de ataque

Cinco routers están montados bajo el prefijo `/api`. Dos rutas merecen atención especial porque atraviesan el límite de propiedad del recurso: `GET /api/docs/:id/public` y `GET /api/docs/:id/file`.

| Prefijo | Entidad | Autenticación | Autorización |
|---------|---------|---------------|--------------|
| `/api/auth` | Sesión de usuario | Parcial: registro y login públicos; `refresh` y `me` exigen token | Usuario sobre su propia sesión |
| `/api/docs` | Documento, versión, propuesta, QR | Obligatoria | Por propietario del documento y rol |
| `/api/verify` | Verificación de integridad | Obligatoria en `POST /`; consulta pública por hash | Solo lectura de resultado |
| `/api/audit` | Bitácora | Obligatoria | Restringida al rol `admin` |
| `/api/users` | Perfil público | Obligatoria | Solo lectura de campos no sensibles |

## 2. Control de acceso

### 2.1. Autenticación

La autenticación se apoya exclusivamente en tokens JWT emitidos y verificados con `jsonwebtoken`. La separación entre token de acceso y token de refresco reduce la ventana de exposición: el de acceso tiene vida corta y el de refresco se presenta únicamente al endpoint que lo renueva. El uso de tokens sin estado evita almacenar sesiones en el servidor, lo que es coherente con la persistencia en memoria de `sql.js`.

| Operación | Ruta | Token exigido | Resultado |
|-----------|------|---------------|-----------|
| Registro | `POST /api/auth/register` | Ninguno | Crea usuario, genera par RSA-2048 y cifra la clave privada con AES-256-GCM |
| Inicio de sesión | `POST /api/auth/login` | Ninguno | Verifica `bcryptjs`, emite token de acceso y de refresco |
| Refresco | `POST /api/auth/refresh` | Token de refresco | Emite un nuevo token de acceso sin pedir contraseña |
| Identidad | `GET /api/auth/me` | Token de acceso | Devuelve el perfil del titular del token |

### 2.2. Autorización por propietario

Regla central: **un usuario solo accede a los documentos que posee o sobre los que tiene una propuesta en curso**. La comprobación se aplica antes de servir el contenido.

| Recurso | Condición de acceso | Operador no propietario |
|---------|---------------------|-------------------------|
| `GET /api/docs/:id`, `PUT /api/docs/:id` | El `user_id` del documento coincide con el titular | Error de autorización |
| `GET /api/docs/:id/file`, `GET /api/docs/:id/versions` | Propiedad del documento | Error de autorización |
| `PATCH /api/docs/:id/visibility` | Propiedad del documento | Error de autorización |
| `GET /api/docs/:id/qr` | Documento visible o propietario | Restringido según visibilidad |
| `POST /api/docs/:id/proposals` | Documento visible para el solicitante | Error de autorización |
| `POST /api/docs/:id/proposals/:proposalId/accept` | Propietario del documento | Error de autorización |
| `GET /api/audit`, `GET /api/audit/verify-chain` | Rol `admin` | Error de autorización |

El modelo es deliberadamente simple: existe una única relación de propiedad (`user_id`) y no hay grupos, permisos heredados ni listas de control de acceso granulares por documento. Esta simplicidad reduce la superficie de error, pero limita la expresión de políticas complejas.

### 2.3. Roles

| Rol | Descripción | Capacidades distintivas |
|-----|-------------|--------------------------|
| `user` | Usuario operativo por defecto | Crear documentos, firmar con su clave privada, proponer cambios y aceptar propuestas sobre documentos propios |
| `admin` | Administrador del sistema | Lo anterior, más lectura íntegra de la bitácora y verificación de la cadena de hash |

El rol `admin` **no** otorga acceso directo a los documentos de terceros ni a las claves privadas de los usuarios. La separación entre administración del sistema y propiedad del contenido reduce el impacto del peor caso: un administrador comprometido no puede leer documentos ajenos.

### 2.4. Flujo de propuesta y aceptación

La modificación de un documento ajeno no se realiza por escritura directa, sino por un flujo que preserva la auditoría del autor original.

| Paso | Ruta | Actor | Efecto |
|------|------|-------|--------|
| 1 | `POST /api/docs/:id/proposals` | Usuario con acceso | Crea propuesta con archivo y firma del proponente |
| 2 | `GET /api/docs/:id/proposals` | Propietario | Lista las propuestas recibidas |
| 3 | `POST /api/docs/:id/proposals/:proposalId/accept` | Propietario | Crea nueva versión firmada con su clave; registra `DOCUMENT_PROPOSAL_ACCEPTED` |
| 4 | `POST /api/docs/:id/proposals/:proposalId/reject` | Propietario | Rechaza la propuesta; registra `DOCUMENT_PROPOSAL_REJECTED` |

## 3. Política de contraseñas

### 3.1. Reglas de composición y almacenamiento

| Regla | Valor | Justificación |
|-------|-------|---------------|
| Longitud mínima | 12 caracteres | Supera el mínimo de 8 de la práctica general; resiste mejor la fuerza bruta |
| Mayúsculas y minúsculas | Al menos una de cada | Amplía el espacio de contraseñas efectivas |
| Dígitos | Al menos uno | Añade clases de caracteres al conjunto |
| Caracteres especiales | Al menos uno de `@$!%*?&` | Eleva la entropía y reduce el éxito de diccionarios |
| Algoritmo de hash | `bcryptjs` con factor de coste 12 | Introduce un retardo deliberado que degrada la fuerza bruta; salt de 12 bytes, único por usuario e incluido en el hash almacenado |
| Almacenamiento | Hash con sal, nunca la contraseña en claro | La contraseña nunca se almacena de forma reversible |

La elección de `bcryptjs` sobre `bcrypt` nativo responde a una restricción concreta del entorno: no se requiere cadena de compilación nativa para instalar el servidor, lo que simplifica la instalación automatizada. La contrapartida es un menor rendimiento por hash, que se acepta conscientemente.

## 4. Criptografía y protección de claves

Todas las operaciones criptográficas se ejecutan exclusivamente con el módulo integrado `node:crypto`. **No se utiliza ninguna biblioteca criptográfica de terceros.** La decisión reduce la superficie de suministro: no hay dependencias externas que puedan introducir una implementación defectuosa o una puerta trasera.

### 4.1. Inventario de algoritmos

| Uso | Algoritmo | Parámetros | Módulo |
|-----|-----------|------------|--------|
| Par de claves del usuario | RSA | 2048 bits | `node:crypto` |
| Firma digital | RSA sobre SHA-256 | 2048 bits, resumen de 256 bits | `node:crypto` |
| Huella de la clave pública | SHA-256 | — | `node:crypto` |
| Huella de contenido de archivo | SHA-256 | — | `node:crypto` |
| Cifrado de la clave privada | AES-256-GCM | Clave de 256 bits, IV de 12 bytes, `authTag` | `node:crypto` |
| Derivación de la clave maestra | PBKDF2-HMAC-SHA512 | 100 000 iteraciones, salt de 16 bytes | `node:crypto` |
| Contraseña de usuario | `bcryptjs` | Factor de coste 12 | `bcryptjs` |
| Tokens de sesión | JWT | Firmado con secreto del entorno | `jsonwebtoken` |
| Encadenado de la bitácora | SHA-256 | — | `node:crypto` |

### 4.2. Esquema de protección de la clave privada

La clave privada RSA nunca se almacena en claro ni se transmite. Al registrarse, `node:crypto` genera el par RSA-2048 y se toma la contraseña del usuario. La **clave maestra** se deriva de esa contraseña con PBKDF2-HMAC-SHA512, 100 000 iteraciones y un salt aleatorio de 16 bytes propio de ese usuario. La clave privada se cifra con AES-256-GCM usando la clave maestra derivada, un IV aleatorio de 12 bytes y un `authTag` de autenticación. El material cifrado se persiste como un objeto JSON de la forma `{ encryptedData, iv, authTag, salt }`. Al firmar, el proceso inverso descifra la clave privada con la contraseña del titular y la utiliza en memoria.

AES-256-GCM aporta autenticación además de confidencialidad: el `authTag` detecta cualquier alteración del texto cifrado, de modo que un atacante que corrompa el almacén no obtiene una clave privada corrupta en silencio, sino un fallo explícito al descifrar.

### 4.3. Consecuencia de diseño

La derivación de la clave maestra a partir de la **contraseña del usuario** implica que perder la contraseña equivale a perder la capacidad de firmar. El sistema trata la contraseña como factor de acceso, no como factor de recuperación de firmas. Las consecuencias operativas se analizan en la sección 11.

## 5. Protección frente a OWASP Top 10 (2021)

| # | Amenaza | Control implementado en el SGD-FD | Estado |
|---|---------|-----------------------------------|:------:|
| A01 | Control de acceso inseguro | Verificación de propiedad en cada ruta de documento; separación de roles `user` y `admin`; auditoría restringida a `admin` | Parcial |
| A02 | Fallos criptográficos | RSA-2048, SHA-256, AES-256-GCM, PBKDF2 con 100 000 iteraciones; sin algoritmos propios; sin transmisión de claves privadas | Parcial |
| A03 | Inyección | El acceso a datos está encapsulado en `DbDriver`; los servicios aplican validación de entrada antes de operar | Parcial |
| A04 | Configuración insegura | `helmet` activa cabeceras defensivas; los secretos se externalizan y se cargan con `dotenv` | Parcial |
| A05 | Falsificación de solicitud en sitios cruzados | Los tokens viajan en cabecera `Authorization`, no en cookies; el navegador no adjunta credenciales automáticamente | Parcial |
| A06 | Cross-site scripting | Svelte 5 escapa las plantillas por defecto; el backend devuelve datos estructurados en JSON, no HTML | Parcial |
| A07 | Falsificación de identidad | Firmas verificables criptográficamente en `POST /api/verify`; huellas de clave pública con SHA-256 | Parcial |
| A08 | Fallos de integridad de datos y software | No se deserializan archivos estructurados como objetos confiables; las actualizaciones de dependencias son manuales | Pendiente |
| A09 | Registro y monitorización insuficientes | Bitácora encadenada con 9 tipos de evento, incluidos `LOGIN_SUCCESS` y `LOGIN_FAILED` | Implementado |
| A10 | Falsificación de petición en el lado del servidor | El backend no realiza peticiones HTTP salientes con entrada de usuario; no existe funcionalidad de URL arbitraria | No aplica |

> La numeración sigue la edición 2021: el séptimo lugar es *Falsificación de identidad* y el octavo *Fallos de integridad de datos y software*, denominaciones que en la edición 2017 correspondían a otros puestos.

| Amenaza | Observación analítica |
|---------|----------------------|
| A01 | Mayor exposición potencial: la lógica de autorización se distribuye entre routers y servicios. El defecto de la sección 11.1 es precisamente un fallo de este control. |
| A02 | El uso exclusivo de `node:crypto` garantiza algoritmos correctos por construcción. La debilidad no está en la implementación, sino en la ausencia de autoridad certificadora y de sello de tiempo (sección 13). |
| A05 | Al no usar cookies de sesión, la autenticación por cabecera reduce sustancialmente la explotabilidad de CSRF. Si la interfaz adoptara autenticación por cookie, sería necesario añadir un token anti-CSRF. |
| A09 | Única categoría implementada por completo. La bitácora registra accesos correctos y fallidos, lo que permite detectar ataques de fuerza bruta en lugar de inferirlos. |

## 6. Validación de entrada

### 6.1. Superficie de validación

| Punto de entrada | Validación aplicada | Resultado ante entrada inválida |
|------------------|--------------------|----------------------------------|
| `POST /api/auth/register` | Política de contraseña de la sección 3; unicidad de nombre de usuario | Mensaje de validación; no se crea el usuario |
| `POST /api/auth/login` | Presencia de credenciales; comparación de hash con `bcryptjs` | Credenciales inválidas, sin revelar qué campo falló |
| `POST /api/docs` | Metadatos del documento y archivo multipart mediante `multer` | Rechazo de la carga |
| `POST /api/docs/:id/proposals` | Archivo de la propuesta | Rechazo de la carga |
| `POST /api/verify` | Formato de la huella hexadecimal esperada | Documento no localizado |
| `GET /api/users/:username` | Identificador de usuario | Perfil no encontrado |

### 6.2. Encapsulamiento del acceso a datos

El acceso a la base de datos está encapsulado en el componente `DbDriver`, que centraliza la ejecución de sentencias sobre `sql.js`. Concentrar las decisiones de acceso a datos en un único punto auditable reduce la probabilidad de consultas mal formadas dispersas por la lógica de negocio.

Sin embargo, **no puede afirmarse que todas las consultas estén parametrizadas**. El motor `sql.js` expone `db.exec`, que acepta texto SQL completo, y parte del código construye sentencias por concatenación de cadenas. La mitigación aplicada es la validación de entrada en la capa de servicio antes de construir la sentencia, junto con la encapsulación en `DbDriver`. Es una mitigación que conviene considerar insuficiente; véase la sección 11.2.

## 7. Sesiones y limitador de tasa

### 7.1. Limitador global

| Parámetro | Valor |
|-----------|-------|
| Mecanismo | `createRateLimiter(15 * 60 * 1000, 300)` |
| Ventana temporal y cupo | 15 minutos, 300 peticiones |
| Ámbito de aplicación | Prefijo `/api` completo |

Reduce la viabilidad de la fuerza bruta contra el inicio de sesión, de la enumeración de usuarios y del abuso de la API de verificación, que es la ruta más costosa en cómputo criptográfico por su uso de SHA-256 sobre archivos.

### 7.2. Limitador de intentos de inicio de sesión

| Característica | Comportamiento |
|----------------|----------------|
| Objetivo | El endpoint `POST /api/auth/login` |
| Umbral | Cuenta intentos fallidos por usuario |
| Bloqueo y expiración | Bloqueo temporal tras superar el umbral; expira solo, sin intervención administrativa |
| Registro | Cada intento fallido genera un evento `LOGIN_FAILED` en la bitácora |

La expiración automática evita que un atacante bloquee permanentemente a una víctima mediante intentos deliberadamente fallidos, lo que sería un vector de denegación de servicio dirigido contra la disponibilidad de una cuenta concreta.

### 7.3. Estados de la sesión

El sistema no implementa lista de revocación de tokens: la invalidación se logra mediante la expiración natural o el cambio de contraseña. La decisión simplifica la arquitectura sin estado, a costa de una ventana en la que un token emitido sigue siendo válido. Se registra como riesgo en la sección 11.3.

## 8. Cabeceras de seguridad y CORS

### 8.1. Cabeceras aplicadas por `helmet`

| Cabecera | Función | Efecto en el SGD-FD |
|----------|---------|---------------------|
| `Content-Security-Policy` | Restricción de orígenes de recursos | Reduce la superficie de inyección de scripts |
| `X-Content-Type-Options: nosniff` | Prevenir la inferencia de tipos MIME | Evita que el navegador interprete un archivo con un tipo distinto al declarado |
| `X-Frame-Options` | Control de incrustación en marcos | Evita el clickjacking sobre la interfaz |
| `Strict-Transport-Security` | Forzar HTTPS | Exige canal seguro al navegador |
| `X-DNS-Prefetch-Control` | Control de precarga DNS | Reduce la fuga de información por DNS |
| Eliminación de `X-Powered-By` | No revelar la pila tecnológica | Dificulta el reconocimiento pasivo del servidor |

### 8.2. Política CORS

| Elemento | Configuración | Fundamento |
|----------|---------------|------------|
| Librería | `cors` ^2.8.5 | Estándar de facto para Express |
| Orígenes permitidos | Configurados mediante variable de entorno | Permite separar API e interfaz en puertos distintos sin abrir a cualquier origen |
| Credenciales | No habilitadas por defecto | Coherente con la autenticación por cabecera `Authorization` |

La API no debe ser alcanzable desde un origen arbitrario, porque eso anularía el control de acceso aunque la autenticación por token fuera correcta.

## 9. Bitácora e integridad de registros

### 9.1. Estructura de la tabla de auditoría

La bitácora se implementa sobre una tabla de **solo adición**: no admite `UPDATE` ni `DELETE` sobre sus filas. Esta restricción es una propiedad del esquema y constituye el fundamento de la trazabilidad del sistema.

| Columna | Papel | Contenido |
|---------|-------|-----------|
| `event_type` | Clave del tipo de evento | Uno de los 9 tipos catalogados |
| `entity_type` | Tipo de entidad afectada | `user`, `document`, `proposal` |
| `entity_id` | Identificador de la entidad | UUID |
| `user_id` | Actor que inició la operación | UUID, o nulo si es anónimo |
| `event_data` | Carga útil del evento | JSON serializado |
| `previous_hash` | Huella del registro anterior | SHA-256 en hexadecimal |
| `current_hash` | Huella de este registro | SHA-256 de los campos del registro junto con `previous_hash` |
| `created_at` | Marca temporal | Fecha y hora de creación |

### 9.2. Catálogo de eventos

| Tipo de evento | Momento de emisión | Dato de auditoría relevante |
|----------------|--------------------|------------------------------|
| `USER_REGISTERED` | Alta de usuario | Nombre de usuario y huella de la clave pública |
| `LOGIN_SUCCESS` | Autenticación correcta | Usuario y resultado favorable |
| `LOGIN_FAILED` | Autenticación fallida | Usuario intentado y causa del fallo |
| `DOCUMENT_UPLOAD` | Carga inicial de documento | Identificador del documento y huella de contenido |
| `DOCUMENT_UPDATE` | Actualización de metadatos o contenido | Versión afectada, huella previa y nueva |
| `DOCUMENT_VISIBILITY_CHANGED` | Cambio de visibilidad | Visibilidad anterior y posterior |
| `DOCUMENT_PROPOSAL_CREATED` | Creación de propuesta | Documento, propuesta y huella de la propuesta |
| `DOCUMENT_PROPOSAL_ACCEPTED` | Aceptación por el propietario | Documento y versión generada |
| `DOCUMENT_PROPOSAL_REJECTED` | Rechazo por el propietario | Documento y propuesta rechazada |

La presencia simultánea de `LOGIN_SUCCESS` y `LOGIN_FAILED` es lo que permite detectar patrones de ataque de credenciales, en lugar de inferirlos a partir de los accesos exitosos.

### 9.3. Encadenado por hash

Cada registro incorpora la huella del anterior en la columna `previous_hash`, lo que forma una cadena criptográfica en la que alterar un registro histórico obligaría a recalcular todas las huellas posteriores.

| Propiedad | Descripción |
|-----------|-------------|
| Función de encadenado | SHA-256 sobre el contenido del registro y su `previous_hash` |
| Detección de manipulación | `GET /api/audit/verify-chain` recalcula y compara la cadena completa |
| Restricción de acceso | Exclusiva del rol `admin` |
| Consecuencia de la alteración | Cualquier modificación rompe el eslabón y se convierte en evidencia |

> **Limitación honesta:** la cadena detecta la alteración pero **no la previene** frente a un atacante con acceso de escritura a la base de datos y capacidad de recalcular los eslabones. La resistencia real depende de que el almacén esté fuera de su alcance. En el despliegue de referencia la base reside en memoria del proceso, lo que reduce pero no elimina el riesgo; véase el [diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md).

### 9.4. Estados de verificación de integridad

| Estado | Significado |
|--------|-------------|
| `VALID` | El hash recalculado coincide con el registrado y la firma se valida |
| `MANIPULATED` | El hash recalculado difiere del registrado: el archivo fue alterado |
| `INVALID_SIGNATURE` | El archivo no fue alterado, pero la firma no valida criptográficamente |
| `NOT_FOUND` | El documento no existe o el solicitante no tiene visibilidad sobre él |
| `FOUND` | Solo en la búsqueda por huella: se localizó un documento cuyo hash coincide con el consultado |

El estado `FOUND` sustenta el mecanismo de verificación descentralizada: un tercero puede comprobar la integridad de un documento si únicamente posee su contenido y su huella.

## 10. Variables de entorno y secretos

Los secretos se cargan mediante `dotenv`, de modo que el código no contiene valores literales y la configuración se externaliza al entorno de ejecución.

| Elemento | Contenido sensible | Exposición si se filtra |
|----------|--------------------|-------------------------|
| Secreto de firma JWT | Clave de firma de los tokens de sesión | Emisión de tokens falsos: acceso total al sistema |
| Orígenes CORS permitidos | Lista de orígenes autorizados | Permitir orígenes no previstos |
| Credenciales de despliegue | Parámetros del entorno destino | Acceso al servidor |

| Práctica de higiene | Aplicación en el SGD-FD |
|---------------------|-------------------------|
| Separación de código y secretos | `dotenv` carga la configuración; el repositorio no la fija |
| Exclusión de entornos del control de versiones | El archivo de entorno no se incluye en la distribución |
| Rotación del secreto JWT | Procedimiento disponible; su ejecución periódica no está automatizada |
| Privilegio mínimo del proceso | El servidor requiere solo el puerto HTTP y acceso a su directorio de almacenamiento |

La rotación del secreto JWT es la práctica de mayor impacto: mientras el secreto no se rote, cualquier token filtrado mantiene su validez hasta expirar.

## 11. Riesgos abiertos y vulnerabilidades conocidas

Esta sección documenta, con honestidad metodológica, las debilidades identificadas. No se ocultan tras afirmaciones generales de seguridad.

### 11.1. Defecto de verificación de firma en `GET /api/verify/:documentId`

**Descripción.** El endpoint `GET /api/verify/:documentId` devuelve el campo `signature.valid` con el valor `true` de forma **hardcodeada**, sin realizar ninguna comprobación criptográfica sobre el archivo. Quien consulte ese endpoint obtiene siempre una respuesta de firma válida, con independencia del estado real del documento. La verificación criptográfica auténtica se realiza en `POST /api/verify`, donde el servicio recalcula el hash SHA-256 del contenido, lo compara con el hash registrado y valida la firma RSA sobre ese hash.

**Impacto.** Un tercero que confíe en el resultado de `GET /api/verify/:documentId` concluirá erróneamente que un documento manipulado mantiene su firma válida. El impacto es de integridad de la confianza, que es precisamente la propiedad que el sistema promete.

| Atributo | Valor |
|----------|-------|
| Probabilidad de explotación | Media: requiere que un tercero utilice el endpoint incorrecto |
| Impacto | Alto: induce a errores de confianza sobre la integridad |
| Severidad | Alta |
| Mitigación actual | El endpoint de verificación por hash `POST /api/verify` es correcto |
| Mitigación recomendada | Eliminar el campo `signature.valid` de la respuesta de `GET /api/verify/:documentId` o sustituirlo por el resultado de la comprobación criptográfica real |
| Estado | **Riesgo abierto, declarado y no corregido en esta versión** |

Se documenta explícitamente porque un sistema de firma digital cuyo endpoint de consulta reporta un resultado no verificado presenta una contradicción entre su documentación y su implementación. Reconocerla es preferible a ocultarla.

### 11.2. Riesgo de inyección SQL por concatenación

**Descripción.** El motor `sql.js` expone `db.exec`, que acepta texto SQL completo, y parte del código construye sentencias por concatenación en lugar de usar parámetros vinculados. Por tanto, no es correcto afirmar que el sistema emplee consultas parametrizadas de forma uniforme. La mitigación aplicada es la validación de entrada en la capa de servicio y la encapsulación del acceso a datos en el componente `DbDriver`.

| Atributo | Valor |
|----------|-------|
| Probabilidad | Media: depende de la cobertura real de la validación en cada sentencia |
| Impacto | Alto: lectura, modificación o eliminación de datos |
| Severidad | Media-Alta |
| Mitigación recomendada | Sustituir progresivamente la concatenación por sentencias con parámetros en `DbDriver` y añadir verificación de tipo en los límites de servicio |
| Estado | Riesgo abierto, mitigado parcialmente |

### 11.3. Cuadro de riesgos residuales

| Riesgo | Descripción | Severidad | Estado de la mitigación |
|--------|-------------|:---------:|-------------------------|
| Firma no verificada en `GET /api/verify/:documentId` | Campo `signature.valid` hardcodeado en `true` | Alta | **Abierto** |
| Concatenación SQL en parte de las sentencias | `db.exec` con SQL construido por concatenación | Media-Alta | Parcial |
| Sin revocación de tokens | Un token emitido sigue siendo válido hasta su expiración | Media | Compensado por diseño |
| Clave privada irrecuperable | La clave depende de la contraseña mediante PBKDF2 | Media | Aceptado |
| Archivos sin cifrar en reposo | Confidencialidad sujeta solo a permisos del sistema de archivos | Media | Aceptado |
| Sin análisis de dependencias | No hay herramienta de detección de librerías vulnerables | Baja | Abierto |

## 12. Plan de respuesta a incidentes

### 12.1. Detección

| Señal | Origen | Acción de verificación |
|-------|--------|------------------------|
| Ráfaga de `LOGIN_FAILED` | Bitácora de auditoría | Revisar si el limitador de intentos fue activado |
| Ruptura de la cadena de hash | `GET /api/audit/verify-chain` | Investigar modificación de la base de datos |
| Respuesta `MANIPULATED` en verificación | Servicio de verificación | Presumir alteración del archivo y preservar evidencia |
| Exceso de peticiones | Limitador global de 300 por 15 minutos | Identificar el origen y el patrón de las peticiones |

### 12.2. Contención y respuesta

| Fase | Acción | Responsable |
|------|--------|-------------|
| Identificación | Correlacionar la señal con la bitácora encadenada | Administrador |
| Contención | Restringir el acceso afectado; rotar el secreto JWT si se sospecha exposición | Administrador |
| Preservación | Conservar la base de datos y los archivos originales para análisis | Administrador |
| Erradicación | Corregir el vector identificado; revisar autorización y validación de entrada | Desarrollo |
| Recuperación | Restaurar desde copia de seguridad verificada por hash | Administrador |
| Post-incidente | Registrar el incidente en la bitácora y revisar el cuadro de riesgos | Todos |

La bitácora encadenada es central para la respuesta a incidentes: al ser de sola adición, la secuencia de eventos que rodea un incidente permanece disponible incluso si el incidente incluye la manipulación del almacén.

## 13. Limitación legal

> **Este apartado es determinante para la interpretación del sistema.**

El SGD-FD produce una **firma criptográfica válida dentro del propio sistema**: emplea RSA-2048 y SHA-256, la clave privada del firmante está protegida con AES-256-GCM, y la verificación criptográfica en `POST /api/verify` es auténtica y reproducible.

Sin embargo, **el SGD-FD no es un sistema de firma electrónica certificada conforme a la Ley N.° 27269, Ley de Firmas y Certificaciones Digitales del Perú**.

| Requisito legal | Situación en el SGD-FD |
|-----------------|------------------------|
| Autoridad de Certificación acreditada | **No existe.** Las claves se autogeneran localmente en el registro del usuario |
| Certificado digital emitido por entidad acreditada | **No existe.** No hay emisión, revocación ni validación de certificados |
| Sello de tiempo (TSA) | **No existe.** El campo `created_at` es una marca del servidor, no una evidencia criptográfica de temporalidad |
| Interoperabilidad con otros sistemas de firma | **No garantizada.** El formato es propio del SGD-FD |

La marca temporal `created_at` que acompaña a cada firma es una **afirmación del servidor**, no una prueba criptográfica de que la firma se realizó en ese instante. Un atacante con control del servidor podría manipular esa marca sin invalidar la firma.

**Conclusión.** La firma del SGD-FD acredita integridad y autoría técnica dentro de un dominio cerrado de confianza. No constituye prueba de integridad, autoría ni temporalidad frente a un tercero que no comparta ese contexto. El uso con finalidades legales, como la validez de contratos, actas, certificados, dictámenes o exhortos, exige integrar un servicio de firma electrónica certificada emitido por una autoridad acreditada.

## 14. Referencias cruzadas

| Documento | Contenido relacionado |
|-----------|------------------------|
| [Aplicación de la ISO/IEC 27001:2022](../iso_aplicada/aplicacion_iso_27000.md) | Evaluación por dominios, gestión de riesgos y Declaración de Aplicabilidad |
| [Software utilizado](../../06_diagramas_y_software/software_utilizado.md) | Versiones y justificación de cada dependencia, incluidas las criptográficas |
| [Diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md) | Superficie expuesta y ubicación del almacén de datos |
| [Diagrama de estados](../../06_diagramas_y_software/diagrama_estados.md) | Ciclo de vida de un documento y de una propuesta |
| [Arquitectura del sistema](../../02_diseno_construccion/arquitectura/arquitectura.md) | Componentes, capas y flujo de verificación |
| [Matriz de pruebas](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) | Casos de prueba que ejercitan los controles de seguridad |
| [Métricas de calidad](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) | Indicadores de cobertura y densidad de defectos |
| [Implementación y despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md) | Procedimiento de puesta en marcha y configuración de secretos |

---

*Los riesgos de la sección 11 forman parte del alcance de la entrega y no deben omitirse al presentar los resultados de la tesis.*
