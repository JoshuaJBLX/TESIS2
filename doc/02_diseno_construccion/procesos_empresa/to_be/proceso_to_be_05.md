# Proceso TO-BE 05 — Auditoría encadenada y verificable

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-05 |
| **Nombre** | Auditoría encadenada y verificable |
| **Sustituye a** | [`P-05 AS-IS`](../as_is/proceso_as_is_05.md) |
| **Área** | Todas; con control de acceso de administrador |
| **Responsable** | Administrador del sistema |
| **Tipo** | Control y apoyo |
| **Implementación** | `GET /api/audit` y `GET /api/audit/verify-chain` — `services/audit.service.ts` |

---

## 2. Objetivo del Proceso

Registrar **toda acción relevante del sistema** en una bitácora que no pueda
alterarse sin ser detectada, y que permita demostrar en cualquier momento:

- qué ocurrió;
- quién lo provocó;
- sobre qué entidad;
- en qué momento.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Cualquier acción con efecto: registro de usuario, inicio de sesión, emisión de
documento, creación de versión, propuesta aceptada o rechazada, cambio de
visibilidad.

### 3.2. Resultado Esperado

```
GET /api/audit/verify-chain
{
  "valid": true,
  "entries": 148,
  "brokenAt": null
}
```

o, si alguien alteró un registro:

```
{ "valid": false, "entries": 148, "brokenAt": 57, "reason": "current_hash no coincide" }
```

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Descripción |
|---------|-------------|
| Evento | Tipo, entidad, identificador, usuario y datos |
| `previousHash` | Hash del evento anterior, leído del último registro |
| Filtros de consulta | `eventType`, `entityType`, `from`, `to`, `limit`, `offset` |

### 4.2. Salidas

| Salida | Descripción |
|--------|-------------|
| `audit_log` | Registro inmutable con `previous_hash` y `current_hash` |
| Listado filtrado | Eventos paginados, del más reciente al más antiguo |
| Veredicto de cadena | Válida o punto exacto de ruptura |

---

## 5. Actores y Roles

| Actor | Rol | Acceso |
|-------|-----|--------|
| Administrador | Consulta y verifica la bitácora | `GET /api/audit`, `GET /api/audit/verify-chain` |
| Usuario | Genera eventos indirectamente | Sin acceso directo a la bitácora |
| Auditor externo | Verifica la cadena con su propia implementación | Lectura del hash de la cadena |

> **Restricción:** ambas rutas exigen rol `admin`. Un usuario común no puede
> leer la bitácora: conocer los eventos sería conocer la actividad ajena.

---

## 6. Reglas de Negocio

| # | Regla |
|---|--------|
| RN-1 | Cada evento se encadena con el anterior mediante `previous_hash` |
| RN-2 | `current_hash = SHA-256(canonicalización del evento)` |
| RN-3 | La canonicalización es estable: claves fijas y `event_data` como objeto, no como cadena |
| RN-4 | El primer evento tiene `previous_hash = null` |
| RN-5 | La tabla es de solo adición: no hay ninguna ruta ni servicio que actualice o borre registros |
| RN-6 | Cualquier modificación de un registro antiguo rompe el encadenamiento de todos los posteriores |
| RN-7 | `verifyChain()` recorre la bitácora en orden ascendente y valida cada eslabón |
| RN-8 | Al detectar una ruptura, se informa el `id` exacto del registro alterado |
| RN-9 | La lectura de eventos y la verificación solo pueden ser realizadas por el rol `admin` |

### 6.1. Evento canónico

```json
{
  "eventType": "VERSION_CREATED",
  "entityType": "document",
  "entityId": "doc-abc",
  "userId": "user-1",
  "eventData": { "versionNumber": 2, "changeDescription": "Actualizacion del anexo" },
  "previousHash": "9f2c...",
  "timestamp": "2026-09-29T14:03:22.117Z"
}
```

