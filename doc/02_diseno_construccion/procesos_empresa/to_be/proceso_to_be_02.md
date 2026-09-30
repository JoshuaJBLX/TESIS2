# Proceso TO-BE 02 — Versionado inmutable con firma

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-02 |
| **Nombre** | Versionado inmutable con firma |
| **Sustituye a** | [`P-02 AS-IS`](../as_is/proceso_as_is_02.md) |
| **Área** | Todas |
| **Responsable** | Propietario del documento |
| **Tipo** | Operativo |
| **Implementación** | `PUT /api/docs/:id` — `services/document.service.ts` |

---

## 2. Objetivo del Proceso

Publicar una nueva versión de un documento de forma que:

- nunca se sobrescriba una versión existente;
- la numeración sea correlativa y sin ambigüedad;
- cada versión quede firmada por su autor;
- el motivo del cambio quede registrado de forma obligatoria.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

El propietario modifica el documento y decide publicar una versión nueva.

### 3.2. Resultado Esperado

```
200 OK
{
  versionId, versionNumber: N + 1,
  contentHash: "<sha-256>",
  signature: { algorithm: "RSA-SHA256", signedAt },
  previousVersionId, previousHash
}
```

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Regla de validación |
|---------|---------------------|
| `file` | MIME permitido; ≤ 10 MB |
| `changeDescription` | **Obligatorio**, 1–500 caracteres |
| `password` | Contraseña de firma del propietario |
| `id` | Documento existente; el usuario debe ser propietario |

### 4.2. Salidas

| Salida | Consumidor |
|--------|-----------|
| Nueva versión numerada | Propietario |
| Hash y firma de la nueva versión | Verificadores |
| Hash de la versión anterior | Permite demostrar la continuidad |
| Evento `VERSION_CREATED` en la bitácora | Auditoría |

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Propietario | Publica la versión y firma |
| Auditor | Verifica la cadena de versiones |
| Destinatario | Consulta cuál es la versión vigente |

---

## 6. Reglas de Negocio

| # | Regla |
|---|--------|
| RN-1 | El número de versión se calcula como `MAX(version_number) + 1` dentro de una transacción |
| RN-2 | Existe una restricción `UNIQUE(document_id, version_number)`: nunca hay dos versiones con el mismo número |
| RN-3 | Las versiones son inmutables: no existe ninguna ruta `DELETE` ni `PUT` sobre una versión existente |
| RN-4 | `changeDescription` es obligatorio; sin él, la operación devuelve `400` |
| RN-5 | Cada versión se firma con la clave privada del propietario, descifrada con su contraseña |
| RN-6 | Si el contenido de la nueva versión es idéntico al de la anterior (mismo hash), se rechaza para no inflar el historial |
| RN-7 | La firma de la nueva versión encadena el hash anterior, formando una cadena verificable |

---

## 7. Diagrama del Proceso

```
 Inicio (el propietario publica un cambio)
   |
   v
 Validar archivo, motivo y contrasena
   |  Motivo vacio --> 400 "changeDescription requerido" --> Fin
   |  Contrasena incorrecta --> 400 --> Fin
   |  Valido
   v
 Calcular el hash de la nueva version
   |
   v
 (El hash es identico al de la version vigente?)
   |  Si --> 400 "el contenido no cambio" --> Fin (se conserva la version actual)
   |  No
   v
 Firmar: RSA-SHA256(nuevoHash)  [con el hash anterior en el historial]
   |
   v
 Insertar la nueva version con version_number = MAX + 1
   |
   v
 Registrar VERSION_CREATED en la bitacora encadenada
   |
   v
 Devolver la nueva version, su hash y su firma
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿El motivo está informado? | Sin motivo, no se publica |
| D-2 | ¿La contraseña es correcta? | Sin ella no se firma |
| D-3 | ¿El contenido cambió realmente? | Evita versiones fantasma |

---

## 8. Actividades

| # | Actividad | Tiempo | Automatizada |
|---|-----------|:------:|:------------:|
| A-1 | Validar entrada | 20 ms | Sí |
| A-2 | Calcular SHA-256 | 50 ms | Sí |
| A-3 | Comparar con el hash vigente | 5 ms | Sí |
| A-4 | Descifrar clave y firmar | 400 ms | Sí |
| A-5 | Calcular `version_number` e insertar | 40 ms | Sí |
| A-6 | Registrar en la bitácora | 20 ms | Sí |

**Tiempo total: < 1 s** frente a las ~4 h del proceso AS-IS.

---

## 9. Sistemas y Puntos de Integración

```
 Cliente
   |  PUT /api/docs/:id  (multipart: file, changeDescription, password)
   v
 DocumentService.createVersion()
   |
   +--> db: SELECT MAX(version_number) ...
   +--> crypto/signature.ts
   +--> db: INSERT document_versions
   +--> db: INSERT document_signatures
   +--> audit.service.record()  (cadena de hashes)
   v
 Respuesta con la nueva version firmada
