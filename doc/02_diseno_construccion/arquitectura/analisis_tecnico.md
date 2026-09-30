# Análisis Técnico de la Arquitectura

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

Este documento justifica, con criterios verificables, las decisiones
tecnológicas del sistema. Complementa a
[`arquitectura.md`](arquitectura.md), que describe *qué* se construyó; aquí se
expone *por qué*.

---

## 1. Technologies Consideradas y Descartadas

  Necesidad   Elegida   Alternativas evaluadas   Motivo de la elección  
 ----------- --------- ------------------------ ----------------------- 
  Lenguaje del servidor   **TypeScript 5.7** sobre Node 18+   JavaScript puro, Go, Python   Un único lenguaje en todo el proyecto; tipado estricto que documenta los contratos de la API.  
  Framework del servidor   **Express 4.21**   Fastify, NestJS, Koa   Específico, con ecosistema maduro y suficiente sin abstracciones. Un framework opinionado no aporta valor en un monolito de este tamaño.  
  Framework del cliente   **SvelteKit 2.63** + Svelte 5.56   React+Next, Vue+Nuxt, Angular   Menor volumen de código, reactividad por compilación, SSR y enrutado en un solo paquete.  
  Base de datos local   **SQLite vía `sql.js` 1.12**   better-sqlite3, PostgreSQL local, MongoDB   Cero instalación para el evaluador; la base es un archivo portable. `sql.js` además permite la abstracción futura.  
  Cifrado de simétrico   **AES-256-GCM**   AES-CBC, ChaCha20-Poly1305   GCM es autenticado: cifra e integra en una sola operación. ChaCha20 es equivalente, pero AES-256 cuenta con aceleración por hardware.  
  Derivación de clave   **PBKDF2-HMAC-SHA512, 100 000 iteraciones**   Argon2id, scrypt, un solo SHA-256   Amplio soporte en Node sin dependencias. Argon2id es superior y es la recomendación futura (`MEJ-01`).  
  Firma asimétrica   **RSA-2048 + SHA-256**   ECDSA P-256, Ed25519   RSA es el estándar de facto para firma de documentos y verificable por herramientas genéricas. ECDSA produce firmas más cortas pero con el problema de la firma mal formada.  
  Hash de contenido   **SHA-256**   SHA-1, SHA-512, BLAKE3   SHA-1 está roto para resistencia a colisiones. BLAKE3 es más rápido pero menos estándar.  
  Formato de la clave cifrada   **JSON `{ encryptedData, iv, authTag, salt }`**   Concatenación `iv:tag:datos`, solo cifrado   El JSON es autodescriptivo y tolera añadir campos; el orden fijo obliga a reescribir el lector.  
  Autenticación   **JWT (access + refresh)**   Sesiones en servidor, OAuth2   Sin estado en servidor: escala horizontalmente y simplifica la API.  
  Contraseñas   **bcryptjs, factor de coste 12**   Argon2id, PBKDF2, scrypt   Adaptativo y sin dependencias nativas.  
  Pruebas   **Vitest 5 + Supertest 7**   Jest, Mocha+Chai, Playwright   Mismo lenguaje de configuración que Vite; `supertest` permite probar la API real sin levantarla.  
  Despliegue objetivo   **Vercel + Supabase**   AWS, Railway, DigitalOcean   Gregorio de coste para un proyecto académico.  

---

## 2. Decisiones de Criptografía

### 2.1. Jerarquía de Confianza

```
        Contraseña del usuario
                 │
                 ▼
   PBKDF2(password, salt, 100000, 32, SHA-512)
                 │
                 ▼
     ┌───────────────────────┐
     │  Clave Maestra (AES)  │  ← nunca se almacena
     └───────────┬───────────┘
                 │ AES-256-GCM (IV de 12 bytes, authTag de 16)
                 ▼
     ┌───────────────────────┐
     │ Clave privada RSA     │  ← se almacena en user_keys
     │ (PEM PKCS#8)          │
     └───────────┬───────────┘
                 │ RSA-SHA256
                 ▼
        Firma del hash SHA-256
```

### 2.2. Flujo de Registro

  Paso   Operación   Resultado  
 ------ ----------- ----------- 
  1   Validar contraseña contra `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$`   Mayúscula, minúscula, dígito, especial y ≥ 12 caracteres  
  2   `bcryptjs.hashSync(password, 12)`   Hash de coste 12  
  3   `crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })`   Par RSA  
  4   Exportar SPKI (pública) y PKCS#8 (privada) en PEM   Textos PEM  
  5   Derivar clave maestra: PBKDF2-SHA512, 100 000 iteraciones, salt aleatorio de 16 bytes   32 bytes  
  6   `AES-256-GCM` con IV aleatorio de 12 bytes   `encryptedData`, `iv`, `authTag`  
  7   Serializar a JSON (`packEncryptedKey`)   Texto almacenable  
  8   Calcular la huella: SHA-256 de la clave pública, en pares hexadecimales separados por `:`   Identificador legible de la clave  

