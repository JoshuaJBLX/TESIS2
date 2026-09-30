# Glosario Técnico — SGD-FD

**Sistema de Gestión Documental con Firma Digital y Trazabilidad (DocuTrust)**

Este glosario define los términos técnicos, criptográficos y metodológicos empleados en la documentación del proyecto. Cada entrada intenta ofrecer una analogía sencilla que permita comprender el concepto sin conocimientos previos.

| Convenciones | Significado |
| --- | --- |
| *Texto en cursiva* | Nombre propio de una entidad, biblioteca o estándar externo |
| `texto entre comillas invertidas` | Literal de código, comando o ruta tal como se escribe |
| **Texto en negrita** | Término definido en este glosario |
| N.° | Número de norma, de artículo o de identificador |

## 1. Acrónimos

| Acrónimo | Significado | Explicación sencilla |
| --- | --- | --- |
| API | *Application Programming Interface* (interfaz de programación de aplicaciones) | Conjunto de direcciones web que el sistema ofrece para que otros programas realicen su trabajo |
| AES | *Advanced Encryption Standard* | Algoritmo simétrico de cifrado; la misma clave cifra y descifra |
| ASN.1 | *Abstract Syntax Notation One* | Notación estándar para representar datos estructurados, como una clave pública, en formato binario |
| BD | Base de datos | Lugar donde se guardan de forma ordenada los documentos, los usuarios y los registros |
| CDN | *Content Delivery Network* | Red de servidores que entrega el contenido del sitio desde máquinas cercanas al usuario |
| CI | *Continuous Integration* (integración continua) | Verificación automática del código cada vez que alguien incorpora cambios |
| CLI | *Command-Line Interface* (interfaz de línea de comandos) | Forma de operar el sistema escribiendo instrucciones de texto, sin interfaz gráfica |
| CRUD | *Create, Read, Update, Delete* | Las cuatro operaciones básicas sobre los datos: crear, leer, actualizar y eliminar |
| CSV | *Comma-Separated Values* | Formato de archivo de texto donde los datos se separan por comas |
| DDE | Detección de defectos | Medida de la eficacia con que las pruebas detectan los defectos antes de que lleguen a producción |
| DNS | *Domain Name System* | Sistema que traduce el nombre de un sitio web a la dirección del equipo que lo aloja |
| E2E | *End-to-End* | Prueba que recorre el flujo completo, imitando a un usuario real |
| GCM | *Galois/Counter Mode* | Modo de operación del cifrado AES que combina cifrado y autenticación en una sola operación |
| GUI | *Graphical User Interface* (interfaz gráfica de usuario) | Interfaz con botones, campos e imágenes, en lugar de solo texto |
| HMAC | *Hash-based Message Authentication Code* | Código que confirma que un mensaje no fue alterado durante su tránsito |
| HTTP | *Hypertext Transfer Protocol* | Protocolo básico de comunicación entre el navegador y el servidor |
| HTTPS | HTTP sobre TLS | Versión cifrada de HTTP; impide que alguien lea lo que viaja por la red |
| ID | *Identifier* (identificador) | Código único que distingue a un documento, un usuario o una versión |
| IoC | *Inversion of Control* (inversión de control) | El componente no construye sus propias dependencias: las recibe desde fuera, lo que facilita las pruebas |
| IV | *Initialization Vector* (vector de inicialización) | Valor aleatorio que se emplea una vez, para que un mismo texto cifrado dos veces produzca resultados distintos |
| JSON | *JavaScript Object Notation* | Formato de texto para intercambiar datos estructurados entre el navegador y el servidor |
| JWT | *JSON Web Token* | Credencial digital que transporta la identidad del usuario y su sesión |
| MIT | Licencia del *Massachusetts Institute of Technology* | Licencia de software permisiva que permite el uso comercial, siempre que se conserve el aviso de copyright |
| MITM | *Man-in-the-Middle* (hombre en el medio) | Ataque en el que un interceptor se coloca entre el navegador y el servidor |
| ms | Milisegundo | Unidad de tiempo equivalente a la milésima parte de un segundo |
| PBKDF2 | *Password-Based Key Derivation Function 2* | Función que convierte una contraseña corta en una clave criptográfica resistente a los ataques de fuerza bruta |
| PKI | *Public Key Infrastructure* (infraestructura de clave pública) | Conjunto de normas y servicios que gestionan certificados y claves criptográficas |
| QR | *Quick Response* | Código de barras bidimensional que la cámara de un teléfono puede leer |
| RNF | *Red Nacional de Fibra Óptica* | Infraestructura de telecomunicaciones de alcance nacional dedicada al intercambio de datos |
| RSA | *Rivest, Shamir y Adleman* | Algoritmo asimétrico basado en un par de claves: una pública y otra privada |
| RUT | *Rol Único Tributario* | Identificador tributario que se emplea en Chile para identificar a personas naturales y jurídicas |
| SDK | *Software Development Kit* | Conjunto de herramientas preparadas para construir software sobre una plataforma |
| SHA | *Secure Hash Algorithm* | Función que convierte cualquier archivo en una huella digital de longitud fija |
| SHA-512 | Variante de SHA que produce una huella de 512 bits | Se emplea en este proyecto como base de la derivación PBKDF2 |
| SGSI | Sistema de Gestión de Seguridad de la Información | Conjunto de políticas y controles que protegen la información de una organización |
| SPA | *Single Page Application* (aplicación de una sola página) | Sitio que carga una única página y cambia su contenido sin recargarla por completo |
| SQL | *Structured Query Language* | Lenguaje para consultar y modificar los datos guardados en una base de datos |
| TLS | *Transport Layer Security* | Capa de cifrado que protege la comunicación entre el navegador y el servidor |
| TTL | *Time To Live* | Tiempo que un registro, una sesión o una caché permanece vigente antes de expirar |
| URI | *Uniform Resource Identifier* | Identificador uniforme de un recurso dentro del sistema |
| URL | *Uniform Resource Locator* | Dirección completa de un recurso en la web |
| UUID | *Universally Unique Identifier* | Identificador de formato numérico único, generado prácticamente sin posibilidad de colisión |
| XSS | *Cross-Site Scripting* | Ataque que inyecta código ejecutable en una página web para suplantar al usuario |

