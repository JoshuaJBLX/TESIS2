# Manual de Usuario — SGD-FD

**Sistema de Gestión Documental con Firma Digital y Trazabilidad (DocuTrust)**

| Campo | Valor |
| --- | --- |
| Producto | SGD-FD (DocuTrust) |
| Tipo de aplicación | Aplicación web |
| Arquitectura | Cliente-servidor, con interfaz web de una sola página y servicio de interfaz de programación de aplicaciones |
| Elaborado para | Proyecto de software (tesis de proyecto) |
| Documentos relacionados | Manual de despliegue, guía técnica y documento de seguridad |

## 1. Introducción

### 1.1. Propósito del manual

Este manual explica, paso a paso y sin exigir conocimientos técnicos previos, cómo utilizar el SGD-FD. El sistema permite cargar documentos, firmarlos con la clave privada del usuario, conservar un historial de versiones inalterable, compartir documentos de forma controlada, aceptar propuestas de cambio enviadas por terceros y verificar la autenticidad de un archivo recibido, incluso sin tener una cuenta.

La aplicación se presenta en la web bajo el nombre DocuTrust. Los principios que el usuario encuentra en pantalla son los siguientes:

- Un documento se identifica por un **título** y se firma con la clave privada de quien lo carga.
- Cada cambio genera una **versión** nueva, firmada y con su propia huella digital.
- Un documento **nunca** nace público: se crea privado y su propietario decide, en un paso posterior y explícito, si lo comparte.
- Cualquier persona puede **verificar** un documento sin registrarse.

### 1.2. A quién va dirigido

- **Usuario registrado:** persona que crea una cuenta, firma documentos y administra su repositorio.
- **Destinatario o tercero:** persona que recibe un documento público y quiere comprobar que no fue alterado.
- **Coautor:** persona registrada que envía una propuesta de cambio sobre un documento público.
- **Administrador:** usuario con permiso de administración, responsable de revisar la bitácora de auditoría y la cadena de integridad.

### 1.3. Requisitos para utilizar el sistema

| Requisito | Detalle |
| --- | --- |
| Navegador | Cualquier navegador moderno actualizado (Chrome, Edge, Firefox o Safari recientes) |
| Conexión a Internet | Necesaria si el sistema está desplegado en un servidor remoto |
| Ejecución local | Node.js 18 o superior, si se desea levantar el sistema en el propio equipo |
| Cuenta de usuario | Necesaria para firmar, cargar, compartir y colaborar |
| Cuenta de usuario | **No necesaria** para verificar un documento |

### 1.4. Límites conocidos del sistema

Estos límites se enuncian de forma deliberada, para evitar expectativas incorrectas:

1. **La firma es criptográficamente válida dentro del SGD-FD, pero no es una firma electrónica certificada bajo la Ley N.° 27269.** No existe una Autoridad de Certificación acreditada ni un sello de tiempo (TSA). Un documento puede aparecer como `VALID` y, aun así, carecer de validez legal de certificado.
2. **No existe recuperación de contraseña.** Si el usuario olvida su contraseña, debe registrar una cuenta nueva. El intento de inicio de sesión fallido también puede provocar un bloqueo temporal (véase la sección 2.5).
3. **El estado `MANIPULATED` indica que el contenido fue alterado, pero no identifica al autor material de la alteración.** El sistema informa en qué versión dejó de coincidir; la investigación de responsabilidades es un acto posterior, ajeno al alcance de la herramienta.

## 2. Acceso al sistema

### 2.1. Crear una cuenta (registro)

**Ruta:** `/register` — Título en pantalla: *«Una base segura para cada acuerdo.»*

**Paso 1.** Abra la portada `/` y pulse el botón de registro.

**Paso 2.** Complete el formulario con nombre de usuario, nombre completo, correo electrónico y contraseña.

**Paso 3.** Escriba una contraseña que cumpla **todas** estas reglas:

- Mínimo **12 caracteres**.
- Al menos **1 letra mayúscula**.
- Al menos **1 letra minúscula**.
- Al menos **1 dígito**.
- Al menos **1 carácter especial** de entre `@ $ ! % * ? &`.

