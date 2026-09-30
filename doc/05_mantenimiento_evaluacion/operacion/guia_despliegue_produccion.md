# Guía de Despliegue a Producción — SGD-FD

**Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)**

## 1. Resumen y alcance

### 1.1 Naturaleza de este documento

Esta guía es un **procedimiento preparado, no un registro de un despliegue
ejecutado**. Ninguno de los pasos aquí descritos se ha realizado sobre un entorno
real de producción: el proyecto nunca ha sido publicado en un servicio de
alojamiento y el archivo `vercel.json` presente en la raíz no ha sido validado
mediante ninguna publicación de prueba.

La distinción es relevante y debe mantenerse en toda la documentación: lo que
está verificado es el funcionamiento del sistema en el entorno local, mientras
que lo que esta guía describe es el procedimiento que debería aplicarse, con las
salvedades señaladas en cada apartado.

### 1.2 Estado de verificación previo al despliegue

Antes de intentar cualquier publicación deben cumplirse las seis verificaciones
descritas en el apartado 3, que en el estado actual del repositorio se satisfacen
en el entorno local: 120 pruebas superadas de 120, sin errores de tipos en el
backend, sin errores ni advertencias en el frontend, y ambos módulos compilando.

### 1.3 Advertencias que condicionan el despliegue

Estas tres limitaciones no son recomendaciones: son condiciones que deben
resolverse o aceptarse de forma explícita antes de exponer el sistema.

| Advertencia | Consecuencia sobre el despliegue |
|---|---|
| La capa de datos es síncrona y solo existe el driver SQLite | El backend **no** admite PostgreSQL; definir `DATABASE_URL` provoca un fallo de arranque deliberado |
| El directorio `uploads/` reside en el sistema de archivos local | El backend **no** puede desplegarse en un entorno serverless sin perder los documentos |
| Solo está instalado `@sveltejs/adapter-auto` | Fijar `ADAPTER=node` o `ADAPTER=vercel` **falla** hasta instalar el paquete correspondiente |

El detalle técnico y el plan de eliminación de estas limitaciones se expone en
[la hoja de ruta hacia produccion](roadmap_produccion.md).

## 2. Requisitos previos

### 2.1 Herramientas locales

| Herramienta | Versión mínima | Comprobación |
|---|---|---|
| Node.js | 18 o superior | `node --version` |
| pnpm | 8 o superior | `pnpm --version` |
| Git | cualquiera | `git --version` |

La verificación de las versiones disponibles se realiza con los comandos
anteriores. El proyecto utiliza módulos ES, admitidos a partir de la versión 18 de
Node.js, razón por la que se establece ese mínimo.

### 2.2 Cuentas y credenciales

| Recurso | Necesario para | Observación |
|---|---|---|
| Cuenta en la plataforma de alojamiento | Opción B | Debe admitir el modelo de ejecución que corresponda al alojamiento elegido |
| Cuenta de registro de dominio | Cualquier opción | Solo si se desea nombre propio |
| Credenciales de acceso al servidor | Opción C | Acceso por protocolo seguro, nunca por contraseña reutilizada |
| Gestor de secretos | Cualquier opción | Obligatorio en producción; los valores de reserva del código son inaceptables |

El despliegue parte de una copia limpia del repositorio. Debe comprobarse que el
directorio de documentos y el archivo de base de datos no están incluidos en el
control de versiones, conforme a las reglas del archivo de exclusión del proyecto.

## 3. Verificación del entorno local

Este apartado debe ejecutarse íntegramente **antes** de cualquier publicación. Los
comandos siguientes reproducen las comprobaciones que distinguen un repositorio
apto para publicar de uno que no lo es.

### 3.1 Comandos de verificación

Los comandos se ejecutan desde la raíz del repositorio salvo indicación contraria.

```bash
pnpm install
pnpm test
```

Resultado esperado: **120 pruebas superadas de 120**. El desglose es de 98
pruebas en el backend y 22 en el frontend. Cualquier cantidad inferior indica una
regresión que debe corregirse antes de continuar.

```bash
cd backend
npx tsc --noEmit
cd ../frontend
npx svelte-check
```

Resultados esperados: **0 errores** en la comprobación de tipos del backend y
**0 errores y 0 advertencias** en la del frontend.

```bash
cd ../backend
pnpm build
cd ../frontend
pnpm build
```

Ambos comandos deben completarse sin error. El resultado de la compilación del
frontend depende del adaptador activo, por lo que este paso se repite tras
cualquier cambio en la variable `ADAPTER` (véase el apartado 6.2).