## 2. Términos del dominio de negocio

| Término | Definición en el SGD-FD |
| --- | --- |
| **Documento** | Unidad lógica de gestión que agrupa un título, una descripción, un propietario y un conjunto de versiones. Es el contenedor lógico; el archivo físico es una de sus versiones. |
| **Versión** | Copia inmutable del archivo de un documento en un momento dado, con su propia huella, su propia firma y su propio firmante. Una versión nunca se modifica ni se elimina. |
| **Versión actual** | Número de la última versión firmada del documento. Es la que se muestra en el listado, en la vista pública y en la verificación. |
| **Propuesta** | Cambio propuesto por un tercero sobre un documento público. Contiene un archivo, una huella y una firma del coautor, pero **no altera el documento** hasta que el propietario la acepta. |
| **Coautor** | Usuario registrado que envía una propuesta de cambio. Su firma se conserva y queda registrada en la trazabilidad si el propietario acepta la propuesta. |
| **Propietario** | Usuario que creó el documento. Es el único facultado para versionar, cambiar la visibilidad y resolver propuestas. |
| **Administrador** | Usuario con permiso especial para consultar la bitácora de auditoría y verificar la cadena de integridad. |
| **Visibilidad** | Estado de acceso al documento: `privado` (solo el propietario) o `público` (cualquier persona). **Todo documento nace privado.** |
| **Compartición** | Cambio explícito de visibilidad. Modifica únicamente el permiso de lectura: **no crea una versión nueva ni altera la huella.** |
| **Huella** | Valor hexadecimal de 64 caracteres producido por SHA-256 sobre el archivo. Es su «huella digital»: si el contenido cambia un solo bit, la huella cambia por completo. |
| **Resumen o *digest*** | Salida de una función de hash. Sobre un archivo completo es la huella; sobre un bloque, es el valor que se firma. |
| **Firma** | Valor criptográfico que vincula un contenido con la identidad de quien lo firma. En el sistema se firma la huella SHA-256, no el archivo completo. |
| **Autenticidad** | Garantía de que el documento procede realmente de la persona que dice haberlo emitido. Se comprueba validando la firma. |
| **Integridad** | Garantía de que el contenido no ha cambiado desde que fue firmado. Se comprueba comparando la huella. |
| **Trazabilidad** | Posibilidad de reconstruir quién hizo qué y en qué orden. En el sistema se apoya en el historial de versiones y en la bitácora de auditoría. |
| **Confidencialidad** | Garantía de que solo las personas autorizadas pueden leer el contenido. En el SGD-FD la garantiza el estado privado del documento. |
| **Bitácora de auditoría** | Registro ordenado y de solo lectura de los eventos relevantes del sistema: creación, firma, cambio de visibilidad, propuestas y accesos de administración. |
| **Cadena de integridad** | Secuencia en la que cada registro incorpora la huella del anterior. Alterar un registro antiguo rompe todos los eslabones posteriores, y el sistema puede señalar el identificador exacto de la ruptura. |
| **Sello de tiempo** | Prueba criptográfica de que una firma se realizó en una fecha y hora concretas. **El SGD-FD no lo implementa**, lo que limita la validez legal de la firma. |
| **Diferencial** | Resultado de comparar línea por línea dos versiones o una versión con una propuesta, que resalta lo agregado, lo eliminado y lo modificado. |
| **Estado de verificación** | Resultado devuelto al comprobar un archivo: `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND` o `FOUND`. |
| **Firma certificada** | Firma electrónica avalada por una Autoridad de Certificación acreditada y acompañada de sello de tiempo. **El SGD-FD no la emite.** |
| **Código QR de verificación** | Imagen que identifica el documento sin transportar su contenido. Al escanearse, dirige a la página de verificación pública. |

