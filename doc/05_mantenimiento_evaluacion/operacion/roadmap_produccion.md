# Hoja de Ruta hacia Producción — SGD-FD

**Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)**

## 1. Objeto y alcance

Este documento define la ruta técnica que debe seguir el SGD-FD para pasar del
entorno de desarrollo verificado a un entorno de producción operable. No se trata
de una descripción de un despliegue ejecutado, sino de la planificación
sustentada en el estado real del código y en los bloqueos que se han comprobado
mediante inspección directa de los archivos del proyecto.

El alcance cubre cinco dimensiones: corrección de defectos conocidos,
persistencia de datos, elección y configuración del alojamiento, endurecimiento
de la seguridad y operación continua. La dimension de calidad de la interfaz de usuario
se aborda al final, por no bloquear el despliegue pero condicionar su sostenibilidad.

## 2. Situación actual verificada

### 2.1 Componentes del sistema

El SGD-FD es una aplicación web compuesta por dos módulos y una capa de
almacenamiento local.

| Componente | Tecnología | Estado |
|---|---|---|
| Backend | Node.js, Express 4.21.2, TypeScript | Funcional en local |
| Persistencia actual | `sql.js` (SQLite íntegramente en memoria) | Funcional en local |
| Carga de archivos | `multer`, directorio `uploads/` | Funcional en local |
| Criptografía | `node:crypto` (RSA-2048, SHA-256, PBKDF2-HMAC-SHA512, AES-256-GCM) | Funcional |
| Frontend | SvelteKit 2.63, Svelte 5.56 | Funcional en local |
| Adaptador de despliegue | `@sveltejs/adapter-auto` | Sin destino fijado |

La base de datos completa reside en memoria y se serializa a un archivo en disco.
Esta arquitectura es adecuada para desarrollo y pruebas, pero condiciona
fuertemente el modelo de despliegue, como se explica en la Fase 1.

### 2.2 Verificaciones ejecutadas sobre el código

La tabla siguiente recoge el resultado de las seis verificaciones ejecutadas
sobre el repositorio. Todas se realizaron en el entorno local de desarrollo.

| Verificación | Comando | Resultado |
|---|---|---|
| Suite de pruebas | `pnpm test` (backend y frontend) | 120 de 120 pruebas superadas |
| Tipos del backend | `npx tsc --noEmit` | 0 errores |
| Tipos del frontend | `npx svelte-check` | 0 errores y 0 advertencias |
| Compilación del backend | `pnpm build` | Correcta |
| Compilación del frontend | `pnpm build` | Correcta |
| Despliegue en producción | No ejecutado | Sin verificar |

El desglose de las 120 pruebas es el siguiente: 98 corresponden al backend, con
37 pruebas unitarias, 23 de servicios, 33 de API e integración y 5 de aceptación,
repartidas en 12 archivos de prueba. Las 22 restantes pertenecen al frontend, con
15 pruebas del cliente de la API y 7 del estado de autenticación, en 2 archivos.

Debe subrayarse que la sexta fila no es un resultado positivo. No existe ningún
despliegue en producción ejecutado ni validado. Existe un archivo `vercel.json`
en la raíz del proyecto, pero su validez nunca se ha comprobado ejecutando un
despliegue completo.

### 2.3 Bloqueos técnicos comprobados

La inspección del código permite identificar tres bloqueos que impiden considerar
el sistema apto para producción en su estado actual.

**Bloqueo 1: ausencia de soporte PostgreSQL.** La capa de datos se define
mediante el contrato `DbDriver`, cuyo diseño es síncrono. El único driver
funcional es `sqlite-driver`, construido sobre `sql.js`. En el archivo
`backend/src/db/connection.ts` el arranque comprueba la variable `DATABASE_URL`
y, si está definida, lanza deliberadamente un error con el mensaje
`DATABASE_URL esta definido pero el adaptador PostgreSQL todavia no esta
habilitado`. En consecuencia, el backend no puede conectarse a PostgreSQL.

**Bloqueo 2: sistema de archivos efímero.** El directorio `uploads/` reside en
el sistema de archivos local. En un entorno serverless cada invocación puede
ejecutarse sobre una instancia distinta, por lo que los documentos cargados se
perderían entre invocaciones. Este hecho invalida el despliegue serverless del
backend tal como está implementado.

