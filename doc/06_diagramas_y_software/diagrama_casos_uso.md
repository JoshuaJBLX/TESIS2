# Diagramas de Casos de Uso — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Tipo:** Diagrama de casos de uso (UML 2.5)
**Notación:** PlantUML
**Total de casos de uso:** 24 (CU-001 a CU-024)

---

## 1. Propósito

Representar las funcionalidades del SGD-FD desde la perspectiva de los actores:
quién puede hacer qué y bajo qué condiciones.

Los 24 casos de uso se distribuyen en cuatro diagramas, agrupados por actor
principal. La especificación completa de cada caso está en
[`casos_uso.md`](../01_planificacion_requerimientos/requerimientos/casos_uso.md).

---

## 2. Actores del Sistema

| Actor | Descripción | Autenticación |
|-------|-------------|---------------|
| **Visitante** | Consulta documentos y perfiles públicos | Ninguna |
| **Verificador externo** | Comprueba la integridad de un documento recibido | Ninguna |
| **Usuario** | Registra la cuenta, emite documentos y propone cambios | JWT |
| **Administrador** | Supervisor, consulta la bitácora y verifica la cadena | JWT con rol `admin` |
| **Proceso de migración** | Ejecuta el esquema de base de datos al arrancar | — |

---

## 3. Diagrama 1 · Visitante y verificación pública

```plantuml
@startuml casos_uso_visitante
skinparam shadowing false

left to right direction
actor Visitante as V
actor "Verificador externo" as VE

rectangle "SGD-FD" {
  usecase "Consultar documento publico" as CU11
  usecase "Consultar perfil publico" as CU04
  usecase "Verificar documento subido" as CU18
  usecase "Buscar documento por contenido" as CU19
  usecase "Verificar por URL o codigo QR" as CU20
  usecase "Comparar versiones o propuestas" as CU17
}

V --> CU11
V --> CU04
VE --> CU18
VE --> CU19
VE --> CU20
V --> CU17

note bottom of CU20
  Sin cuenta de usuario.
  Lee el QR y ejecuta la
  verificacion completa
end note

note bottom of CU18
  Compara el hash recibido
  con el registrado y valida
  la firma con la clave publica
end note

@enduml
```

| Caso | Descripción | Actor |
|:----:|-------------|-------|
| CU-004 | Consultar el perfil público de un usuario | Visitante |
| CU-011 | Consultar un documento público | Visitante |
| CU-017 | Comparar versiones o propuestas | Visitante |
| CU-018 | Verificar un documento subido | Verificador externo |
| CU-019 | Buscar un documento por su contenido | Verificador externo |
| CU-020 | Verificar por URL o código QR | Verificador externo |

**Característica común:** ninguno requiere cuenta. Es el cambio funcional más
relevante respecto del proceso AS-IS, donde la verificación exigía contactar con
quien emitió el documento.

---

## 4. Diagrama 2 · Identidad y sesión

```plantuml
@startuml casos_uso_identidad
skinparam shadowing false

left to right direction
actor Usuario as U

rectangle "SGD-FD" {
  usecase "Registrarse" as CU01
  usecase "Iniciar sesion" as CU02
  usecase "Renovar la sesion" as CU03
}

U --> CU01
U --> CU02
U --> CU03

CU03 ..> CU02 : "<<extend>>\nsi el token expiro"

note bottom of CU01
  Genera el par RSA-2048,
  cifra la clave privada con
  AES-256-GCM y registra
  la huella publica
end note

note bottom of CU02
  Valida bcrypt, emite el
  token JWT y aplica el
  limite de intentos
end note

@enduml
```

| Caso | Descripción | Actor |
|:----:|-------------|-------|
| CU-001 | Registrarse | Usuario |
| CU-002 | Iniciar sesión | Usuario |
| CU-003 | Renovar la sesión | Usuario |

---

## 5. Diagrama 3 · Emisión, versionado y coautoría

```plantuml
@startuml casos_uso_emision
skinparam shadowing false

left to right direction
actor Usuario as U

rectangle "SGD-FD" {
  usecase "Subir y firmar un documento" as CU05
  usecase "Actualizar con nueva version" as CU06
  usecase "Consultar detalle de documento" as CU07
  usecase "Consultar historial de versiones" as CU08
  usecase "Obtener codigo QR" as CU09
  usecase "Compartir un documento" as CU10
  usecase "Descargar archivo de una version" as CU12
  usecase "Crear propuesta de cambio" as CU13
  usecase "Revisar propuestas recibidas" as CU14
  usecase "Aceptar una propuesta" as CU15
  usecase "Rechazar una propuesta" as CU16
}

U --> CU05
U --> CU06
U --> CU07
U --> CU08
U --> CU09
U --> CU10
U --> CU12
U --> CU13
U --> CU14
U --> CU15
U --> CU16

note bottom of CU05
  Exige la contrasena para
  firmar y crea la version 1
end note

note bottom of CU15
  Solo en documentos publicos.
  Genera la nueva version
  firmada y registra al coautor
end note

note bottom of CU10
  Cambia la visibilidad sin
  crear una nueva version
end note

@enduml
```

