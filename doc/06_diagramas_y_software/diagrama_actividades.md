# Diagramas de Actividades — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Tipo:** Diagrama de actividades (UML 2.5)
**Notación:** PlantUML

---

## 1. Propósito

Modelar el flujo de trabajo del SGD-FD como secuencias de actividades,
decisiones y carriles que muestran **quién** hace **qué** y en **qué orden**.

Los diagramas de actividades son el puente natural entre el proceso de negocio
(AS-IS y TO-BE) y la implementación: describen el flujo sin mezclar detalle de
interfaz con detalle de base de datos.

---

## 2. Actividad 1 · Emisión y distribución de un documento

```plantuml
@startuml actividad_emision
skinparam shadowing false

|#F5F5F5|Emisor|
|#E8F4E8|Sistema|
start
|Emisor|
:Introducir titulo, descripcion\ny archivo;
:Indicar la contrasena de firma;

if (Formato de archivo valido?) then (no)
  :Rechazar:\n400 tipo no permitido;
  stop
elseif (Tamano mayor a 10 MB?) then (si)
  :Rechazar:\n400 limite excedido;
  stop
endif

|Sistema|
:Calcular SHA-256\ndel contenido;
:Descifrar la clave privada\ncon la contrasena;

if (Contrasena correcta?) then (no)
  :Rechazar:\n400 error de autenticacion GCM;
  stop
else (si)
  :Firmar el hash\ncon RSA-SHA256;
  :Insertar documento;\nversion_number = 1;
  :Insertar la firma;\nInsertar auditoria;\nDOCUMENT_CREATED;
  :Generar el codigo QR;\ncon la URL publica;
endif

|Emisor|
:Decidir si comparte;

if (Comparte?) then (si)
  |Sistema|
  :Marcar is_public = true;\nInsertar auditoria;\nDOCUMENT_SHARED;
endif

|Sistema|
:Entregar hash, firma,\nURL y QR;
stop

@enduml
```

### 2.1. Puntos de decisión

| # | Decisión | Camino «sí» | Camino «no» |
|---|----------|-------------|-------------|
| D-1 | ¿Formato de archivo válido? | Continúa | `400` |
| D-2 | ¿Tamaño mayor a 10 MB? | `400` | Continúa |
| D-3 | ¿Contraseña correcta? | Firma | `400` |
| D-4 | ¿Comparte el documento? | Marca público | Permanece privado |

---

## 3. Actividad 2 · Verificación de un documento recibido

```plantuml
@startuml actividad_verificacion
skinparam shadowing false

|#F5F5F5|Verificador|
|#E8F4E8|Sistema|
start
|Verificador|
:Escanear el codigo QR\ndel documento;

|Sistema|
:Consultar los metadatos\npublicos;
:Mostrar titulo, version\nvigente, firmante y fecha;

|Verificador|
:Seleccionar el archivo\nque se recibio;
:Enviar el archivo al\nverificador publico;

if (Se informo documentId?) then (no)
  |Sistema|
  :Calcular SHA-256\ndel archivo;
  :Buscar por hash en\ntodo el repositorio;

  if (Hay coincidencia?) then (si)
    :Mostrar FOUND:\npuede ser un documento falso;
  else (no)
    :Mostrar NOT_FOUND:\nel archivo no esta registrado;
  endif
  stop
else (si)
endif

|Sistema|
:Localizar el documento\ny la version;

if (Existe?) then (no)
  :Mostrar NOT_FOUND;
  stop
else (si)
endif

:Calcular SHA-256\ndel archivo recibido;

if (Coincide con el\nhash registrado?) then (no)
  :Mostrar MANIPULATED:\nel contenido fue alterado;
  stop
else (si)
endif

:Verificar la firma\ncon la clave publica;

if (Firma valida?) then (no)
  :Mostrar INVALID_SIGNATURE;
  stop
else (si)
  :Mostrar VALID:\ndocumento integro y vigente;
endif

stop

@enduml
```

### 3.1. Reglas del flujo

| Regla | Aplicación |
|-------|------------|
| R-1 | El verificador nunca necesita una cuenta |
| R-2 | Sin `documentId`, la búsqueda es por hash |
| R-3 | El hash se compara antes que la firma |
| R-4 | Cada fallo produce un mensaje distinto y accionable |

---

## 4. Actividad 3 · Publicación de una nueva versión

```plantuml
@startuml actividad_version
skinparam shadowing false

|#F5F5F5|Propietario|
|#E8F4E8|Sistema|
start
|Propietario|
:Editar el documento;

|Sistema|
if (El motivo del cambio\nesta informado?) then (no)
  :Rechazar:\n400 changeDescription requerido;
  stop
else (si)
endif

if (El contenido cambio?) then (no)
  :Rechazar:\n400 el contenido no cambio;
  stop
else (si)
endif

:Calcular el hash\nde la nueva version;
:Calcular version_number = MAX + 1;
:Firmar con la clave privada;\nInsertar la version;\nInsertar la firma;

if (Es una propuesta aceptada?) then (si)
  :Registrar coauthorId;\nmarcar la propuesta\ncomo ACCEPTED;
else (no)
  :No hay coautor registrado;
endif

:Insertar auditoria;\nVERSION_CREATED;
:Devolver la nueva version,\nsu hash y su firma;
stop

@enduml
```

---

## 5. Actividad 4 · Gestión de una propuesta de coautoría

