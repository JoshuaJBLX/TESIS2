# Proceso AS-IS 03 — Recepción y validación de documentos recibidos

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-03 |
| **Nombre** | Recepción y validación de documentos recibidos |
| **Proceso TO-BE equivalente** | P-03 — Verificación pública sin cuenta |
| **Área** | Todas las áreas receptoras |
| **Responsable** | Destinatario |
| **Tipo** | Operativo |
| **Estado** | Vigente (no soportado: solo confianza) |

---

## 2. Objetivo del Proceso

Confirmar que el documento recibido es auténtico, íntegro y el más reciente,
antes de tomarlo como base para una decisión.

En la práctica, este objetivo **no se puede cumplir**: no existe ningún
mecanismo que permita comprobarlo.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Llegada de un documento por correo o mensajería.

### 3.2. Resultado Esperado

El destinatario abre el archivo y lo usa. La «validación» se reduce a comprobar
que abre y que parece el documento esperado.

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Origen |
|---------|--------|
| Archivo recibido | Emisor (correo o mensajería) |
| Expectativa del contenido | Conocimiento del destinatario |

### 4.2. Salidas

| Salida | Formato |
|--------|---------|
| Confirmación informal («recibido, gracias») | Mensaje |
| Documento en uso | PDF / DOCX |

### 4.3. Consumidores

El propio destinatario y su área.

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Destinatario | Abre y usa el documento |
| Emisor | Responde si hay dudas |
| *(Ausente)* | Ningún tercero que certifique la autenticidad |

---

## 6. Reglas de Negocio Actuales

| # | Regla | Formalidad |
|---|-------|-----------|
| RN-1 | Si el archivo abre correctamente, se acepta | Consuetudinaria |
| RN-2 | Se acusa recibo con un mensaje | Consuetudinaria |
| RN-3 | Ante una duda, se pregunta al emisor por el mismo canal | Consuetudinaria |
| RN-4 | No hay comprobación de autenticidad, integridad ni versión | **Ausente** |

---

## 7. Diagrama del Proceso

```
 Inicio (llega un documento)
   |
   v
 (El archivo abre correctamente?)
   |  No --> Avisar al emisor --> Fin (no se puede usar)
   |  Si
   v
 (El remitente es conocido?)
   |  No --> (Punto de decision de riesgo)
   |  Si                          |
   v                              v
 Leer el documento           (Se pide confirmacion al
   |                          emisor por un canal
   v                          distinto, p. ej. llamada?)
 (El contenido es el          |  Si --> Confirmar --> Leer
  que esperaba?)              |  No --> Rechazar
   |  Si                           |
   v                               v
 Usar el documento               Fin
   |
   v
 Acusar recibo por el mismo canal
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Abre el archivo? | Detecta corrupción, no falsificación |
| D-2 | ¿El remitente es conocido? | Única pista de autenticidad: la confianza personal |
| D-3 | ¿El contenido es el esperado? | Juicio subjetivo, no verificable |
| D-4 | ¿Se confirma por otro canal? | Único control adicional existente |

> **Observación crítica:** D-1 detecta **corrupción**, no **falsificación**. Un
> archivo PDF perfectamente válido puede haber sido modificado en su contenido y
> seguirá abriendo sin error.

---

## 8. Actividades Actuales

| # | Actividad | Tiempo | Efectividad |
|---|-----------|:------:|-------------|
| A-1 | Abrir el archivo | 30 s | Detecta corrupción |
| A-2 | Reconocer al remitente | 10 s | Señal débil, no verificable |
| A-3 | Leer el documento | 10 min | Subjetiva |
| A-4 | Acusar recibo | 1 min | Sin valor probatorio |
| A-5 | *(No existe)* Verificación de la firma | — | — |
| A-6 | *(No existe)* Verificación del hash | — | — |
| A-7 | *(No existe)* Consulta de la versión vigente | — | — |

---

## 9. Sistemas y Puntos de Integración

```
 Correo / Mensajeria --> Archivo --> Visor PDF --> Lectura
                             |
                             (sin verificacion)
```

**Ningún sistema participa en la validación.**

---

## 10. Indicadores del Estado Actual

### 10.1. Tiempo de Ciclo

| Concepto | Valor |
|----------|-------|
| Tiempo activo | ~12 min |
| Tiempo de espera | ~1 h |
| Tiempo de ciclo total | ~1 h |

### 10.2. Tasa de Errores

| Error | Frecuencia estimada |
|-------|:-------------------:|
| Se usa una versión antigua creyendo que es la actual | 30 % |
| Se actúa sobre un documento alterado sin notarlo | **Indeterminable**: no hay detección |
| Se rechaza un documento legítimo por desconfianza | 15 % |
| Se acepta un documento sin leerlo | 20 % |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Confirmar la recepción | Se cumple |
| Confirmar la autenticidad | **Imposible en el estado actual** |
| Confirmar la integridad | **Imposible en el estado actual** |
| Confirmar que es la última versión | **Imposible en el estado actual** |

---

## 11. Problemas Detectados

### PR-01 · No se puede distinguir «abre» de «es auténtico»

La apertura correcta es la única comprobación, y no aporta ninguna garantía
criptográfica.

### PR-02 · La confianza es personal y transferible

La confianza en el remitente se transfiere al documento: si el remitente es
confiable, todo lo que envía se acepta, incluso lo que un tercero alteró en
tránsito.

### PR-03 · No hay detección de documentos falsos

Si alguien crea una copia con datos distintos y la distribuye, el sistema
actual no lo detecta. Esta es la brecha más grave.

### PR-04 · La verificación exige una cuenta o un contacto

Para confirmar algo, el destinatario debe escribir al emisor. No puede
verificar de forma autónoma.

---

## 12. Brechas Identificadas

| # | Brecha | Cubierta por |
|---|--------|--------------|
| BR-01 | Sin verificación de firma | RF-021 |
| BR-02 | Sin detección de manipulación del contenido | RF-021, RF-022 |
| BR-03 | Sin búsqueda de documentos falsos por hash | RF-022 |
| BR-04 | Sin verificación pública sin cuenta | RF-023 |

---

## 13. Oportunidades de Automatización

| # | Oportunidad | Proceso TO-BE |
|---|------------|---------------|
| OP-01 | Verificación de la firma con la clave pública | P-03 TO-BE |
| OP-02 | Recálculo del hash para detectar alteración | P-03 TO-BE |
| OP-03 | Búsqueda por hash para detectar documentos falsos | P-03 TO-BE |
| OP-04 | Verificación por QR, sin cuenta ni contacto | P-03 TO-BE |
| OP-05 | Mensajes de resultado en lenguaje comprensible | P-03 TO-BE |

---

## 14. Referencias Cruzadas

- [`procesos_as_is.md`](procesos_as_is.md) — Mapa de procesos AS-IS
- [`proceso_as_is_01.md`](proceso_as_is_01.md) — Emisión y distribución
- [`../to_be/proceso_to_be_03.md`](../to_be/proceso_to_be_03.md) — Proceso TO-BE equivalente
- [`../../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
