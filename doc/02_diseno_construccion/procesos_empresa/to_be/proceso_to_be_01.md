# Proceso TO-BE 01 — Emisión, firma y distribución verificable

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-01 |
| **Nombre** | Emisión, firma y distribución verificable |
| **Sustituye a** | [`P-01 AS-IS`](../as_is/proceso_as_is_01.md) |
| **Área** | Comercial / Administración |
| **Responsable** | Propietario del documento |
| **Tipo** | Operativo |
| **Implementación** | `POST /api/docs` — `services/document.service.ts` |

---

## 2. Objetivo del Proceso

Emitir un documento de modo que quede **firmado criptográficamente** y
**verificable por cualquier destinatario, sin cuenta y sin contacto con el
emisor**, desde el instante de la subida.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

El propietario selecciona un archivo y lo sube con un título y una descripción.

### 3.2. Resultado Esperado

```
201 Created
{
  documentId, versionId, versionNumber: 1,
  contentHash: "<sha-256>",
  signature: { algorithm: "RSA-SHA256", signedAt },
  verificationUrl: "https://<host>/v/<documentId>",
  qrCode: "<data-uri>"
}
```

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Regla de validación |
|---------|---------------------|
| `file` | MIME permitido; ≤ 10 MB |
| `title` | 1–200 caracteres |
| `description` | Opcional |
| `changeDescription` | Motivo de la creación |
| `password` | Contraseña del usuario; se usa para descifrar la clave privada |

### 4.2. Salidas

| Salida | Consumidor |
|--------|-----------|
| Identificadores del documento y la versión | Propietario |
| Hash SHA-256 del contenido | Propietario y verificadores |
| Firma RSA-SHA256 | Verificadores |
| URL de verificación | Destinatario |
| Código QR | Impresión en el documento |

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Propietario | Sube, firma y comparte |
| Destinatario | Verifica con el QR, sin cuenta |
| Verificador anónimo | Cualquier persona con el archivo o el QR |

---

## 6. Reglas de Negocio

| # | Regla |
|---|--------|
| RN-1 | Toda versión creada se firma automáticamente; no existe la opción de «sin firmar» |
| RN-2 | La firma se calcula sobre el hash SHA-256 del contenido, no sobre el archivo completo |
| RN-3 | La clave privada solo se descifra en memoria, con la contraseña del propietario, y no se persiste en claro |
| RN-4 | El QR apunta a una ruta pública de verificación que no requiere autenticación |
| RN-5 | El evento de creación queda registrado en la bitácora encadenada |
| RN-6 | La contraseña de firma nunca se almacena ni se registra en bitácora |

---

## 7. Diagrama del Proceso

```
 Inicio
   |
   v
 El propietario selecciona el archivo y completa el formulario
   |
   v
 (El archivo cumple los requisitos?)
   |  No --> 400: tipo no permitido / supera 10 MB --> Fin
   |  Si
   v
 Validar el formato de la contrasena de firma
   |  Incorrecta --> 400 --> Fin
   |  Correcta
   v
 Insertar el documento (is_public = 0)
   |
   v
 Generar version_number = 1
   |
   v
 Calcular contentHash = SHA256(bytes)
   |
   v
 Descifrar la clave privada con PBKDF2 + AES-256-GCM
   |
   v
 Firmar: RSA-SHA256(contentHash, clave privada)
   |
   v
 Guardar version + firma
   |
   v
 Registrar en la bitacora: DOCUMENT_CREATED
   |
   v
 Generar el codigo QR con la URL de verificacion
   |
   v
 Responder 201 con hash, firma, URL y QR
   |
   v
 (El propietario decide compartirlo?)
   |  No --> Fin (documento privado)
   |  Si
   v
 PATCH /visibility { isPublic: true } --> Registrar DOCUMENT_SHARED
   |
   v
 Entregar URL y QR al destinatario
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿El archivo cumple los requisitos? | Rechazo temprano, sin escritura |
| D-2 | ¿La contraseña es correcta? | Sin ella no se puede firmar; se rechaza |
| D-3 | ¿Se comparte? | Define si el documento es público o privado |

---

## 8. Actividades

| # | Actividad | Tiempo | Automatizada |
|---|-----------|:------:|:------------:|
| A-1 | Validar archivo y formulario | 20 ms | Sí |
| A-2 | Calcular SHA-256 | 50 ms (10 MB) | Sí |
| A-3 | Descifrar la clave privada | 400 ms | Sí |
| A-4 | Firmar con RSA-SHA256 | 1 ms | Sí |
| A-5 | Persistir versión y firma | 30 ms | Sí |
| A-6 | Registrar en la bitácora | 20 ms | Sí |
| A-7 | Generar el QR | 60 ms | Sí |
| A-8 | Compartir (decisión del usuario) | — | No |

**Tiempo total automatizado: < 2 s** frente a las ~2 h del proceso AS-IS.

---

## 9. Sistemas y Puntos de Integración

```
 Frontend (SvelteKit)
      |  multipart/form-data + Authorization
      v
 POST /api/docs
      |
      v
 DocumentService  ──▶ crypto/signature.ts  ──▶ node:crypto
      |            └─▶ db (document_versions, document_signatures)
      |            └─▶ audit.service  (cadena de hashes)
      v
 QR + URL de verificacion
