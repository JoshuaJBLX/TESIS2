# Proceso TO-BE 04 — Coautoría gobernada

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-04 |
| **Nombre** | Coautoría gobernada |
| **Sustituye a** | [`P-04 AS-IS`](../as_is/proceso_as_is_04.md) |
| **Área** | Todas |
| **Responsable** | Propietario del documento (decide) |
| **Tipo** | Operativo |
| **Implementación** | Rutas `/api/docs/:id/proposals` y `/api/docs/:id/compare` |

---

## 2. Objetivo del Proceso

Permitir que varias personas construyan un mismo documento de forma conjunta y
**dejar constancia criptográfica de quién propuso qué, sobre qué versión, y de
quién quedó como responsable de la versión resultante**.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Un usuario registrado, con acceso al documento, necesita aportar una versión
modificada para su revisión por el propietario.

### 3.2. Resultado Esperado

Una propuesta en estado `PENDING`, firmada con las claves del coautor, adjunta a
una versión concreta del documento. Al ser aceptada, genera una **nueva versión
firmada en la que el coautor queda registrado**.

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Regla de validación |
|---------|---------------------|
| `file` | MIME permitido; ≤ 10 MB; **el documento debe ser público** |
| `changeDescription` | Motivo del cambio |
| `password` | Contraseña de firma del coautor |
| `documentId` | Documento existente |
| `versionNumber` | Versión sobre la que se propone el cambio |

### 4.2. Salidas

| Salida | Descripción |
|--------|-------------|
| Propuesta creada | Estado `PENDING`, con su firma |
| Diferencial | Comparación línea a línea entre versión y propuesta |
| Evento `PROPOSAL_CREATED` | Entrada en la bitácora |
| Nueva versión | Al aceptar: firmada por el propietario, con `coauthor_id` |
| Eventos `PROPOSAL_ACCEPTED` / `PROPOSAL_REJECTED` | Trazabilidad de la decisión |

---

## 5. Actores y Roles

| Actor | Rol | Puede |
|-------|-----|--------|
| Propietario | Decide sobre las propuestas | Crear, aceptar, rechazar |
| Coautor | Propone cambios | Crear propuestas |
| Visitante | Consulta documentos públicos | Descargar propuestas, comparar, **no proponer** |
| Administrador | Supervisa | Lo mismo que el propietario, según diseño |

> **Restricción deliberada:** las propuestas solo se aceptan en documentos
> **públicos**. Un documento privado no se puede coescribir, porque el
> coautor necesitaría descargarlo para proponer cambios y eso expondría el
> contenido.

---

## 6. Reglas de Negocio

| # | Regla |
|---|--------|
| RN-1 | Toda propuesta se firma con la clave privada del coautor, descifrada con su contraseña |
| RN-2 | La propuesta se ancla a un `versionNumber` concreto: no puede aplicarse sobre otra base |
| RN-3 | Los estados posibles son `PENDING`, `ACCEPTED` y `REJECTED` |
| RN-4 | Solo el propietario puede aceptar o rechazar |
| RN-5 | Aceptar requiere de nuevo la contraseña del propietario: se crea una versión firmada por él |
| RN-6 | Al aceptar, la versión resultante registra `coauthor_id` y `proposal_id` |
| RN-7 | Rechazar deja constancia del motivo y no altera ninguna versión existente |
| RN-8 | La comparación de artefactos es accesible sin autenticación si el documento es público |
| RN-9 | Un archivo binario sin texto extraíble no produce diferencial de líneas, pero sí de metadatos (nombre, tamaño, hash, origen) |

---

## 7. Diagrama del Proceso

```
 Inicio (un coautor quiere aportar cambios)
   |
   v
 (El documento es publico?)
   |  No --> 403 "no se permiten propuestas en documentos privados" --> Fin
   |  Si
   v
 El coautor descarga la version vigente y prepara su version
   |
   v
 POST /api/docs/:id/proposals  (file, changeDescription, password)
   |
   v
 Validar la contrasena de firma del coautor
   |  Incorrecta --> 400 --> Fin
   |  Correcta
   v
 Calcular el hash de la propuesta y firmarla
   |
   v
 Registrar la propuesta con estado PENDING, sobre versionNumber
   |
   v
 Registrar PROPOSAL_CREATED en la bitacora
   |
   v
 Responder 201 con la propuesta creada
   |
   v
 (El coautor revisa el diferencial?)
   |  GET /api/docs/:id/compare?sourceType=version&targetType=proposal
   v
 El propietario revisa el diferencial
   |
   v
 (Acepta la propuesta?)
   |  No --> POST .../reject  --> Registrar PROPOSAL_REJECTED --> Fin
   |  Si
   v
 POST .../accept  (password del propietario)
   |
   v
 Firmar la nueva version con la clave del propietario
   |
   v
 Insertar version_number = MAX + 1 con coauthor_id y proposal_id
   |
   v
 Marcar la propuesta como ACCEPTED
   |
   v
 Registrar PROPOSAL_ACCEPTED y VERSION_CREATED en la bitacora
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿El documento es público? | Condición previa a la coautoría |
| D-2 | ¿La contraseña del coautor es válida? | Sin ella no se firma la propuesta |
| D-3 | ¿Acepta el propietario? | Bifurca en nueva versión o rechazo |
| D-4 | ¿La contraseña del propietario es válida? | Requisito para firmar la versión final |

---

## 8. Actividades

| # | Actividad | Tiempo | Automatizada |
|---|-----------|:------:|:------------:|
| A-1 | Validar documento público y contraseña | 420 ms | Sí |
| A-2 | Calcular hash y firmar la propuesta | 50 ms | Sí |
| A-3 | Registrar la propuesta | 20 ms | Sí |
| A-4 | Calcular el diferencial | 120 ms | Sí |
| A-5 | Revisar el diferencial | 5 min | **No** (decisión humana) |
| A-6 | Firmar la nueva versión | 420 ms | Sí |
| A-7 | Registrar coautor y eventos | 30 ms | Sí |

**Tiempo de proceso: < 2 s por paso automático.**
**Tiempo de ciclo total: ~5 min**, dominado por la decisión humana, frente a
los ~3 días del proceso AS-IS.

---

## 9. Sistemas y Puntos de Integración

```
 Coautor                    Propietario
   |                            |
   | POST /proposals            | GET /compare
   v                            v
   +---------- DocumentService --+
                |
                +--> crypto/signature.ts     (firma de la propuesta)
                +--> services/document-analysis.ts
                |     extractComparableText()      (extraccion de texto)
                |     compareComparableArtifacts() (diff + metadatos)
                +--> db: version_proposals
                +--> audit.service.record()  (PROPOSAL_*, VERSION_CREATED)
                v
           Respuesta con la propuesta y su diferencial