`current_hash` es el SHA-256 de la serialización JSON de ese objeto, en ese
orden de claves. La canonicalización es lo que hace la verificación
reproducible por un tercero.

---

## 7. Diagrama del Proceso

```
 Inicio (una accion relevante ocurre en el sistema)
   |
   v
 El servicio correspondiente construye el evento
 (eventType, entityType, entityId, userId, eventData)
   |
   v
 Leer el ultimo registro: SELECT current_hash ... ORDER BY id DESC LIMIT 1
   |
   v
 (Existe un registro anterior?)
   |  No --> previousHash = null
   |  Si --> previousHash = ese current_hash
   v
 Construir la carga util y canonicalizarla
   |
   v
 currentHash = SHA-256(carga canonica)
   |
   v
 INSERT INTO audit_log (...)   --> de solo adicion
   |
   v
 saveDatabase()   --> persistencia a disco
   |
   v
 Fin
   =====================================================================

 Inicio (el administrador audita)
   |
   v
 GET /api/audit/verify-chain
   |
   v
 Leer TODOS los eventos en orden ASC
   |
   v
 previousHash = null
   |
   v
 Para cada evento:
   |
   v
 (event.previous_hash === previousHash?)
   |  No --> ROTA en este id: "previous_hash no coincide" --> Fin
   |  Si
   v
 (SHA-256(canonical(evento)) === event.current_hash?)
   |  No --> ROTA en este id: "current_hash no coincide" --> Fin
   |  Si
   v
 previousHash = event.current_hash
   |
   v
 (Quedan eventos?)
   |  Si --> siguiente evento
   |  No
   v
 CADENA VALIDA: { valid: true, entries: N, brokenAt: null }
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Es la primera entrada de la cadena? | `previous_hash = null` |
| D-2 | ¿El eslabón anterior coincide? | Detecta inserciones y eliminaciones |
| D-3 | ¿El hash recalculado coincide? | Detecta modificaciones de contenido |

> La verificación es **autorreferencial**: no depende de una clave secreta. Eso
> permite a un tercero recalcular la cadena y obtener el mismo veredicto, pero
> también significa que un atacante con acceso a la base de datos podría
> recalcular todos los hashes posteriores. La protección real es el control de
> acceso al archivo, no el algoritmo.

---

## 8. Actividades

| # | Actividad | Tiempo | Automatizada |
|---|-----------|:------:|:------------:|
| A-1 | Leer el hash del último evento | 5 ms | Sí |
| A-2 | Canonicalizar y calcular SHA-256 | 1 ms | Sí |
| A-3 | Insertar el registro | 10 ms | Sí |
| A-4 | Persistir a disco | 30 ms | Sí |
| A-5 | Verificar la cadena completa | 2 ms por evento | Sí |
| A-6 | Presentar el listado filtrado | 20 ms | Sí |

**Coste por evento: ~46 ms.** La verificación de *N* eventos es **O(N)**.

---

## 9. Sistemas y Puntos de Integración

```
 DocumentService, AuthService
            |
            | auditService.append(...)
            v
     audit_log  (previous_hash, current_hash)
            |
            +--> GET /api/audit            (admin)
            +--> GET /api/audit/verify-chain (admin)
            v
       Veredicto de integridad
