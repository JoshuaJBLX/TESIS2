# Mapa de Procesos TO-BE — Estado Deseado

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

---

## 1. Propósito del Documento

Describe los procesos de la organización **después** de incorporar el SGD-FD.
Cada proceso TO-BE tiene un proceso AS-IS correspondiente en
[`../as_is/procesos_as_is.md`](../as_is/procesos_as_is.md), y cada cambio está
vinculado al requerimiento que lo habilita.

---

## 2. Mapa General de Procesos TO-BE

```
                        +-------------------------------+
                        |  NECESIDAD DE EMITIR UN       |
                        |  DOCUMENTO OFICIAL            |
                        +---------------+---------------+
                                        |
                        +---------------v---------------+
                        |  A. Emision, firma y          |
                        |     distribucion verificable  |
                        +---------------+---------------+
                                        |
              +-------------------------+-------------------------+
              |                         |                         |
    +---------v---------+   +---------v---------+   +-----------v---------+
    | B. Versionado     |   | C. Verificacion   |   | D. Coautoria        |
    |    inmutable      |   |    publica        |   |    gobernada        |
    +---------+---------+   +---------+---------+   +-----------+---------+
              |                         |                         |
              +-------------------------+-------------------------+
                                        |
                        +---------------v---------------+
                        |  E. Auditoria encadenada      |
                        |     y verificable             |
                        +-------------------------------+

   Valor entregado: el documento, su firma, su historial verificable y
   una via de verificacion publica que no requiere cuenta ni contacto.
```

---

## 3. Nivel 1 — Lista de Procesos TO-BE

| Código | Proceso TO-BE | Sustituye a | Archivo |
|--------|---------------|-------------|---------|
| P-01 | Emisión, firma y distribución verificable | P-01 AS-IS | [`proceso_to_be_01.md`](proceso_to_be_01.md) |
| P-02 | Versionado inmutable con firma | P-02 AS-IS | [`proceso_to_be_02.md`](proceso_to_be_02.md) |
| P-03 | Verificación pública sin cuenta | P-03 AS-IS | [`proceso_to_be_03.md`](proceso_to_be_03.md) |
| P-04 | Coautoría gobernada | P-04 AS-IS | [`proceso_to_be_04.md`](proceso_to_be_04.md) |
| P-05 | Auditoría encadenada y verificable | P-05 AS-IS | [`proceso_to_be_05.md`](proceso_to_be_05.md) |

---

## 4. Matriz de Mejora AS-IS → TO-BE

| # | Dimensión | AS-IS | TO-BE | Requerimientos |
|---|-----------|-------|-------|----------------|
| 1 | Tiempo de ciclo total | ~3,5 días | **~2 min** | Todos |
| 2 | Integridad del contenido | No verificable | Hash SHA-256 firmado | RF-006, RNF-001 |
| 3 | Autenticidad | Confianza personal | Firma RSA verificable | RF-021 |
| 4 | Detección de falsificación | 0 % | Detección por hash | RF-022 |
| 5 | Verificación externa | Requiere contacto | QR público, sin cuenta | RF-023 |
| 6 | Ambigüedad de versión | 35 % | 0 % (numeración correlativa) | RF-007 |
| 7 | Autoría conjunta | 70 % no registrada | 100 % registrada | RNF-044 |
| 8 | Diferencial de cambios | Manual | Automático línea a línea | RF-020 |
| 9 | Auditoría | Inexistente | Bitácora encadenada | RF-024 |
| 10 | Integridad de la auditoría | — | Detectable por cadena | RF-025 |
| 11 | Fuente única de verdad | No | Sí (repositorio con permisos) | RF-005, RF-011 |
| 12 | Evidencia de envío | Ninguna | Evento auditable + QR | RF-024, RF-010 |

---

## 5. Proceso por Proceso: Resumen

| Código | Flujo TO-BE | Tiempo | Indicador |
|--------|-------------|:------:|-----------|
| **P-01** | Subir archivo → el sistema calcula el hash, firma con la clave del propietario y emite el QR | < 2 s | Firma presente en el 100 % de las versiones |
| **P-02** | Nueva versión → numeración correlativa, hash, firma y motivo obligatorio | < 1 s | Numeración sin huecos ni repeticiones |
| **P-03** | Verificar → el sistema recalcula el hash, verifica la firma y devuelve un veredicto | < 500 ms | Detección de alteración al 100 % |
| **P-04** | Proponer → el coautor firma su propuesta; el propietario compara el diferencial y acepta o rechaza | < 1 s por paso | Coautor registrado en el 100 % de las aceptaciones |
| **P-05** | Auditar → toda acción genera una entrada encadenada; la cadena se puede verificar | < 2 s | Cadena válida o anomalía indicada |

---

## 6. Cambios Habilitantes por Proceso

| Requerimiento | Proceso TO-BE que lo habilita |
|---------------|------------------------------|
| RF-001 … RF-004 | P-01 (identidad y credenciales criptográficas) |
| RF-005, RF-010 | P-01, P-02 |
| RF-006, RF-007, RF-009 | P-02 |
| RF-008, RF-014, RF-019 | P-01, P-02 |
| RF-011, RF-012, RF-013 | P-01 |
| RF-015 … RF-019 | P-04 |
| RF-020 | P-04 |
| RF-021, RF-022, RF-023 | P-03 |
| RF-024, RF-025 | P-05 |
| RF-026, RF-027 | Transversal a todos |

---

## 7. Indicadores Objetivo del Estado Deseado

| Indicador | AS-IS | TO-BE objetivo | Cómo se mide |
|-----------|:-----:|:--------------:|--------------|
| Tiempo de ciclo documental | ~3,5 días | < 5 min | De `POST /api/docs` a la respuesta con QR |
| Documentos sin firma verificable | 100 % | 0 % | Versiones con firma en `document_signatures` |
| Versiones ambiguas | 35 % | 0 % | `UNIQUE(document_id, version_number)` |
| Tiempo de verificación | No disponible | < 2 s | `GET /api/verify/:id` |
| Detección de alteración | 0 % | 100 % | Pruebas de manipulación |
| Autoría conjunta registrada | 30 % | 100 % | `coauthor_id` informado |
| Integridad de la auditoría | No aplica | 100 % verificable | `GET /api/audit/verify-chain` |
| Documentos públicos verificables sin cuenta | 0 % | 100 % | Rutas públicas de verificación |

---

## 8. Riesgos de la Transición

| # | Riesgo | Mitigación |
|---|--------|------------|
| TR-01 | La resistencia del personal a verificar en lugar de confiar | Verificador público en 2 clics, con mensaje comprensible |
| TR-02 | La migración de documentos históricos no tiene firma | Se documenta como limitación; la firma aplica desde la fecha de adopción |
| TR-03 | Dependencia de un solo usuario administrador | El rol `admin` está definido; se recomienda segregar funciones |
| TR-04 | La pérdida de la clave privada por contraseña olvidada | Riesgo aceptado (`RK-10`): los documentos previos siguen verificables |
| TR-05 | El almacenamiento local no escala | Plan de migración a Supabase documentado |

---

**Documentos relacionados**

- [`../as_is/procesos_as_is.md`](../as_is/procesos_as_is.md) — Mapa de procesos AS-IS
- [`../../arquitectura/arquitectura.md`](../../arquitectura/arquitectura.md) — Arquitectura
- [`../../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