**Bloqueo 3: adaptador de despliegue no fijado.** La configuración de SvelteKit
selecciona el adaptador según la variable de entorno `ADAPTER`, con la lógica
`node` para `adapter-node`, `vercel` para `adapter-vercel` y cualquier otro valor
para `adapter-auto`. Sin embargo, en `package.json` del frontend solo está
instalado `@sveltejs/adapter-auto`. Por tanto, fijar `ADAPTER=node` o
`ADAPTER=vercel` provoca un fallo de compilación hasta instalar el paquete
correspondiente.

## 3. Principios de la hoja de ruta

La planificación se rige por cinco principios, aplicados en este orden.

1. **Corrección antes que ampliación.** Ninguna funcionalidad nueva se incorpora
   hasta cerrar los defectos conocidos que afectan a la seguridad o a la
   veracidad de los resultados que el sistema comunica al usuario.
2. **Persistencia antes que despliegue.** Sin un almacén de datos que sobreviva
   al reinicio del proceso y a la redistribución de instancias, no existe
   despliegue posible en más de una instancia.
3. **Evidencia explícita.** Cada hito declara si ha sido verificado en el entorno
   local, verificado en un entorno de pruebas o pendiente de verificación. No se
   afirma un resultado que no proceda de una comprobación efectiva.
4. **Continuidad operativa.** Un despliegue que no se puede respaldar, restaurar
   ni revertir no es un despliegue completo.
5. **Cumplimiento normativo explícito.** Las limitaciones legales del sistema se
   declaran de forma visible y no se ocultan tras la validez criptográfica.

## 4. Fase 0 — Correcciones previas al despliegue

Ninguna de estas correcciones es opcional. Todas deben cerrarse antes de exponer
el sistema a usuarios reales.

### 4.1 Corrección del defecto de verificación por código QR

La ruta `GET /api/verify/:documentId`, destinada a la lectura del código QR,
devuelve en su respuesta el campo `signature.valid` con el valor `true`
literalmente fijo en el código, sin efectuar comprobación criptográfica alguna
sobre el archivo almacenado. Este comportamiento está presente en
`backend/src/routes/verify.ts`.

La corrección consiste en sustituir el valor fijo por el resultado de la
comprobación real de la firma, reutilizando la lógica criptográfica ya
implementada y disponible en la ruta `POST /api/verify`. Adicionalmente, debe
incorporarse una prueba automatizada que cubra el caso de un archivo modificado
después de la firma, con el fin de impedir la reaparición del defecto.

Este punto es el de mayor severidad de la hoja de ruta: un usuario que escanee un
código QR podría recibir una constancia de validez sobre un documento cuyo
contenido ha sido alterado.

### 4.2 Alineación de los tipos de Express

La dependencia de desarrollo `@types/express` está declarada en la versión
`^5.0.0`, mientras que la dependencia de producción `express` está fijada en
`^4.21.2`. Los tipos no corresponden a la versión realmente instalada. Esta
discrepancia puede producir errores de compilación ausentes en el momento actual
y, en particular, hacer que sobrecargas de funciones inexistentes en la versión 4
se consideren válidas.

La corrección es fijar `@types/express` en la rama `^4.17.x`, coherente con la
versión 4 de Express, y volver a ejecutar la compilación para confirmar que no
aparecen errores derivados de la alineación.

### 4.3 Protección del directorio de almacenamiento

El directorio `uploads/` y el archivo de base de datos deben quedar fuera del
repositorio y ser inaccesibles por cualquier vía que no sea el servicio de
documentos. Verificar además que las respuestas del servidor no exponen rutas
absolutas del sistema de archivos, dado que la ruta efectiva se construye con
`UPLOAD_DIR`.

### 4.4 Fijación del adaptador de despliegue

Para evitar que `adapter-auto` elija un destino no previsto, se debe instalar
explícitamente el adaptador correspondiente al alojamiento elegido y fijarlo en
la configuración, en lugar de depender de la detección automática. El
procedimiento concreto se desarrolla en la
[guia de despliegue a produccion](guia_despliegue_produccion.md).

