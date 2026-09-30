# Aplicación de la ISO/IEC 27001:2022 al SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 1.0.0 · **Naturaleza del documento:** autoevaluación interna, no certificada

> Este documento aplica la estructura de la norma ISO/IEC 27001:2022 al sistema SGD-FD
> utilizando como evidencia el código fuente implementado. **El SGD-FD no cuenta con
> certificación ni ha sido objeto de auditoría externa.** Se declara explícitamente para
> evitar que la lectura de estas tablas sugiera un reconocimiento externo inexistente.

## 0. Tabla de Contenido

1. Introducción y alcance · 2. Contexto · 3. Estructura de la norma · 4. Aplicación por dominios · 5. Gestión de riesgos · 6. Declaración de Aplicabilidad · 7. Auditoría y bitácora · 8. Continuidad · 9. Mejora continua · 10. Limitaciones

## 1. Introducción y alcance

### 1.1. Propósito

El propósito es evaluar la correspondencia entre los controles de seguridad del SGD-FD y
los temas temáticos del Anexo A de la norma, identificar brechas y establecer una línea
base de mejora continua.

### 1.2. Alcance del sistema evaluado

| Elemento | Descripción |
|----------|-------------|
| Backend | Node.js con Express 4.21.2 y TypeScript |
| Frontend | SvelteKit 2.63 con Svelte 5.56 |
| Persistencia | `sql.js` (SQLite en memoria, sin proceso de servidor de base de datos) |
| Criptografía | Exclusivamente `node:crypto`; sin bibliotecas criptográficas de terceros |
| Superficie expuesta | Cinco routers bajo el prefijo `/api` |
| Roles | `user` y `admin` |
| Almacenamiento de archivos | Disco del servidor, sin cifrado en reposo |

### 1.3. Fuera de alcance

| Aspecto excluido | Motivo |
|------------------|--------|
| Certificación de la norma | No se dispose de auditoría externa ni de organismo certificador |
| Controles de naturaleza física del datacenter | El proyecto no administra la infraestructura del datacenter del operador |
| Criptografía de terceros | El sistema no usa PKI externa, ni TSA, ni AC acreditada |

## 2. Contexto

### 2.1. Activos de información

| Activo | Descripción | Criticidad |
|--------|-------------|:----------:|
| Contenido de los documentos | Archivos cargados por los usuarios, con datos institucionales | Muy alta |
| Claves privadas de los usuarios | Pares RSA-2048, cifrados con AES-256-GCM | Muy alta |
| Contraseñas de usuario | Protegidas con `bcryptjs`, factor de coste 12 | Muy alta |
| Registros de auditoría | Bitácora encadenada por SHA-256, de solo adición | Alta |
| Secretos de despliegue | Secreto de firma JWT, orígenes CORS, credenciales del entorno | Alta |
| Sesiones activas | Tokens de acceso y de refresco emitidos con `jsonwebtoken` | Media |
| Metadatos y perfiles | Nombres de usuario, visibilidad de documentos, perfiles públicos | Media |

### 2.2. Actores

| Actor | Descripción | Nivel de privilegio |
|-------|-------------|---------------------|
| Usuario no registrado | Puede consultar el registro y verificar documentos por huella | Nulo |
| Usuario `user` | Crea documentos, firma, propone cambios, gestiona sus documentos | Medio |
| Administrador `admin` | Consulta la bitácora íntegra y verifica la cadena de hash | Alto, limitado a auditoría |
| Atacante externo | Intenta acceder a documentos ajenos, forzar credenciales o alterar la bitácora | Nulo, hostil |
| Administrador de infraestructura | Opera el servidor, el sistema de archivos y el entorno | Máximo sobre el despliegue |

### 2.3. Amenazas relevantes

| Amenaza | Origen típico | Consecuencia para el SGD-FD |
|---------|---------------|-----------------------------|
| Suplantación de identidad | Credenciales robadas o adivinadas | Acceso a documentos ajenos |
| Manipulación de documentos | Acceso de escritura al almacenamiento | Ruptura de la promesa de integridad |
| Alteración de la bitácora | Acceso de escritura a la base de datos | Pérdida de trazabilidad |
| Filtración de claves privadas | Robo de la base de datos y de contraseñas | Falsificación de firmas |
| Inyección de consultas | Entrada de usuario en sentencias SQL | Lectura o modificación de datos |
| Denegación de servicio | Exceso de peticiones o de intentos de acceso | Indisponibilidad del servicio |
| Abuso de la confianza en la verificación | Consulta del endpoint de verificación incorrecto | Aceptación de documentos manipulados |