## 4. Variables de entorno

El inventario siguiente recoge exclusivamente las variables que el código fuente
consulta realmente; no se incluye ninguna variable decorativa.

### 4.1 Variables del backend

| Variable | Carácter | Valor de ejemplo | Función |
|---|---|---|---|
| `PORT` | Opcional | `3000` | Puerto de escucha del servidor Express. Si se omite, el proceso escucha en el 3000 |
| `NODE_ENV` | Opcional | `production` | Modo de ejecución; en `test` se instalan ajustes específicos de prueba |
| `JWT_SECRET` | **Obligatoria en producción** | cadena aleatoria de 64 caracteres | Firma de los tokens de acceso. Sin esta variable el sistema usa un valor de reserva fijo |
| `JWT_REFRESH_SECRET` | **Obligatoria en producción** | cadena aleatoria distinta de la anterior | Firma de los tokens de renovación, con la misma advertencia sobre el valor de reserva |
| `JWT_EXPIRES_IN` | Opcional | `15m` | Vigencia del token de acceso |
| `JWT_REFRESH_EXPIRES_IN` | Opcional | `7d` | Vigencia del token de renovación |
| `DB_PATH` | Opcional | `./data/database.sqlite` | Ubicación del archivo donde se serializa la base de datos en memoria |
| `UPLOAD_DIR` | Opcional | `uploads` | Ubicación del directorio de documentos |
| `CORS_ORIGIN` | **Obligatoria si hay dominio propio** | `https://sgd-fd.example.pe` | Origen autorizado por la política de acceso entre orígenes |
| `DATABASE_URL` | **Bloqueada** | ninguna | Si está definida, el arranque falla deliberadamente. Debe permanecer **sin definir** |

La advertencia sobre `JWT_SECRET` y `JWT_REFRESH_SECRET` es la más relevante de
esta tabla: el código emplea valores de reserva constantes cuando las variables no
están definidas, lo que en producción significa operar con material criptográfico
conocido por terceros.

### 4.2 Variables del frontend

Estas variables se evalúan **en tiempo de compilación**, por lo que modificar una
de ellas exige recompilar el frontend.

| Variable | Carácter | Valor de ejemplo | Función |
|---|---|---|---|
| `VITE_API_URL` | Opcional | `https://api.sgd-fd.example.pe/api` | Dirección completa de la API, con sufijo `/api`. Tiene prioridad sobre cualquier otra fuente |
| `PUBLIC_API_ORIGIN` | Opcional | `https://api.sgd-fd.example.pe` | Origen sin sufijo; el cliente añade `/api` automáticamente |
| `ADAPTER` | Opcional | `node` o `vercel` | Selecciona el adaptador de compilación. Cualquier otro valor deja actuar a `adapter-auto` |

La resolución de la dirección de la API sigue el orden siguiente, tal como está
implementado en el cliente:

1. Si `VITE_API_URL` está definida, se utiliza tras normalizar las barras finales.
2. En su defecto, si `PUBLIC_API_ORIGIN` está definida, se añade el sufijo `/api`.
3. En ausencia de ambas, se utiliza el valor de reserva `http://localhost:3000/api`.

Debe subrayarse que el cliente **nunca** toma el origen del puerto 5173. En
desarrollo local el frontend se sirve en el 5173 y el backend en el 3000, y no
existe un intermediario que traduzca las rutas, por lo que el sistema resuelve
la dirección de forma explícita y no por descubrimiento. Esta decisión está
cubierta por pruebas del cliente de la API.

### 4.3 Archivo de variables

Las variables del backend pueden declararse en un archivo en la raíz del módulo
backend, dado que el proceso las carga durante el arranque. Ese archivo nunca debe
subirse al repositorio: debe existir únicamente un archivo de ejemplo que
documente los nombres sin los valores.

## 5. Opción A — Alojamiento tradicional con proceso persistente

Adecuado cuando se dispone de un servidor o hosting tradicional con disco
persistente. El backend se ejecuta como un proceso Node.js y el frontend se
sirve como salida de compilación, según describe la
[documentacion de implementacion y despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md).

### 5.1 Obtención del código y compilación

```bash
git clone <url-del-repositorio> sgd-fd
cd sgd-fd
pnpm install
cd backend && pnpm build && cd ..
cd frontend && pnpm build && cd ..
```

### 5.2 Fijación del adaptador del frontend

Para este modelo corresponde instalar el adaptador de Node.js:

```bash
cd frontend
pnpm add -D @sveltejs/adapter-node
```

A continuación se recompila con la variable de entorno fijada. En un servidor
situado en Windows la asignación en la misma línea no es válida, por lo que la
variable debe definirse en el entorno del sistema antes de invocar la compilación.

```bash
cd frontend
ADAPTER=node pnpm build
```

### 5.3 Gestión del proceso

El proceso del backend se ejecuta desde el módulo `backend` mediante el
comando `pnpm start`, que invoca el artefacto compilado. La gestión del proceso,
el reinicio automático ante terminación y el registro de salida se delegan en un
gestor de procesos, que en un servidor con sistema Linux puede ser el incluido en
la distribución o una herramienta específica de gestión de procesos. La
configuración esencial consta de tres elementos: el directorio de trabajo en el
módulo `backend`, el comando de arranque y la ruta del archivo de registro.

### 5.4 Proxy inverso, terminación TLS y diagnóstico

Un proxy inverso debe situarse delante de los dos procesos y encargarse de la
terminación del certificado TLS, de la redirección de todo el tráfico no seguro
hacia el seguro y del reenvío de las peticiones dirigidas al backend. Es necesario
añadir una cabecera que reenvíe el protocolo original y otra que indique la
dirección real del cliente, de modo que los registros conserven la información de
conexión. El tamaño máximo de carga solicitado debe ser compatible con el límite
de tamaño de archivo del servicio de documentos. Una vez iniciado el proceso, la
comprobación básica de disponibilidad se realiza solicitando la ruta de salud del
backend desde el servidor; si la respuesta no llega, el orden de revisión es
proceso activo, puerto de escucha, configuración del proxy y ruta del registro.

## 6. Opción B — Alojamiento serverless

### 6.1 Advertencia determinante sobre el almacenamiento de archivos

Un entorno serverless no conserva el sistema de archivos entre invocaciones. El
directorio `uploads/` se crearía en una instancia que se destruye al terminar la
petición, con la consiguiente pérdida de los documentos cargados. **Esta opción no
es viable para el backend en su estado actual.**

Para habilitarla es necesario completar, en este orden: trasladar los documentos
a un servicio de objetos externo; sustituir el acceso directo al sistema de
archivos por el acceso a ese servicio en el módulo de documentos; y convertir el
contrato `DbDriver` en asíncrono e implementar el driver PostgreSQL, dado que el
estado en memoria no se comparte entre invocaciones.

El análisis técnico del tercer punto, incluida la razón por la que no se trata de
un simple ajuste de configuración, se expone en el apartado 5.2 de
[la hoja de ruta hacia produccion](roadmap_produccion.md); la estrategia prevista
para esta migración se describe en
[el plan de nube](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md).

### 6.2 Configuración del frontend y del adaptador

El proyecto incorpora un archivo de configuración en la raíz. Su contenido
relevante es la orden de instalación, que se ejecuta en la raíz, la orden de
compilación, que accede al módulo `frontend`, el directorio de salida y las
cabeceras de seguridad aplicadas a todas las respuestas. Esta configuración no ha
sido validada mediante ninguna publicación real, por lo que su corrección forma
parte del trabajo de despliegue y no constituye una certeza.

Sólo está instalado `@sveltejs/adapter-auto`. Para fijar el destino de Vercel es
necesario instalar el adaptador correspondiente y recompilar con la variable de
entorno definida:

```bash
cd frontend
pnpm add -D @sveltejs/adapter-vercel
ADAPTER=vercel pnpm build
```

Si no se instala el paquete y se define `ADAPTER=vercel`, la compilación falla al
intentar cargar el módulo inexistente.

### 6.3 Configuración de las variables de entorno

Las variables del backend deben declararse como secretos en el panel del
proyecto, nunca en el archivo de configuración versionado. Resulta imprescindible
no definir `DATABASE_URL`, porque su presencia detiene el arranque.

Las variables del frontend deben declararse con el prefijo reconocido por la
herramienta de compilación, y su valor debe apuntar a la dirección pública del
backend, que es distinta de la del frontend.

## 7. Opción C — Servidor propio

### 7.1 Pila del sistema y despliegue del artefacto

Un despliegue autoalojado presupone un sistema operativo Linux, un servidor web
como proxy inverso, un gestor de procesos y un cortafuegos; Debian, Ubuntu Server
o un equivalente con soporte prolongado resultan apropiados. El procedimiento de
obtención del código y compilación es el del apartado 5.1. La diferencia radica en
que el artefacto se traslada al servidor de destino y allí se ejecuta como
servicio del sistema, con reinicio automático y registro de salida.