### 4.5 Actualización de la biblioteca de carga de archivos

La versión declarada de `multer` pertenece a la línea 1.x, que se encuentra en
rama de mantenimiento. La versión 2.x fue reesificada. Procede evaluar y
ejecutar la actualización, con ejecución previa de la suite completa de pruebas,
antes de fijar una versión de producción.

## 5. Fase 1 — Datos y persistencia

### 5.1 El problema que exige la fase

El almacenamiento actual mantiene la base de datos completa en memoria y la
serializa a un archivo. Esto supone dos consecuencias operativas:

- El estado se pierde si el proceso termina de forma anormal antes de la
  serialización.
- El estado no se comparte entre instancias, lo que impide escalar
  horizontalmente y limita el despliegue a una sola instancia activa.

Mientras no se resuelva esta fase, el único modelo de despliegue admisible es un
servidor único con disco persistente.

### 5.2 Por qué la interfaz síncrona obliga a un rediseño

El contrato `DbDriver` expone métodos síncronos. El único driver existente ejecuta
las consultas sobre `sql.js`, que opera íntegramente en memoria y por tanto
responde de forma síncrona. Un cliente de PostgreSQL, en cambio, opera sobre red
y responde de forma asíncrona.

Adaptar el contrato a un driver de red no consiste en escribir una nueva
implementación de la misma interfaz: exige cambiar la firma de los métodos para que
devuelvan promesas, y propagar ese cambio a todos los servicios que los
consumen. Esta es la razón técnica de que el soporte PostgreSQL no sea una
tarea de configuración, sino una tarea de refactorización con impacto transversal
en la capa de servicios.

La alternativa de menor coste es mantener el almacenamiento en archivo y migrar
los documentos a un servicio de objetos, aceptando que la base de datos seguirá
siendo de un solo proceso. Ambas opciones se analizan a continuación.

### 5.3 Alternativa A: almacenamiento de objetos con base local

Consiste en mantener `sql.js` para los datos relacionales y trasladar los
archivos de `uploads/` a un servicio de objetos, de modo que el sistema de
archivos efímero deje de ser un bloqueo. Es la alternativa de menor esfuerzo y la
recomendada si el objetivo es un despliegue de una sola instancia con procesos
independientes para el backend y el frontend.

### 5.4 Alternativa B: PostgreSQL

Consiste en completar el driver PostgreSQL sobre el contrato `DbDriver`,
convirtiendo el contrato y sus consumidores a operaciones asíncronas, y
trasladando los documentos a almacenamiento de objetos. Es la alternativa
necesaria si se requiere escalado horizontal, alta disponibilidad o consultas
sobre grandes volúmenes de auditoría.

La alternativa B es la única compatible con un despliegue serverless del backend,
porque elimina la dependencia del sistema de archivos local y permite que
distintas invocaciones compartan estado.

### 5.5 Decisión recomendada y criterio de reversibilidad

Se recomienda adoptar la alternativa B cuando el propósito sea demostrar la
trazabilidad documental bajo carga real o con soporte de concurrencia, y la
alternativa A si el propósito se limita a una demostración institucional con
volumen moderado y un solo proceso.

Esta decisión debe adoptarse antes de configurar el alojamiento, ya que el
modelo de almacenamiento determina el modelo de despliegue. La justificación
detallada del diseño previsto se documenta en
[el plan de nube con Vercel y Supabase](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md).

## 6. Fase 2 — Despliegue

### 6.1 Elección del alojamiento

La elección debe responder a la fase anterior. Un alojamiento de proceso
persistente, con servidor propio o tradicional, admite la alternativa A. Un
alojamiento serverless exige la alternativa B, por las razones expuestas en el
apartado 2.3.

La sección de la
[guia de despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md)
describe la configuración del entorno en términos generales; esta hoja de ruta
fija los criterios de decisión.

### 6.2 Configuración del adaptador y de las variables de entorno

El adaptador del frontend se fija mediante la variable `ADAPTER` y requiere que el
paquete correspondiente esté instalado. Las variables del backend deben
configurarse en el entorno de destino, nunca en el repositorio. El inventario
completo, con su carácter obligatorio u opcional, figura en la
[guia de despliegue a produccion](guia_despliegue_produccion.md).