```

| Punto de integración | Tecnología |
|----------------------|-----------|
| Subida de la propuesta | `multer`, `uploads/proposals/` |
| Diferencial | Algoritmo de líneas propio, sin dependencia de Python |
| Persistencia | Tabla `version_proposals` |

---

## 10. Indicadores

### 10.1. Tiempo de Ciclo

| Concepto | AS-IS | TO-BE |
|----------|:-----:|:-----:|
| Tiempo de proceso | ~1 h 48 min | **< 2 s** |
| Tiempo de espera | ~2 días | ~5 min |
| Tiempo de ciclo total | **~3 días** | **~5 min** |

### 10.2. Tasa de Errores

| Error | AS-IS | TO-BE |
|-------|:-----:|:-----:|
| Autoría conjunta no registrada | 70 % | **0 %** (`coauthor_id`) |
| Cambio integrado parcialmente | 25 % | **0 %** (el archivo de la propuesta se firma íntegro) |
| Propuesta perdida | 15 % | **0 %** (tabla `version_proposals`) |
| Decisión sin registro | 60 % | **0 %** (eventos en bitácora) |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Registrar la propuesta y su autor | ✔ `proposer_id` |
| Mostrar el diferencial | ✔ `GET /:id/compare` |
| Firmar la versión resultante | ✔ Firma del propietario |
| Registrar al coautor en la versión final | ✔ `coauthor_id` |

---

## 11. Problemas Resueltos

| Problema AS-IS | Resolución |
|----------------|-----------|
| PR-01 · Autoría conjunta invisible | `coauthor_id` en la versión aceptada |
| PR-02 · Comparación manual | Diferencial automático línea a línea |
| PR-03 · Propuestas perdidas | Bandeja de propuestas con estado |
| PR-04 · Decisiones sin registro | Eventos `PROPOSAL_ACCEPTED` / `PROPOSAL_REJECTED` |

---

## 12. Brechas Resueltas

| Brecha AS-IS | Requerimiento |
|--------------|---------------|
| BR-01 · Sin registro de propuesta ni autor | RF-015, RF-016 |
| BR-02 · Sin bandeja de propuestas | RF-017 |
| BR-03 · Sin diferencial del sistema | RF-020 |
| BR-04 · Sin autoría conjunta | RNF-044 |
| BR-05 · Sin firma propia de la propuesta | RNF-043, RF-018 |

---

## 13. Verificación

Las pruebas que respaldan este proceso están en
`backend/tests/integration/documents.api.test.ts`,
`backend/tests/services/document.service.test.ts` y
`backend/tests/unit/document-analysis.test.ts`.

| Prueba | Archivo | Resultado |
|--------|---------|:---------:|
| *gestiona propuestas: crear, rechazar y aceptar* | `documents.api.test.ts` | ✔ |
| *no permite propuestas en documentos privados* | `documents.api.test.ts` | ✔ |
| *crea, acepta y rechaza propuestas firmadas* | `document.service.test.ts` | ✔ |
| *solo acepta propuestas en documentos públicos* | `document.service.test.ts` | ✔ |
| *un tercero puede descargar propuestas de documentos públicos* | `document.service.test.ts` | ✔ |
| *compara versiones de texto* | `documents.api.test.ts` | ✔ |
| *compara dos versiones de un documento de texto* | `document.service.test.ts` | ✔ |
| *detecta adiciones, eliminaciones y cambios entre versiones* | `unit/document-analysis.test.ts` | ✔ |
| *registra diferencias de metadatos* | `unit/document-analysis.test.ts` | ✔ |
| *no muestra diffs de línea cuando no hay texto extraíble* | `unit/document-analysis.test.ts` | ✔ |

---

## 14. Referencias Cruzadas

- [`procesos_to_be.md`](procesos_to_be.md) — Mapa de procesos TO-BE
- [`proceso_to_be_02.md`](proceso_to_be_02.md) — Versionado inmutable
- [`../../as_is/proceso_as_is_04.md`](../as_is/proceso_as_is_04.md) — Proceso AS-IS
- [`../../pruebas_calidad/matriz_pruebas.md`](../../pruebas_calidad/matriz_pruebas.md) — Pruebas de coautoría