**Paso 4.** Pulse el botón de envío. Si el formulario es aceptado, el sistema redirige al panel principal.

**Qué ocurre internamente al registrarse.** En ese momento el sistema genera un par de claves RSA-2048 para el usuario, cifra la clave privada con AES-256-GCM y almacena la huella SHA-256 de la clave pública. Esta operación no se ve en pantalla, pero determina que el usuario pueda firmar en el futuro: la clave privada nunca se almacena en texto legible.

### 2.2. Iniciar sesión

**Ruta:** `/login` — Título en pantalla: *«Tus documentos, bajo control.»*

**Paso 1.** Ingrese su nombre de usuario y su contraseña, y pulse el botón de acceso.

**Paso 2.** Si las credenciales son correctas, el sistema emite un **token de sesión** (JWT) y lo muestra en el panel principal.

**Ruta de destino:** `/dashboard` — Título en pantalla: *«Hola, {nombre de usuario}»*. El saludo personalizado confirma que la sesión se inició correctamente.

### 2.3. Renovar la sesión

La sesión tiene una vigencia limitada. El sistema dispone de un mecanismo de renovación que evita tener que escribir la contraseña de nuevo:

- **Petición:** `POST /api/auth/refresh`.
- **Efecto:** se emite un token nuevo con la misma identidad, sin crear una cuenta nueva ni alterar los documentos.

Si la interfaz muestra el mensaje de sesión expirada, vuelva a iniciar sesión con el paso 2.2.

### 2.4. Cerrar sesión

**Paso 1.** Localice el botón de cierre de sesión en la barra de navegación superior.

**Paso 2.** Pulse el icono de salida, representado por una flecha que atraviesa una puerta.

**Paso 3.** El sistema descarta el token local y devuelve al visitante a la portada.

### 2.5. Recuperar la contraseña

**El SGD-FD no implementa recuperación de contraseña.** No hay enlace de «olvidé mi contraseña» ni envío de correo de restablecimiento.

Si la contraseña se olvida:

1. El inicio de sesión fallará de forma reiterada.
2. Tras varios intentos fallidos, el sistema aplica un **bloqueo temporal que expira por sí solo** (ventana de 15 minutos). No es necesario que un administrador lo levante.
3. La única vía disponible es **registrar una cuenta nueva**. Los documentos asociados a la cuenta anterior siguen existiendo en el repositorio, pero dejan de ser accesibles, pues cada documento pertenece a su propietario.

**Recomendación preventiva.** Guarde la contraseña en un gestor de contraseñas y anótela en un lugar seguro antes de firmar el primer documento, ya que la clave privada del usuario depende de ella.

## 3. Pantalla principal y navegación

### 3.1. Mapa de páginas

| Ruta | Título en pantalla | Acceso | Función |
| --- | --- | --- | --- |
| `/` | «Confianza digital para cada versión de tus documentos.» | Público | Portada de presentación |
| `/register` | «Una base segura para cada acuerdo.» | Público | Creación de cuenta |
| `/login` | «Tus documentos, bajo control.» | Público | Inicio de sesión |
| `/dashboard` | «Hola, {nombre de usuario}» | Con sesión | Resumen y acceso rápido |
| `/documents` | «Mis Documentos» | Con sesión | Listado de documentos propios |
| `/documents/[id]` | Título del documento | Propietario | Detalle, versiones, código QR y coautoría |
| `/v/[id]` | Título del documento | Público, si el documento es público | Vista pública del documento |
| `/verify` | «Comprueba la autenticidad de un documento.» | Público | Verificación sin cuenta |
| `/u/[username]` | Nombre completo o nombre de usuario | Público | Perfil público del firmante |
| `/audit` | «Bitácora de auditoría» | Solo administradores | Auditoría y cadena de integridad |

### 3.2. Elementos de la interfaz

La barra de navegación superior muestra el logotipo *DocuTrust*, los enlaces a las secciones y el botón de cierre de sesión. En el pie de página aparece el enlace a la bitácora de auditoría cuando el usuario tiene permisos de administración. Una vez iniciada la sesión, el nombre de usuario se muestra en el encabezado y en el saludo del panel principal.

