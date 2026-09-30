# Proceso TO-BE 03 — Verificación pública sin cuenta

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-03 |
| **Nombre** | Verificación pública sin cuenta |
| **Sustituye a** | [`P-03 AS-IS`](../as_is/proceso_as_is_03.md) |
| **Área** | Todas; también destinatarios externos |
| **Responsable** | Verificador (cualquier persona) |
| **Tipo** | Apoyo |
| **Implementación** | `POST /api/verify` y `GET /api/verify/:documentId` — `crypto/verification.ts` |

---

## 2. Objetivo del Proceso

Permitir que **cualquier persona**, sin cuenta y sin contactar con el emisor,
compruebe si el documento que tiene en sus manos es auténtico, íntegro y
corresponde a una versión emitida por el SGD-FD.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

El destinatario escanea el QR impreso en el documento o accede a la URL pública
y sube el archivo que recibió.

### 3.2. Resultado Esperado

```
200 OK
{
  status: "VALID" | "MANIPULATED" | "INVALID_SIGNATURE" | "NOT_FOUND" | "FOUND",
  verification: { hashMatch, signatureValid, signedBy, signedAt },
  message: "Documento íntegro y vigente"
}
```

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Descripción | Obligatoria |
|---------|-------------|:-----------:|
| `file` | El documento que el verificador tiene en sus manos | Sí |
| `documentId` | Identificador leído del QR o de la URL | No |
| `versionNumber` | Versión concreta a verificar | No |

Cuando no se envía `documentId`, el sistema busca por hash en todo el
repositorio, lo que permite detectar documentos falsos aunque el verificador no
conozca el identificador.

### 4.2. Salidas

| Campo | Significado |
|-------|-------------|
| `VALID` | El hash coincide con el registrado y la firma es válida |
| `MANIPULATED` | El hash no coincide: el contenido fue alterado |
| `INVALID_SIGNATURE` | El hash coincide, pero la firma no valida |
| `NOT_FOUND` | El documento o la versión no existe en el repositorio |
| `FOUND` | El hash del archivo existe en alguna versión del repositorio |

---

## 5. Actores y Roles

| Actor | Rol | Autenticación |
|-------|-----|---------------|
| Verificador anónimo | Confirma la integridad | **Ninguna** |
| Destinatario | Verifica antes de usar | Ninguna |
| Auditor | Consulta metadatos públicos | Ninguna |

Las rutas de verificación **no aplican `authenticate`**: son deliberadamente
públicas. Esa es la diferencia funcional principal frente al proceso AS-IS.

---

## 6. Reglas de Negocio

| # | Regla |
|---|--------|
| RN-1 | La verificación no requiere sesión ni token |
| RN-2 | Se recalcula el SHA-256 del archivo subido y se compara con `document_versions.content_hash` |
| RN-3 | Se verifica la firma con la clave pública del firmante mediante `crypto.verify()` |
| RN-4 | Si el hash no coincide, el estado es `MANIPULATED`, con independencia de la firma |
| RN-5 | Sin `documentId`, se busca por hash: es el mecanismo de detección de documentos falsos |
| RN-6 | El mensaje del veredicto está redactado en lenguaje comprensible, no en notación técnica |
| RN-7 | La verificación no modifica ningún dato ni registra la consulta en la bitácora (es una operación de solo lectura) |

---

## 7. Diagrama del Proceso

```
 Inicio (el destinatario escanea el QR)
   |
   v
 Se abre la pagina publica /v/:documentId
   |
   v
 GET /api/verify/:documentId --> Titulo, version vigente, firmante, fecha
   |
   v
 El verificador selecciona el archivo que recibio
   |
   v
 POST /api/verify  (multipart: file [, documentId, versionNumber])
   |
   v
 Calcular SHA-256 del archivo recibido
   |
   v
 (Se informo documentId?)
   |  No --> Buscar por hash en todo el repositorio
   |            |  Coincide --> status = FOUND  (posible documento falso)
   |            |  No coincide --> status = NOT_FOUND
   |  Si
   v
 (Existe el documento y la version?)
   |  No --> status = NOT_FOUND --> Fin
   |  Si
   v
 (El hash coincide con el registrado?)
   |  No --> status = MANIPULATED --> Fin  (documento alterado)
   |  Si
   v
 Verificar la firma con la clave publica del firmante
   |  Falla --> status = INVALID_SIGNATURE --> Fin
   |  Correcta
   v
 status = VALID --> Mostrar: "Documento integro y vigente"
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Se conoce el `documentId`? | Sin él, la verificación es por hash |
| D-2 | ¿Existe el documento? | `NOT_FOUND` |
| D-3 | ¿El hash coincide? | `MANIPULATED` si no |
| D-4 | ¿La firma valida? | `INVALID_SIGNATURE` si no |

> **Distinción clave:** `MANIPULATED` y `INVALID_SIGNATURE` son fallos
> distintos. El primero significa que el **contenido** cambió; el segundo, que
> la **firma** no se corresponde. Confundirlos impediría al verificador saber
> qué ocurrió.

---

## 8. Actividades

| # | Actividad | Tiempo | Automatizada |
|---|-----------|:------:|:------------:|
| A-1 | Recibir el archivo | 300 ms (10 MB) | Sí |
| A-2 | Calcular SHA-256 | 50 ms | Sí |
| A-3 | Consultar la versión y su firma | 20 ms | Sí |
| A-4 | Verificar RSA-SHA256 | 2 ms | Sí |
| A-5 | Devolver el veredicto | 5 ms | Sí |

**Tiempo total: < 2 s** frente a las ~1 h del proceso AS-IS (que además no
llegaba a un resultado verificable).

---

## 9. Sistemas y Puntos de Integración

```
 Verificador (navegador, sin cuenta)
   |
   +--> GET  /api/verify/:documentId   -> metadatos publicos
   +--> POST /api/verify               -> veredicto criptografico
   |
   v
 VerificationService
   +--> crypto/signature.ts   calculateFileHash()
   +--> crypto/verification.ts verifyDocument()
   +--> db                    document_versions, document_signatures, user_keys