## 3. Estructura de la ISO/IEC 27001:2022

La norma se organiza en cláusulas de requisitos (4 a 10) y en un Anexo A con 93 controles
de referencia distribuidos en cuatro temas.

### 3.1. Cláusulas 4 a 10

| Cláusula | Título | Aplicación en el SGD-FD |
|---------|--------|-------------------------|
| 4 | Contexto de la organización | La organización es el equipo del proyecto; su contexto se documenta en las secciones 1 y 2 |
| 5 | Liderazgo | El rol `admin` ejerce el liderazgo operativo sobre el control de acceso a la bitácora |
| 6 | Planificación | La gestión de riesgos se documenta en la sección 5 |
| 7 | Soporte | Los recursos son el proceso de Node.js, el almacenamiento y las dependencias declaradas |
| 8 | Operación | La operación efectiva se evidencia en la bitácora, la verificación de integridad y el control de acceso |
| 9 | Evaluación de rendimiento | La revisión se realiza sobre la verificación de la cadena de hash y la revisión de riesgos |
| 10 | Mejora | La mejora continua se planifica en la sección 9 |

### 3.2. Temas del Anexo A

| Tema | Controles de referencia | Núcleo temático para el SGD-FD |
|------|------------------------|--------------------------------|
| Controles organizacionales | 37 controles | Políticas, roles, gestión de riesgos, tratamiento de incidentes |
| Controles de personas | 8 controles | Competencia, responsabilidades, alta y baja de usuarios |
| Controles físicos | 14 controles | Protecciones del entorno físico y del soporte |
| Controles tecnológicos | 34 controles | Control de acceso, criptografía, seguridad en la desarrollo y en las operaciones |

> **Criterio de numeración empleado.** Las tablas de las secciones siguientes identifican los
> controles por su **nombre**, tal como aparecen en el Anexo A de la norma. Se evita asignar
> un número a los controles cuya numeración exacta no ha sido verificada contra el texto
> oficial, por considerar que una referencia errónea sería más dañina para la tesis que una
> descripción nominal precisa.

## 4. Aplicación por dominios

La siguiente tabla recorre los cuatro temas del Anexo A, describiendo cada control por su
nombre y consignando la evidencia verificable en el SGD-FD.

### 4.1. Controles organizacionales

| Control (por nombre) | Aplicación en el SGD-FD | Evidencia | Estado |
|----------------------|------------------------|-----------|:------:|
| Políticas de seguridad de la información | Modelo de seguridad definido y publicado en la documentación del proyecto | [Documento de seguridad](../seguridad/seguridad.md) | Implementado |
| Roles y responsabilidades de la seguridad | Separación entre `user` y `admin`; el administrador no accede a documentos ajenos | Router de auditoría restringido a `admin` | Implementado |
| Separación de funciones | Administración del sistema separada de la propiedad del contenido | Verificación de `user_id` en cada ruta de documento | Implementado |
| Gestión de los riesgos de la seguridad | Identificación, evaluación y tratamiento documentados | Sección 5 de este documento | Implementado |
| Gestión de incidentes de seguridad | Procedimiento de detección, contención y respuesta | Sección 12 del documento de seguridad | Implementado |
| Continuidad de la actividad y de los servicios | Procedimiento de recuperación desde copia verificada por hash | Sección 8 de este documento | Parcial |
| Cumplimiento de los requisitos legales y contractuales | Limitación legal declarada: no es firma certificada bajo la Ley N.° 27269 | Sección 13 del documento de seguridad | Parcial |
| Revisión por la dirección | Autoevaluación periódica sobre riesgos y cadena de auditoría | Sección 9 de este documento | Parcial |
| Construcción de la seguridad en la arquitectura y el diseño | Separación de la lógica de autorización en la capa de servicio | [Arquitectura del sistema](../../02_diseno_construccion/arquitectura/arquitectura.md) | Implementado |
| Gestión de la seguridad en los proyectos | Pruebas que ejercitan la verificación criptográfica | [Matriz de pruebas](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) | Implementado |
| Acceso a la información | Rutas `public`, `file` y `qr` con comprobación de visibilidad y propiedad | Router de documentos | Parcial |
| Cambios en la seguridad de la información | Registro de los nueve tipos de evento en la bitácora | Sección 9 de este documento | Implementado |