## 4. Gestión de documentos

### 4.1. Subir y firmar un documento

**Ruta de partida:** `/documents` — Título: *«Mis Documentos»*.

**Paso 1.** Pulse el botón para crear un documento nuevo.

**Paso 2.** Seleccione el archivo desde su equipo. El sistema acepta los formatos previstos para el repositorio.

**Paso 3.** Escriba el **título** del documento. Este título se mostrará en la lista de documentos, en la vista de detalle y en la vista pública.

**Paso 4.** Escriba una **descripción del cambio**, es decir, una breve explicación de qué representa esta versión y por qué se carga.

**Paso 5.** **Ingrese su contraseña para firmar.** Este paso es obligatorio: la contraseña no se usa para abrir el archivo, sino para demostrar que quien lo carga es realmente el propietario de la clave privada. Si la contraseña es incorrecta, la firma no se genera y el documento no se crea.

**Paso 6.** Pulse el botón de envío. El sistema firma el archivo con su clave privada y crea la **versión 1**.

**Qué ve el usuario en pantalla.** Una vez creado, el documento aparece en el listado con su título, su estado de visibilidad (privado), el número de versión actual y la fecha de creación. Un documento recién creado **siempre es privado**: la opción de compartir es una decisión posterior y separada.

### 4.2. Ver el detalle de un documento

**Ruta:** `/documents/[id]` — Título en pantalla: el título del documento.

En esta pantalla se concentran las acciones del ciclo de vida del documento:

| Elemento visible | Descripción |
| --- | --- |
| Título y descripción | Datos declarados al crear el documento |
| Versión actual | Número de versión vigente, por ejemplo `v3` |
| Visibilidad | Indicador `privado` o `público` |
| Firmante | Usuario que firmó la versión vigente |
| Fecha de firma | Momento en que se registró la firma |
| Huella SHA-256 | Valor de integridad del archivo vigente |
| Historial de versiones | Lista de versiones con su huella correspondiente |
| Código QR | Imagen de verificación descargable |
| Propuestas | Propuestas de coautoría pendientes y resueltas |
| Botón de descarga | Obtiene el archivo de una versión concreta |

### 4.3. Crear una versión nueva

**Paso 1.** Abra el detalle del documento y pulse la opción para subir una versión nueva.

**Paso 2.** Seleccione el archivo actualizado, escriba la **descripción del cambio** e **ingrese su contraseña** para firmar.

**Paso 3.** Confirme la operación.

**Efecto técnico.** La petición `PUT /api/docs/:id` no reemplaza el archivo anterior: crea la versión siguiente, la firma y la incorpora a la cadena de integridad. La versión previa permanece intacta y descargable.

### 4.4. Consultar el historial de versiones

- **Petición:** `GET /api/docs/:id/versions`.
- **Qué se obtiene:** la lista completa de versiones del documento, con su número, su huella SHA-256, su firmante y su fecha.

El historial es de solo lectura. No existe ninguna operación en el sistema que elimine una versión; ésa es precisamente la garantía de trazabilidad.

### 4.5. Comparar dos versiones

- **Petición:** `GET /api/docs/:id/compare`.
- **Qué hace:** genera un **diferencial de texto** entre dos versiones seleccionadas, o entre una versión y una propuesta de cambio.
- **Cómo se usa en pantalla:** elija la versión base y la versión de destino; el sistema resalta las líneas agregadas, eliminadas o modificadas.

Esta función es la más útil para revisar una corrección extensa sin abrir dos archivos lado a lado.

### 4.6. Descargar una versión

- **Petición:** `GET /api/docs/:id/file`.

Reglas de acceso:

| Situación del documento | ¿Requiere sesión? | ¿Quién puede descargar? |
| --- | --- | --- |
| Público | No | Cualquier persona |
| Privado | Sí | Únicamente el propietario |

Si un usuario no autorizado intenta descargar un documento privado, el sistema deniega la operación y no entrega el archivo.

### 4.7. Obtener el código QR