```

**Invariante de base de datos que respalda el proceso:**

```sql
UNIQUE(document_id, version_number)
```

Es la garantía real de que no habrá ambigüedad de versión, aunque el código
fallara. La regla RN-1 no depende solo de la aplicación.

---

## 10. Indicadores

### 10.1. Tiempo de Ciclo

| Concepto | AS-IS | TO-BE |
|----------|:-----:|:-----:|
| Tiempo de proceso | ~4 h | **< 1 s** |
| Tiempo de espera | hasta 1 día | 0 |
| Tiempo de ciclo total | ~1 día | **< 1 s** |

### 10.2. Tasa de Errores

| Error | AS-IS | TO-BE |
|-------|:-----:|:-----:|
| Se sobrescribe una versión | 10 % | **0 %** (no existe ruta de borrado) |
| Se confunde cuál es la vigente | 35 % | **0 %** (`MAX + 1` correlativo) |
| Se publica un cambio sin motivo | 60 % | **0 %** (campo obligatorio) |
| Se registra una versión sin cambios | 20 % | **0 %** (comparación de hash) |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Historial inmutable | ✔ Sin rutas de borrado ni restricción de FK con `CASCADE` sobre versiones |
| Numeración inequívoca | ✔ `UNIQUE(document_id, version_number)` |
| Motivo obligatorio | ✔ Validación en ruta y servicio |
| Firma por versión | ✔ Automática |

---

## 11. Problemas Resueltos

| Problema AS-IS | Resolución |
|----------------|-----------|
| PR-01 · Sufijos en el nombre del archivo | Numeración correlativa en base de datos |
| PR-02 · Sobrescritura accidental | Inmutabilidad sin ruta de eliminación |
| PR-03 · «v_final», «v2» y «v3» mezclados | Un solo campo `version_number` |
| PR-04 · Motivo ausente u opcional | `changeDescription` obligatorio |
| PR-05 · Fecha de modificación como criterio | Sustituida por hash y número de versión |

---

## 12. Brechas Resueltas

| Brecha AS-IS | Requerimiento |
|--------------|---------------|
| BR-01 · Sin control de versiones | RF-007 |
| BR-02 · Sin historial de cambios | RF-008, RF-009 |
| BR-03 · Sin integridad de la versión | RF-006, RNF-001 |
| BR-04 · Motivo no exigido | RF-019 |

---

## 13. Verificación

Las pruebas que respaldan este proceso están en
`backend/tests/integration/documents.api.test.ts` y
`backend/tests/services/document.service.test.ts`.

| Prueba | Archivo | Resultado |
|--------|---------|:---------:|
| *crea la versión 2 al actualizar el documento* | `documents.api.test.ts` | ✔ |
| *crea la version 2 al actualizar y mantiene el historial* | `document.service.test.ts` | ✔ |
| *solo el propietario puede actualizar documentos privados* | `document.service.test.ts` | ✔ |
| *compara versiones de texto* | `documents.api.test.ts` | ✔ |
| *detecta adiciones, eliminaciones y cambios entre versiones* | `unit/document-analysis.test.ts` | ✔ |
| *reporta archivos idénticos sin adiciones ni eliminaciones* | `unit/document-analysis.test.ts` | ✔ |

> La numeración correlativa está garantizada por la restricción
> `UNIQUE(document_id, version_number)` del esquema, además de por el cálculo
> `MAX + 1` del servicio.

---

## 14. Referencias Cruzadas

- [`procesos_to_be.md`](procesos_to_be.md) — Mapa de procesos TO-BE
- [`proceso_to_be_01.md`](proceso_to_be_01.md) — Emisión y firma
- [`../../as_is/proceso_as_is_02.md`](../as_is/proceso_as_is_02.md) — Proceso AS-IS
- [`../../arquitectura/modelo_datos.md`](../../arquitectura/modelo_datos.md) — Restricciones de la base de datos
