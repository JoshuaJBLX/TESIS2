# Guía de sustento bibliográfico para la tesis (SGD-FD)

## 1. Criterios de selección y marco bibliográfico

Este documento presenta el sustento bibliográfico del Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD). Dada la condición de que la carpeta `articulos/` se encuentra vacía, el presente documento se redacta como una guía de sustento con referencias reales, públicas y verificables de normas, estándares y publicaciones técnicas pertinentes al tema.

### 1.1 Criterios de selección

Las fuentes se han seleccionado aplicando los siguientes criterios:
- **Pertinencia**: relación directa con arquitectura de software, criptografía aplicada, firma electrónica/normativa, pruebas y calidad, seguridad de aplicaciones, auditoría/trazabilidad y formatos de código QR.
- **Autoridad**: normas ISO/IEC, publicaciones del NIST (FIPS, SP), RFC del IETF, organizaciones técnicas (OWASP) y obras reconocidas en ingeniería de software.
- **Reproducibilidad y verificabilidad**: se utilizan identificadores públicos (números de norma, FIPS, SP, RFC, ISBN). No se inventan DOI, páginas, fechas o detalles no comprobables.
- **Temporalidad**: se priorizan ediciones vigentes y versiones conocidas de normas/técnicas aplicables al alcance del proyecto.

### 1.2 Marco metodológico

- Los artículos y normas se citan exclusivamente por su referencia bibliográfica pública y verificable.
- Las copias de texto completo deben archivarse en la carpeta `articulos/` antes de la entrega de la tesis.
- Se distingue entre lo que sustenta decisiones de diseño (justificación técnica) y lo que no ha sido copiado localmente (estado pendiente).
- Las referencias listadas son reales y conocidas; cualquier dato bibliográfico marcado como "por verificar" indica que debe confirmarse al momento de archivar las copias.

## 2. Arquitectura de software

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| ART-01 | Martin Fowler. *Patterns of Enterprise Application Architecture*. Addison-Wesley, 2002. ISBN 978-0321127426. | Proporciona patrones para separar capas y responsabilidades en aplicaciones empresariales. | Arquitectura por capas (servicios, API, capa de datos). | Uso de capas, abstracciones y separación entre lógica de dominio y acceso a datos (`DbDriver` como abstracción). |
| ART-02 | Martin Fowler. *Refactoring: Improving the Design of Existing Code*. Addison-Wesley, 2ª ed., 2018. ISBN 978-0134757599. | Promueve mejoras incrementales con preservación de comportamiento verificable. | Mantenibilidad (RNF transversales), capacidad de prueba. | Desarrollo incremental con 120 pruebas automatizadas y verificación estática (0 errores de tipos). |
| ART-03 | Robert C. Martin. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017. ISBN 978-0132350884. | Propone independencia de frameworks, independencia de BD y separación de responsabilidades. | Arquitectura, mantenibilidad, modularidad. | Separación clara entre Express (backend) y SvelteKit (frontend), capa `DbDriver` para abstraer persistencia (SQLite en memoria). |
| ART-04 | Martin Kleppmann. *Designing Data-Intensive Applications*. O'Reilly Media, 2017. ISBN 978-1449373320. | Aborda integridad, consistencia, trazabilidad y sistemas con registros (logs). | Auditoría (bitácora solo-append), integridad de eventos. | Diseño de bitácora inmutable, solo-append (sin UPDATE/DELETE) con encadenamiento SHA-256 (`previous_hash`/`current_hash`). |