- **Petición:** `GET /api/docs/:id/qr`.
- **Qué hace:** genera el **código QR de verificación** asociado al documento.

Uso previsto: el destinatario escanea el código con la cámara de su teléfono y llega a la página de verificación, desde donde puede comprobar la autenticidad del documento que recibió. El código QR no transporta el contenido del documento, sino el identificador que permite verificarlo.

## 5. Visibilidad y compartido

### 5.1. Principio de compartición

En el SGD-FD, **un documento nunca nace público**. Todo documento se crea en estado `privado`. El compartido es un acto deliberado del propietario, que debe ejecutar de forma explícita.

### 5.2. Cambiar la visibilidad

- **Petición:** `PATCH /api/docs/:id/visibility`.

**Paso 1.** Abra el detalle del documento y pulse el control de visibilidad.

**Paso 2.** Seleccione `público` o `privado` y confirme.

### 5.3. Efecto del compartido

Es importante comprender qué ocurre y qué **no** ocurre al compartir:

| Efecto | Detalle |
| --- | --- |
| Cambia la visibilidad | El documento pasa a ser consultable por terceros |
| Permite la vista pública | Se habilita la ruta `/v/[id]` |
| Permite la descarga sin sesión | Cualquier persona puede obtener el archivo |
| **No crea una versión nueva** | La versión y su firma permanecen intactas |
| **No altera la huella** | El contenido firmado es el mismo antes y después |
| **No altera el historial** | Compartir, versionar y proponer son eventos distintos |

Compartir es, por tanto, un cambio de **permiso de lectura**, no una alteración del documento.

### 5.4. Vista pública de un documento compartido

- **Ruta:** `/v/[id]` — Título en pantalla: el título del documento.

Esta pantalla es la que ve un destinatario sin cuenta. Presenta el título, la versión vigente, el firmante, la fecha de firma, la huella SHA-256 y el código QR. Desde aquí, el destinatario puede ir a la página `/verify` para validar el archivo que tiene en su poder.

## 6. Coautoría

La coautoría permite que una persona registrada proponga un cambio sobre un documento **público**, sin poder modificarlo directamente. La autoridad sobre el documento permanece siempre en el propietario.

### 6.1. Crear una propuesta de cambio

**Paso 1.** Inicie sesión con su propia cuenta y abra la vista pública `/v/[id]` del documento sobre el que desea colaborar.

**Paso 2.** Pulse la opción para crear una propuesta.

**Paso 3.** Cargue el archivo propuesto, escriba el motivo del cambio e **ingrese su contraseña** para firmar la propuesta.

**Paso 4.** Envíe la propuesta.

**Qué ve el usuario en pantalla.** La propuesta queda registrada con su propia huella y su propia firma, y aparece en la lista de propuestas del documento. **El documento original no cambia en absoluto**; lo que se registra es una contribución firmada y trazable.

### 6.2. Revisar una propuesta (propietario)

**Paso 1.** Inicie sesión con la cuenta propietaria del documento y abra su detalle en `/documents/[id]`.

**Paso 2.** Ubique la sección de propuestas y seleccione la que desea revisar.

**Paso 3.** Pulse la opción de comparación. El sistema muestra el **diferencial de texto** entre la versión vigente y el archivo propuesto, para que el propietario evalúe exactamente qué cambió.

### 6.3. Aceptar una propuesta

- **Petición:** `POST /api/docs/:id/proposals/:proposalId/accept`.
- **Efecto:** el sistema crea una **versión nueva firmada** a partir del contenido propuesto y **registra al coautor** en la trazabilidad del documento.

**Paso 1.** Tras revisar el diferencial, pulse la opción de aceptar.

**Paso 2.** Ingrese su contraseña para firmar la versión resultante y confirme. La propuesta queda cerrada y figura como aceptada en el historial.

### 6.4. Rechazar una propuesta

- **Petición:** `POST /api/docs/:id/proposals/:proposalId/reject`.
- **Efecto:** la propuesta se marca como rechazada y **no se crea ninguna versión**. El documento permanece exactamente como estaba, y la decisión queda registrada en la bitácora de auditoría.

