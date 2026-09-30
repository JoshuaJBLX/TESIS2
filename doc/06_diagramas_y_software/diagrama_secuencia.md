# Diagramas de Secuencia — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Tipo:** Diagrama de secuencia (UML 2.5)
**Notación:** PlantUML

---

## 1. Propósito

Mostrar la interacción ordenada entre participantes durante la ejecución de
los flujos principales del SGD-FD, con los mensajes concretos que intercambian.

Se documentan cinco secuencias: emisión, verificación pública, versionado,
coautoría y auditoría.

---

## 2. Secuencia 1 · Emisión de un documento firmado

```plantuml
@startuml secuencia_emision
skinparam shadowing false
autonumber

actor Usuario as U
participant "Interfaz" as UI
participant "Rutas /api/docs" as R
participant "Autenticacion" as Auth
participant "DocumentService" as DS
participant "Criptografia" as Crypto
participant "SQLite" as DB
participant "Archivo" as FS
participant "AuditService" as Audit

U -> UI : Selecciona el archivo y completa el formulario
UI -> R : POST /api/docs (multipart, Bearer)
R -> Auth : Verificar token
Auth --> R : Usuario autenticado

R -> DS : createDocument(archivo, datos, password)
DS -> Crypto : Descifrar clave privada con password

alt Contrasena incorrecta
  Crypto --> DS : Error de autenticacion GCM
  DS --> R : Error
  R --> UI : 400 "Contrasena requerida para firmar"
else Contrasena correcta
  Crypto --> DS : Clave privada en memoria

  DS -> Crypto : calculateFileHash(bytes)
  Crypto --> DS : SHA-256 (64 hex)

  DS -> FS : Guardar el archivo
  FS --> DS : Ruta

  DS -> Crypto : signDocumentHash(hash, clavePrivada)
  Crypto --> DS : Firma RSA-SHA256

  DS -> DB : INSERT documents
  DS -> DB : INSERT document_versions (version_number = 1)
  DS -> DB : INSERT document_signatures

  DS -> Audit : append("DOCUMENT_CREATED")
  Audit -> Audit : Encadenar previous_hash
  Audit -> DB : INSERT audit_log
  Audit -> FS : saveDatabase()

  DS -> Crypto : Generar QR con la URL publica
  Crypto --> DS : Data URI

  DS --> R : { id, versionNumber, contentHash, signature, verificationUrl, qr }
  R --> UI : 201 Created
  UI --> U : Muestra hash, firma y codigo QR
end

note over Crypto
  La clave privada existe
  solo en memoria durante
  este metodo
end note

@enduml
```

### 2.1. Mensajes y su propósito

| # | Emisor → Receptor | Mensaje | Propósito |
|:-:|-------------------|---------|-----------|
| 1 | Usuario → Interfaz | Seleccionar archivo | Capturar la entrada |
| 2 | Interfaz → Rutas | `POST /api/docs` | Solicitar emisión |
| 3 | Rutas → Autenticación | Verificar token | Identificar al usuario |
| 4 | Rutas → Servicio | `createDocument` | Delegar la lógica |
| 5 | Servicio → Criptografía | Descifrar clave privada | Obtener la clave con la contraseña |
| 6 | Servicio → Criptografía | `calculateFileHash` | Obtener el hash del contenido |
| 7 | Servicio → Archivo | Guardar | Persistir el archivo |
| 8 | Servicio → Criptografía | `signDocumentHash` | Firmar el hash |
| 9 | Servicio → Base de datos | 3 `INSERT` | Registrar documento, versión y firma |
| 10 | Servicio → Auditoría | `append` | Dejar constancia |
| 11 | Servicio → Criptografía | Generar QR | Producir el código de verificación |
| 12 | Servicio → Interfaz | Respuesta 201 | Informar el resultado |

---

## 3. Secuencia 2 · Verificación pública sin cuenta