### 2.3. Flujo de Firma

  Paso   Operación  
 ------ ----------- 
  1   Leer los bytes del archivo  
  2   `contentHash = SHA256(bytes)`  
  3   Descifrar la clave privada con la contraseña del usuario  
  4   `signature = RSA-SHA256(contentHash, privateKey)`  
  5   Insertar `document_versions` + `document_signatures`  
  6   Registrar el evento en la bitácora encadenada  

### 2.4. Flujo de Verificación

  Paso   Operación   Resultado en falso  
 ------ ----------- -------------------- 
  1   Buscar la versión por identificador   `NOT_FOUND`  
  2   Recalcular `SHA256(bytes)` y comparar con `content_hash`   `MANIPULATED`  
  3   Verificar `RSA-SHA256` con la clave pública   `INVALID_SIGNATURE`  
  4   Todo correcto   `VALID`  

> El paso 2 precede al 3 de forma intencionada: si el contenido cambió, la
> firma ya no corresponde aunque siga siendo criptográficamente válida.
> Informar `MANIPULATED` es más preciso que `INVALID_SIGNATURE`.

---

## 3. Análisis de Seguridad

### 3.1. Amenazas y Mitigaciones

  #   Amenaza   Mitigación   Ubicación  
 --- --------- ----------- ----------- 
  T-01   Interceptar credenciales   bcryptjs + JWT, nunca Devolver `password_hash`   `auth.service.ts`  
  T-02   Falsificar una firma   Clave privada cifrada; el servidor no la posee en claro   `keyProtection.ts`  
  T-03   Alterar un documento   SHA-256 firmado; detección en verificación   `signature.ts`  
  T-04   Alterar la bitácora   Cadena de hashes + triggers `append-only`   `audit.service.ts`, `migrate.ts:139`  
  T-05   Robar una sesión   Expiración corta del access token + refresh   `auth.ts`  
  T-06   Fuerza bruta   Rate limit 300/15 min; política de contraseña   `rateLimit.ts`  
  T-07   XSS   Svelte escapa por defecto; helmet activa CSP   `app.ts:37`  
  T-08   CSRF / CORS abusivo   Lista blanca de orígenes; tokens en cabecera, no en cookie   `app.ts:19`  
  T-09   Subir un archivo peligroso   Límite de 10 MB, lista blanca de MIME, nombre generado   `documents.ts`  
  T-10   Acceso a documentos ajenos   Verificación de propietario/coautor en cada operación   `document.service.ts`  
  T-11   SQL injection   Consultas parametrizadas en toda la capa de datos   `query.ts`  
  T-12   Fuga por logs   No se registran contraseñas, tokens ni claves   Todo el proyecto  
  T-13   Denegación de servicio por XML   Solo PDF; sin parser de XML; el MIME está acotado   `documents.ts`  
  T-14   Filtración de datos en respuestas   DTOs explícitos; no se expone `password_hash` ni `encrypted_private_key`   `types.ts`  

### 3.2. Limitaciones Reconocidas

  #   Limitación   Impacto   Mitigación documentada  
 --- ----------- --------- ------------------------ 
  L-01   Sin sellado de tiempo (TSA)   La marca temporal es la del servidor   Declarado; ver `RK-01`  
  L-02   Sin Entidad de Certificación   No equivale a firma electrónica legal   Declarado en el `README` y en la interfaz  
  L-03   La cadena de hash no resiste a un atacante con control total del motor   Reescritura completa e consistente   Riesgo `RK-04`, aceptado  
  L-04   Tokens en `localStorage`   Un XSS exitoso tendría acceso   Mitigado por CSP; migración a cookies `httpOnly` en `MEJ-02`  
  L-05   Sin segundo factor de autenticación   El robo de contraseña compromete la firma   `MEJ-03`  
  L-06   Rate limit en memoria   Se reinicia al reiniciar el proceso   `MEJ-04` (store compartido en Supabase)  
  L-07   Sin rotación de claves privadas   Una clave comprometida firmará para siempre   `MEJ-05`  

---

## 4. Análisis de Rendimiento

### 4.1. Operaciones Críticas

  Operación   Costo dominante   Complejidad  
 ----------- ----------------- ------------- 
  `SHA256` de un archivo de 10 MB   ~50 ms   O(n)  
  Firma RSA-2048   ~1 ms   O(1)  
  Cifrado/descifrado de la clave privada   ~1 ms   O(1)  
  `saveDatabase()` de sql.js   Crece con el tamaño de la base   O(n)  

**Hallazgo:** `saveDatabase()` serializa **toda** la base en cada escritura. Es
la operación más cara del sistema y escala mal. Se mitiga con escrituras
agrupadas, pero se migura a un motor real en la nube. Registrado en `MEJ-06`.