```plantuml
@startuml actividad_propuesta
skinparam shadowing false

|#F5F5F5|Coautor|
|#E8F4E8|Sistema|
|#FFE8E8|Propietario|
start
|Coautor|
:Preparar su version\ndel documento;

if (El documento es publico?) then (no)
  |Sistema|
  :Rechazar:\n403 propuestas no permitidas\nen documentos privados;
  stop
else (si)
endif

|Coautor|
:Enviar la propuesta con\nsu contrasena de firma;

if (Contrasena correcta?) then (no)
  |Sistema|
  :Rechazar:\n400;
  stop
else (si)
  |Sistema|
  :Firmar la propuesta;\nInsertar estado PENDING;\nInsertar auditoria:\nPROPOSAL_CREATED;
endif

:Calcular el diferencial\nentre la version vigente\ny la propuesta;
:Mostrar el diferencial\nal propietario;

|Propietario|
:Revisar el diferencial;

if (Acepta?) then (si)
  :Registrar coauthorId;\nInsertar nueva version\nfirmada por el propietario;
  |Sistema|
  :Marcar la propuesta\ncomo ACCEPTED;
  :Insertar auditoria:\nPROPOSAL_ACCEPTED,\nVERSION_CREATED;
  :Notificar al coautor\nque su propuesta\nfue aceptada;
else (no)
  |Sistema|
  :Marcar la propuesta\ncomo REJECTED;
  :Insertar auditoria:\nPROPOSAL_REJECTED;
  :Notificar al coautor\nque su propuesta\nfue rechazada;
endif

stop

@enduml
```

---

## 6. Actividad 5 · Registro en la auditoría

```plantuml
@startuml actividad_auditoria
skinparam shadowing false

|#F5F5F5|Cualquier actor|
|#E8F4E8|AuditService|
start
|Cualquier actor|
:Ocurre una accion relevante;

|AuditService|
:Invocar append(tipo, entidad, id,\nusuario, datos);
:Leer el current_hash\ndel ultimo registro;

if (Es el primer evento?) then (si)
  :previous_hash = null;
else (no)
  :previous_hash = current_hash\ndel ultimo registro;
endif

:Calcular el hash canonico\nSHA-256 del evento;
:Insertar el registro;\nsolo adicion;
:Volcar la base a disco;

stop

@enduml
```

---

## 7. Actividad 6 · Proceso completo de extremo a extremo

```plantuml
@startuml actividad_completa
skinparam shadowing false

|#F9E8E8|Emisor|
|#E8F0F8|SGD-FD|
|#E8F8F0|Destinatario|
start
|Emisor|
:Preparar el documento;

|SGD-FD|
:Calcular hash y firmar;
:Generar el codigo QR;

|Emisor|
:Distribuir el documento\ncon su URL de verificacion;

|Destinatario|
:Recibir el documento;

if (Desconfia o tiene dudas?) then (no)
  :Usar el documento\nsin verificar;
  stop
else (si)
  :Escanear el QR;
  |SGD-FD|
  :Mostrar metadatos publicos;
  |Destinatario|
  :Subir el archivo recibido;
  |SGD-FD|
  :Recalcular el hash;

  if (Hash coincide?) then (no)
    :MANIPULATED;
    |Destinatario|
    :Rechazar el documento\ny avisar al emisor;
    stop
  else (si)
  endif

  |SGD-FD|
  :Verificar la firma;

  if (Firma valida?) then (no)
    :INVALID_SIGNATURE;
    |Destinatario|
    :Rechazar el documento;
    stop
  else (si)
  endif

  |SGD-FD|
  :VALID;
  |Destinatario|
  :Aceptar el documento;
endif

stop

@enduml
```

---

## 8. Comparación de Flujos AS-IS y TO-BE

| Aspecto | AS-IS | TO-BE |
|---------|-------|-------|
| Emisión | ~2 h, sin firma | < 2 s, firmada |
| Distribución | Correo, sin trazabilidad | QR y evento auditable |
| Verificación | Contacto con el emisor, ~1 h | < 2 s, automática, sin cuenta |
| Versionado | ~4 h, sufijos en el nombre | < 1 s, numeración correlativa |
| Coautoría | ~3 días, autoría no registrada | ~5 min, coautor firmado |
| Auditoría | Imposible de reconstruir | Cadena verificable en < 100 ms |
| Tiempo total del ciclo | **~3,5 días** | **~5 min** |

---

## 9. Reglas de Negocio Representadas

| Regla | Actividad | Diagrama |
|-------|-----------|----------|
| Toda versión se firma automáticamente | 1 | Emisión |
| El motivo del cambio es obligatorio | 3 | Versionado |
| No se aceptan versiones sin cambios reales | 3 | Versionado |
| Las propuestas solo existen en documentos públicos | 4 | Coautoría |
| Solo el propietario acepta o rechaza | 4 | Coautoría |
| La bitácora es de solo adición | 5 | Auditoría |
| La verificación es pública | 2 y 6 | Verificación |

---

## 10. Referencias Cruzadas

- [`diagrama_secuencia.md`](diagrama_secuencia.md) — Diagramas de secuencia
- [`diagrama_estados.md`](diagrama_estados.md) — Máquinas de estado
- [`../02_diseno_construccion/procesos_empresa/as_is/procesos_as_is.md`](../02_diseno_construccion/procesos_empresa/as_is/procesos_as_is.md) — Mapa de procesos AS-IS
- [`../02_diseno_construccion/procesos_empresa/to_be/procesos_to_be.md`](../02_diseno_construccion/procesos_empresa/to_be/procesos_to_be.md) — Mapa de procesos TO-BE
