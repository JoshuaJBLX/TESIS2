# Validación Experimental — SGD-FD

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Propósito

Documentar cómo se validó que el SGD-FD cumple sus objetivos, qué evidencia se
recogió y **qué queda sin demostrar**.

Este documento distingue explícitamente entre lo medido y lo estimado. La
distinción es esencial: presentar una estimación como una medición invalidaría
todo el documento.

---

## 2. Objetivos de la Validación

| # | Objetivo | Pregunta que responde |
|---|----------|----------------------|
| OV-1 | Verificar la integridad documental | ¿El sistema detecta cualquier cambio en un documento? |
| OV-2 | Verificar la autenticidad | ¿Se puede probar quién firmó el documento? |
| OV-3 | Verificar la trazabilidad | ¿Se puede reconstruir el historial completo? |
| OV-4 | Verificar la usabilidad | ¿Un destinatario externo puede verificar sin ayuda? |
| OV-5 | Verificar la viability técnica | ¿El sistema sostiene la carga prevista? |
| OV-6 | Verificar el control de acceso | ¿Las Confidentialidad se respeta entre usuarios? |

---

## 3. Tipo de Validación Realizada

| Tipo | Aplicado | Detalle |
|------|:--------:|---------|
| Validación funcional automatizada | ✔ | 120 pruebas, todas en verde |
| Validación de integración | ✔ | Recorridos de extremo a extremo en `scenarios.test.ts` |
| Validación criptográfica | ✔ | Casos positivo y negativo de firma y cifrado |
| Validación de usabilidad con usuarios | ✘ | No se realizó con usuarios reales |
| Validación de carga y rendimiento | ✘ | No se ejecutaron pruebas de estrés |
| Validación de seguridad ofensiva | ✘ | No se realizó auditoría externa |
| Validación en entorno productivo | ✘ | El sistema opera en desarrollo local |

> **Advertencia de alcance:** los objetivos OV-4, OV-5 y OV-6 **no están
> validados empíricamente**. Se presentan como diseño y como resultados de
> pruebas funcionales, no como evidencia de comportamiento humano o de
> rendimiento a escala.

---

## 4. Experimento 1 — Detección de Alteración

### 4.1. Hipótesis

> Si se modifica un byte de un documento firmado, el verificador informará
> `MANIPULATED`.

### 4.2. Diseño

| Elemento | Valor |
|----------|-------|
| Variable independiente | Bytes del contenido del archivo |
| Variable dependiente | Estado devuelto por `POST /api/verify` |
| Control | El mismo documento sin modificar |
| Instrumento | Prueba automatizada `verify.api.test.ts` |

### 4.3. Procedimiento

1. Emitir un documento firmado con contenido `Contenido original`.
2. Conservar el hash registrado.
3. Crear un archivo con el mismo nombre y contenido `Contenido manipulado`.
4. Verificar el archivo alterado contra el mismo `documentId`.
5. Observar el estado devuelto.

### 4.4. Resultado

| Campo | Valor observado |
|-------|-----------------|
| `status` | `MANIPULATED` |
| `hashMatch` | `false` |
| `message` | «El documento ha sido manipulado (hash no coincide)» |

### 4.5. Conclusión

**Hipótesis confirmada.** La prueba
`detecta MANIPULATED si el contenido cambió` pasa de forma consistente.

---

## 5. Experimento 2 — Detección de Firma Inválida

### 5.1. Hipótesis

> Si se verifica un documento con una clave pública distinta de la que firmó, la
> firma se rechazará.

### 5.2. Diseño

| Elemento | Valor |
|----------|-------|
| Variable independiente | Clave pública utilizada en la verificación |
| Variable dependiente | Resultado de `verification.isValid` |
| Control | Verificación con la clave pública correcta |
| Instrumento | Prueba `unit/crypto.test.ts` |

### 5.3. Resultado

La prueba `detecta firma inválida cuando se usa otra clave pública` pasa. La
firma se rechaza, lo que confirma que la verificación no es decorativa.

### 5.4. Conclusión