### 4.2. Índices

  Índice   Tabla   Objetivo  
 -------- ------- ---------- 
  `idx_versions_document`   `document_versions(document_id)`   Listado de versiones  
  `idx_versions_coauthor`   `document_versions(coauthor_id)`   Documentos como coautor  
  `idx_documents_owner_public`   `documents(owner_id, is_public)`   Listado y galería pública  
  `idx_proposals_document`   `document_proposals(document_id, status)`   Bandeja de propuestas  
  `idx_proposals_base_version`   `document_proposals(base_version_id)`   Validación de coherencia  
  `idx_proposals_creator`   `document_proposals(proposed_by)`   Propuestas del usuario  
  `idx_audit_entity`   `audit_log(entity_type, entity_id)`   Historial de una entidad  
  `idx_audit_hash`   `audit_log(current_hash)`   Verificación de la cadena  
  `idx_users_username` / `idx_users_email`   `users`   Búsqueda en login y unicidad  

### 4.3. Resultados Medidos

Detalle en
[`../pruebas_calidad/validacion_experimental.md`](../pruebas_calidad/validacion_experimental.md).

  Prueba   Resultado   Objetivo   Estado  
 -------- ----------- ---------- -------- 
  Subida de documento de 1 MB   62 ms   < 500 ms   ✔  
  Firma y verificación (10 MB)   118 ms   < 2 000 ms   ✔  
  Verificación por QR   34 ms   < 300 ms   ✔  
  Comparación de versiones (texto)   210 ms   < 1 000 ms   ✔  
  Login con bcryptjs   95 ms   < 500 ms   ✔  
  300 peticiones concurrentes   Sin errores, sin memoria degradada   Estable   ✔  

---

## 5. Análisis de Mantenibilidad

  Métrica   Valor   Interpretación  
 --------- ------- ---------------- 
  Archivos de código fuente (backend)   23   Tamaño manejable  
  Archivos de prueba (backend)   12   Cobertura amplia  
  Pruebas automatizadas   115   Red de seguridad sólida  
  Acoplamiento entre capas   Bajo   La lógica de negocio no conoce la persistencia  
  Duplicación detectada   1 (resuelta)   `optionalAuthenticate` duplicaba `authenticateOptional`  
  Ramas muertas   1 (resuelta)   La anterior  
  Complejidad ciclomática máxima   Media   Predomina la orquestación, no la lógica condicional  

**Decisiones de mantenimiento aplicadas:**

  Decisión   Efecto  
 ---------- -------- 
  Contrato `DbDriver`   Permite cambiar de motor sin tocar servicios  
  Servicio de análisis documental aislado   La comparación de archivos no está acoplada al flujo de documentos  
  Middleware reutilizable   `authenticate` y `authenticateOptional` se componen en lugar de duplicarse  
  Comments en el código no triviales   Explican el *porqué*, no el *qué*  

---

## 6. Viabilidad de la Migración a PostgreSQL

### 6.1. Trabajo ya realizado

  Activo   Ubicación  
 -------- ----------- 
  Contrato de acceso a datos   `backend/src/db/driver.ts`  
  Implementación SQLite   `backend/src/db/sqlite-driver.ts`  
  Conversión `?` → `$1…$n`   `toPositionalPlaceholders()` en `driver.ts:32`  
  Selección de motor por entorno   `backend/src/db/connection.ts:21`  
  Variables documentadas   `backend/.env.example`  

### 6.2. Trabajo restante

  Tarea   Esfuerzo   Riesgo  
 ------- ---------- -------- 
  Implementar `PostgresDriver` (usando `pg`)   4 h   Bajo  
  Convertir la capa de datos a `await`   8 h   **Alto** — afecta a todos los servicios  
  Traducir el DDL a PostgreSQL   3 h   Bajo  
  Sustituir `uploads/` por Supabase Storage   5 h   Medio  
  Desplegar el backend en Vercel   4 h   Medio  
  **Total estimado**   **≈ 24 h**    

> La conversión asíncrona es la partida crítica. Se optó por documentarla en
> lugar de implementar un adaptador PostgreSQL parcial que daría una falsa
> sensación de funcionamiento.

---

## 7. Conclusiones

  #   Conclusión  
 --- ----------- 
  1   La arquitectura satisface los 27 requerimientos funcionales y los 15 no funcionales.  
  2   Las decisiones criptográficas siguen recomendaciones vigentes y verificables.  
  3   El rendimiento medido cumple los objetivos con holgura.  
  4   La persistencia en memoria es la principal limitación técnica, y su solución está diseñada y estimada.  
  5   El código es mantenible: está tipado, probado y libre de duplicación.  

---

**Documentos relacionados**

- [`arquitectura.md`](arquitectura.md) — Arquitectura del sistema
- [`../metricas/metricas_calidad.md`](../pruebas_calidad/metricas_calidad.md) — Métricas de calidad
- [`../pruebas_calidad/validacion_experimental.md`](../pruebas_calidad/validacion_experimental.md) — Validación experimental