```

| Punto de integración | Nota |
|----------------------|------|
| Eventos conectados | Registro e inicio de sesión, emisión de documento, nueva versión, propuestas, cambio de visibilidad |
| Persistencia | `saveDatabase()` escribe el archivo SQLite tras cada evento |
| Control de acceso | Middleware `requireAdmin` |

---

## 10. Indicadores

### 10.1. Tiempo de Ciclo

| Concepto | AS-IS | TO-BE |
|----------|:-----:|:-----:|
| Tiempo de respuesta ante una auditoría | 3 días (búsqueda manual) | **< 100 ms** |
| Registro de una acción | Imposible | **~46 ms** |
| Verificación de la integridad del historial | Imposible | **O(N), ~2 ms por evento** |

### 10.2. Tasa de Errores

| Error | AS-IS | TO-BE |
|-------|:-----:|:-----:|
| Acciones sin rastro | 100 % | **0 %** |
| Respuestas basadas en memoria | 60 % | **0 %** |
| Alteración de la bitácora sin detección | Indeterminable | **Detectada** en la verificación |
| Documento no localizado | 30 % | **0 %** (fuente única de verdad) |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Registro de toda acción relevante | ✔ `auditService.append()` en cada servicio |
| Bitácora de solo adición | ✔ Sin rutas de actualización ni borrado |
| Detección de alteración | ✔ `verifyChain()` |
| Acceso restringido | ✔ Solo rol `admin` |
| Localización del documento vigente | ✔ `version_number` correlativo |

---

## 11. Problemas Resueltos

| Problema AS-IS | Resolución |
|----------------|-----------|
| PR-01 · Sin fuente única de verdad | Repositorio con permisos y versión correlativa |
| PR-02 · La fecha no es evidencia | Hash del contenido y bitácora encadenada |
| PR-03 · Respuesta basada en memoria | Datos consultables y verificables |
| PR-04 · Sin registro de consultas | Cada acción genera un evento con autor y fecha |

---

## 12. Brechas Resueltas

| Brecha AS-IS | Requerimiento |
|--------------|---------------|
| BR-01 · Sin fuente única de verdad | RF-005, RF-011 |
| BR-02 · Sin hash del contenido | RF-006, RF-022 |
| BR-03 · Sin bitácora | RF-024 |
| BR-04 · Sin integridad de la auditoría | RF-025 |

---

## 13. Limitación Conocida

La verificación de cadena es **autorreferencial**: usa el mismo SHA-256 que
generó los registros y no incorpora ningún secreto. Un atacante con permiso de
escritura sobre el archivo SQLite podría alterar un evento y recalcular todos
los hashes posteriores, obteniendo una cadena que el sistema declararía válida.

En un despliegue local de un solo servidor, el control de acceso al archivo
(`backend/data/`) es la barrier real. En un entorno multiusuario o cloud se
requeriría anchoring externo de la cadena, por ejemplo publicando periódicamente
el `current_hash` más reciente en un registro con marca de tiempo de un tercero.

---

## 14. Verificación

Las pruebas que respaldan este proceso están en
`backend/tests/services/audit.service.test.ts` y
`backend/tests/integration/audit.api.test.ts`.

| Prueba | Archivo | Resultado |
|--------|---------|:---------:|
| *encadena los eventos con hashes SHA-256* | `audit.service.test.ts` | ✔ |
| *verifica la cadena completa como válida* | `audit.service.test.ts` | ✔ |
| *es de solo-append: no se pueden actualizar ni borrar registros* | `audit.service.test.ts` | ✔ |
| *detecta una manipulación si se rompe el encadenamiento* | `audit.service.test.ts` | ✔ |
| *lista y filtra eventos* | `audit.service.test.ts` | ✔ |
| *exige rol de administrador* | `audit.api.test.ts` | ✔ |
| *listas eventos generados por el uso del sistema* | `audit.api.test.ts` | ✔ |
| *filtra por tipo de evento* | `audit.api.test.ts` | ✔ |
| *verifica la integridad de la cadena de auditoría* | `audit.api.test.ts` | ✔ |

---

## 15. Referencias Cruzadas

- [`procesos_to_be.md`](procesos_to_be.md) — Mapa de procesos TO-BE
- [`../../as_is/proceso_as_is_05.md`](../as_is/proceso_as_is_05.md) — Proceso AS-IS
- [`../../arquitectura/arquitectura.md`](../../arquitectura/arquitectura.md) — Arquitectura
- [`../../pruebas_calidad/matriz_pruebas.md`](../../pruebas_calidad/matriz_pruebas.md) — Pruebas de auditoría