## 3. Arquitectura y desarrollo

| Término | Definición |
| --- | --- |
| **Arquitectura monolítica modular en capas** | Estilo de organización en el que el sistema es un solo programa, dividido en capas con responsabilidades separadas. Facilita el mantenimiento porque cada capa se modifica de forma aislada. |
| **Capa de presentación** | Es la interfaz que ve el usuario. En el SGD-FD corresponde al frontend construido con SvelteKit. |
| **Capa de lógica de negocio** | Contiene las reglas del sistema: qué es válido, qué se firma y qué se comparte. En el backend corresponde al directorio `services/`. |
| **Capa de acceso a datos** | Se ocupa de leer y escribir datos. En el backend corresponde al directorio `db/`. |
| **Endpoint** | Dirección concreta que el sistema ofrece para una operación, por ejemplo `GET /api/docs/:id/versions`. Se combinan el método (GET, POST, PUT, PATCH) y la ruta. |
| **Middleware** | Pieza de software que se interpone entre la petición y el controlador para revisarla. En el SGD-FD se usa para exigir sesión y para limitar los intentos de acceso. |
| **Router** | Componente que recibe las peticiones y las dirige al controlador correspondiente según la ruta solicitada. |
| **Controlador** | Código que recibe una petición, invoca la lógica de negocio y devuelve la respuesta al cliente. |
| **Servicio** | Unidad de lógica de negocio. Por ejemplo, el servicio de documentos coordina la firma, el versionado y las propuestas. |
| **Repositorio** | Patrón que separa la lógica de negocio del detalle de almacenamiento. La lógica habla con una interfaz abstracta, no con el motor concreto. |
| **`DbDriver`** | Contrato de persistencia del SGD-FD. Define las operaciones `run`, `exec`, `save` y `close` que el repositorio ofrece, sin revelar qué motor de base de datos se usa. |
| **Driver** | Implementación concreta de un contrato. En el proyecto, `sqlite-driver.ts` implementa `DbDriver` sobre `sql.js`. |
| **Capa de persistencia** | Capa que traduce las operaciones del dominio en consultas SQL sobre la base de datos. |
| **Contrato** | Especificación formal que define qué operaciones deben existir, sin imponer cómo se implementan. Permite cambiar de tecnología sin reescribir la lógica. |
| **Acoplamiento** | Grado de dependencia entre dos módulos. Bajo acoplamiento significa que un cambio en uno obliga poco a cambiar el otro. |
| **Desacoplamiento** | Práctica de mantener baja la dependencia entre capas, de modo que cada una pueda evolucionar por separado. |
| **Módulo** | Unidad de código con una responsabilidad única y un nombre propio, dentro de un archivo mayor. |
| **SPA** | Aplicación web que carga una sola página y actualiza su contenido de forma dinámica. Mejora la sensación de rapidez frente a los sitios clásicos. |
| **SSR** | *Server-Side Rendering*. Generación de la página en el servidor antes de enviarla al navegador. Mejora el primer dibujado y el posicionamiento en buscadores. |
| **API REST** | Estilo de API donde cada operación se realiza sobre un recurso identificado por una ruta y un método. Es el criterio seguido por el backend. |
| **Límite de peticiones** | Protección que restringe cuántas veces una misma identidad puede invocar el sistema en un periodo. Evita el abuso por fuerza bruta. |
| **Bloqueo temporal** | Medida que impide nuevos intentos de acceso durante un intervalo fijo. En el SGD-FD expira por sí solo, sin intervención de un administrador. |
| **Política de origen cruzado (CORS)** | Regla que indica qué sitios web pueden invocar la API. Permite separar la interfaz y el servicio en puertos distintos. |
| **Cabeceras de seguridad** | Instrucciones que el servidor envía al navegador para endurecer la página. Ejemplo: `X-Content-Type-Options`. |
| **TypeScript** | Extensión de JavaScript que añade tipos estáticos. Permite detectar errores antes de ejecutar el código. |