```plantuml
@startuml secuencia_verificacion
skinparam shadowing false
autonumber

actor Verificador as X
participant "Interfaz publica" as UI
participant "Rutas /api/verify" as R
participant "VerificationService" as VS
participant "Criptografia" as Crypto
participant "SQLite" as DB

X -> UI : Escanea el codigo QR
UI -> R : GET /api/verify/:documentId
R -> DB : SELECT documento
R -> DB : SELECT ultima version firmada + firmante
DB --> R : Datos del documento
R --> UI : { titulo, versionVigente, firmante, fecha }
UI --> X : Muestra los metadatos

X -> UI : Selecciona el archivo recibido
UI -> R : POST /api/verify (archivo, documentId)

R -> VS : verifyDocument(ruta, hash, clavePublica, firma)
VS -> Crypto : calculateFileHash(ruta)
Crypto --> VS : hash calculado
VS -> Crypto : crypto.verify(firma, hash, clavePublica)

alt hash distinto
  VS --> R : hashMatch = false
  R --> UI : 200 status = MANIPULATED
  UI --> X : "El documento ha sido manipulado"
else hash coincide pero firma invalida
  VS --> R : signatureMatch = false
  R --> UI : 200 status = INVALID_SIGNATURE
  UI --> X : "Firma digital invalida"
else todo correcto
  VS --> R : isValid = true
  R --> UI : 200 status = VALID
  UI --> X : "Documento integro y vigente"
end

note over UI
  Ninguna de estas rutas
  aplica middleware de
  autenticacion
end note

@enduml
```

### 3.1. Decisión central

La separación entre `MANIPULATED` e `INVALID_SIGNATURE` es deliberada:

| Estado | Significado | Causa |
|--------|-------------|-------|
| `MANIPULATED` | El contenido cambió | El hash no coincide |
| `INVALID_SIGNATURE` | La firma no corresponde | La clave pública no valida la firma |
| `VALID` | Ambos coinciden | Documento íntegro y firmado |

Confundirlos impediría al verificador saber si el problema está en el archivo o
en la firma.

---

## 4. Secuencia 3 · Creación de una nueva versión

```plantuml
@startuml secuencia_version
skinparam shadowing false
autonumber

actor Propietario as P
participant "Rutas" as R
participant "DocumentService" as DS
participant "Criptografia" as Crypto
participant "SQLite" as DB
participant "AuditService" as Audit

P -> R : PUT /api/docs/:id (archivo, changeDescription, password)
R -> DS : createVersion(id, archivo, motivo, password)

alt changeDescription vacio
  DS --> R : Error
  R --> P : 400 "changeDescription requerido"
else motivo informado
  DS -> Crypto : Descifrar clave privada
  alt Contrasena incorrecta
    Crypto --> DS : Error GCM
    DS --> R : Error
    R --> P : 400
  else Contrasena correcta
    Crypto --> DS : Clave privada

    DS -> Crypto : calculateFileHash(bytes)
    Crypto --> DS : hash nuevo

    DS -> DB : SELECT content_hash de la version vigente
    DB --> DS : hash anterior

    alt hash identico al anterior
      DS --> R : Error "el contenido no cambio"
      R --> P : 400
    else contenido distinto
      DS -> Crypto : signDocumentHash(hash nuevo)
      Crypto --> DS : firma

      DS -> DB : SELECT MAX(version_number) + 1
      DS -> DB : INSERT document_versions (con UNIQUE)
      DS -> DB : INSERT document_signatures

      DS -> Audit : append("VERSION_CREATED")
      Audit -> DB : INSERT audit_log

      DS --> R : { versionNumber, hash, firma, versionAnterior }
      R --> P : 200 OK
    end
  end
end

note over DB
  UNIQUE(document_id, version_number)
  impide dos versiones con
  el mismo numero, aunque
  el servicio fallara
end note

@enduml
```

---

## 5. Secuencia 4 · Coautoría: propuesta y aceptación

```plantuml
@startuml secuencia_coautoria
skinparam shadowing false
autonumber

actor Coautor as CO
participant "Rutas /proposals" as R
participant "DocumentService" as DS
participant "AnalisisDocumental" as AD
actor Propietario as PR
participant "AuditService" as Audit
participant "SQLite" as DB

CO -> R : POST /api/docs/:id/proposals (archivo, motivo, password)
R -> DS : createProposal(id, archivo, motivo, usuario, password)

DS -> DB : SELECT is_public del documento
DB --> DS : is_public

alt Documento privado
  DS --> R : Error
  R --> CO : 403 "no se permiten propuestas en documentos privados"
else Documento publico
  DS -> DS : Verificar contrasena del coautor
  DS -> DB : INSERT version_proposals (status = PENDING, firma)
  DS -> Audit : append("PROPOSAL_CREATED")
  DS --> R : Propuesta creada
  R --> CO : 201 Created

  PR -> R : GET /api/docs/:id/proposals
  R --> PR : Lista de propuestas

  PR -> R : GET /api/docs/:id/compare?sourceType=version&targetType=proposal
  R -> AD : compareComparableArtifacts(version, propuesta)
  AD --> R : Diferencial de lineas y de metadatos
  R --> PR : Diferencial

  alt El propietario acepta
    PR -> R : POST .../accept (password)
    R -> DS : acceptProposal(id, propuestaId, usuario, password)
    DS -> DS : Verificar contrasena del propietario
    DS -> DS : Firmar la nueva version
    DS -> DB : INSERT version (version_number = MAX+1, coauthorId, proposalId)
    DS -> DB : UPDATE propuesta -> ACCEPTED
    DS -> Audit : append("PROPOSAL_ACCEPTED")
    DS -> Audit : append("VERSION_CREATED")
    DS --> R : Nueva version firmada con coautor
    R --> PR : 200 OK
  else El propietario rechaza
    PR -> R : POST .../reject
    R -> DS : rejectProposal(id, propuestaId, usuario)
    DS -> DB : UPDATE propuesta -> REJECTED
    DS -> Audit : append("PROPOSAL_REJECTED")
    DS --> R : Propuesta rechazada
    R --> PR : 200 OK
  end
end

note over AD
  Si el archivo es binario y no
  tiene texto extraible, el
  diferencial muestra solo
  metadatos
end note

@enduml
```

