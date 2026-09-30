# Enfoque BDD — Desarrollo Dirigido por Comportamiento

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Propósito

Documentar cómo el SGD-FD se especificó **por comportamiento observable** y
cómo los casos de uso, las historias de usuario y las pruebas automatizadas se
relacionan entre sí.

> **Nota de honestidad metodológica:** el proyecto no empleó Gherkin en un
> framework BDD ejecutable como Cucumber o SpecFlow. El comportamiento se
> especificó en lenguaje natural mediante historias de usuario y casos de uso, y
> las pruebas automatizadas se escribieron nombrando explícitamente el
> comportamiento esperado. Este documento describe esa relación con precisión,
> sin atribuir al proyecto herramientas que no utilizó.

---

## 2. ¿Qué Aporta BDD en Este Proyecto?

BDD no se aplicó como una herramienta, sino como un **principio de redacción**:

1. Cada funcionalidad se expresa como un comportamiento observable, no como una
   estructura interna.
2. Cada comportamiento tiene un nombre de prueba que lo repite literalmente.
3. El requerimiento y la prueba se enlazan en la matriz de trazabilidad.

El resultado es que un stakeholder puede leer el nombre de una prueba y
entender exactamente qué se construyó y por qué.

---

## 3. Cadena de Especificación

```
 necessidad del stakeholder
   |
   v
 HISTORIA DE USUARIO      "Como <rol>, quiero <capacidad>, para <beneficio>"
   |  US-001 ... US-033
   v
 CASO DE USO              Escenario principal + escenarios alternativos
   |  CU-001 ... CU-024
   v
 CRITERIO DE ACEPTACION   Given / When / Then en la especificacion
   |
   v
 PRUEBA AUTOMATIZADA      it("<comportamiento observable>")
   |
   v
 MATRIZ DE TRAZABILIDAD   RF/RNF <--> prueba <--> archivo
```

---

## 4. Anatomía de una Historia de Usuario

Cada historia del proyecto sigue la misma estructura:

| Campo | Contenido | Ejemplo (US-012) |
|-------|-----------|------------------|
| Identificador | `US-XXX` | US-012 |
| Rol | Quién la necesita | «Como destinatario externo» |
| Capacidad | Qué quiere hacer | «Quiero verificar la autenticidad de un documento recibido sin pedirle nada a quien me lo envió» |
| Beneficio | Para qué | «Para decidir si puedo confiar en un documento antes de usarlo» |
| Criterios de aceptación | Given / When / Then | Ver tabla siguiente |
| Requerimientos | RF y RNF asociados | RF-023, RNF-002 |

### 4.1. Criterios de aceptación de US-012

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Un documento ha sido emitido y firmado | Escaneo el código QR del documento | Veo el título, la versión vigente y quién lo firmó |
| 2 | Tengo en mis manos una copia del documento | La subo al verificador público | Obtengo «Documento íntegro y vigente» |
| 3 | Alguien ha alterado el contenido del documento | Lo subo al verificador público | Obtengo «El documento ha sido manipulado» |
| 4 | No tengo cuenta en el sistema | Intento verificar | La verificación funciona igual |

El criterio 4 es el que distingue esta historia de un requisito de
autenticación: **no hay inicio de sesión**.

---

## 5. Del Criterio de Aceptación a la Prueba

El criterio de aceptación se traduce en una prueba cuyo nombre enuncia el
comportamiento. Comparación literal:

| Criterio de aceptación (Given / When / Then) | Nombre de la prueba | Archivo |
|----------------------------------------------|----------------------|---------|
| Alguien alteró el contenido, lo subo y debe avisar | `detecta MANIPULATED si el contenido cambió` | `verify.api.test.ts` |
| El archivo es íntegro, lo subo y debe confirmar | `verifica como VALID un archivo íntegro` | `verify.api.test.ts` |
| No conozco el identificador del documento | `localiza coincidencias por hash sin indicar documento` | `verify.api.test.ts` |
| El documento no existe | `reporta NOT_FOUND para documentos desconocidos` | `verify.api.test.ts` |
| Subo un documento sin firma válida | `firma un documento con RSA-SHA256 y devuelve su hash` | `crypto.test.ts` |
| Uso una clave pública que no corresponde | `detecta firma inválida cuando se usa otra clave pública` | `crypto.test.ts` |