### 4.2. Controles de personas

| Control (por nombre) | Aplicación en el SGD-FD | Evidencia | Estado |
|----------------------|------------------------|-----------|:------:|
| Selección y asignación de responsabilidades | El registro es abierto; no hay proceso de selección de personal | `POST /api/auth/register` | Pendiente |
| Deberes de los usuarios | Política de contraseñas y regla de propiedad de documentos | Sección 3 del documento de seguridad | Parcial |
| Capacitación y concienciación | No se incluye en el alcance del proyecto | — | Pendiente |
| Proceso disciplinario | No aplica al ámbito de un proyecto de software | — | No aplica |
| Responsabilidades tras la terminación o cambio de trabajo | No hay gestión de baja de usuarios; el registro es permanente | Esquema de usuarios | Pendiente |
| Restricciones de acceso y uso de la información | Autorización por propietario en la capa de servicio | Router de documentos | Implementado |

### 4.3. Controles físicos

| Control (por nombre) | Aplicación en el SGD-FD | Evidencia | Estado |
|----------------------|------------------------|-----------|:------:|
| Perímetro de seguridad física | No administrado por el proyecto; depende del datacenter del operador | [Diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md) | Fuera de alcance |
| Control de acceso físico | No administrado por el proyecto | — | Fuera de alcance |
| Protección contra amenazas ambientales | No administrado por el proyecto | — | Fuera de alcance |
| Ubicaciones protegidas | No administrado por el proyecto | — | Fuera de alcance |
| Protección frente a la salud y seguridad | No administrado por el proyecto | — | Fuera de alcance |
| Control de las áreas protegidas y supervisadas | No aplica al despliegue del servidor | — | No aplica |
| Entrega física | No aplica: los documentos se entregan por API | — | No aplica |
| Almacenamiento en soporte | Los documentos residen en el sistema de archivos del servidor | Ruta de almacenamiento | Parcial |
| Mantenimiento de los activos | Los archivos se almacenan sin cifrado en reposo | Servicio de documentos | Parcial |
|ретirada de los activos | No se implementa deterioro seguro de documentos; el borrado lógico no está contemplado | Esquema de documentos | Pendiente |

### 4.4. Controles tecnológicos

| Control (por nombre) | Aplicación en el SGD-FD | Evidencia | Estado |
|----------------------|------------------------|-----------|:------:|
| Política de autenticación | Tokens JWT emitidos y verificados con `jsonwebtoken`; límite de intentos de acceso | Router de autenticación | Implementado |
| Gestión de la información de autenticación | Contraseñas con `bcryptjs` factor 12; secreto JWT externalizado | Variables de entorno | Implementado |
| Enrolamiento de usuarios y proceso de alta | Registro público; no se exige justificación ni verificación de identidad | `POST /api/auth/register` | Pendiente |
| Uso de utilidades privilegiadas | El rol `admin` está acotado a lectura de auditoría | Router de auditoría | Implementado |
| Control de acceso | Autorización por propietario del documento en cada ruta | Router de documentos | Parcial |
| Gestión de claves criptográficas | Pares RSA-2048 generados con `node:crypto`; clave privada cifrada con AES-256-GCM y PBKDF2 con 100 000 iteraciones | Servicio criptográfico | Implementado |
| Restricción de la información que aparece en los registros | Los eventos `LOGIN_FAILED` no exponen el detalle de la credencial fallida | Política de respuestas | Implementado |
| Uso de utilidades de administración de archivos | No hay utilidades de administración de archivos expuestas por la API | Rutas de documentos | Implementado |
| Cifrado en tránsito | A cargo del despliegue; `helmet` establece `Strict-Transport-Security` | Sección 8 del documento de seguridad | Parcial |
| Protección de los registros de auditoría | Tabla de solo adición encadenada con SHA-256 | Sección 7 de este documento | Implementado |
| Limitación del tamaño de la información | Limitador global de 300 peticiones por 15 minutos en el prefijo `/api` | Utilidad de limitación de tasa | Implementado |
| Separación de los entornos de desarrollo, prueba y producción | No se documenta separación de entornos; el despliegue documentado es único | [Implementación y despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md) | Pendiente |
| Aspectos de seguridad en el desarrollo de software | Pruebas automatizadas de los flujos de firma y verificación | [Métricas de calidad](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) | Implementado |
| Gestión de la seguridad de las vulnerabilidades técnicas | No se incorpora análisis automatizado de dependencias vulnerables | `package.json` | Pendiente |
| Aplicación de las directrices de programación segura | Criptografía con `node:crypto`; sin algoritmos propios; secretos externalizados | Servicio criptográfico | Parcial |
| Sistema operativo seguro | Depende de la configuración del servidor y del sistema anfitrión | [Diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md) | Parcial |
| Protección frente a código malicioso | No se ejecuta código de los documentos; no hay deserialización de objetos confiables | Servicio de documentos | Implementado |
| Copias de seguridad | Procedimiento de copia descrito, sin verificación automatizada por hash | Sección 8 de este documento | Pendiente |
| Registro de eventos | Bitácora con nueve tipos de evento, incluidos accesos fallidos | Sección 7 de este documento | Implementado |
| Sincronización del reloj | `created_at` se registra en el servidor, sin fuente de tiempo externa | Esquema de auditoría | Parcial |
| Uso de utilidades de diagnóstico | No se expone información de diagnóstico sensible en las respuestas | Servicios de error | Implementado |
| Manejo de los incidentes de seguridad y las mejoras | Procedimiento de respuesta documentado | Sección 12 del documento de seguridad | Implementado |
| Recolección de evidencia | La bitácora encadenada conserva la secuencia de eventos | Esquema de auditoría | Implementado |

