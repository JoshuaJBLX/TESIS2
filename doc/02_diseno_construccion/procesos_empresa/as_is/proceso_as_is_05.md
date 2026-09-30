# Proceso AS-IS 05 — Consulta de la fuente autorizada

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| **Campo** | Valor |
|-------|-------|
| **Código** | P-05 |
| **Nombre** | Consulta de la fuente autorizada |
| **Proceso TO-BE equivalente** | P-05 — Auditoría encadenada y verificable |
| **Área** | Todas |
| **Responsable** | Quien consulta |
| **Tipo** | Apoyo |
| **Estado** | Vigente (búsqueda manual en carpetas) |

---

## 2. Objetivo del Proceso

Determinar cuál es la versión vigente de un documento, quién la emitió y si ha
sido modificada.

Este proceso es el que convierte todos los problemas anteriores en un hecho
comprobable: cuando alguien pregunta «¿esto es lo último?», la respuesta exige
un proceso de búsqueda que en el estado actual no tiene resultado fiable.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Duda sobre el estado de un documento: una disputa, una auditoría, una
verificación ante un tercero.

### 3.2. Resultado Esperado

Una respuesta basada en evidencia. En la práctica, la respuesta suele ser una
opinión: «creo que sí».

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Origen |
|---------|--------|
| Nombre aproximado del documento | Quien consulta |
| Carpeta de red o buzón | Repositorio disperso |

### 4.2. Salidas

| Salida | Formato |
|--------|---------|
| Copia del archivo «supuestamente» vigente | PDF / DOCX |
| Declaración no formalizada | Respuesta oral o informal |

### 4.3. Consumidores

Quien originó la consulta.

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Consultante | Busca y pregunta |
| Responsable del área | Confirma o desmiente de memoria |
| *(Ausente)* | Ningún sistema que responda |

---

## 6. Reglas de Negocio Actuales

| # | Regla | Formalidad |
|---|-------|-----------|
| RN-1 | La versión vigente es la de fecha de modificación más reciente | Consuetudinaria |
| RN-2 | Se confirma preguntando al responsable del área | Consuetudinaria |
| RN-3 | En caso de duda, se aplica el archivo más grande (suposición) | **Informal y peligrosa** |
| RN-4 | No existe un registro de consultas | **Ausente** |

> RN-3 es especialmente problemática: el tamaño del archivo no es un criterio
> de versión. Un cambio tipográfico puede alterar el tamaño sin cambiar el
> contenido normativo, y viceversa.

---

## 7. Diagrama del Proceso

```
 Inicio (alguien duda de un documento)
   |
   v
 Buscar por nombre en carpetas y buzones
   |
   v
 (Se encuentra una sola copia?)
   |  No --> Buscar en otras areas --> (Encontrada?) -- No --> Fin (no se encuentra)
   |  Si                                              |  Si
   v                                                  v
 (Cual es la version vigente?)
   |
   v
 Revisar fechas de modificacion  -->  Critico
   |  (Las fechas son fiables?)                        |
   v                                                    v
 Preguntar al responsable del area                     Usar la copia
   |                                                    encontrada
   v                                                    |
 (Confirma la version?)                                 v
   |  No --> Volver a buscar                            Fin
   |  Si
   v
 Usar la copia confirmada
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Se encontró una sola copia? | Si hay varias, el proceso se complica |
| D-2 | ¿Cuál es la versión vigente? | Se responde por fecha, no por número |
| D-3 | ¿Las fechas son fiables? | Copiar un archivo cambia su fecha |
| D-4 | ¿El responsable confirma? | Confirmación verbal, sin registro |

---

## 8. Actividades Actuales

| # | Actividad | Tiempo | Problema |
|---|-----------|:------:|----------|
| A-1 | Buscar por nombre en carpetas | 5 min | El nombre no es criterio fiable |
| A-2 | Revisar fechas de modificación | 2 min | Se alteran al copiar |
| A-3 | Comparar tamaños | 1 min | Criterio inválido (RN-3) |
| A-4 | Preguntar al responsable | 1 h espera | Respuesta verbal, sin registro |
| A-5 | Entregar la copia | 1 min | — |
| A-6 | *(No existe)* Registro de la consulta | — | — |
| A-7 | *(No existe)* Verificación criptográfica | — | — |

---

## 9. Sistemas y Puntos de Integración

```
 Carpetas de red  ──┐
 Buzones de correo ─┼──▶ Busqueda manual ──▶ Respuesta verbal
 Almacenamiento USB ┘
