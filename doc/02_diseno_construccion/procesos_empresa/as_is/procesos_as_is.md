# Mapa de Procesos AS-IS — Estado Actual

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 2 — Diseño y Construcción

---

## 1. Propósito del Documento

### 1.1. Alcance

Describe cómo una organización gestiona hoy sus documentos oficiales **antes**
de incorporar el SGD-FD. El objetivo es fijar la línea base sobre la que se
mide el impacto del sistema.

El alcance cubre el ciclo completo del documento: emisión, distribución,
recepción, control de versiones, gestión de cambios y auditoría.

### 1.2. Qué es un Proceso AS-IS

Un proceso **AS-IS** (*as it is*) representa la práctica **tal como se ejecuta
hoy**, con sus limitaciones. No es un juicio de valor: describe la realidad para
que la comparación con el estado TO-BE sea fundamentada.

### 1.3. Relación con los Procesos TO-BE

Cada proceso AS-IS tiene un equivalente TO-BE en
[`../to_be/procesos_to_be.md`](../to_be/procesos_to_be.md). La correspondencia
es 1:1 por identificador (`P-01` AS-IS ↔ `P-01` TO-BE).

### 1.4. Convención de Nomenclatura

| Patrón | Significado |
|--------|-------------|
| `procesos_as_is.md` | Mapa general de procesos (nivel 0 y 1) |
| `proceso_as_is_NN.md` | Ficha de detalle de un proceso |

---

## 2. Contexto de la Organización

### 2.1. Datos de la Organización

| Dato | Valor |
|------|-------|
| Tipo | Institución o empresa mediana, 20–80 colaboradores |
| Documentos oficiales por mes | 150–400 |
| Tamaño promedio de documento | 1–3 MB (PDF, DOCX) |
| Sistemas de información | Ofimática (Word, Excel), correo corporativo, mensajería instantánea |
| Base de datos estructurada | Ninguna dedicada a documentos |
| Personal dedicado al archivo | 1 persona a tiempo parcial |

### 2.2. Estructura Organizacional Relevante

```
                    Dirección
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Seguridad      Administración     Comercial
   (dictamina)      (coordina)        (emite)
        │               │               │
        └───────────────┴───────────────┘
                        │
                  Expedientes
               (carpetas compartidas)
```

### 2.3. Áreas Involucradas

| Área | Interés principal |
|------|-------------------|
| Dirección | Que el documento sea auténtico y no se altere |
| Seguridad | Que el dictamen llegue íntegro al destinatario |
| Administración | Reducir el tiempo de circulación |
| Comercial | Poder acreditar ante el cliente qué se envió |
| destinatario externo | Saber si lo que recibió es auténtico |

### 2.4. Sistemas de Información Existentes

| Sistema | Uso | Conteo de versiones | Firma | Trazabilidad |
|---------|-----|:--------------------:|:-----:|:------------:|
| Correo electrónico | Distribución principal | No | No | Parcial (cabeceras) |
| WhatsApp / Telegram | Distribución rápida | No | No | No |
| Carpetas de red | Archivo manual con sufijos | Manual (`v2_final`) | No | No |
| OneDrive / Drive | Carpeta compartida | Parcial | No | Parcial |
| Correo físico | Casos oficiales formales | No | No | Manual (registro) |

---

## 3. Mapa General de Procesos AS-IS

### 3.1. Nivel 0 — Mapa de Procesos

```
                        ┌───────────────────────────────┐
                        │      NECESIDAD DE EMITIR      │
                        │     UN DOCUMENTO OFICIAL      │
                        └───────────────┬───────────────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │  A. Emisión y distribución     │
                        │     (proceso manual)           │
                        └───────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
    ┌─────────▼─────────┐   ┌───────────▼──────────┐   ┌──────────▼─────────┐
    │ B. Control de     │   │ C. Recepción y       │   │ D. Gestión de      │
    │    versiones     │   │    validación        │   │    cambios         │
    └─────────┬─────────┘   └───────────┬──────────┘   └──────────┬─────────┘
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │  E. Consulta de la fuente     │
                        │      (¿cuál era la última?)   │
                        └───────────────────────────────┘

   Valor entregado: distribución del archivo.
   Valor NO entregado: prueba de autenticidad, inmutabilidad, no repudio.
```

### 3.2. Nivel 1 — Lista de Procesos

| Código | Proceso | Tipo | Archivo de detalle |
|--------|---------|------|--------------------|
| P-01 | Emisión y distribución de documentos | Operativo | [`proceso_as_is_01.md`](proceso_as_is_01.md) |
| P-02 | Control de versiones | Operativo | [`proceso_as_is_02.md`](proceso_as_is_02.md) |
| P-03 | Recepción y validación de documentos recibidos | Operativo | [`proceso_as_is_03.md`](proceso_as_is_03.md) |
| P-04 | Gestión de cambios y propuestas | Operativo | [`proceso_as_is_04.md`](proceso_as_is_04.md) |
| P-05 | Consulta de la fuente autorizada | Apoyo | [`proceso_as_is_05.md`](proceso_as_is_05.md) |

---

## 4. Ficha Resumen por Proceso