## 5. Gestión de riesgos

### 5.1. Método de evaluación

| Escala | Probabilidad | Impacto | Riesgo resultante |
|:------:|--------------|---------|--------------------|
| 1 | Rara | Insignificante | Bajo |
| 2 | Improbable | Menor | Bajo |
| 3 | Posible | Moderado | Medio |
| 4 | Probable | Mayor | Alto |
| 5 | Casi segura | Crítico | Crítico |

El riesgo resultante se obtiene combinando probabilidad e impacto. El riesgo residual se
registra tras aplicar el tratamiento descrito.

### 5.2. Registro de riesgos

| Riesgo | Prob. | Impacto | Riesgo inherent | Tratamiento | Riesgo residual | Estado |
|--------|:----:|--------:|:----------------:|-------------|:--------------:|--------|
| Firma reportada como válida sin comprobación criptográfica en `GET /api/verify/:documentId` | 3 | 5 | Crítico | Declarar el defecto y dirigir al usuario al endpoint de verificación por hash | Alto | Abierto |
| Concatenación de sentencias SQL mediante `db.exec` | 3 | 4 | Alto | Validación de entrada en la capa de servicio y encapsulación en `DbDriver` | Medio | Parcial |
| Filtración del secreto de firma JWT | 2 | 5 | Medio | Externalización mediante variables de entorno; rotación manual documentada | Medio | Parcial |
| Robo de la clave privada por acceso a la base de datos | 2 | 5 | Medio | Cifrado AES-256-GCM con clave derivada mediante PBKDF2 | Medio | Parcial |
| Denegación de servicio por agotamiento del cupo de peticiones | 3 | 3 | Medio | Limitador global de 300 peticiones en 15 minutos | Bajo | Implementado |
| Fuerza bruta contra el inicio de sesión | 3 | 4 | Alto | Limitador de intentos con bloqueo temporal; `bcryptjs` factor 12 | Bajo | Implementado |
| Manipulación de la bitácora por acceso de escritura al almacén | 2 | 4 | Medio | Tabla de solo adición encadenada por SHA-256 | Medio | Parcial |
| Lectura de documentos de otro usuario por fallo de autorización | 2 | 4 | Medio | Verificación de `user_id` en cada ruta de documento | Medio | Parcial |
| Uso del sistema como si fuera una firma certificada | 3 | 4 | Alto | Declaración de limitación legal explícita en la documentación y en la interfaz | Bajo | Implementado |
| Pérdida de la base de datos en memoria por reinicio del proceso | 3 | 4 | Alto | Persistencia del almacén desde la memoria al almacenamiento | Medio | Parcial |
| Incorporación de una dependencia vulnerable | 3 | 3 | Medio | Versiones fijadas en `package.json`; sin análisis automatizado | Medio | Pendiente |
| Manipulación de la marca temporal de la firma | 2 | 4 | Medio | No se presenta como evidencia criptográfica de temporalidad | Alto | Aceptado |