**Paso 1.** Pulse la opción de rechazar sobre la propuesta y confirme la decisión.

### 6.5. Reglas de la coautoría

| Regla | Detalle |
| --- | --- |
| Solo sobre documentos públicos | Un documento privado no admite propuestas |
| Ambos participantes deben estar registrados | El coautor y el propietario son usuarios del sistema |
| El coautor no firma en nombre del propietario | Su firma identifica al coautor, no al dueño del documento |
| Aceptar es irreversible desde la interfaz | La versión creada no se puede borrar |

## 7. Verificación de documentos sin sesión

### 7.1. Cuándo usar la verificación

Use la verificación cuando **reciba** un documento de un tercero y necesite saber si el archivo que tiene en sus manos es exactamente el que el firmante selló. Esta función es deliberadamente pública: no requiere cuenta, y por eso sirve para que un destinatario externo compruebe la autenticidad sin pedirle credenciales al remitente.

**Ruta:** `/verify` — Título en pantalla: *«Comprueba la autenticidad de un documento.»*

### 7.2. Tres formas de verificar

1. **Cargar el archivo recibido.** Arrastre el archivo o selecciónelo desde el equipo. El sistema calcula su huella SHA-256 y la compara con la registrada.
2. **Escanear el código QR.** La cámara del teléfono lee el código y abre la página de verificación del documento correspondiente.
3. **Buscar por contenido.** Si ya conoce el identificador o el código de verificación, puede consultar la ficha del documento directamente.

### 7.3. Los cinco estados de resultado

El sistema devuelve siempre uno de estos cinco estados:

| Estado | Significado en lenguaje llano | Qué hacer |
| --- | --- | --- |
| `VALID` | El archivo es **íntegro y firmado**: coincide bit a bit con lo que el firmante selló, y la firma corresponde a su clave pública. | Aceptar el documento y conservarlo como evidencia técnica. Recuerde que esto **no** equivale a un certificado legal. |
| `MANIPULATED` | El contenido fue **alterado** después de firmarse. La huella del archivo recibido no coincide con la registrada. | **No aceptar el documento.** Solicite al remitente una copia nueva, vuelva a verificar y conserve el archivo recibido como evidencia. |
| `INVALID_SIGNATURE` | El contenido es **idéntico** al firmado, pero la firma **no corresponde** a la clave pública declarada. | **No aceptar el documento.** Es una señal de alerta grave: o la firma fue fabricada, o pertenece a otra clave. Escale el caso a un responsable. |
| `NOT_FOUND` | El documento **no está en el repositorio** del SGD-FD. | Verifique que el archivo provenga realmente de este sistema. Si el remitente afirma haberlo firmado aquí, existe un error o un uso indebido. |
| `FOUND` | Existe en el repositorio un documento **con esa misma huella**, pero usted no ha cargado el archivo completo: la pantalla muestra la ficha del documento y le invita a subir el archivo. | Cargue el archivo recibido para obtener el veredicto definitivo. |

### 7.4. Lectura de la pantalla de resultados

Después de verificar, la pantalla muestra el **estado** obtenido con su color correspondiente (verde para `VALID`, ámbar para los avisos y rojo para los resultados negativos), una **explicación en lenguaje llano** del resultado, dos comprobaciones independientes —**Hash SHA-256**, que indica «Coincide» o «No coincide», y **Firma digital**, que indica «Válida» o «Inválida»— y el **nombre de quien firmó** junto con la **fecha de la firma**.

En la parte inferior de la página se recuerda de forma permanente que *la firma criptográfica es válida dentro de DocuTrust y no constituye firma electrónica certificada*.

## 8. Perfil público

**Ruta:** `/u/[username]` — Título en pantalla: el nombre completo o el nombre de usuario del firmante.

El perfil público permite consultar, sin iniciar sesión, quién es el firmante y qué documentos ha hecho públicos. Este dato resulta especialmente útil en la verificación: si el estado es `VALID`, la pantalla remite al perfil del firmante, de modo que el destinatario puede contrastar la identidad declarada con la que figura en el documento que recibió.

## 9. Panel de administración