| Código | Objetivo | Disparador | Actores | Indicador clave | Detalle |
|--------|----------|-----------|---------|-----------------|---------|
| **P-01** | Entregar el documento al destinatario | Necesidad de emitir un documento | Emisor, destinatario | Tiempo hasta el primer acuse informal | [01](proceso_as_is_01.md) |
| **P-02** | Conservar las distintas versiones | Emisión de una revisión | Emisor | % de versiones localizables | [02](proceso_as_is_02.md) |
| **P-03** | Confirmar la recepción | Recepción del archivo | Destinatario | Tiempo de comprobación manual | [03](proceso_as_is_03.md) |
| **P-04** | Incorporar cambios de otra persona | Propuesta de modificación | Coautor, propietario | Tiempo hasta la versión integrada | [04](proceso_as_is_04.md) |
| **P-05** | Resolver cuál es la versión vigente | Duda sobre el estado del documento | Cualquiera | Tiempo medio de resolución | [05](proceso_as_is_05.md) |

---

## 5. Clasificación de los Procesos

| Tipo | Procesos | Justificación |
|------|----------|---------------|
| **Estratégicos** | — | Ninguno: la gestión documental no es una actividad diferenciadora en el estado actual |
| **Operativos** | P-01, P-02, P-03, P-04 | Son el flujo central de trabajo diario |
| **De apoyo** | P-05 | Permite a los demás procesos operar; no genera valor por sí mismo |

---

## 6. Indicadores Agregados del Estado Actual

> Los valores son **estimaciones documentadas** de la práctica descrita,
> consolidadas en [`../../metricas/metricas_calidad.md`](../../pruebas_calidad/metricas_calidad.md).
> No provienen de medición automatizada, porque el proceso actual no
> instrumenta datos.

### 6.1. Tiempo de Ciclo por Proceso

| Proceso | Tiempo típico | Tiempo máximo observado |
|---------|---------------|--------------------------|
| P-01 Emisión y distribución | 2 h | 2 días |
| P-02 Control de versiones | 5 min por versión | 30 min |
| P-03 Recepción y validación | 15 min | 2 h |
| P-04 Gestión de cambios | 3 días | 2 semanas |
| P-05 Consulta de la fuente | 10 min | 3 días |

**Tiempo de ciclo total del proceso documental: ≈ 3,5 días**, de los cuales
P-04 y P-05 aportan 3,2 días.

### 6.2. Tasa de Errores o Reprocesos

| Indicador | Valor estimado |
|-----------|:--------------:|
| Documentos perdidos o no localizables | 8 % |
| Versiones ambiguas (no se sabe cuál es la vigente) | 35 % |
| Detección de un documento alterado | 0 % (no hay mecanismo) |
| Reenvíos por pérdida de información | 25 % |
| Consultas a la fuente que no se resuelven | 30 % |

### 6.3. Cumplimiento de Objetivos

| Objetivo | Estado actual |
|----------|---------------|
| Entregar el documento al destinatario | Se cumple |
| Conservar el historial de versiones | Se cumple parcialmente |
| Demostrar la autenticidad del documento | **No se cumple** |
| Impedir la alteración del contenido | **No se cumple** |
| Auditar quién hizo qué y cuándo | **No se cumple** |

---

## 7. Resumen de Problemas y Brechas

### 7.1. Problemas Frecuentes

| # | Problema | Frecuencia |
|---|----------|:----------:|
| PR-01 | Archivos enviados con nombre `v2_final_FINAL.pdf`, sin criterio verificable | Muy alta |
| PR-02 | El destinatario no sabe si lo recibido es la última versión | Muy alta |
| PR-03 | Un documento alterado circula sin ser detectado | Media |
| PR-04 | No se puede probar quién envió o quién alteró un documento | Muy alta |
| PR-05 | El archivo se pierde entre carpetas de red y correos | Media |
| PR-06 | Cambios de coautores se confirman por teléfono, sin registro | Media |

### 7.2. Brechas Detectadas

| # | Brecha | Requerimiento que la cubre |
|---|--------|---------------------------|
| BR-01 | No hay firma digital: la integridad depende del canal | RF-006, RF-007 |
| BR-02 | No hay verificación pública: el destinatario no puede comprobar nada | RF-021, RF-022, RF-023 |
| BR-03 | No hay inmutabilidad: cualquier usuario con permiso puede editar el archivo | RF-007, RNF-001 |
| BR-04 | No hay bitácora: no se sabe quién hizo qué | RF-024, RF-025 |
| BR-05 | No hay control de versiones estructurado | RF-007, RF-009 |
| BR-06 | No hay gobierno de la coautoría | RF-015 … RF-019 |

### 7.3. Raíces Comunes

| Raíz | Explicación |
|------|-------------|
| **R-1: Ausencia de identificador de versión** | Sin un número de versión inmutable, "la última" es una interpretación. |
| **R-2: Ausencia de evidencia criptográfica** | No hay hash ni firma, así que nada es demostrable. |
| **R-3: Dependencia del canal de transporte** | La confianza se delega al correo o a la mensajería. |
| **R-4: Confianza en el comportamiento de las personas** | Se asume que nadie altera nada; nada lo comprueba. |

---

## 8. Criterios para Registrar un Proceso Nuevo

Un proceso se incluye en el mapa si cumple **al menos uno**:

1. Consume o produce un documento oficial.
2. Tiene un disparador y un resultado identificables.
3. Interviene en más de un área de la organización.
4. Genera impacto medible en tiempo, errores o riesgo.

---

**Documentos relacionados**

- [`../to_be/procesos_to_be.md`](../to_be/procesos_to_be.md) — Mapa de procesos TO-BE
- [`../../metricas/metricas_calidad.md`](../../pruebas_calidad/metricas_calidad.md) — Métricas de calidad
- [`../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad de requerimientos