### 7.2 Permisos de archivo

El proceso necesita permiso de escritura en dos ubicaciones: el directorio de
documentos y el directorio que contiene el archivo de base de datos. Estos
permisos deben concederse al usuario del servicio, nunca como administrador. La
copia de seguridad requiere lectura de ambas ubicaciones, que deben quedar fuera
del directorio servido por el servidor web; conviene verificar que el servidor no
las entrega como archivos estáticos.

### 7.3 Migraciones y datos iniciales

La aplicación dispone de órdenes de mantenimiento de la base de datos. Antes de
publicar el servicio debe ejecutarse la preparación del esquema y, si el entorno
lo requiere, la carga de los datos iniciales. Ambas órdenes se ejecutan desde el
módulo `backend`. La preparación del esquema debe ejecutarse **antes** de activar
el servicio definido en el gestor de procesos, para evitar que el proceso arranque
contra una base de datos sin preparar.

### 7.4 Despliegue del frontend

La salida de la compilación del frontend debe entregarse al servidor web como
contenido estático. Las reglas de reescritura son necesarias para que el
enrutamiento del lado del cliente funcione en rutas profundas, y deben preservar
las rutas de la API para que el servidor web no las capture como contenido
estático.

## 8. Copias de seguridad y restauración

### 8.1 Particularidad del modelo actual

La base de datos reside íntegramente en memoria y se serializa a un archivo
determinado por `DB_PATH`. En consecuencia, la copia de seguridad no puede
realizarse mediante una exportación convencional: debe copiarse el archivo
serializado junto con el directorio de documentos. Ambas piezas deben copiarse
como un conjunto coherente, pues copiar sólo una de ellas produce un estado
inconsistente: documentos sin registro asociado, o registros que apuntan a
documentos ausentes.

### 8.2 Copia y restauración

La copia debe realizarse con el proceso detenido, o mediante un procedimiento que
garantice la consistencia si se ejecuta con el proceso activo. Un procedimiento
aceptable consiste en detener el servicio, copiar el archivo de base de datos y
el directorio de documentos, y reiniciar el servicio. Las copias deben conservarse
fuera del servidor, en un soporte independiente; la retención recomendada es
diaria, con copias semanales de mayor duración.

La restauración consiste en detener el servicio, sustituir el archivo de base de
datos y el directorio de documentos por sus copias, reiniciar y ejecutar la
lista de verificación funcional del apartado 9.

**La restauración debe ensayarse antes de declarar el procedimiento válido.** Un
procedimiento de copia que nunca se ha restaurado no es un procedimiento de
recuperación, sino una hipótesis.

Si se adopta el driver PostgreSQL y el almacenamiento de objetos descrito en la
fase 1 de la hoja de ruta, este apartado queda obsoleto y se sustituye por las
mecánicas de copia del propio motor de base de datos y del servicio de objetos.

## 9. Verificación posterior al despliegue

El despliegue sólo se da por concluido cuando la lista siguiente se completa de
forma satisfactoria. Todas las comprobaciones se ejecutan contra el entorno
público.

### 9.1 Lista de verificación funcional

| Verificación | Criterio de aceptación |
|---|---|
| Disponibilidad de la interfaz | La aplicación carga sin error de consola |
| Autenticación | Un usuario autorizado accede y otro no autorizado es rechazado |
| Registro de auditoría | Toda acción de negocio queda registrada |
| Subida de un documento | El archivo se almacena y se registra con su huella |
| Firma digital | La firma se registra y genera el código de verificación |
| Lectura del código | El código de verificación conduce al documento correcto |

### 9.2 Estados de verificación del contenido

La ruta de verificación por contenido devuelve uno de cinco estados. Todos ellos
deben comprobarse, porque cada estado ejercita una rama distinta del servicio.

| Estado | Situación que lo produce |
|---|---|
| `VALID` | El contenido coincide con el firmado y la firma es correcta |
| `MANIPULATED` | El contenido difiere del firmado: el documento fue alterado |
| `INVALID_SIGNATURE` | El contenido coincide pero la firma no valida |
| `FOUND` | La búsqueda por contenido localiza coincidencias en el repositorio |
| `NOT_FOUND` | La búsqueda no localiza ninguna coincidencia |

La comprobación de `MANIPULATED` es la relevante para la integridad: debe
realizarse abriendo el archivo almacenado, modificando un único byte y
solicitando de nuevo la verificación.