## 3. Criptografía aplicada a documentos

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| NORM-01 | NIST. *FIPS 180-4: Secure Hash Standard*. U.S. Department of Commerce, agosto 2015. [Publicación FIPS 180-4, NIST]. | Define SHA-256 como función de hash criptográfico para integridad. | Integridad de documentos, hashes y cadena de auditoría (`previous_hash`/`current_hash`). | Uso de SHA-256 para hashes y encadenamiento de eventos de auditoría. |
| NORM-02 | NIST. *FIPS 186-5: Digital Signature Standard (DSS)*. U.S. Department of Commerce, febrero 2023. [Publicación FIPS 186-5, NIST]. | Especifica algoritmos para firmas digitales (RSA/DSA/ECDSA). | Emisión y firma de documentos. | Uso de RSA-2048 para firma digital (algoritmo basado en estándares NIST). |
| NORM-03 | NIST. *FIPS 197: Advanced Encryption Standard (AES)*. U.S. Department of Commerce, noviembre 2001. [Publicación FIPS 197, NIST]. | Define AES como estándar para cifrado simétrico. | Protección de clave privada (cifrado en reposo). | Cifrado de la clave privada con AES-256-GCM. |
| NORM-04 | NIST. *SP 800-132: Recommendation for Password-Based Key Derivation*. U.S. Department of Commerce, diciembre 2010. [NIST SP 800-132]. | Recomienda PBKDF2 para derivar claves a partir de contraseñas. | Derivación de clave para proteger material criptográfico. | PBKDF2-HMAC-SHA512 con 100000 iteraciones. |
| NORM-05 | NIST. *SP 800-38A: Recommendation for Block Cipher Modes of Operation*. U.S. Department of Commerce, diciembre 2001 (incluye modos). [NIST SP 800-38A]. | Define modos de operación para cifrado por bloques (GCM como modo autenticado). | Cifrado autenticado (confidencialidad + integridad). | Uso de AES-256-GCM (modo autenticado) para proteger clave privada. |
| RFC-01 | IETF. *RFC 7519: JSON Web Token (JWT)*. Internet Engineering Task Force, mayo 2015. | Define formato compacto y autoverificable para tokens de acceso. | Autenticación/autorización. | Uso de JWT conforme a RFC 7519. |
| RFC-02 | IETF. *RFC 2104: HMAC: Keyed-Hashing for Message Authentication*. Internet Engineering Task Force, febrero 1997. | Especifica HMAC para autenticación de mensajes basada en hash. | Verificaciones con HMAC en contexto criptográfico (soporte a operaciones con SHA). | Uso de HMAC-SHA512 en PBKDF2 (conforme a RFC 2104 y recomendaciones NIST). |
| RFC-03 | IETF. *RFC 8017: PKCS #1: RSA Cryptography Specifications Version 2.2*. Internet Engineering Task Force, noviembre 2016. | Define especificaciones para operaciones RSA (cifrado/firma) PKCS#1 v2.2. | Firma RSA-2048 aplicada a documentos. | Alineación con prácticas de firma RSA (PKCS#1 v2.2) para operaciones criptográficas. |

## 4. Firma electrónica y normativa

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| NORM-06 | ISO/IEC 15489-1:2016. *Information and documentation — Records management — Part 1: Concepts and principles*. | Establece principios para gestión de documentos y conservación de registros. | Gestión documental, trazabilidad, conservación. | Soporte a inmutabilidad y trazabilidad de documentos (versionado, bitácora). |
| NORM-07 | ISO/IEC 17021-1:2015. *Conformity assessment — Requirements for bodies providing audit and certification of management systems — Part 1: Requirements*. | Define requisitos para organismos de certificación/auditoría (contexto de evaluación de sistemas). | Marco de auditoría y trazabilidad (referencial). | Contexto normativo para trazabilidad/auditoría del sistema. |
| NORM-08 | Ley N.º 27269 del Perú. *Ley sobre Firmas y Certificados Digitales*. Publicada en el Diario Oficial El Peruano; reglamento aplicable. [Marco normativo peruano sobre firmas electrónicas]. | Regula firmas electrónicas y certificados digitales en Perú. | Alcance de firma electrónica del proyecto. | Declaración explícita: la firma es criptográficamente válida dentro del SGD-FD, pero NO es firma electrónica certificada según Ley N.º 27269 (no existe Autoridad de Certificación acreditada ni sello de tiempo TSA). |
| NORM-09 | NIST. *SP 800-53 Rev. 5: Security and Privacy Controls for Information Systems and Organizations*. U.S. Department of Commerce, septiembre 2020. [NIST SP 800-53 Rev. 5]. | Proporciona controles para integridad, auditoría, autenticación y responsabilidad. | Controles de seguridad, auditoría, trazabilidad. | Soporta diseño de bitácora inmutable, control de acceso, autenticación, responsabilidad y no repudio (a nivel de controles aplicables). |