```

| Punto de integración | Tecnología |
|----------------------|-----------|
| Cliente → API | HTTPS, JWT en cabecera `Authorization` |
| Persistencia | SQLite (`db/driver.ts` → `sqlite-driver.ts`) |
| Archivos | `backend/uploads/` |
| Verificación | Ruta pública `/v/:id` |

---

## 10. Indicadores

### 10.1. Tiempo de Ciclo

| Concepto | AS-IS | TO-BE |
|----------|:-----:|:-----:|
| Tiempo de proceso | ~2 h | **< 2 s** |
| Tiempo de espera | hasta 2 días | 0 |
| Tiempo hasta que el destinatario puede verificar | Sin posibilidad | Inmediato |

### 10.2. Tasa de Errores

| Error | AS-IS | TO-BE |
|-------|:-----:|:-----:|
| Se envía la versión anterior | 15 % | **0 %** (numeración correlativa) |
| Se adjunta el documento equivocado | 5 % | **0 %** (QR identifica el documento) |
| Se pierde el documento | 25 % | **0 %** (repositorio único) |
| Se distribuye un documento alterado | Indeterminable | **Detectado al verificar** |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Firmar cada versión | ✔ Automático, sin excepción |
| Emitir verificable sin cuenta | ✔ QR público |
| Registrar la acción | ✔ Evento en la bitácora |

---

## 11. Problemas Resueltos

| Problema AS-IS | Resolución |
|----------------|-----------|
| PR-01 · Versión ambigua | Numeración correlativa obligatoria |
| PR-02 · Canal como garantía | Firma criptográfica con clave del emisor |
| PR-03 · Sin trazabilidad del envío | Evento `DOCUMENT_CREATED` y `DOCUMENT_SHARED` |
| PR-04 · Reenvíos divergentes | El QR siempre apunta a la versión vigente |

---

## 12. Brechas Resueltas

| Brecha AS-IS | Requerimiento |
|--------------|---------------|
| BR-01 · Sin firma digital | RF-006 |
| BR-02 · Sin verificación pública | RF-010, RF-023 |
| BR-03 · Sin inmutabilidad | RNF-001 |
| BR-04 · Sin registro de auditoría | RF-024 |

---

## 13. Verificación

Las pruebas que respaldan este proceso están en
`backend/tests/integration/documents.api.test.ts` y
`backend/tests/services/document.service.test.ts`.

| Prueba | Archivo | Resultado |
|--------|---------|:---------:|
| *sube un documento firmado y genera su QR* | `documents.api.test.ts` | ✔ |
| *rechaza la subida sin contraseña de firma* | `documents.api.test.ts` | ✔ |
| *rechaza tipos de archivo no permitidos* | `documents.api.test.ts` | ✔ |
| *sube un documento, lo firma y crea la versión 1* | `document.service.test.ts` | ✔ |
| *rechaza subir un documento con contraseña equivocada* | `document.service.test.ts` | ✔ |
| *firma un documento con RSA-SHA256 y devuelve su hash* | `unit/crypto.test.ts` | ✔ |
| *genera un par RSA-2048 con fingerprint SHA-256 formateado* | `unit/crypto.test.ts` | ✔ |

---

## 14. Referencias Cruzadas

- [`procesos_to_be.md`](procesos_to_be.md) — Mapa de procesos TO-BE
- [`proceso_to_be_02.md`](proceso_to_be_02.md) — Versionado inmutable
- [`../../as_is/proceso_as_is_01.md`](../as_is/proceso_as_is_01.md) — Proceso AS-IS
- [`../../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