### 9.3 Cadena de auditoría y defecto conocido

Existe una ruta dedicada a comprobar la integridad de la cadena de auditoría. Debe
invocarse autenticándose con un usuario autorizado y su respuesta es determinante:
el código 200 con la marca de validez indica una cadena íntegra, mientras que el
código 409 indica que **la cadena está alterada**, lo que constituye un incidente
que debe investigarse de inmediato e invalida la garantía de trazabilidad.

Debe recordarse además que la ruta de verificación por identificador de documento,
destinada a la lectura del código, devuelve actualmente el campo de validez de la
firma con un valor fijo y **sin comprobación criptográfica**. Mientras esta
corrección no se aplique, el comportamiento de esa ruta en producción **no es
fiable** y sus respuestas no deben utilizarse como constancia de validez. La
corrección descrita en el apartado 4.1 de la hoja de ruta es condición previa a
cualquier publicación.

## 10. Diagnóstico de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| El arranque falla con el mensaje sobre el adaptador PostgreSQL | `DATABASE_URL` está definida | Eliminar la variable del entorno y usar `DB_PATH` |
| El arranque continúa usando secretos conocidos | `JWT_SECRET` o `JWT_REFRESH_SECRET` no definidas | Definir ambas con valores aleatorios distintos |
| La compilación del frontend falla al cargar un adaptador | `ADAPTER` definido sin instalar el paquete | Instalar el adaptador correspondiente y recompilar |
| La compilación elige un destino no previsto | `ADAPTER` sin definir, por lo que actúa `adapter-auto` | Definir `ADAPTER` de forma explícita |
| El frontend no encuentra la API en desarrollo | Se comparó una dirección derivada del puerto 5173 | Definir `VITE_API_URL` con la dirección del backend en el 3000 |
| Los documentos desaparecen tras un intervalo | Despliegue serverless con almacenamiento local | No usar serverless para el backend, o migrar a almacenamiento de objetos |
| La aplicación responde con error de origen no permitido | `CORS_ORIGIN` no incluye el dominio público | Añadir el origen exacto a la variable |
| La subida de archivos es rechazada | Límite de la capa intermedia inferior al permitido | Ajustar el límite del servidor web y el del servicio de documentos |
| La cadena de auditoría responde con código 409 | Alteración del registro | Investigar de inmediato como incidente de integridad |
| Un usuario legítimo ve peticiones rechazadas | Límite global de 300 peticiones por cada 15 minutos | Dimensionar el límite según la concurrencia esperada |
| La copia de seguridad resulta inconsistente | Se copiaron por separado los dos componentes | Copiar el archivo de base de datos y el directorio como un conjunto |

## 11. Reversión de un despliegue

La reversión debe ser posible siempre que exista una migración de base de datos
o un cambio incompatible. Conviene por tanto fijar el despliegue en dos versiones
completas antes de permitir la publicación automática de cambios.

### 11.1 Procedimiento en alojamiento tradicional

1. Detener el proceso del gestor de procesos.
2. Sustituir el artefacto compilado por la versión anterior.
3. Aplicar la reversión de la migración de esquema, si la hubo.
4. Reiniciar el proceso.
5. Ejecutar la lista de verificación del apartado 9.

### 11.2 Procedimiento en alojamiento serverless

La reversión se realiza desde el historial de despliegues de la plataforma,
seleccionando la versión anterior y republicando. La atención debe ponerse en que
las migraciones de base de datos **no** se revierten automáticamente: si la
publicación fallida incluía una migración, la reversión exige una migración
de compensación, que debe existir antes de publicar.

### 11.3 Verificación posterior a la reversión

La reversión no se considera completada hasta repetir la lista de verificación
funcional del apartado 9.1 y confirmar que la cadena de auditoría responde con
código 200.

## 12. Documentos relacionados

- [Hoja de ruta hacia producción](roadmap_produccion.md)
- [Manual de usuario](manual_usuario.md)
- [Implementación y despliegue](../../04_implementacion_despliegue/implementacion_despliegue.md)
- [Plan de nube con Vercel y Supabase](../../04_implementacion_despliegue/plan_nube_vercel_supabase.md)
- [Diagrama de despliegue](../../06_diagramas_y_software/diagrama_despliegue.md)
- [Software utilizado](../../06_diagramas_y_software/software_utilizado.md)
- [Seguridad](../seguridad/seguridad.md)
- [Matriz de pruebas](../../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md)
- [Métricas de calidad](../../02_diseno_construccion/pruebas_calidad/metricas_calidad.md)