---

## 6. Secuencia 5 · Auditoría y verificación de la cadena

```plantuml
@startuml secuencia_auditoria
skinparam shadowing false
autonumber

actor Servicio as S
participant "AuditService" as A
participant "SQLite" as DB
actor Administrador as Adm
participant "Rutas /api/audit" as R

== Registro de un evento ==

S -> A : append(eventType, entityType, entityId, userId, eventData)
A -> DB : SELECT current_hash ORDER BY id DESC LIMIT 1
DB --> A : previousHash (o null)
A -> A : currentHash = SHA-256(canonico(carga))
A -> DB : INSERT INTO audit_log (...)
A -> A : saveDatabase()
A --> S : Registro creado

== Consulta y verificacion ==

Adm -> R : GET /api/audit/verify-chain
R -> R : requireAdmin
alt Sin rol admin
  R --> Adm : 403
else Con rol admin
  R -> A : verifyChain()
  A -> DB : SELECT * ORDER BY id ASC
  DB --> A : Todos los eventos

  loop Por cada evento
    A -> A : Verificar previous_hash == hash anterior
    A -> A : Recalcular SHA-256(canonico(evento))
    A -> A : Comparar con current_hash
  end

  alt Cadena integra
    A --> R : { valid: true, entries: N, brokenAt: null }
    R --> Adm : 200 OK
  else Cadena rota
    A --> R : { valid: false, entries: N, brokenAt: X, reason }
    R --> Adm : 200 OK con el id de la ruptura
  end
end

@enduml
```

### 6.1. Detección de manipulación

Si alguien modifica `event_data` de la fila con `id = 57` sin recalcular los
hashes, la verificación falla en dos puntos posibles:

| Alteración | Cómo se detecta |
|------------|-----------------|
| Se cambia el contenido de un evento | `current_hash` recalculado no coincide |
| Se elimina una fila | `previous_hash` de la siguiente no coincide |
| Se inserta una fila falsa | `previous_hash` no apunta al evento anterior |
| Se reordena la tabla | `previous_hash` deja de seguir la secuencia |

En los cuatro casos, `brokenAt` identifica el `id` exacto de la ruptura.

---

## 7. Resumen de las Secuencias

| Secuencia | Actores externos | Mensajes | Alternativas | Resultado clave |
|-----------|:----------------:|:--------:|:------------:|-----------------|
| 1. Emisión | 1 (usuario) | 12 | 2 | Documento firmado con QR |
| 2. Verificación | 1 (verificador) | 9 | 3 | Veredicto sobre la integridad |
| 3. Versionado | 1 (propietario) | 13 | 4 | Nueva versión correlativa |
| 4. Coautoría | 2 (coautor, propietario) | 20 | 3 | Versión con coautor registrado |
| 5. Auditoría | 2 (servicio, admin) | 14 | 2 | Cadena verificada o punto de ruptura |

---

## 8. Referencias Cruzadas

- [`diagrama_casos_uso.md`](diagrama_casos_uso.md) — Casos de uso
- [`diagrama_actividades.md`](diagrama_actividades.md) — Diagrama de actividades
- [`diagrama_estados.md`](diagrama_estados.md) — Máquina de estados
- [`../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_03.md`](../02_diseno_construccion/procesos_empresa/to_be/proceso_to_be_03.md) — Proceso TO-BE de verificación
