# Enfoque TDD — Desarrollo Dirigido por Pruebas

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Propósito

Documentar cómo se aplicó el Desarrollo Dirigido por Pruebas (TDD) en el
SGD-FD, qué significa aquí en términos verificables y qué evidencia existe en
el repositorio.

> **Nota de honestidad metodológica:** el proyecto se desarrolló con pruebas
> escritas junto a cada funcionalidad, no mediante un ciclo estricto
> rojo-verde-refactor por cada método. Este documento describe el enfoque
> efectivamente aplicado y en qué se aproxima o se aparta del TDD clásico.

---

## 2. Definición y Aplicabilidad

| Aspecto | TDD clásico | Aplicación en el SGD-FD |
|---------|-------------|-------------------------|
| Secuencia | Prueba roja → verde → refactor | Prueba y código realizados en paralelo |
| Unidad de prueba | Método o función | Endpoint, servicio, función criptográfica |
| Cobertura de la prueba | Una prueba por regla | Una prueba por regla de negocio y por error esperado |
| Automatización | Automática | 100 % automatizada con Vitest |
| Prueba primero | Obligatoria | Parcial: primero se fijó la especificación (RF/RNF/CU) |
| Refactor | Obligatorio en cada ciclo | Aplicado al descubrir duplicación |

La diferencia esencial no está en tener pruebas, sino en **qué se usa como
fuente de verdad**. En este proyecto la fuente de verdad previa es la
especificación: cada prueba se puede rastrear hasta un requerimiento funcional
o no funcional concreto.

---

## 3. Ciclo Aplicado

```
 Requerimiento (RF-XXX / RNF-XXX)
   |
   v
 Especificacion del caso de prueba
   |  Nombre, entrada, resultado esperado, motivo
   v
 Implementacion (ruta -> servicio -> base de datos)
   |
   v
 Prueba automatizada
   |
   v
 (La prueba falla?) --> Se corrige la implementacion
   |                          |
   v                          v
 (La prueba pasa?) --> Refactor --> Volver a ejecutar
   |
   v
 Matriz de trazabilidad actualizada
```

### 3.1. Capas de la pirámide de pruebas

| Capa | Ubicación | Alcance | Archivos | Pruebas |
|------|-----------|---------|:--------:|:-------:|
| Unitarias | `backend/tests/unit/` | Funciones puras: criptografía, análisis de documentos, middleware, límite de intentos | 4 | 37 |
| De servicios | `backend/tests/services/` | Lógica de negocio contra la base de datos real en memoria | 3 | 23 |
| De API | `backend/tests/integration/` | Rutas HTTP completas con Supertest | 4 | 33 |
| De aceptación | `backend/tests/integration/scenarios.test.ts` | Recorridos de usuario de principio a fin | 1 | 5 |
| De cliente | `frontend/src/lib/api.test.ts` | Resolución de URL de API y manejo de respuestas | 1 | 15 |
| De estado | `frontend/src/lib/stores/auth.test.ts` | Estado de autenticación del cliente | 1 | 7 |

| Total | | | **14** | **120** |

**Backend: 98** (37 + 23 + 33 + 5) · **Frontend: 22** (15 + 7).

---

## 4. Convención de Nombres de Pruebas

Se utiliza el patrón `describe` / `it` en español, describiendo el
comportamiento esperado como una afirmación:

```ts
describe('API /api/verify', () => {
  it('verifica como VALID un archivo íntegro', async () => { ... });
  it('detecta MANIPULATED si el contenido cambió', async () => { ... });
});
```

La prueba de integración es la que mejor refleja el estilo de la especificación:
el nombre de la prueba es, en la práctica, un criterio de aceptación
verificable.

---

## 5. Ejemplo Completo: Detección de Manipulación

### 5.1. Requerimiento

- **RF-022**: el sistema debe detectar documentos falsos o alterados mediante
  comparación de hash.
- **RNF-001**: la integridad debe comprobarse criptográficamente.

### 5.2. Prueba