## 5. Pruebas y calidad

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| NORM-10 | ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. | Define modelo de calidad de producto con 8 características. | Calidad de producto (funcionalidad, eficiencia, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad, portabilidad). | Aplicación directa documentada en `../iso_aplicada/aplicacion_iso_25000.md`. |
| NORM-11 | ISO/IEC 25019:2023. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Guide to quality evaluation*. | Guía para medir la calidad del producto de software. | Proceso de evaluación y métricas (definición, recolección, análisis, acciones). | Métricas con valores reales: 120/120=100 %, trazabilidad 27/27 y 44/44=100 %, cobertura UI 43 %, tipos 0. |
| NORM-12 | ISO/IEC/IEEE 29119-1:2022. *Software and systems engineering — Software testing — Part 1: Concepts and definitions*. | Define conceptos fundamentales de pruebas de software. | Marco conceptual de pruebas. | Soporta enfoque de pruebas automatizadas por capas (unitarias, servicios, API/integración, aceptación). |
| NORM-13 | ISO/IEC/IEEE 29119-2:2021. *Software and systems engineering — Software testing — Part 2: Test processes*. | Describe procesos de pruebas (planificación, diseño, ejecución, reporte). | Proceso de pruebas. | Referencial para `../../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md` y enfoque de ejecución. |
| NORM-14 | ISO/IEC/IEEE 29119-3:2021. *Software and systems engineering — Software testing — Part 3: Test documentation*. | Especifica documentación de pruebas. | Documentación de pruebas (matrices). | Estructura de `matriz_pruebas.md`, `matriz_trazabilidad.md`, `metricas_calidad.md`. |
| STD-01 | Cohn, Mike. *Succeeding with Agile: Software Development Using Scrum*. Addison-Wesley, 2009. ISBN 978-0321579362. | Populariza la pirámide de pruebas (concepto) y enfoques de pruebas por niveles. | Niveles de pruebas (pirámide). | Justifica distribución: unitarias (37), servicios (23), API/integración (33), aceptación (5); frontend por capas (15 cliente HTTP, 7 estado autenticación). |
| STD-02 | Beck, Kent. *Test Driven Development: By Example*. Addison-Wesley, 2002. ISBN 978-0321146533. | Promueve TDD y enfoque orientado a pruebas verificables. | Enfoque TDD y capacidad de prueba. | Alineado con `../../02_diseno_construccion/pruebas_calidad/enfoque_tdd.md` y enfoque BDD (`enfoque_bdd.md`). |