## 4. Criptografía y seguridad

### 4.1. Conceptos fundamentales

| Término | Explicación en lenguaje llano |
| --- | --- |
| **Cifrado** | Transformación que convierte información legible en un texto imposible de interpretar, usando una clave. A diferencia del hash, el cifrado **se puede revertir** con la clave correcta. |
| **Hash o huella** | Transformación unidireccional: convierte un archivo en una huella de longitud fija, sin forma de volver atrás. Cambia un solo carácter del archivo y la huella cambia por completo. |
| **Cifrado frente a hash** | El cifrado es una cerradura con dos llaves; el hash es una huella dactilar que solo permite comparar, nunca reconstruir. El SGD-FD usa **hash** para comprobar integridad y **cifrado** para proteger claves. |
| **Clave pública** | Parte de un par de claves que puede repartirse libremente. Con ella se **verifica** una firma. Es pública por diseño. |
| **Clave privada** | Parte secreta del par. Con ella se **firma**. Nunca se transmite, nunca se almacena en texto legible y solo se usa en memoria. |
| **Par de claves** | Conjunto formado por una clave pública y su correspondiente clave privada, generadas juntas. |
| **Firma digital** | Resultado de aplicar un algoritmo con la clave privada sobre el resumen del contenido. Cualquiera puede verificarla con la clave pública, pero nadie puede crearla sin la privada. |
| **Firma no repudiable** | Firma que vincula a una identidad de forma que el firmante no puede negar después haber firmado. El SGD-FD no alcanza el nivel de firma certificada. |
| **Entropía** | Medida del desorden de una fuente aleatoria. Una entropía alta significa que el valor es impredecible. |
| **Primitiva criptográfica** | Operación matemática básica y probada, como el hash o el cifrado. En este proyecto provienen de la biblioteca `node:crypto`, y nunca de un algoritmo propio. |
| **Longitud de clave** | Tamaño de la clave, expresado en bits. En RSA-2048 son 2048 bits; en AES-256 son 256 bits. |
| **Clave maestra** | Clave intermedia que protege la clave privada del usuario. En el SGD-FD se deriva de la contraseña con PBKDF2. |
| **Modo de operación** | Regla que determina cómo se aplica un cifrado de bloque a un texto largo. GCM combina cifrado y verificación de integridad. |