```ts
it('detecta MANIPULATED si el contenido cambió', async () => {
  // 1. Se emite y firma un documento real
  const creado = await request(app)
    .post('/api/docs')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Contrato')
    .field('password', PASSWORD)
    .attach('file', crearArchivo('contrato.txt', 'Contenido original'));

  const { documentId } = creado.body.data;

  // 2. Se altera el contenido del mismo archivo
  const archivoAlterado = crearArchivo('contrato.txt', 'Contenido manipulado');

  // 3. Se verifica el archivo alterado
  const respuesta = await request(app)
    .post('/api/verify')
    .field('documentId', documentId)
    .attach('file', archivoAlterado);

  // 4. Se espera la detección de manipulación
  expect(respuesta.status).toBe(200);
  expect(respuesta.body.data.status).toBe('MANIPULATED');
  expect(respuesta.body.data.verification.hashMatch).toBe(false);
});
```

### 5.3. Qué aporta esta prueba

| Aspecto | Valor |
|---------|-------|
| Detecta la regresión | Si alguien cambia el algoritmo de hash, la prueba falla |
| Verifica el contrato público | El estado `MANIPULATED` es parte de la API pública |
| Cubre el camino de error | No solo el caso feliz |
| Es ejecutable | `pnpm test` en el backend |

---

## 6. Pruebas de la Capa Criptográfica

La criptografía es el núcleo del sistema, por lo que sus pruebas son las más
estrictas.

| Prueba | Qué garantiza |
|--------|---------------|
| *genera un par RSA-2048 con fingerprint SHA-256 formateado* | Que la huella tiene el formato esperado |
| *genera pares distintos en cada llamada* | Que no se reutiliza una clave |
| *cifra y descifra la clave privada con la misma contraseña* | Round-trip del cifrado de la clave |
| *lanza error si la contraseña es incorrecta (auth GCM)* | Que AES-GCM detecta contraseñas erradas |
| *usa salts aleatorias: dos cifrados del mismo texto difieren* | Que el cifrado no es determinista |
| *calcula un hash SHA-256 de 64 caracteres hex* | Longitud y alfabeto del hash |
| *es sensible a cambios mínimos de contenido* | Que el hash no tiene colisiones triviales |
| *firma un documento con RSA-SHA256 y devuelve su hash* | Firma real |
| *detecta firma inválida cuando se usa otra clave pública* | Que la verificación no es decorativa |

La prueba de **salts aleatorias** es especialmente relevante: sin ella, dos
cifrados del mismo texto producirían el mismo resultado, lo que revelaría
información sobre la clave privada.

---

## 7. Cobertura por Requerimiento

| Grupo de requisitos | Pruebas que los respaldan |
|---------------------|--------------------------|
| RF-001 … RF-004 (identidad) | `auth.api`, `auth.service`, `auth-middleware` |
| RF-005 … RF-010 (emisión y firma) | `documents.api`, `document.service`, `crypto` |
| RF-011 … RF-014 (visibilidad) | `documents.api`, `document.service` |
| RF-015 … RF-020 (coautoría) | `documents.api`, `document.service`, `document-analysis` |
| RF-021 … RF-023 (verificación) | `verify.api`, `crypto` |
| RF-024, RF-025 (auditoría) | `audit.api`, `audit.service` |
| RF-026, RF-027 (seguridad) | `rate-limit`, `auth-middleware` |
| RNF-001 … RNF-044 (no funcionales) | `matriz_trazabilidad.md` |

La correspondencia exhaustiva está en
[`matriz_trazabilidad.md`](matriz_trazabilidad.md).

---

## 8. Ejecución

### 8.1. Comandos

```bash
# Backend
cd backend
pnpm test              # toda la suite
pnpm test:unit         # solo unitarias
pnpm test:integration  # solo API y escenarios

# Frontend
cd frontend
pnpm test              # api.test.ts + componentes
```

### 8.2. Estado Actual