La sección `/audit` — *«Bitácora de auditoría»* — es de acceso exclusivo para administradores.

### 9.1. Bitácora de auditoría

- **Petición:** `GET /api/audit`.
- **Qué muestra:** el registro ordenado de los eventos relevantes del sistema: creación de documentos, firmas, cambios de visibilidad, propuestas de coautoría, aceptación y rechazo, y accesos de administración.
- **Para qué sirve:** reconstruir qué ocurrió con un documento y en qué orden. Es la evidencia de trazabilidad del sistema.

### 9.2. Verificación de la cadena de integridad

- **Petición:** `GET /api/audit/verify-chain`.
- **Qué hace:** recorre **toda la cadena de hashes** del repositorio y comprueba que cada eslabón siga enlazado con el siguiente.
- **Qué informa:** el **identificador exacto de cualquier ruptura**. Si la cadena está intacta, el sistema lo indica de forma explícita; si encuentra un punto de desalineación, señala qué registro rompió la secuencia.

Esta comprobación responde a una pregunta concreta: ¿ha cambiado algo en el repositorio sin que el sistema lo haya registrado como una versión firmada?

## 10. Preguntas frecuentes

**1. ¿La firma de DocuTrust tiene validez legal?**
No. La firma es criptográficamente válida dentro del SGD-FD, pero no es una firma electrónica certificada bajo la Ley N.° 27269. No hay Autoridad de Certificación acreditada ni sello de tiempo (TSA). Un documento puede ser `VALID` y carecer, aun así, de validez legal de certificado.

**2. ¿Olvidé mi contraseña? ¿Qué hago?**
El sistema no implementa recuperación de contraseña, de modo que debe registrar una cuenta nueva. Tenga en cuenta que el acceso anterior puede bloquearse temporalmente tras varios intentos fallidos, pero el bloqueo expira solo.

**3. ¿Puedo firmar un documento sin escribir mi contraseña?**
No. La contraseña se exige en cada firma precisamente para demostrar que quien firma es el titular de la clave privada. Es una decisión de diseño, no una limitación técnica.

**4. ¿Puedo eliminar un documento o una versión?**
No. El sistema no expone ninguna operación de eliminación de versiones. La trazabilidad exige que lo firmado permanezca, lo que protege al propietario frente a la alteración de la evidencia.

**5. Al compartir un documento, ¿se crea una versión nueva?**
No. Compartir cambia únicamente la visibilidad. La versión, la firma y la huella permanecen idénticas, porque son dos operaciones separadas en el sistema.

**6. ¿Por qué el estado es `MANIPULATED` si el archivo se ve igual?**
Porque la verificación no compara la apariencia, sino el contenido exacto. Un cambio invisible —un espacio, una coma, un carácter oculto en un PDF— altera la huella. El sistema detecta modificaciones que el ojo no percibe.

**7. ¿El sistema sabe quién alteró un documento?**
No. El estado `MANIPULATED` informa que el contenido cambió y en qué versión dejó de coincidir, pero no identifica al autor material de la alteración. Esa investigación es un acto posterior, ajeno al alcance de la herramienta.

**8. ¿Puedo verificar un documento sin registrarme?**
Sí. La página `/verify` es pública precisamente para eso. También son públicas la vista `/v/[id]` de todo documento compartido y el perfil `/u/[username]`.

**9. ¿Quién puede crear una propuesta de coautoría?**
Cualquier usuario registrado, pero solo sobre documentos **públicos**. La propuesta se firma con la clave del coautor, y el propietario decide si la acepta o la rechaza.

**10. ¿Qué pasa si rechazo una propuesta?**
El documento no cambia: no se crea ninguna versión y la decisión queda asentada en la bitácora de auditoría.

**11. ¿Cuánto tiempo dura mi sesión?**
La sesión se sostiene mediante un token con vigencia limitada. Puede renovarse con `POST /api/auth/refresh` sin volver a escribir la contraseña. Si la interfaz indica que la sesión expiró, inicie sesión de nuevo.