### 4.2. Algoritmos y parámetros utilizados

| Término | Valor y uso en el SGD-FD |
| --- | --- |
| **RSA-2048** | Algoritmo asimétrico que genera el par de claves de cada usuario. El número 2048 indica el tamaño de la clave, en bits: cuanto mayor es el tamaño, más difícil es factorizarla. |
| **SHA-256** | Función de hash que produce la huella de cada archivo y de cada bloque de la cadena. El sistema firma la huella, no el archivo completo, lo que resulta más rápido sin perder garantía. |
| **HMAC** | Código de autenticación de mensajes. Añade una clave secreta al cálculo del hash, de modo que solo quien posee la clave puede producir un resultado válido. |
| **PBKDF2** | Función que convierte la contraseña del usuario en una clave criptográfica. En el SGD-FD se emplea la variante **PBKDF2-HMAC-SHA512** con **100 000 iteraciones**. La idea es como amasar una masa: repetir la operación muchas veces vuelve lentísima la derivación. |
| **Salt o sal** | Valor aleatorio único por usuario que se combina con la contraseña antes de derivar la clave. Aunque dos usuarios tengan la misma contraseña, sus claves resultantes son distintas. En el proyecto, el `salt` ocupa 16 bytes. |
| **AES-256-GCM** | Algoritmo simétrico usado para cifrar la clave privada del usuario. AES-256 trabaja con una clave de 256 bits; el modo GCM permite, además de ocultar el contenido, **detectar si alguien lo alteró**. |
| **IV** | Vector de inicialización: número aleatorio que acompaña al cifrado, de 12 bytes en este proyecto. Garantiza que cifrar el mismo texto dos veces produzca resultados distintos. |
| **`authTag`** | Etiqueta de autenticación que genera AES-GCM. Si alguien modifica el contenido cifrado, esta etiqueta deja de coincidir y el descifrado falla. Actúa como un sello de inviolabilidad. |
| **Estructura de la clave protegida** | El material cifrado se persiste como un objeto JSON con los campos `encryptedData`, `iv`, `authTag` y `salt`. |
| **JWT** | Credencial que contiene la identidad del usuario y la hora de emisión, firmada por el servidor. El servidor la valida sin consultar la base de datos. Si alguien la modifica, deja de ser válida. |
| **bcrypt** | Función de derivación usada para guardar contraseñas. En el SGD-FD se aplica con 12 rondas de coste mediante la biblioteca `bcryptjs`. |
| **Serialización SPKI** | Formato estándar, basado en ASN.1 y DER, en que la clave pública se almacena como texto para poder recuperarla y verificar firmas. |
| **Ataque de fuerza bruta** | Intento de adivinar una clave probando todas las combinaciones posibles. PBKDF2 y bcrypt lo encarecen al hacerlo deliberadamente lento. |
| **Ataque MITM** | Interceptación de la comunicación entre navegador y servidor. Se combate con HTTPS y con cabeceras de seguridad que evitan la fuga de información. |
| **Confidencialidad de la clave privada** | Garantía de que la clave privada nunca se expone. En el SGD-FD solo existe cifrada en reposo y en claro en memoria durante el instante de la firma. |

## 5. Pruebas y calidad