**Conclusión:** el nombre de la prueba es la traducción literal del criterio de
aceptación. Un lector no técnico puede verificar el cumplimiento sin leer el
código.

---

## 6. Escenarios de Aceptación (End-to-End)

El archivo `backend/tests/integration/scenarios.test.ts` contiene 5 recorridos
completos que atraviesan varios servicios:

| # | Escenario | Recorrido |
|---|-----------|-----------|
| 1 | Ciclo de vida completo de un documento | Registro → emisión firmada → verificación → nueva versión |
| 2 | Detección de un documento alterado | Emisión → alteración del archivo → verificación `MANIPULATED` |
| 3 | Coautoría: propuesta, aceptación y firma | Propuesta firmada → diferencial → aceptación → versión con coautor |
| 4 | Control de acceso entre usuarios | Un usuario no puede leer ni descargar documentos privados ajenos |
| 5 | Visibilidad pública y verificación anónima | Compartir → verificar sin cuenta → comprobar la bitácora |

Estos escenarios son los que demuestran que las unidades y los servicios
funcionan **junto**, que es la aporte propio de las pruebas de aceptación.

---

## 7. Especificación Ejecutable como Contrato

La ventaja práctica de esta disciplina se+Hace visible en un caso concreto.
Cuando se detectó que `GET /api/verify/:documentId` devuelve siempre
`signature.valid: true` —porque en esa ruta todavía no se ha recibido el
archivo—, la especificación del comportamiento esperado era inequívoca:

> «Cuando el usuario sube un documento, el sistema debe recalcular el hash y
> verificar la firma, y devolver un estado distinto para contenido alterado y
> para firma inválida.»

Las pruebas existentes ya expresaban ese comportamiento, por lo que la
discrepancia entre la especificación y la ruta `GET` quedó visible sin necesidad
de ambigüedad interpretativa. El defecto quedó registrado en
[`../procesos_empresa/to_be/proceso_to_be_03.md`](../procesos_empresa/to_be/proceso_to_be_03.md)
como limitación conocida.

---

## 8. Beneficios del Enfoque

| Beneficio | Descripción |
|-----------|-------------|
| Especificación legible | Los stakeholders leen los nombres de las pruebas |
| Trazabilidad completa | 27 RF, 44 RNF, 24 CU y 33 US enlazados a pruebas concretas |
| Pruebas como criterio de aceptación | «Terminado» significa «la prueba pasa» |
| Detección de ambigüedad | Un criterio no verificable se detecta al escribir la prueba |
| Comunicación técnica | Un mismo nombre sirve al analista, al desarrollador y al auditor |

---

## 9. Limitaciones

| # | Limitación | Mitigación |
|---|------------|------------|
| L-1 | No se usó Gherkin ejecutable | Los criterios Given/When/Then se redactaron en las historias de usuario |
| L-2 | No hay etiquetado automático de requisitos en el código | La trazabilidad se mantiene en la matriz, no mediante anotaciones |
| L-3 | Los casos de uso no cubren todos los caminos alternativos | El repo de escenarios cubre 5 flujos críticos |
| L-4 | No se prohíbe la escritura de pruebas sin especificación | Se acepta como práctica, priorizando la cobertura funcional |

---

## 10. Conclusiones

El SGD-FD se especificó por comportamiento observable y ese comportamiento está
reflejado, nombre a nombre, en las 120 pruebas automatizadas. Aunque no se
empleó una herramienta BDD ejecutable, el principio se aplicó de forma
consistente: **toda funcionalidad descrita tiene una prueba que enuncia lo que
el usuario puede observar**.

---

## 11. Referencias Cruzadas

- [`enfoque_tdd.md`](enfoque_tdd.md) — Enfoque TDD
- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`../../01_planificacion_requerimientos/analisis_requerimientos/historias_usuario.md`](../../01_planificacion_requerimientos/requerimientos/historias_usuario.md) — Historias de usuario
- [`../../01_planificacion_requerimientos/analisis_requerimientos/casos_de_uso.md`](../../01_planificacion_requerimientos/requerimientos/casos_uso.md) — Casos de uso
- [`matriz_trazabilidad.md`](matriz_trazabilidad.md) — Trazabilidad
