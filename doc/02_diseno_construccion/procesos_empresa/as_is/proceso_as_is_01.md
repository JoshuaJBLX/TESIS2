# Proceso AS-IS 01 — Emisión y distribución de documentos

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-01 |
| **Nombre** | Emisión y distribución de documentos |
| **Proceso TO-BE equivalente** | P-01 — Emisión, firma y distribución verificable |
| **Área** | Comercial / Administración |
| **Responsable** | Emisor del documento |
| **Tipo** | Operativo |
| **Estado** | Vigente (sin sistema de apoyo) |

---

## 2. Objetivo del Proceso

Entregar un documento oficial al destinatario correcto, de forma que pueda
leerlo y, en la práctica, **confiar** en él, aunque hoy no exista ninguna
garantía técnica de esa confianza.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Necesidad de emitir un documento formal: una resolución, un informe, un
contrato, un dictamen.

### 3.2. Resultado Esperado

El destinatario recibe el archivo por correo o mensajería. **No hay resultado
técnico verificable**: el sistema no deja constancia de qué se envió.

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Origen | Formato |
|---------|--------|---------|
| Contenido del documento | Emisor | PDF / DOCX |
| Datos del destinatario | Directorio | Correo, nombre |
| Canal de distribución | Política interna | Correo / mensajería |

### 4.2. Salidas

| Salida | Formato |
|--------|---------|
| Archivo distribuido | PDF / DOCX |
| Correo enviado | Mensaje de correo |
| Posible acuse informal | Mensaje de respuesta |

### 4.3. Consumidores de la Salida

Destinatario interno o externo. Nadie más.

---

## 5. Actores y Roles

| Actor | Rol en el proceso |
|-------|-------------------|
| Emisor | Redacta, exporta a PDF, adjunta y envía |
| Destinatario | Recibe y abre el archivo |
| Administración | Guarda una copia en la carpeta compartida |
| *(Ausente)* | Nadie verifica la integridad ni la autenticidad |

---

## 6. Reglas de Negocio Actuales

| # | Regla | Formalidad |
|---|-------|-----------|
| RN-1 | Todo documento oficial se exporta a PDF antes de enviarse | Consuetudinaria |
| RN-2 | Se adjunta al correo con el nombre del documento, sin versión | Consuetudinaria |
| RN-3 | Se guarda una copia en la carpeta compartida del área | Consuetudinaria |
| RN-4 | Si el documento es muy importante, se envía también por mensajería | Consuetudinaria |
| RN-5 | No existe regla sobre la integridad del contenido | **Ausente** |

---

## 7. Diagrama del Proceso

```
 Inicio
   │
   ▼
 ¿El documento ya está redactado?
   │ Sí                    │ No
   │                       ▼
   │                 Redactar en Word
   │                       │
   ▼                       ▼
 Exportar a PDF ◀──────────┘
   │
   ▼
 ¿Se adjuntó el PDF correcto?
   │ Sí                    │ No
   │                       ▼
   │                 Corregir y volver a exportar
   │                       │
   ▼◀──────────────────────┘
 Guardar copia en carpeta compartida
   │
   ▼
 Enviar por correo
   │
   ▼
 ¿El documento es crítico?
   │ Sí                    │ No
   ▼                       │
 Enviar también                │
 por mensajería ◀────────────┘
   │
   ▼
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Ya está redactado? | Evita trabajo duplicado |
| D-2 | ¿Se adjuntó el PDF correcto? | Última barrera; depende del ojo humano |
| D-3 | ¿Es crítico? | Define si se duplica el canal |

---

## 8. Actividades Actuales

| # | Actividad | Responsable | Tiempo | Sistema |
|---|-----------|-------------|:------:|---------|
| A-1 | Redactar el documento | Emisor | 1 h | Word |
| A-2 | Exportar a PDF | Emisor | 2 min | Word |
| A-3 | Revisar visualmente el PDF | Emisor | 3 min | Lectura humana |
| A-4 | Guardar copia en la carpeta | Emisor | 1 min | Carpeta de red |
| A-5 | Enviar por correo | Emisor | 2 min | Correo |
| A-6 | Reenviar por mensajería si es crítico | Emisor | 1 min | Mensajería |
| A-7 | (No existe) Firma criptográfica | — | — | — |
| A-8 | (No existe) Registro de envío verificable | — | — | — |

---

## 9. Sistemas y Puntos de Integración

```
   Word ──export──▶ PDF ──adjunto──▶ Correo ──▶ Destinatario
                          │
                          └──▶ Carpeta de red (copia)