### 5.3. Lectura del registro

Dos riesgos merecen examen aparte por su impacto en la promesa central del sistema: la
verificación de firma no real y la ausencia de sello de tiempo. Ambos se aceptan de forma
explícita y documentada, no se ocultan. El resto de riesgos ha sido reducido mediante
tratamientos concretos verificables en el código.

## 6. Declaración de Aplicabilidad

La siguiente tabla resume el estado de los controles evaluados según la escala de la
sección 4.

| Estado | Significado | Tratamiento en el proyecto |
|:------:|-------------|----------------------------|
| Implementado | El control existe y es verificable en el código | Se mantiene y se somete a pruebas |
| Parcial | El control existe pero no cubre la totalidad del riesgo | Se documenta la brecha y se planifica completarlo |
| Pendiente | El control no existe en esta versión | Se incorpora en la hoja de ruta de mejora |
| Fuera de alcance | El control excede el ámbito del proyecto | Se delega en el responsable de la infraestructura |
| No aplica | El control no se relaciona con el sistema | Se excluye de la evaluación |

| Tema del Anexo A | Implementados | Parciales | Pendientes | Fuera de alcance |
|-----------------|:------------:|:---------:|:----------:|:----------------:|
| Organizacionales | 8 | 4 | 0 | 0 |
| De personas | 1 | 1 | 4 | 0 |
| Físicos | 0 | 2 | 1 | 5 |
| Tecnológicos | 9 | 5 | 5 | 0 |
| **Total** | **18** | **12** | **10** | **5** |

La proporción de controles implementados refleja un sistema con una capa criptográfica y
de control de acceso sólida, y con brechas claras en los ámbitos organizativos y físicos,
que dependen de factores externos al proyecto de software.

## 7. Auditoría y bitácora

### 7.1. Estructura de la bitácora

La bitácora se implementa sobre una tabla de **solo adición**: no admite `UPDATE` ni
`DELETE`. Esta propiedad del esquema sustenta la trazabilidad del SGD-FD.

| Columna | Función en la cadena |
|---------|---------------------|
| `event_type` | Clave del tipo de evento |
| `entity_type` | Tipo de entidad afectada |
| `entity_id` | Identificador de la entidad |
| `user_id` | Actor que originó la operación |
| `event_data` | Carga útil serializada |
| `previous_hash` | Huella SHA-256 del registro anterior |
| `current_hash` | Huella SHA-256 del presente registro |
| `created_at` | Marca temporal del servidor |

### 7.2. Eventos registrados

| Tipo de evento | Utilidad para la auditoría |
|----------------|---------------------------|
| `USER_REGISTERED` | Trazabilidad del alta de cuentas y de la huella de la clave pública |
| `LOGIN_SUCCESS` | Detección de patrones anómalos de acceso |
| `LOGIN_FAILED` | Detección de ataques de fuerza bruta |
| `DOCUMENT_UPLOAD` | Trazabilidad de la creación de contenido |
| `DOCUMENT_UPDATE` | Trazabilidad de la modificación con huella previa y nueva |
| `DOCUMENT_VISIBILITY_CHANGED` | Trazabilidad de cambios en la exposición del contenido |
| `DOCUMENT_PROPOSAL_CREATED` | Trazabilidad de aportaciones de terceros |
| `DOCUMENT_PROPOSAL_ACCEPTED` | Trazabilidad del acto de aceptación del propietario |
| `DOCUMENT_PROPOSAL_REJECTED` | Trazabilidad del rechazo y su motivo |

### 7.3. Verificación de la cadena

| Aspecto | Descripción |
|---------|-------------|
| Mecanismo | Cada registro incorpora la huella del anterior en `previous_hash` |
| Función | SHA-256, calculada con `node:crypto` |
| Verificación | `GET /api/audit/verify-chain` recalcula y compara la cadena completa |
| Acceso | Restringido al rol `admin` |
| Resultado de la alteración | El eslabón roto queda identificado como evidencia |

> **Limitación declarada.** La cadena detecta la alteración pero no la previene frente a
> un atacante con acceso de escritura a la base de datos y capacidad de recalcular los
> eslabones. La resistencia depende de que el almacén permanezca fuera del alcance del
> atacante.

## 8. Continuidad