## 6. Pruebas de seguridad

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| SEC-01 | OWASP. *OWASP Top 10:2021*. OWASP Foundation, 2021. [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) | Identifica riesgos críticos de seguridad en aplicaciones web. | Seguridad transversal (autenticación, autorización, validación, configuración). | Orienta controles: JWT, `helmet`, `cors`, validación de entradas, bloqueo por intentos fallidos con expiración, limitador de tasa 300 req/15 min sobre `/api`. |
| SEC-02 | OWASP. *OWASP API Security Top 10:2023*. OWASP Foundation, 2023. [https://owasp.org/www-project-api-security/](https://owasp.org/www-project-api-security/) | Enumera riesgos específicos de APIs. | Seguridad de endpoints `/api/*`. | Justifica controles de autorización, limitación de tasa, protección contra abuso de autenticación y validación en capa API. |
| SEC-03 | OWASP. *OWASP Application Security Verification Standard (ASVS) v4.0.x*. OWASP Foundation, 2021 (v4.0.3). [https://owasp.org/www-project-application-security-verification-standard/](https://owasp.org/www-project-application-security-verification-standard/) | Proporciona requisitos de verificación de seguridad (nivel aplicable). | Verificación de controles criptográficos y autenticación. | Referencial para verificación de controles (PBKDF2, bcrypt coste 12, AES-GCM, JWT, bitácora inmutable). |

## 7. Auditoría y trazabilidad

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| NORM-15 | ISO/IEC 27001:2022. *Information security, cybersecurity and privacy protection — Information security management systems — Requirements*. | Define requisitos para un Sistema de Gestión de Seguridad de la Información (SGSI). | Seguridad, auditoría, responsabilidad. | Marco referencial para bitácora de auditoría, trazabilidad y controles criptográficos. |
| NORM-16 | ISO/IEC 27000:2018. *Information technology — Security techniques — Information security management systems — Overview and vocabulary*. | Proporciona vocabulario y visión general de seguridad de la información. | Terminología y alcance de auditoría. | Alineación terminológica (responsabilidad, integridad, no repudio). |
| STD-03 | Schneier, Bruce. *Applied Cryptography: Protocols, Algorithms, and Source Code in C*. John Wiley & Sons, 2ª ed., 1996. ISBN 978-0471117094. | Aborda conceptos de integridad, hashes y registros a prueba de manipulación (tamper-evident). | Bitácora con hash encadenado (tamper-evident logging). | Justifica diseño append-only y encadenamiento SHA-256 (`previous_hash`/`current_hash`) para detectar manipulación. |
| STD-04 | Crosby, Scott A.; Wallach, Dan S. "Efficient Data Structures for Tamper-Evident Logging". *USENIX Security Symposium*, 2009. [Publicación USENIX Security 2009, por verificar]. | Propone estructuras eficientes para logs a prueba de manipulación. | Bitácora inmutable y encadenada. | Referencia técnica complementaria para concepto de *tamper-evident logging* (append-only). Por verificar al archivar copia completa. |

## 8. Formatos y otros estándares aplicables

| Identificador | Referencia completa | Argumento central (una frase) | Componente o requerimiento del SGD-FD al que sustenta | Decisión de diseño justificada |
|---|---|---|---|---|
| NORM-17 | ISO/IEC 18004:2015. *Information technology — Automatic identification and data capture techniques — QR Code bar code symbology specification*. | Especifica la simbología del código QR. | Generación de códigos QR (verificación/identificación de documentos). | Uso de `qrcode` para generación conforme al estándar ISO/IEC 18004. |

## 9. Mapeo referencias → componentes del sistema

| Componente del sistema | Referencias aplicables (identificadores) | Explicación del mapeo |
|---|---|---|
| Arquitectura/capas (Express + SvelteKit) | ART-01, ART-02, ART-03 | Separación de responsabilidades, independencia de frameworks, mantenibilidad. |
| Persistencia (`DbDriver`, SQLite en memoria) | ART-03, ART-04 | Abstracción de acceso a datos, diseño orientado a datos con trazabilidad. |
| Auditoría (bitácora solo-append, encadenada SHA-256) | ART-04, STD-03, STD-04, NORM-15, NORM-16 | Integridad, inmutabilidad, *tamper-evident logging*, responsabilidad. |
| Criptografía (RSA-2048, SHA-256, PBKDF2-HMAC-SHA512, AES-256-GCM) | NORM-01–NORM-05, RFC-02, RFC-03 | Cumplimiento de estándares NIST e IETF para firma, hashes, derivación y cifrado autenticado. |
| Autenticación/autorización (JWT, bcrypt, bloqueo) | RFC-01, SEC-01, SEC-02, SEC-03 | Tokens, protección contra abuso, controles de acceso. |
| Firma electrónica (alcance normativo) | NORM-06–NORM-09 | Marco documental y limitación legal explícita (Ley N.º 27269: no certificada, sin AC acreditada ni TSA). |
| Pruebas/calidad | NORM-10–NORM-14, STD-01, STD-02 | ISO 25010/25019, ISO/IEC/IEEE 29119, pirámide de pruebas, TDD/BDD. |
| Seguridad de API/aplicación | SEC-01–SEC-03 | OWASP Top 10 2021, API Security Top 10 2023, ASVS 4.0.x. |
| Código QR | NORM-17 | Generación conforme a ISO/IEC 18004. |

## 10. Normas y estándares aplicados (resumen)

| Identificador exacto | Norma/estándar | Parte/aplicación en el proyecto |
|---|---|---|
| ISO/IEC 25010:2011 | Sistemas y software — Calidad (modelo de producto) | 8 características y subcaracterísticas aplicadas (ver `../iso_aplicada/aplicacion_iso_25000.md`). |
| ISO/IEC 25019:2023 | Guía para medir calidad de producto | Métricas, proceso de evaluación (definición/recolección/análisis/acciones). |
| ISO/IEC 25012:2008 | Modelo de calidad de datos | Características aplicadas a datos (integridad, confidencialidad, trazabilidad). |
| ISO/IEC 15489-1:2016 | Gestión de documentos (registros) | Principios de conservación, trazabilidad, inmutabilidad. |
| ISO/IEC 27001:2022 / 27000:2018 | SGSI (requisitos/vocabulario) | Marco referencial de auditoría y seguridad. |
| ISO/IEC/IEEE 29119-1:2022, 2:2021, 3:2021 | Pruebas de software | Conceptos, procesos y documentación de pruebas. |
| ISO/IEC 18004:2015 | Código QR | Especificación de simbología QR. |
| FIPS 180-4 (2015), FIPS 186-5 (2023), FIPS 197 (2001) | Estándares criptográficos NIST | SHA-256, firma digital (RSA), AES. |
| NIST SP 800-132 (2010), SP 800-38A (2001), SP 800-53 Rev. 5 (2020) | Recomendaciones/controles NIST | PBKDF2, modos autenticados (GCM), controles de seguridad/auditoría. |
| RFC 7519 (2015), RFC 2104 (1997), RFC 8017 (2016) | IETF | JWT, HMAC, PKCS#1 v2.2 (RSA). |
| OWASP Top 10 2021, API Security Top 10 2023, ASVS 4.0.x | Seguridad de aplicaciones/APIs | Riesgos y verificación de controles. |
| Ley N.º 27269 (Perú) y reglamento | Firma electrónica peruana | Alcance legal: firma criptográfica válida internamente, NO certificada (sin AC acreditada ni TSA). |

## 11. Estado de cobertura bibliográfica y qué falta

| Aspecto | Estado | Observación |
|---|---|---|
| Referencias normativas (ISO/NIST/RFC/OWASP) | Completo (identificadores públicos). | Verificables. Requiere archivar copias en `articulos/`. |
| Publicaciones técnicas (Fowler, Martin, Kleppmann, Beck, Cohn, Schneier) | Completo por referencia bibliográfica. | ISBN incluidos cuando corresponde. Copias de texto completo pendientes en `articulos/`. |
| Referencias complementarias (Crosby–Wallach, USENIX 2009) | Identificada, marcada "por verificar". | Confirmar detalles bibliográficos exactos al obtener copia completa. |
| Copias físicas/digitales en `articulos/` | Pendiente | **Declaración metodológica**: todas las referencias anteriores se citan por su referencia bibliográfica pública y verificable. Las copias de texto completo deben archivarse en la carpeta `articulos/` antes de la entrega. |
| DOI/páginas concretas | No incluidos | No se inventan; omitidos intencionalmente por falta de certeza. |

## Referencias cruzadas

- `../iso_aplicada/aplicacion_iso_25000.md`
- `../metodologia/metodologia_general.md`
- `../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md`
- `../../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md`
- `../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md`
- `../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md`
- `../../02_diseno_construccion/pruebas_calidad/validacion_experimental.md`
- `../../02_diseno_construccion/pruebas_calidad/enfoque_tdd.md`
- `../../02_diseno_construccion/pruebas_calidad/enfoque_bdd.md`
- `../../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md`
- `../../02_diseno_construccion/arquitectura/arquitectura.md`
- `../../02_diseno_construccion/arquitectura/analisis_tecnico.md`
- `../../05_mantenimiento_evaluacion/evaluacion.md`