```

| Punto de integración | Estado | Riesgo |
|----------------------|--------|--------|
| Word → PDF | Manual | Un clic equivocado exporta la versión anterior |
| PDF → Correo | Manual | Adjuntar el archivo equivocado |
| Correo → Destinatario | Confianza implícita | Suplantación de remitente |

---

## 10. Indicadores del Estado Actual

### 10.1. Tiempo de Ciclo

| Concepto | Valor |
|----------|-------|
| Tiempo activo | ~10 min |
| Tiempo de espera | hasta 2 días |
| Tiempo de ciclo total | ~2 h (mediana), 2 días (peor caso) |

### 10.2. Tasa de Errores

| Error | Frecuencia estimada |
|-------|:-------------------:|
| Se envía la versión anterior por error | 15 % |
| Se adjunta el documento equivocado | 5 % |
| El destinatario no recibe nada y hay que reenviar | 25 % |

### 10.3. Cumplimiento

El objetivo de "entregar el documento" **se cumple**. El objetivo de "garantizar
que el documento entregado es el entregado e íntegro" **no existe** como
requisito.

---

## 11. Problemas Detectados

### PR-01 · Versión ambigua en el envío

El archivo se envía como `Contrato.pdf` o `Contrato_v2_final.pdf` sin un criterio
que permita saber cuál es el vigente. El destinatario no tiene forma de
saberlo.

### PR-02 · Canal como única garantía

La confianza reside en que "el correo llegó". Cualquiera con acceso al buzón
puede afirmar que envió algo.

### PR-03 · Pérdida de trazabilidad del envío

No queda registro de qué se envió, cuándo, ni a quién. Si surge una disputa, no
hay evidencia.

### PR-04 · Reenvíos que originan versiones divergentes

Cuando alguien "pierde" el correo, se reenvía desde una copia local que puede
estar desactualizada.

---

## 12. Brechas Identificadas

| # | Brecha | Cubierta por |
|---|--------|--------------|
| BR-01 | Sin firma digital del documento | RF-006, RF-007 |
| BR-02 | Sin verificación pública para el destinatario | RF-021, RF-022, RF-023 |
| BR-03 | Sin inmutabilidad del contenido enviado | RNF-001 |
| BR-04 | Sin registro de auditoría del envío | RF-024 |

---

## 13. Oportunidades de Automatización

| # | Oportunidad | Proceso TO-BE |
|---|-------------|---------------|
| OP-01 | Firmar cada versión automáticamente en la subida | P-01 TO-BE |
| OP-02 | Emitir un QR por documento para verificación pública | P-01 TO-BE |
| OP-03 | Registrar el envío como evento auditable | P-01 TO-BE |
| OP-04 | Asignar la versión de forma correlativa e inmutable | P-02 TO-BE |
| OP-05 | Notificar al destinatario la URL de verificación | P-01 TO-BE |

---

## 14. Referencias Cruzadas

- [`procesos_as_is.md`](procesos_as_is.md) — Mapa de procesos AS-IS
- [`proceso_as_is_02.md`](proceso_as_is_02.md) — Control de versiones
- [`../to_be/proceso_to_be_01.md`](../to_be/proceso_to_be_01.md) — Proceso TO-BE equivalente
- [`../../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
