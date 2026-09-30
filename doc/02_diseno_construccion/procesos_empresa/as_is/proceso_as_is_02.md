# Proceso AS-IS 02 — Control de versiones

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-02 |
| **Nombre** | Control de versiones |
| **Proceso TO-BE equivalente** | P-02 — Versionado inmutable con firma |
| **Área** | Todos los que producen documentos |
| **Responsable** | Emisor |
| **Tipo** | Operativo |
| **Estado** | Vigente (manual, no soportado por sistema) |

---

## 2. Objetivo del Proceso

Conservar las distintas revisiones de un documento de modo que se pueda saber
cuál es la vigente y recuperar cualquiera de las anteriores.

En la práctica, el objetivo declarado se cumple solo parcialmente: **conservar**
se cumple; **saber cuál es la vigente** depende de la convención de nombres.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Necesidad de emitir una revisión del documento (corrección, actualización
normativa, respuesta a un requerimiento).

### 3.2. Resultado Esperado

Una nueva copia del archivo, con un sufijo que indique la revisión. No existe un
registro estructurado de las revisiones.

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Origen |
|---------|--------|
| Documento vigente | Carpeta compartida |
| Motivo de la revisión | Emisor ( informally, a veces no documentado) |

### 4.2. Salidas

| Salida | Formato |
|--------|---------|
| Archivo nuevo con sufijo de versión | `documento_v3.pdf` |
| Carpeta con copias sueltas | Sistema de archivos |

### 4.3. Consumidores

El propio emisor; quien necesite un documento antiguo.

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Emisor | Decide cuándo y por qué hay nueva versión |
| *(Ausente)* | Nadie valida que la versión sea la correcta |

---

## 6. Reglas de Negocio Actuales

| # | Regla | Formalidad |
|---|-------|-----------|
| RN-1 | La versión se indica con un sufijo en el nombre del archivo | Consuetudinaria |
| RN-2 | Cada versión se guarda como archivo separado | Consuetudinaria |
| RN-3 | Se conserva la versión anterior (no se sobrescribe) | Consuetudinaria |
| RN-4 | El motivo del cambio se documenta… a veces | **Informal** |
| RN-5 | No hay numeración obligatoria ni automática | **Ausente** |

---

## 7. Diagrama del Proceso

```
 Inicio
   │
   ▼
 ¿Hay un cambio que justifique una nueva versión?
   │ No ──────────────────────────────▶ Fin (se sigue con la actual)
   │ Sí
   ▼
 Editar el archivo de la versión anterior
   │
   ▼
 Guardar como archivo nuevo con sufijo  (v3, v_final, etc.)
   │
   ▼
 ¿Se conservó la versión anterior?
   │ Sí                    │ No
   │                       ▼
   │                 (Se sobrescribió: se perdió el historial)
   │                       │
   ▼◀──────────────────────┘
 ¿Se documentó el motivo del cambio?
   │ Sí                    │ No
   │                       ▼
   │                 (Sin trazabilidad del por qué)
   │                       │
   ▼◀──────────────────────┘
 Notificar por correo la nueva versión
   │
   ▼
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿El cambio justifica una versión? | Evita versiones innecesarias |
| D-2 | ¿Se conservó la anterior? | Si no, se pierde el historial |
| D-3 | ¿Se documentó el motivo? | Si no, no hay trazabilidad del cambio |

---

## 8. Actividades Actuales

| # | Actividad | Tiempo | Control |
|---|-----------|:------:|---------|
| A-1 | Editar la copia anterior | 20 min | Ninguno |
| A-2 | Guardar como archivo nuevo | 30 s | Manual |
| A-3 | Escribir el motivo del cambio | 0–5 min | Informal |
| A-4 | Notificar la nueva versión | 2 min | Manual |
| A-5 | (No existe) Cálculo de hash del contenido | — | — |
| A-6 | (No existe) Firma de la versión | — | — |
| A-7 | (No existe) Registro de autoría de la versión | — | — |

---

## 9. Sistemas y Puntos de Integración

```
 Carpeta compartida
   ├── documento.pdf          ← versión 1
   ├── documento_v2.pdf       ← versión 2
   └── documento_v3_final.pdf ← versión 3
```

No hay sistema: el versionado **es el sistema de archivos**.

---

## 10. Indicadores del Estado Actual

### 10.1. Tiempo de Ciclo

| Concepto | Valor |
|----------|-------|
| Tiempo activo | ~5 min |
| Tiempo de espera | ~1 h |
| Tiempo de ciclo total | ~1 h |

### 10.2. Tasa de Errores

| Error | Frecuencia estimada |
|-------|:-------------------:|
| Se sobrescribe la versión anterior | 20 % |
| Sufijo inconsistente (`v2`, `v2_final`, `final2`) | 45 % |
| Versión duplicada sin cambio real | 25 % |
| No se sabe cuál es la vigente | 35 % |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Conservar el historial | Parcial: depende de la disciplina de copiado |
| Saber cuál es la vigente | **No se cumple de forma fiable** |
| Justificar cada cambio | **No se cumple** |

---

## 11. Problemas Detectados

### PR-01 · Numeración no fiable

El sufijo lo elige la persona. `v3_final_FINAL.pdf` no es interpretable por un
sistema, y el resultado es que un 35 % de los casos no se sabe con certeza cuál
es la versión vigente.

### PR-02 · Autoría de la versión no registrada

Una versión puede haber sido editada por cualquiera con permiso de escritura en
la carpeta. No hay registro de quién cambió qué.

### PR-03 · Integridad del contenido sin comprobar

Un archivo puede modificarse accidental o deliberadamente sin que nada lo
detecte. El hash no existe como concepto.

### PR-04 · Motivo del cambio ausente

Cuando alguien pregunta "¿por qué cambió el monto?", no hay respuesta
registrada.

---

## 12. Brechas Identificadas

| # | Brecha | Cubierta por |
|---|--------|--------------|
| BR-01 | Sin hash ni firma por versión | RF-006, RF-007 |
| BR-02 | Sin numeración correlativa obligatoria | RF-007, RF-009 |
| BR-03 | Sin registro de autor de la versión | RNF-042 |
| BR-04 | Sin motivo de cambio obligatorio | RF-007 |

---

## 13. Oportunidades de Automatización

| # | Oportunidad | Proceso TO-BE |
|---|------------|---------------|
| OP-01 | Numeración correlativa automática e inmutable | P-02 TO-BE |
| OP-02 | Hash SHA-256 calculado en cada subida | P-02 TO-BE |
| OP-03 | Firma RSA de cada versión | P-02 TO-BE |
| OP-04 | Motivo del cambio obligatorio | P-02 TO-BE |
| OP-05 | Autor y coautor registrados por versión | P-02 TO-BE |

---

## 14. Referencias Cruzadas

- [`procesos_as_is.md`](procesos_as_is.md) — Mapa de procesos AS-IS
- [`proceso_as_is_01.md`](proceso_as_is_01.md) — Emisión y distribución
- [`../to_be/proceso_to_be_02.md`](../to_be/proceso_to_be_02.md) — Proceso TO-BE equivalente
- [`../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