**Hipótesis confirmada.** Se valida que la firma realmente se comprueba.

---

## 6. Experimento 3 — Protección de la Clave Privada

### 6.1. Hipótesis

> La clave privada nunca se almacena en claro y no se puede recuperar con una
> contraseña incorrecta.

### 6.2. Diseño

| Elemento | Valor |
|----------|-------|
| Variable independiente | Contraseña de cifrado |
| Variable dependiente | Resultado del descifrado |
| Instrumento | Pruebas `keyProtection` en `unit/crypto.test.ts` |

### 6.3. Resultados

| Prueba | Resultado observado |
|--------|---------------------|
| `cifra y descifra la clave privada con la misma contraseña` | ✔ Correcto |
| `lanza error si la contraseña es incorrecta (auth GCM)` | ✔ Error de autenticación GCM |
| `usa salts aleatorias: dos cifrados del mismo texto difieren` | ✔ Los dos cifrados difieren |

### 6.4. Conclusión

**Hipótesis confirmada.** El cifrado es reversible solo con la contraseña
correcta, y el uso de sales aleatorias impide el cifrado determinista.

---

## 7. Experimento 4 — Encadenamiento de la Bitácora

### 7.1. Hipótesis

> Si se modifica un registro de auditoría antiguo, la verificación de la cadena
> lo detecta e informa el punto exacto de ruptura.

### 7.2. Diseño

| Elemento | Valor |
|----------|-------|
| Variable independiente | Integridad del registro con `id` conocido |
| Variable dependiente | `{ valid, brokenAt, reason }` |
| Control | Cadena intacta |
| Instrumento | Pruebas de `services/audit.service.test.ts` |

### 7.3. Resultados

| Prueba | Resultado |
|--------|-----------|
| `encadena los eventos con hashes SHA-256` | ✔ |
| `verifica la cadena completa como válida` | ✔ |
| `es de solo-append: no se pueden actualizar ni borrar registros` | ✔ |
| `detecta una manipulación si se rompe el encadenamiento` | ✔ |

### 7.4. Conclusión

**Hipótesis confirmada.** La manipulación se detecta y se localiza.

### 7.5. Limitación detectada

La cadena es **autorreferencial**: no incorpora ningún secreto. Un atacante con
escritura sobre el archivo SQLite podría recalcular todos los hashes
posteriores. La protección depende del control de acceso al archivo, no del
algoritmo. Registrado en
[`../procesos_empresa/to_be/proceso_to_be_05.md`](../procesos_empresa/to_be/proceso_to_be_05.md).

---

## 8. Experimento 5 — Control de Acceso entre Usuarios

### 8.1. Hipótesis

> Un usuario no autenticado o ajeno al documento no puede acceder a documentos
> privados.

### 8.2. Resultados

| Prueba | Resultado |
|--------|-----------|
| `exige autenticación para listar documentos` | ✔ |
| `bloquea la descarga de documentos privados ajenos` | ✔ |
| `prohíbe compartir documentos ajenos` | ✔ |
| `solo el propietario puede actualizar documentos privados` | ✔ |
| `exige rol de administrador` (bitácora) | ✔ |
| `rechaza peticiones sin cabecera Authorization` | ✔ |

### 8.3. Conclusión

**Hipótesis confirmada a nivel de API.** Las 6 pruebas relacionadas con el
control de acceso pasan.

---

## 9. Experimento 6 — Verificación sin Cuenta

### 9.1. Hipótesis

> Un destinatario sin cuenta puede verificar la autenticidad de un documento.

### 9.2. Diseño

Se comprueba la existencia de rutas sin middleware `authenticate` en
`routes/verify.ts` y la ausencia de cabecera `Authorization` en las pruebas de
verificación.

### 9.3. Resultado

Las 6 pruebas de `verify.api.test.ts` se ejecutan **sin token** y pasan, lo que
demuestra que la verificación es accesible sin cuenta. `GET /api/verify/:id`
responde `200` sin autenticación.

### 9.4. Conclusión

**Hipótesis confirmada.** Este es el experimento que mejor demuestra la mejora
respecto al proceso AS-IS, donde la verificación exigía contactar con el emisor.