| Elemento | Situación en el SGD-FD | Observación |
|----------|------------------------|-------------|
| Persistencia de datos | `sql.js` mantiene la base en memoria del proceso | El reinicio del proceso obliga a reconstruir el estado desde la copia almacenada |
| Copia de seguridad | Procedimiento descrito en la documentación de operación | No hay verificación automatizada de la integridad de la copia |
| Verificación de la copia | La huella SHA-256 permite comprobarla | El proceso manual puede omitir la comprobación |
| Objetivo de recuperación | No fijado formalmente | Se propone como mejora en la sección 9 |
| Plan de continuidad | No existe plan de disasters formal | Brecha declarada en la Declaración de Aplicabilidad |
| Redundancia | No implementada; el despliegue es un proceso único | Adecuado para el alcance académico del proyecto |

## 9. Plan de mejora continua

| Horizonte | Iniciativa | Resultado esperado |
|-----------|-----------|--------------------|
| Corto plazo | Corregir la respuesta de `GET /api/verify/:documentId` para que no informe una validez no comprobada | Elimina el riesgo abierto de mayor severidad |
| Corto plazo | Sustituir la concatenación de sentencias por sentencias con parámetros en `DbDriver` | Cierra el riesgo de inyección SQL |
| Corto plazo | Incorporar análisis automatizado de dependencias vulnerables | Detección temprana de componentes de riesgo |
| Mediano plazo | Fijar objetivos de recuperación y automatizar la verificación por hash de las copias | Continuidad verificable |
| Mediano plazo | Documentar la separación de entornos de desarrollo, prueba y producción | Cumplimiento del control de separación de entornos |
| Mediano plazo | Registrar la baja de usuarios y revocar sus sesiones activas | Cierra el control de terminación de funciones |
| Mediano plazo | Definir el cifrado en reposo de los documentos almacenados | Reduce el impacto de una filtración del almacenamiento |
| Largo plazo | Integrar una autoridad de certificación acreditada y un sello de tiempo | Permitir el uso legal de la firma |
| Largo plazo | Someter el sistema a auditoría externa de seguridad | Sustituir la autoevaluación por verificación independiente |

El ciclo de mejora se apoya en tres disparadores: la aparición de un incidente de
seguridad, la revisión periódica del registro de riesgos de la sección 5 y cualquier cambio
significativo en la superficie de la API.

## 10. Limitaciones

> **Este apartado es determinante para la interpretación del documento.**

| Limitación | Consecuencia para el lector |
|------------|------------------------------|
| No existe certificación ISO/IEC 27001:2022 | Las tablas de las secciones 4 y 6 no pueden invocarse como reconocimiento externo |
| No existe auditoría externa de seguridad | Los estados «Implementado» y «Parcial» son juicios propios, elaborables por los autores del proyecto |
| La enumeración nominal de controles evita referencias numéricas dudosas | La trazabilidad a un número de control del Anexo A debe completarse con el texto oficial de la norma |
| Los controles físicos quedan mayoritariamente fuera de alcance | El sistema no cubre los riesgos del datacenter del operador |
| La marca temporal no es evidencia criptográfica | La bitácora acredita orden de operaciones, no temporalidad |
| La persistencia en memoria limita la disponibilidad | El reinicio del proceso afecta la continuidad del servicio |
| El SGD-FD no es firma electrónica certificada | La firma acredita integridad dentro de un dominio cerrado de confianza, no validez legal |

**Sobre la firma.** El SGD-FD produce una **firma criptográfica válida dentro del propio
sistema**, con RSA-2048, SHA-256 y clave privada protegida mediante AES-256-GCM con
derivación PBKDF2-HMAC-SHA512. Sin embargo, **no constituye firma electrónica certificada
bajo la Ley N.° 27269 del Perú**: no existe Autoridad de Certificación acreditada que
emita los certificados, y no hay sello de tiempo (TSA) que acredite la temporalidad de la
firma. El campo `created_at` es una afirmación del servidor, no una prueba criptográfica
de temporalidad.

**Sobre la autoevaluación.** Al no existir auditoría externa, los porcentajes de la
sección 6 describen la percepción de los autores del proyecto, no elDictamen de un
organismo evaluador. Presentarlos como tales sería metodológicamente incorrecto.

---

*Documento elaborado a partir de la verificación directa del código fuente del SGD-FD
versión 1.0.0. Las cifras de la Declaración de Aplicabilidad y los estados de los
controles son producto de una autoevaluación interna, sin valor certificante.*