| Suite | Pruebas | Resultado |
|-------|:-------:|:---------:|
| Backend — unitarias (`unit/`) | 37 | ✔ Todas pasan |
| Backend — servicios (`services/`) | 23 | ✔ Todas pasan |
| Backend — API (`integration/`, sin escenarios) | 33 | ✔ Todas pasan |
| Backend — aceptación (`scenarios.test.ts`) | 5 | ✔ Todas pasan |
| Frontend — cliente de API | 15 | ✔ Todas pasan |
| Frontend — estado de autenticación | 7 | ✔ Todas pasan |
| **Total** | **120** | **✔ 120/120** |

| Suite | Archivo | Pruebas |
|-------|---------|:-------:|
| Unitarias | `unit/crypto.test.ts` | 12 |
| Unitarias | `unit/auth-middleware.test.ts` | 9 |
| Unitarias | `unit/document-analysis.test.ts` | 9 |
| Unitarias | `unit/rate-limit.test.ts` | 7 |
| Servicios | `services/document.service.test.ts` | 11 |
| Servicios | `services/auth.service.test.ts` | 7 |
| Servicios | `services/audit.service.test.ts` | 5 |
| API | `integration/documents.api.test.ts` | 13 |
| API | `integration/auth.api.test.ts` | 10 |
| API | `integration/verify.api.test.ts` | 6 |
| API | `integration/audit.api.test.ts` | 4 |
| Aceptación | `integration/scenarios.test.ts` | 5 |
| Frontend | `frontend/src/lib/api.test.ts` | 15 |
| Frontend | `frontend/src/lib/stores/auth.test.ts` | 7 |

### 8.3. Verificación de tipos

```bash
cd backend && npx tsc --noEmit   # 0 errores
```

La verificación de tipos es parte del criterio de aceptación: una prueba puede
pasar y aun así el código no ser válido para el compilador.

---

## 9. Beneficios Observados

| Beneficio | Evidencia |
|-----------|-----------|
| Detección temprana de errores | Los errores de autenticación y de validación se detectaron al escribir las pruebas de la API |
| Documentación viva | Los nombres de las pruebas describen el comportamiento esperado |
| Refactor seguro | La eliminación del middleware duplicado no rompió ninguna prueba |
| Base para la corrección de la API | La suite permitió detectar que `GET /api/verify/:id` devuelve `valid: true` sin comprobar la firma |
| Regresión protegida | La resolución de `resolveApiBase()` está cubierta por 5 pruebas dedicadas |

---

## 10. Limitaciones

| # | Limitación | Mitigación |
|---|------------|------------|
| L-1 | No se siguió el ciclo rojo-verde-refactor estricto | Cada funcionalidad se probó antes de declararse terminada |
| L-2 | No hay cobertura automatizada de la interfaz de usuario completa | 7 pruebas del estado de autenticación cubren la lógica del cliente, no el renderizado de todos los componentes |
| L-3 | No se midió el porcentaje de cobertura de líneas | Se prefirió la cobertura funcional por escenario sobre el porcentaje bruto |
| L-4 | No hay pruebas de carga ni de rendimiento | Fuera del alcance de la validación funcional |
| L-5 | No hay prueba de integración con un navegador real | El flujo del QR se valida a nivel de endpoint |

---

## 11. Conclusiones

El SGD-FD cuenta con **120 pruebas automatizadas que pasan en su totalidad**,
cada una vinculada a un requerimiento verificable. La disciplina de pruebas se
aplicó como criterio de aceptación de cada funcionalidad, más que como ciclo
de desarrollo iterativo estricto.

El resultado más relevante no es el número de pruebas, sino que cada una
responde a una pregunta que el stakeholder puede formular: «¿esto funciona
como dijimos que funcionaba?».

---

## 12. Referencias Cruzadas

- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`matriz_pruebas.md`](matriz_pruebas.md) — Catálogo de pruebas
- [`matriz_trazabilidad.md`](matriz_trazabilidad.md) — Trazabilidad con los requisitos
- [`enfoque_bdd.md`](enfoque_bdd.md) — Enfoque BDD
- [`../arquitectura/arquitectura.md`](../arquitectura/arquitectura.md) — Arquitectura