### 6.3 Verificación posterior al despliegue

El despliegue no se considera concluido hasta completar la lista de
verificación funcional, que comprende el registro de un documento, su firma, la
lectura del código QR, la verificación por contenido y la validación de la cadena
de auditoría. Los estados esperados de verificación se documentan en el apartado
noveno de la guía.

## 7. Fase 3 — Seguridad

### 7.1 Transporte y superficie de exposición

Todo el despliegue debe servirse bajo HTTPS con un certificado válido. La
documentación de las medidas de seguridad aplicadas en el sistema se recoge en
[el documento de seguridad](../seguridad/seguridad.md).

### 7.2 Gestión de secretos

La variable `JWT_SECRET` y `JWT_REFRESH_SECRET` poseen valores de reserva en el
código. Ese comportamiento es admisible en desarrollo y es inaceptable en
producción: si no se definen explícitamente, el sistema opera con secretos
conocidos. Debe configurarse un valor largo y aleatorio por entorno, almacenado en
el gestor de secretos de la plataforma de destino y rotado ante cualquier
sospecha de exposición.

### 7.3 Endurecimiento adicional

- Confirmar que el directorio de documentos y el archivo de base de datos no son
  alcanzables desde el servidor web.
- Evaluar la actualización de la biblioteca de carga de archivos descrita en el
  apartado 4.5.
- Revisar el límite global de 300 peticiones por cada 15 minutos aplicado sobre
  `/api` y el bloqueo temporal por intentos de autenticación fallidos, cuyo
  vencimiento es automático y por tanto no protege contra ataques distribuidos
  lentos.
- Incorporar registro estructurado de eventos de seguridad.

### 7.4 Limitación legal determinante

La firma producida por el SGD-FD es criptográficamente válida dentro del sistema:
emplea RSA-2048, un resumen SHA-256 y una clave privada protegida mediante
PBKDF2-HMAC-SHA512 con cien mil iteraciones. Sin embargo, **no constituye firma
electrónica certificada** conforme a la Ley N.° 27269, porque no interviene una
Autoridad de Certificación acreditada ni un sello de tiempo de confianza.

Esta limitación es determinante y debe resolverse antes de cualquier uso oficial.
El uso comercial o administrativo del sistema exige asesoría legal que
determine si la validez criptográfica interna resulta suficiente para el destino
previsto, o si resulta necesario incorporar un proveedor de servicios de
confianza acreditado. La decisión no es técnica y no puede adoptarse dentro del
proyecto sin dicho acompañamiento.

## 8. Fase 4 — Operación

### 8.1 Copias de seguridad

El modelo actual exige respaldar el archivo de base de datos y el directorio de
documentos como un conjunto coherente. Una copia de sólo uno de ellos produce un
estado inconsistente: documentos sin registro o registros sin documento. El
procedimiento de copia y restauración se especifica en el apartado 8 de la guía
de despliegue.

### 8.2 Registro y trazabilidad operativa

El sistema ya registra la auditoría de acciones de negocio y permite verificar la
integridad de la cadena. Complementariamente debe incorporarse un registro técnico
de la operación: acceso a la aplicación, errores, reinicios y latencia.

### 8.3 Alertas y disponibilidad

Deben definirse umbrales y alertas sobre disponibilidad del servicio, tasa de
error y uso de memoria. El proceso de verificación de la cadena de auditoría
conviene ejecutarse de forma programada, con el fin de detectar de manera
oportunada cualquier alteración del registro.

### 8.4 Escalabilidad

Con la arquitectura actual el escalado vertical es la única opción, dado que el
estado reside en el proceso. El escalado horizontal exige la fase 1, alternativa B.

## 9. Fase 5 — Calidad

### 9.1 Cobertura de la interfaz de usuario

Las pruebas automatizadas cubren actualmente tres de las siete áreas de la
interfaz de usuario, lo que representa una cobertura del 43 por ciento. Las áreas
no cubiertas corresponden a componentes de presentación que merecen
verificación propia. Los datos completos de cobertura se encuentran en
[las métricas de calidad](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md),
y el detalle por prueba en
[la matriz de pruebas](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md).

