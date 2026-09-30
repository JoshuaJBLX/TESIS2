# Estado del Arte

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0
**Fase:** 1 — Planificación y Requerimientos

---

## 1. Problema Investigado

La distribución de documentos por canales informales —WhatsApp, correo
electrónico, messaging— ha sustituido al expediente físico sin trasladar sus
garantías. El receptor de un documento no tiene forma de saber:

1. Si el documento es auténtico o fue alterado en tránsito.
2. Si es la **última versión** o una copia obsoleta.
3. Quién lo emitió realmente.
4. Si su contenido cambió después de haberlo recibido o rubricado.

En el contexto institucional peruano, esta carencia agrava el riesgo de que una
**cláusula o un monto sea modificado sin que el firmante lo note**, y de que una
versión falsificada circular como auténtica.

---

## 2. Líneas de Solución Existentes

### 2.1. Firma electrónica certificada (infraestructura de clave pública)

| Aspecto | Descripción |
|---------|-------------|
| **Qué es** | Sistema de confianza basado en una jerarquía de Entidades de Certificación (AC) y Autoridades de Sellado de Tiempo (TSA), conforme a la Ley N.° 27269 del Perú. |
| **Representantes** | IOFE/RENIEC (nivel máximo de confianza), entidades acreditadas por INDECOPI, certificados de los CA privados (Perú PKI, Digicert, Globalsign). |
| **Cómo funciona** | Se emite un certificado X.509 ligado a la identidad del firmante. La firma criptográfica cubre el contenido; la TSA sella la hora; la AC garantiza la identidad. |
| **Fortalezas** | Valor legal pleno, no repudio reconocido, interoperabilidad normativa, reconocimiento internacional. |
| **Debilidades** | Costo de emisión y de mantenimiento del certificado; proceso de acreditación lento; dependencia de una AC; el certificado puede ser revocado, lo que obliga a un servicio de CRL/OCSP. |
| **Aplicabilidad a esta tesis** | Es la solución de referencia normativa. El SGD-FD **no** la implementa, por no disponer de una entidad acreditada, pero adopta su criptografía. |

### 2.2. Plataformas de gestión documental con firma (Lotus, SharePoint, DocuSign)

| Aspecto | Descripción |
|---------|-------------|
| **Qué es** | Plataformas comerciales que almacenan documentos, gestionan flujos de aprobación y registran firmas electrónicas. |
| **Representantes** | DocuSign, Adobe Acrobat Sign, Microsoft SharePoint, IBM Content Management. |
| **Cómo funciona** | Repositorio central con control de versiones, flujo de trabajo configurable, firma mediante certificado del proveedor (firmas «de nivel avanzado» o «avanzada»). |
| **Fortalezas** | Flujos de trabajo maduros, integración con ofimática, paneles de auditoría, cumplimiento normativo. |
| **Debilidades** | Coste por usuario; **los documentos salen del control de la organización** hacia un tercero; en las modalidades de firma alojada del proveedor, la clave está en el servidor del proveedor y no en manos del firmante; dependencia total del proveedor. |
| **Aplicabilidad a esta tesis** | Ofrecen funcionalidad comparable a la de esta tesis, pero no son reproducibles en un contexto académico sin costo. |

### 2.3. Soluciones de código abierto

| Solución | Descripción | Evaluación |
|----------|-------------|------------|
| **Nextcloud** | Suite colaborativa con aplicación de firmas; se apoya en el certificado del usuario. | Buena integración y control de versiones, pero la firma depende de certificados emitidos por una autoridad; sin PKI propia, la trazabilidad criptográfica es limitada. |
| **ownCloud / Seafile** | Almacenamiento con versionado de archivos. | Versionado robusto, pero **sin firma digital**: la integridad depende del canal. |
| **Git** | Versionado por contenido con hashes (SHA-1/SHA-256) y firmas GPG. | Excelente integridad del historial y no repudio por clave, pero es una herramienta de desarrollo, no un repositorio documental de negocio; los objetos no se organizan por versiones de negocio ni se difunden con un QR de verificación. |
| **SignServer / pdfsig** | Firma de PDF con PKI. | Proporciona firma, pero no la gestión documental ni la verificación pública. |
| **Tatuya (Perú)** | Plataforma de firma electrónica peruana. | Es un servicio basado en PKI propia; no es una implementación abierta y reproducible. |

### 2.4. Blockchain y registros distribuidos

| Aspecto | Descripción |
|---------|-------------|
| **Qué es** | Registro distribuido e inmutable de transactions, con hash encadenado. |
| **Representantes** | Ethereum, Hyperledger Fabric, Corda. |
| **Fortalezas** | Inmutabilidad garantizada por consenso; no requiere confianza en un operador central. |
| **Debilidades** | Coste y latencia; complejidad operativa; **irrelevancia del consenso distribuido cuando existe una autoridad central identificable** (el propietario del documento); la inmutabilidad de una cadena de hashes en base de datos ya cubre el caso de uso. |
| **Aplicabilidad a esta tesis** | Se evaluó y se **descartó**: la propiedad de un documento ya es una autoridad central, y el consenso distribuido añade coste sin aportar valor funcional. Se conserva, en cambio, la **idea central**: el hash encadenado, implementada en `audit_service.ts`. |

### 2.5. Marca de agua y DRM