| Término | Definición |
| --- | --- |
| **Prueba unaria** | Verifica una pieza aislada del código, sin levantar el sistema completo. En el proyecto se ubica en `backend/tests/unit/`, con 37 casos. |
| **Prueba de integración** | Verifica que varias piezas funcionan juntas, por ejemplo el servicio de documentos con la base de datos. En el proyecto reúne 33 casos. |
| **Prueba de sistema** | Verifica el comportamiento completo de un requisito del negocio, desde la petición hasta la respuesta. |
| **Prueba de servicio** | Verifica una unidad de lógica de negocio aislada del transporte HTTP. En el proyecto reúne 23 casos. |
| **Prueba de aceptación** | Confirma que el sistema satisface las necesidades reales del usuario, escenario por escenario. En el proyecto se concentra en `scenarios.test.ts`, con 5 casos. |
| **Prueba de seguridad** | Comprueba los controles de acceso, la validez de los tokens y el límite de intentos. En el proyecto son 16 casos, pero **no son una categoría adicional**: son un subconjunto transversal, `auth-middleware.test.ts` (9) más `auth.service.test.ts` (7), ya contados como unitarias y de servicio. Sumarlos otra vez daría 136 y falsearía el total. |
| **Prueba end-to-end** | Recorre el flujo completo imitando a un usuario real, desde que inicia sesión hasta que verifica un documento. |
| **Suite de pruebas** | Conjunto completo de pruebas del proyecto. En el SGD-FD comprende **120 casos** ejecutados con Vitest: 98 del backend en 12 archivos (37 unitarias, 23 de servicio, 33 de API e integración, 5 de aceptación) y 22 del frontend en 2 archivos (15 del cliente HTTP y 7 del estado de autenticación). Las categorías son excluyentes entre sí; 37 + 23 + 33 + 5 = 98 y 98 + 22 = 120. |
| **Caso de prueba** | Definición de una situación concreta: qué se prepara, qué se ejecuta y qué resultado se espera. |
| **Afirmación** | Comprobación automática que compara el resultado obtenido con el esperado. Si falla, la prueba se considera fallida. |
| **Cobertura** | Porcentaje del código ejecutado por las pruebas. En el proyecto, la cobertura funcional del backend es total, mientras que la cobertura de la interfaz es del 43 %. |
| **Mutación** | Técnica que altera ligeramente el código para comprobar si las pruebas detectan el cambio. Si una prueba sigue pasando, la prueba es insuficiente. |
| **Prueba de regresión** | Repite la suite completa tras cada cambio, para asegurar que no se rompió lo que ya funcionaba. |
| **DDE** | Tasa de eficacia de la detección de defectos. Compara cuántos defectos encontraron las pruebas frente a cuántos llegaron a producción. |
| **TDD** | *Test-Driven Development*. Se escribe primero la prueba y luego el código que la satisface. |
| **BDD** | *Behavior-Driven Development*. Las pruebas se escriben en lenguaje cercano al del negocio, para que sirvan de especificación compartida. |
| **Simulación o *mock*** | Sustituto de una dependencia externa, usado en las pruebas para aislar el componente evaluado. |
| **Ambiente de pruebas** | Conjunto de datos y configuración aislado del de producción. En el proyecto se apoya en SQLite en memoria, sin dependencias externas. |
| **Trazabilidad** | Capacidad de vincular cada requisito con su implementación y con la prueba que lo verifica. |
| **Métrica de calidad** | Medida objetiva que permite afirmar si el sistema cumple un estándar, en lugar de apoyarse en una impresión subjetiva. |

## 6. Infraestructura y despliegue