La corrección del defecto descrita en el apartado 4.1 debe incorporar su prueba
en esta área.

### 9.2 Automatización de la integración continua

Las seis verificaciones del apartado 2.2 deben ejecutarse de forma automática en
cada confirmación de código, con el fin de impedir que una regresión alcance el
entorno de despliegue. La configuración actual de plataforma se apoya en la
detección automática del framework, lo que introduce variabilidad; fijar el
adaptador, como se indica en el apartado 4.4, reduce esa incertidumbre.

## 10. Resumen de hitos

| Hito | Fase | Esfuerzo | Dependencia | Bloqueo |
|---|---|---|---|---|
| Corregir `signature.valid` fijo en `GET /api/verify/:documentId` | 0 | M | Ninguna | Crítico |
| Alinear `@types/express` con Express 4 | 0 | B | Ninguna | Medio |
| Proteger y aislar `uploads/` y el archivo de base de datos | 0 | B | Ninguna | Crítico |
| Fijar el adaptador e instalar el paquete correspondiente | 0 | B | Decisión de alojamiento | Crítico |
| Evaluar actualización de `multer` | 0 | B | Ninguna | Bajo |
| Decidir el modelo de persistencia | 1 | M | Fase 0 | Crítico |
| Trasladar documentos a almacenamiento de objetos | 1 | M | Decisión de persistencia | Crítico |
| Convertir `DbDriver` a contrato asíncrono e implementar PostgreSQL | 1 | H | Decisión de persistencia | Alto |
| Configurar alojamiento y variables de entorno | 2 | M | Fase 1 | Crítico |
| Publicar y verificar el despliegue | 2 | M | Fase 0, Fase 2 | Crítico |
| Fijar secretos reales y forzar HTTPS | 3 | B | Fase 2 | Crítico |
| Emitir dictamen legal sobre la Ley N.° 27269 | 3 | H | Ninguna | Crítico |
| Implementar copia de seguridad y restauración verificada | 4 | M | Fase 1 | Alto |
| Incorporar registro técnico y alertas | 4 | M | Fase 2 | Medio |
| Elevar la cobertura de la interfaz al cien por ciento de las áreas | 5 | M | Ninguna | Bajo |
| Automatizar las seis verificaciones en integración continua | 5 | M | Fase 0 | Medio |

El esfuerzo se clasifica como alto, medio o bajo según la magnitud del cambio y
el número de archivos afectados.

## 11. Riesgos de la hoja de ruta y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Refactorizar `DbDriver` afecta a toda la capa de servicios | Alta | Alto | Ejecutar la suite completa tras cada paso intermedio y fijar el número de pruebas superadas como criterio de aceptación |
| El almacenamiento en archivo pierde datos ante terminación anormal | Media | Alto | Serialización periódica, copia programada y prueba de restauración |
| El sistema de archivos serverless pierde los documentos | Alta | Crítico | No desplegar el backend en serverless mientras el bloqueo no se resuelva |
| `adapter-auto` selecciona un destino no previsto | Media | Medio | Instalar y fijar el adaptador de forma explícita |
| Secretos de reserva activos en producción | Media | Crítico | Hacer falla el arranque cuando `JWT_SECRET` no esté definida en producción |
| El límite de peticiones bloquea usuarios legítimos | Media | Medio | Dimensionar el límite según el número de usuarios concurrentes y verificar el comportamiento |
| Uso oficial del sistema sin firma certificada | Media | Crítico | Dictamen legal previo y rotulación explícita del alcance de la validez |
| Cobertura de interfaz insuficiente para detectar regresiones | Media | Medio | Elevar la cobertura de las siete áreas e integrar la comprobación en el proceso automático |

## 12. Documentos relacionados

- [Guía de despliegue a producción](guia_despliegue_produccion.md)
- [Manual de usuario](manual_usuario.md)
- [Implementación y despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md)
- [Plan de nube con Vercel y Supabase](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md)
- [Diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md)
- [Software utilizado](../../06_diagramas_y_software/software_utilizado.md)
- [Seguridad](../seguridad/seguridad.md)
- [Matriz de pruebas](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md)
- [Métricas de calidad](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md)