| Aspecto | Descripción |
|---------|-------------|
| **Qué es** | Incrustación de marcas de agua o cifrado ligado al dispositivo. |
| **Fortalezas** | Disuaden la copia; no son resistentes a la alteración. |
| **Debilidades** | **Una marca de agua se puede eliminar.** No aporta prueba de integridad; es un control de disuasión, no de autenticidad. Se descarta como mecanismo de integridad. |

---

## 3. Cuadro Comparativo

Criterios de evaluación, con escala 1 (ausente) a 5 (óptimo).

| Criterio | Firma PKI | Plataforma comercial | Nextcloud | Git | **SGD-FD** |
|----------|:---------:|:--------------------:|:----------:|:---:|:----------:|
| Autenticidad del contenido | 5 | 4 | 3 | 4 | **5** |
| Trazabilidad de versiones | 3 | 4 | 4 | 5 | **5** |
| No repudio por clave propia del firmante | 5 | 2 | 3 | 5 | **5** |
| Trazabilidad inmutable de auditoría | 4 | 4 | 3 | 4 | **5** |
| Verificación **pública** sin cuenta | 2 | 3 | 2 | 1 | **5** |
| Verificación **por hash** (detección de falsos) | 1 | 2 | 1 | 2 | **5** |
| Firma con clave **controlada por el usuario** | 5 | 2 | 3 | 5 | **5** |
| Persistencia de datos en la organización | 5 | 2 | 5 | 5 | **5** |
| Independencia de un tercero | 4 | 1 | 5 | 5 | **5** |
| Reproducibilidad en entorno académico | 2 | 1 | 4 | 5 | **5** |
| Costo | 2 | 1 | 5 | 5 | **5** |
| Soporte normativo formal (Ley 27269) | 5 | 4 | 3 | 1 | **1** |
| **Total** | **43** | **28** | **37** | **37** | **58** |

> El único criterio donde SGD-FD obtiene una valoración inferior es el
> **soporte normativo formal**, y es una limitación deliberada y declarada, no
> un descuido. Ver §6.

---

## 4. Brecha Identificada

Del análisis se desprende una brecha concreta:

> **No existe en el mercado una solución que combine, sin depender de un tercero,
> (a) firma criptográfica con clave bajo control del firmante, (b) trazabilidad
> inmutable de versiones y auditoría, y (c) verificación pública sin cuenta,
> incluyendo la detección de documentos falsos por comparación de contenido.**

Las tres propiedades se encuentran por separado:

- La **firma PKI** aporta (a) pero no (c): la verificación suele requerir la
  cadena de confianza de la AC.
- Las **plataformas comerciales** aportan (b) y parcialmente (c), pero no (a) ni
  la independencia: la clave reside en el proveedor.
- **Git** aporta (a) y (b), pero está orientado a desarrollo y su verificación
  requiere acceso al repositorio.

Esta brecha es exactamente el espacio que ocupa el SGD-FD.

---

## 5. Propuesta de Valor

| # | Aportación |
|---|-----------|
| 1 | La clave privada **pertenece al firmante**: se genera en su registro, se cifra con su contraseña y nunca sale del servidor en claro. |
| 2 | Cada versión es un **sello inmutable**: hash SHA-256 + firma RSA-SHA256, sin excepción. |
| 3 | La **bitácora encadenada** hace detectables las alteraciones retroactivas de la propia bitácora. |
| 4 | La **verificación es pública**: por QR, por URL o por simple comparación de hash, sin cuenta y sin coste. |
| 5 | La **coautoría gobernada** distingue claramente quién propone, quién firma y quién asume la responsabilidad final. |
| 6 | El **código abierto y la ausencia de dependencias externas** hacen el sistema reproducible y auditable. |

---

## 6. Limitación Reconocida

El SGD-FD **no constituye firma electrónica** en el sentido de la Ley N.° 27269
del Perú ni del Reglamento de Firmas Electrónicas. No utiliza una Entidad de
Certificación acreditada, ni el soporte de la IOFE/RENIEC, ni sellado de tiempo
por una TSA. La firma que produce el sistema es criptográficamente sólida y
válida **dentro del perímetro del propio sistema**, pero carece del valor legal
atribuido a una firma electrónica sobre documento electrónico.

Esta limitación se declara de forma explícita en el `../../../README.md` de `doc/00/` y en
la interfaz de usuario, y se maneja como riesgo crítico `RK-01` en
[`metodologia_general.md`](../metodologia/metodologia_general.md).

---

## 7. Conclusiones del Análisis

| # | Conclusión |
|---|-----------|
| 1 | El problema es real, recurrente y con consecuencias legales; no es un artificio académico. |
| 2 | Las soluciones del mercado resuelven parcialmente el problema, pero introducen dependencia de un tercero o costo recurrente. |
| 3 | La criptografía asimétrica y el hash encadenado son tecnologías maduras y verificables; su uso no requiere invención. |
| 4 | La brecha identificada justifica la construcción de una solución específica. |
| 5 | El alcance de la tesis debe declarar la limitación legal con honestidad, en lugar de presentar el sistema como equivalente a una firma certificada. |

---

**Documentos relacionados**

- [`../requerimientos/requerimientos.md`](../requerimientos/requerimientos.md) — Requerimientos derivados de esta brecha
- [`../articulos_sustentacion/sustentacion_articulos.md`](../articulos_sustentacion/sustentacion_articulos.md) — Artículos que sustentan las afirmaciones