```

No hay sistema. El «sistema» es la búsqueda de archivos.

---

## 10. Indicadores del Estado Actual

### 10.1. Tiempo de Ciclo

| Concepto | Valor |
|----------|-------|
| Tiempo activo | ~10 min |
| Tiempo de espera (respuesta del responsable) | ~1 día |
| Tiempo de ciclo total | ~10 min (si se encuentra) / hasta 3 días (si no) |

**El 30 % de las consultas no se resuelven.**

### 10.2. Tasa de Errores

| Error | Frecuencia estimada |
|-------|:-------------------:|
| Se entrega una versión que no es la vigente | 35 % |
| El documento no se encuentra | 30 % |
| Se respuesta desde el recuerdo, no desde la evidencia | 60 % |
| Se pierde tiempo buscando sin resultado | 45 % |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Identificar la versión vigente | **30 % de acierto** |
| Conocer el autor de cada versión | **Imposible** |
| Saber si el contenido fue alterado | **Imposible** |
| Dejar constancia de la consulta | **Imposible** |

---

## 11. Problemas Detectados

### PR-01 · No hay una fuente única de verdad

El mismo documento puede estar en cuatro lugares, con cuatro contenidos
distintos. No hay un repositorio oficial.

### PR-02 · La fecha de modificación no es evidencia

Copiar un archivo actualiza su fecha. Cualquier usuario puede «actualizar» la
fecha de un documento sin cambiarlo, o alterar su contenido sin que la fecha
lo delate.

### PR-03 · Respuesta basada en la memoria

El responsable del área responde de memoria. Tres meses después, esa respuesta
ya no es verificable.

### PR-04 · Sin registro de consultas

No hay forma de demostrar que alguien consultó un documento, ni qué le
respondieron. Esto es crítico en un contexto legal.

---

## 12. Brechas Identificadas

| # | Brecha | Cubierta por |
|---|--------|--------------|
| BR-01 | Sin fuente única de verdad | RF-005, RF-011 |
| BR-02 | Sin hash que identifique el contenido | RF-022 |
| BR-03 | Sin bitácora de consultas y acciones | RF-024, RF-025 |
| BR-04 | Sin verificación de la integridad | RF-021 |

---

## 13. Oportunidades de Automatización

| # | Oportunidad | Proceso TO-BE |
|---|------------|---------------|
| OP-01 | Repositorio único con autorización por propietario | P-05 TO-BE |
| OP-02 | Versión vigente identificable por número correlativo | P-05 TO-BE |
| OP-03 | Bitácora encadenada de toda acción relevante | P-05 TO-BE |
| OP-04 | Verificación de la integridad de la cadena | P-05 TO-BE |
| OP-05 | Registro de cada consulta con su resultado | P-05 TO-BE |
| OP-06 | Filtros por tipo de evento, entidad y fecha | P-05 TO-BE |

---

## 14. Referencias Cruzadas

- [`procesos_as_is.md`](procesos_as_is.md) — Mapa de procesos AS-IS
- [`proceso_as_is_01.md`](proceso_as_is_01.md) — Emisión y distribución
- [`../to_be/proceso_to_be_05.md`](../to_be/proceso_to_be_05.md) — Proceso TO-BE equivalente
- [`../arquitectura/arquitectura.md`](../../arquitectura/arquitectura.md) — Arquitectura