| Caso | Descripción | Actor |
|:----:|-------------|-------|
| CU-005 | Subir y firmar un documento | Usuario propietario |
| CU-006 | Actualizar un documento con una nueva versión | Usuario propietario |
| CU-007 | Consultar el detalle de un documento | Usuario autenticado |
| CU-008 | Consultar el historial de versiones | Usuario autenticado |
| CU-009 | Obtener el código QR de verificación | Usuario propietario |
| CU-010 | Compartir un documento | Usuario propietario |
| CU-012 | Descargar el archivo de una versión | Según visibilidad |
| CU-013 | Crear una propuesta de cambio | Usuario coautor |
| CU-014 | Revisar las propuestas recibidas | Usuario propietario |
| CU-015 | Aceptar una propuesta | Usuario propietario |
| CU-016 | Rechazar una propuesta | Usuario propietario |

---

## 6. Diagrama 4 · Administración y sistema

```plantuml
@startuml casos_uso_admin
skinparam shadowing false

left to right direction
actor Administrador as A
actor "Proceso de migracion" as MIG

rectangle "SGD-FD" {
  usecase "Consultar bitacora de auditoria" as CU21
  usecase "Verificar integridad de la cadena" as CU22
  usecase "Verificar cadena de un archivo" as CU23
  usecase "Aplicar migracion de esquema" as CU24
}

A --> CU21
A --> CU22
A --> CU23
MIG --> CU24

note bottom of CU21
  Eventos en orden descendente
  con sus hashes de encadenamiento
end note

note bottom of CU22
  Recorre la bitacora en orden e
  informa el id exacto de
  cualquier ruptura
end note

note bottom of CU23
  Se ejecuta al cargar cada
  archivo y compara el hash
  calculado con el registrado
end note

@enduml
```

| Caso | Descripción | Actor |
|:----:|-------------|-------|
| CU-021 | Consultar la bitácora de auditoría | Administrador |
| CU-022 | Verificar la integridad de la cadena de auditoría | Administrador |
| CU-023 | Verificar la cadena de integridad de un archivo (automático) | Automático |
| CU-024 | Aplicar la migración de esquema (automático) | Automático |

---

## 7. Relaciones entre Casos de Uso

| Tipo | Relación | Casos |
|------|----------|-------|
| `<<extend>>` | Se ejecuta si el token expiró | CU-003 → CU-002 |
| `<<extend>>` | Se ejecuta al compartir | CU-010 → CU-009 |
| `<<extend>>` | Se ejecuta al aceptar | CU-015 → CU-005 |
| `<<include>>` | Siempre se ejecuta | CU-018 → CU-020 |
| Generalización | Comportamiento común de descarga | CU-012 cubre público y privado |
| Generalización | Comportamiento común de resolución | CU-015 y CU-016 comparten validación de propietario |

---

## 8. Restricciones de Acceso

| Caso de uso | Sin sesión | Con sesión | Solo propietario | Solo admin |
|-------------|:---------:|:----------:|:----------------:|:----------:|
| CU-004, CU-011, CU-017 | Sí | Sí | — | — |
| CU-018, CU-019, CU-020 | Sí | Sí | — | — |
| CU-001, CU-002 | Sí | — | — | — |
| CU-003 | — | Sí | — | — |
| CU-005, CU-006, CU-009, CU-010 | — | Sí | Sí | — |
| CU-007, CU-008, CU-012 | — | Sí | Según visibilidad | — |
| CU-013 | — | Sí | — | — |
| CU-014, CU-015, CU-016 | — | Sí | Sí | — |
| CU-021, CU-022, CU-023 | — | — | — | Sí |
| CU-024 | — | — | — | Automático |

**Observación:** CU-012 (descargar) tiene un comportamiento dual: es público
cuando el documento está compartido y exige autenticación y autorización cuando
es privado.

---

## 9. Cobertura de los Actores

| Actor | Casos de uso asignados | Total |
|-------|------------------------|:-----:|
| Visitante | CU-004, CU-011, CU-017 | 3 |
| Verificador externo | CU-018, CU-019, CU-020 | 3 |
| Usuario | CU-001 a CU-016, CU-012 | 16 |
| Administrador | CU-021, CU-022, CU-023 | 3 |
| Proceso de migración | CU-024 | 1 |

*Un caso puede atender a más de un actor; por eso la suma supera 24.*

---

## 10. Referencias Cruzadas

- [`casos_uso.md`](../01_planificacion_requerimientos/requerimientos/casos_uso.md) — Especificación de los 24 casos de uso
- [`historias_usuario.md`](../01_planificacion_requerimientos/requerimientos/historias_usuario.md) — Historias de usuario
- [`diagrama_secuencia.md`](diagrama_secuencia.md) — Diagrama de secuencia
- [`diagrama_actividades.md`](diagrama_actividades.md) — Diagrama de actividades
- [`diagrama_estados.md`](diagrama_estados.md) — Máquinas de estado