| Término | Definición |
| --- | --- |
| **Build** | Proceso de transformar el código fuente en archivos que un servidor puede ejecutar. En el frontend produce la carpeta `build/`; en el backend, `dist/`. |
| **Despliegue** | Publicación del sistema construido en el entorno donde se utilizará. |
| **Escalabilidad** | Capacidad de atender más usuarios o más carga sin degradar el servicio. |
| **Serverless** | Modalidad de ejecución donde el proveedor gestiona la infraestructura y se factura por uso. El repositorio incluye una configuración de despliegue con este enfoque. |
| **Efímero** | Que no persiste cuando el proceso se reinicia. La base de datos del SGD-FD es **SQLite en memoria** (`sql.js`), por lo que es efímera. |
| **Sistema de archivos** | Lugar donde se guardan los archivos en disco. En el SGD-FD los documentos se almacenan en memoria o en el almacenamiento del entorno, no en rutas locales fijas. |
| **Migración** | Script que prepara o actualiza el esquema de la base de datos. En el proyecto se ejecuta con `pnpm db:migrate`. |
| **Semilla o *seed*** | Datos de prueba que se cargan inicialmente para poder desarrollar y evaluar sin crear registros a mano. Se aplican con `pnpm db:seed`. |
| **Contenedor** | Entorno aislado que empaqueta la aplicación con todo lo necesario para ejecutarse de forma reproducible. |
| **Puerto** | Número que identifica la puerta de entrada lógica de un servicio. El backend escucha en el 3000 y el frontend en el 5173. |
| **Variables de entorno** | Valores de configuración que se mantienen fuera del código, como el secreto de firma del token o los límites de peticiones. |
| **Dependencia** | Paquete externo del que el proyecto se apoya. El gestor de paquetes las instala y las fija en versiones concretas. |
| **Caché** | Almacén temporal de resultados frecuentes, para responder más rápido y evitar repetir el mismo cálculo. |
| **Proxy inverso** | Servidor que recibe las peticiones del público y las reparte a los servicios internos. |
| **Registro de eventos** | Línea de texto que describe una operación relevante, útil para diagnosticar fallos y reconstruir la actividad. |

## 7. Referencia rápida de comandos

Los comandos se ejecutan por separado en las carpetas `backend` y `frontend`. El proyecto utiliza **pnpm 8** como gestor de paquetes.

| Comando | Propósito | Dónde se ejecuta |
| --- | --- | --- |
| `pnpm install` | Instala las dependencias declaradas en el manifiesto del proyecto | `backend` y `frontend` |
| `pnpm dev` | Levanta el entorno de desarrollo con recarga automática | `backend` (puerto 3000) y `frontend` (puerto 5173) |
| `pnpm test` | Ejecuta la suite completa de pruebas con Vitest | `backend` y `frontend` |
| `npx tsc --noEmit` | Revisa los tipos de TypeScript sin generar archivos | `backend` y `frontend` |
| `npx svelte-check` | Detecta errores de tipos y de plantilla en los componentes Svelte | `frontend` |
| `pnpm build` | Genera la versión de producción del proyecto | `backend` y `frontend` |
| `pnpm db:migrate` | Crea o actualiza el esquema de la base de datos | `backend` |
| `pnpm db:seed` | Carga los datos iniciales de prueba | `backend` |
| `pnpm db:reset` | Recrea la base de datos desde cero y vuelve a sembrarla | `backend` |
| `pnpm preview` | Sirve localmente la compilación de producción del frontend | `frontend` |

La verificación completa del proyecto se resume en la siguiente secuencia, que debe ejecutarse en ambos proyectos:

```text
cd backend  && npx tsc --noEmit && pnpm test && pnpm build
cd frontend && npx svelte-check && pnpm test && pnpm build
```

## 8. Referencias cruzadas

- **Manual de usuario:** [manual_usuario.md](../operacion/manual_usuario.md) — pasos de uso del sistema dirigidos al usuario final.
- **Seguridad del sistema:** [seguridad.md](../seguridad/seguridad.md) — amenazas analizadas y controles implementados.
- **Software utilizado:** [software_utilizado.md](../../06_diagramas_y_software/software_utilizado.md) — tecnologías, versiones, licencias y justificación de cada elección.
- **Arquitectura del sistema:** [arquitectura.md](../../02_diseno_construccion/arquitectura/arquitectura.md) — capas, contratos y decisiones de diseño registradas.

---

*Fin del glosario técnico del SGD-FD. Las definiciones describen el uso concreto de cada término en este proyecto y no pretenden sustituir las normas técnicas o legales vigentes.*