## 11. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| El formulario de registro rechaza la contraseña | No cumple la política de contraseñas | Verifique: mínimo 12 caracteres, 1 mayúscula, 1 minúscula, 1 dígito y 1 carácter de `@ $ ! % * ? &` |
| El nombre de usuario ya existe | El identificador está repetido | Elija otro nombre de usuario |
| El inicio de sesión falla aunque la contraseña sea correcta | Bloqueo temporal por intentos fallidos | Espere a que expire la ventana de 15 minutos; el bloqueo se levanta solo |
| Mensaje «Demasiadas solicitudes» | Se alcanzó el límite de solicitudes por periodo | Espere unos minutos antes de reintentar; el límite se reinicia automáticamente |
| La sesión se corta inesperadamente | El token venció | Renueve la sesión con `POST /api/auth/refresh` o inicie sesión de nuevo |
| Al firmar, el sistema rechaza la operación | La contraseña ingresada para firmar no coincide | Verifique la contraseña; sin ella no se genera la firma ni la versión |
| El documento cargado no aparece en el listado | La creación no llegó a completarse | Repita la carga desde `/documents`; la versión 1 se crea en una única operación |
| La vista `/v/[id]` muestra un error de acceso | El documento es privado | Solicite al propietario que lo comparta; la vista pública solo funciona con documentos públicos |
| La descarga de un documento privado es rechazada | El usuario no es el propietario | Inicie sesión con la cuenta propietaria |
| El código QR no se genera | El identificador del documento no es válido | Verifique la ruta y recargue la página de detalle |
| La comparación no muestra diferencias | Las dos versiones son equivalentes | Elija versiones distintas en los selectores de versión base y destino |
| La verificación devuelve `NOT_FOUND` | El documento no pertenece a este repositorio | Confirme el origen del archivo; pida al remitente el código QR o el identificador correcto |
| La verificación devuelve `FOUND` | Hay un documento con esa huella, pero falta cargar el archivo | Cargue el archivo completo para obtener el veredicto definitivo |
| La verificación devuelve `INVALID_SIGNATURE` | El contenido coincide, pero la firma no corresponde | No acepte el documento; escale el caso a un responsable |
| La verificación devuelve `MANIPULATED` | El contenido fue alterado tras la firma | No acepte el documento; solicite una copia nueva y conserve la evidencia |
| La cadena de integridad reporta una ruptura | Un registro fue alterado fuera del sistema | Revise el identificador señalado y escale el hallazgo; la bitácora conserva la secuencia |

## 12. Referencias cruzadas

Documentos relacionados con este manual:

- **Seguridad del sistema:** [seguridad.md](../seguridad/seguridad.md) — controles, amenazas y medidas aplicadas.
- **Casos de uso:** [diagrama_casos_uso.md](../../06_diagramas_y_software/diagrama_casos_uso.md) — escenarios de uso representados en el sistema.
- **Diagrama de actividades:** [diagrama_actividades.md](../../06_diagramas_y_software/diagrama_actividades.md) — flujo de las operaciones principales.
- **Diagrama de despliegue:** [diagrama_despliegue.md](../../06_diagramas_y_software/diagrama_despliegue.md) — componentes y su ubicación en ejecución.
- **Requerimientos:** [casos_uso.md](../../01_planificacion_requerimientos/requerimientos/casos_uso.md) — funcionalidad esperada por rol.
- **Historias de usuario:** [historias_usuario.md](../../01_planificacion_requerimientos/requerimientos/historias_usuario.md) — origen de los criterios de aceptación.
- **Implementación y despliegue:** [implementacion_despliegue.md](../../04_implementacion_despliegue/implementacion_despliegue.md) — puesta en marcha del sistema.
- **Glosario técnico:** [glosario_tecnico.md](../referencia/glosario_tecnico.md) — definición de los términos técnicos empleados en este manual.

En el mismo directorio de operación se encuentran además `guia_despliegue_produccion.md`, `guia_tecnica.md` y `roadmap_produccion.md`, que completan el conjunto documental de operación del proyecto.

---

*Fin del manual de usuario del SGD-FD. La firma criptográfica descrita es de alcance interno y no constituye firma electrónica certificada.*