---

## 10. Resumen de Experimentos

| # | Experimento | Hipótesis | Resultado |
|---|-------------|-----------|:---------:|
| 1 | Detección de alteración | Confirmada | ✔ |
| 2 | Firma inválida rechazada | Confirmada | ✔ |
| 3 | Protección de la clave privada | Confirmada | ✔ |
| 4 | Encadenamiento de la bitácora | Confirmada | ✔ |
| 5 | Control de acceso entre usuarios | Confirmada | ✔ |
| 6 | Verificación sin cuenta | Confirmada | ✔ |

**6 de 6 hipótesis confirmadas sobre 120 pruebas automatizadas.**

---

## 11. Indicadores No Validados

Estos indicadores se presentan en la documentación como **objetivos de diseño**,
no como mediciones:

| Indicador | Valor objetivo | ¿Medido? |
|-----------|:--------------:|:--------:|
| Tiempo de ciclo documental | < 5 min | **No** — no se cronometró una operación real de extremo a extremo |
| Usuarios concurrentes | 50 | **No** — no se ejecutaron pruebas de carga |
| Tamaño máximo de documento | 10 MB | **Sí** — límite configurado en `multer` |
| Tiempo de respuesta de la API | < 2 s | **No** — no se midió con herramienta de benchmark |
| Disponibilidad del servicio | 99,9 % | **No** — no aplica en ejecución local |

---

## 12. Riesgos Detectados por la Validación

| # | Riesgo | Origen | Severidad |
|---|--------|--------|:---------:|
| R-1 | `GET /api/verify/:id` declara `valid: true` sin comprobar la firma | Análisis de código | **Alta** |
| R-2 | La cadena de auditoría es autorreferencial | Experimento 4 | Media |
| R-3 | La pérdida de la clave privada irrecupera deja documentos sin firma | Diseño (`RK-10`) | Media |
| R-4 | El almacenamiento en `uploads/` no escala ni es replicable | Diseño | Media |
| R-5 | No hay validación con usuarios reales | Alcance | Media |

R-1 es el más relevante: un usuario que consulte la ruta pública sin subir el
archivo podría interpretar `valid: true` como una comprobación realizada, cuando
en realidad solo se verificó que existe una firma registrada. El mensaje
«Suba el documento para verificar su integridad» acompaña al resultado, pero el
campo es ambiguo.

---

## 13. Trabajo Futuro de Validación

| # | Acción | Objetivo |
|---|--------|----------|
| 1 | Corregir el campo `signature.valid` de `GET /api/verify/:id` | Eliminar la ambigüedad de R-1 |
| 2 | Ejecutar pruebas de carga con k6 o Artillery | Validar OV-5 |
| 3 | Realizar pruebas de usabilidad con 5 destinatarios externos | Validar OV-4 |
| 4 | Incorporar un anclaje externo de la cadena de auditoría | Mitigar R-2 |
| 5 | Medir el tiempo de ciclo real de emisión a verificación | Convertir el objetivo en medición |

---

## 14. Conclusiones

La validación funcional del SGD-FD es sólida: **120 pruebas cubren los seis
comportamientos centrales del sistema y todas pasan**. La detección de
alteración, la verificación de firma, la protección de la clave privada, la
integridad de la bitácora, el control de acceso y la verificación anónima están
demostrados con evidencia ejecutable y repetible.

Lo que **no** está demostrado es el comportamiento en condiciones reales de
carga, con usuarios reales y bajo ataque. En consecuencia, el sistema debe
considerarse **funcionalmente validado y operativamente no validado**.

---

## 15. Referencias Cruzadas

- [`enfoque_tdd.md`](enfoque_tdd.md) — Enfoque TDD
- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`matriz_pruebas.md`](matriz_pruebas.md) — Catálogo de pruebas
- [`metricas_calidad.md`](metricas_calidad.md) — Métricas de calidad
- [`aplicacion_iso_29119.md`](aplicacion_iso_29119.md) — Aplicación de ISO/IEC 29119