```

| Punto de integración | Nota |
|----------------------|------|
| Autenticación | **Ninguna** por diseño |
| Archivo temporal | `uploads/temp/`, subido por `multer` |
| Clave pública | `user_keys.public_key`, asociada al firmante |

---

## 10. Indicadores

### 10.1. Tiempo de Ciclo

| Concepto | AS-IS | TO-BE |
|----------|:-----:|:-----:|
| Tiempo de proceso | ~1 h (o imposible) | **< 2 s** |
| Dependencia del emisor | Obligatoria | **Ninguna** |
| Disponibilidad del veredicto | Depende de la buena voluntad del emisor | Automática |

### 10.2. Tasa de Errores

| Error | AS-IS | TO-BE |
|-------|:-----:|:-----:|
| Se acepta un documento alterado | Indeterminable | **0 %** (se detecta) |
| Se rechaza un documento legítimo | 15 % | Riesgo residual bajo |
| Falsos no detectados | 100 % de los casos | **Detectados por hash** |
| Verificación imposible sin cuenta | 100 % | **0 %** |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Verificar sin cuenta | ✔ Rutas públicas |
| Detectar alteración del contenido | ✔ `MANIPULATED` |
| Detectar documentos falsos | ✔ Búsqueda por hash |
| Mensaje comprensible | ✔ Textos en lenguaje natural |

---

## 11. Problemas Resueltos

| Problema AS-IS | Resolución |
|----------------|-----------|
| PR-01 · «Abre» no es «es auténtico» | Verificación criptográfica real |
| PR-02 · La confianza es transferible | La confianza ya no es un control |
| PR-03 · No hay detección de falsos | Búsqueda por hash en todo el repositorio |
| PR-04 · Verificar exige contacto | Rutas públicas sin autenticación |

---

## 12. Brechas Resueltas

| Brecha AS-IS | Requerimiento |
|--------------|---------------|
| BR-01 · Sin verificación de firma | RF-021 |
| BR-02 · Sin detección de manipulación | RF-022 |
| BR-03 · Sin búsqueda por hash | RF-022 |
| BR-04 · Sin verificación sin cuenta | RF-023 |

---

## 13. Limitación Conocida

`GET /api/verify/:documentId` devuelve el campo `signature.valid` con valor
constante `true`, porque en ese momento **no se ha recibido el archivo**: solo
se consultan metadatos. El valor `true` de esa ruta debe interpretarse como
«existe una firma registrada», no como «firma comprobada».

La comprobación criptográfica real ocurre exclusivamente en `POST /api/verify`.
Esta distinción queda registrada como pendiente de corrección en el
mantenimiento del sistema.

---

## 14. Verificación

Las pruebas que respaldan este proceso están en
`backend/tests/integration/verify.api.test.ts` y `backend/tests/unit/crypto.test.ts`.

| Prueba | Archivo | Resultado |
|--------|---------|:---------:|
| *verifica como VALID un archivo íntegro* | `verify.api.test.ts` | ✔ |
| *detecta MANIPULATED si el contenido cambió* | `verify.api.test.ts` | ✔ |
| *localiza coincidencias por hash sin indicar documento* | `verify.api.test.ts` | ✔ |
| *reporta NOT_FOUND para documentos desconocidos* | `verify.api.test.ts` | ✔ |
| *devuelve la información pública de verificación de un documento* | `verify.api.test.ts` | ✔ |
| *rechaza la verificación sin archivo* | `verify.api.test.ts` | ✔ |
| *verifica como válido un documento firmado e íntegro* | `unit/crypto.test.ts` | ✔ |
| *detecta firma inválida cuando se usa otra clave pública* | `unit/crypto.test.ts` | ✔ |

---

## 15. Referencias Cruzadas

- [`procesos_to_be.md`](procesos_to_be.md) — Mapa de procesos TO-BE
- [`proceso_to_be_01.md`](proceso_to_be_01.md) — Emisión y firma
- [`../../as_is/proceso_as_is_03.md`](../as_is/proceso_as_is_03.md) — Proceso AS-IS
- [`../../pruebas_calidad/matriz_pruebas.md`](../../pruebas_calidad/matriz_pruebas.md) — Pruebas de verificación
