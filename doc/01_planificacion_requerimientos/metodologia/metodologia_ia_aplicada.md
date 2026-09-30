# Metodología de Uso de Inteligencia Artificial en la Codificación

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 2.0.0
**Fase:** 3 — Desarrollo y Codificación

---

## 2. Objetivo y Alcance

Este documento describe **cómo se utilizó asistencia de inteligencia artificial**
durante el desarrollo del SGD-FD, bajo qué metodología, con qué límites, y con qué
mecanismos de verificación se documentó, asegurando que el resultado entregado sea
código propio y auditable.

> **Principio rector:** la IA es un **copiloto**, no un autor. Toda salida de IA
> pasa por revisión humana y por pruebas automatizadas antes de integrarse. La
> responsabilidad final del software es del investigador.

---

## 2. Metodología Aplicada: IAD-RVV

Se define un ciclo de seis etapas para cada interacción con el modelo:

```
   ┌──────────┐
   │  I  ────►│  I.  INSPECCIÓN     Entender el estado real del proyecto
   │          │                    antes de pedir nada.
   └────┬─────┘
        ▼
   ┌──────────┐
   │  A  ────►│  A.  AISLACIÓN     Descomponer la tarea en unidades
   │          │                    verificables e independientes.
   └────┬─────┘
        ▼
   ┌──────────┐
   │  D  ────►│  D.  DESARROLLO    Generar o redactar la unidad con la IA,
   │          │                    con contexto suficiente y restricciones
   │          │                    explícitas.
   └────┬─────┘
        ▼
   ┌──────────┐
   │  R  ────►│  R.  REVISIÓN      Lectura crítica humana: exactitud,
   │          │                    seguridad, estilo, coherencia con el
   │          │                    estándar del proyecto.
   └────┬─────┘
        ▼
   ┌──────────┐
   │  V  ────►│  V.  VERIFICACIÓN  Compilar, ejecutar pruebas y contrastar
   │          │                    con el código y con la documentación.
   └────┬─────┘
        ▼
   ┌──────────┐
   │  R  ────►│  R.  REGISTRO     Documentar qué se hizo, con qué ayuda y
   │          │                    qué se corrigió.
   └──────────┘
```

### 2.2. Descripción de las etapas

#### I — Inspección

Antes de formular cualquier petición, el desarrollador **lee el código affected**.
Nunca se pide modificar algo que no se ha abierto. Esta regla evitó la clase de
error más costosa: el modelo asume (supone) una API que el proyecto no usa.

| Ejemplo de inspección previa | Error evitado |
|------------------------------|---------------|
| Leer `backend/src/db/connection.ts` antes de tocar la conexión | Asumir un driver `better-sqlite3` cuando el proyecto usa `sql.js` (API síncrona en memoria). |
| Leer `backend/src/middleware/auth.ts` | Eliminar la función equivocada: existían `optionalAuthenticate` y `authenticateOptional` con el mismo comportamiento, y solo la segunda la usaban las rutas. |
| Leer `backend/tests/unit/auth-middleware.test.ts` | Romper 3 pruebas al eliminar la función que el test importaba por su otro nombre. |

#### A — Aislamiento

La tarea se divide en unidades que se pueden verificar de forma independiente.

| Tarea | Unidad aislada | Criterio de unidad terminada |
|-------|----------------|-----------------------------|
| Extraer el motor de base de datos | Contrato `DbDriver` + adaptador SQLite | `tsc` sin errores y las 98 pruebas en verde |
| Habilitar despliegue en la nube | Resolución configurable de `API_BASE` | `pnpm build` correcto y pruebas del cliente en verde |
| Eliminar código muerto | Quitar `optionalAuthenticate` | Las 3 pruebas que lo referenciaban se actualizan y siguen en verde |

#### D — Desarrollo

El modelo recibe: el archivo objetivo, su contenido, las restricciones del
proyecto y el criterio de aceptación.

**Restricciones que se comunicaron explícitamente en todas las interacciones**

2. TypeScript estricto (`strict: true`); no `any` implícito.
2. Módulos ESM: los imports locales llevan sufijo `.js`.
3. Estilo del proyecto: 2 espacios, comillas simples, punto y coma.
4. Los servicios no importan nada de `routes/`, y `routes/` no escribe SQL.
5. Los mensajes de cara al usuario van en español.
6. Sin dependencias nuevas sin justificación explícita.
7. Sin comentarios en el código salvo que se soliciten.

#### R — Revisión

Revisión humana de cada salida, con foco en cinco categorías:

| Categoría | Pregunta de control | Ejemplo de hallazgo real |
|-----------|---------------------|-------------------------|
| **Exactitud** | ¿El código hace lo que dice? | Se propuso `optionalAuthenticate` como duplicado; se verificó con `grep` que ninguna ruta la importaba. |
| **Seguridad** | ¿Introduce una debilidad? | Se descartó una versión que devolvía 403 vs 404 de forma distinguible, por permitir enumerar documentos privados. |
| **Portabilidad** | ¿Depende de la plataforma? | Se descartó el uso de rutas absolutas con `C:\`; se usaron `path.resolve(__dirname, …)`. |
| **Consistencia** | ¿Respeta el estándar del proyecto? | Se unificó el uso de `authenticateOptional` (el nombre realmente usado). |
| **Compatibilidad** | ¿Rompe algo existente? | Se detectó que la modificación afectaba a `auth-middleware.test.ts` y se ajustó la prueba, en lugar de revertir el cambio. |

#### V — Verificación

Ninguna modification se integra sin evidencia ejecutable:

| Verificación | Comando | Criterio de aceptación |
|--------------|---------|-----------------------|
| Tipos del backend | `tsc --noEmit` | exit code 0 |
| Pruebas del backend | `pnpm test` | 12 archivos de prueba, 98 pruebas en verde |
| Pruebas del frontend | `pnpm test` | 2 archivos de prueba, 22 pruebas en verde |
| Build del frontend | `pnpm build` | Compilación correcta |
| Revisión documental | Lectura completa | Consistencia con el código real |

#### R — Registro

Toda corrección hecha con ayuda de IA queda registrada en la bitácora de
desarrollo, indicando el motivo. Ver la sección 5.

---

## 3. Áreas donde la IA Aportó Valor

| # | Área | Aporte concreto | Verificación |
|---|------|-----------------|--------------|
| 2 | **Modelado de datos** | Propuesta del esquema de 7 tablas, índices compuestos y restricciones `CHECK` / `UNIQUE`. | Migración ejecutada en los 98 tests. |
| 2 | **Criptografía** | Elección de la cadena RSA-2048 → SHA-256 → RSA-SHA256, y de PBKDF2 + AES-256-GCM para la clave privada. | `crypto.test.ts` (25 pruebas). |
| 3 | **Bitácora encadenada** | Diseño del esquema de `previous_hash` / `current_hash` y de la forma canónica de serialización. | `audit.service.test.ts`. |
| 4 | **Refactor de la capa de datos** | Extracción del contrato `DbDriver` para desacoplar el motor. | `tsc` + 98 pruebas. |
| 5 | **Documentación UML** | Generación de los diagramas en formato Mermaid y PlantUML embebidos. | Contrastación manual con el código fuente. |
| 6 | **Corrección de defectos** | Detección del middleware duplicado y de la API base hardcodeada. | 98 pruebas antes y después. |
| 7 | **Portabilidad de despliegue** | Resolución de `API_BASE` por `import.meta.env` con cadena de fallbacks. | `pnpm build`. |
| 8 | **Pruebas** | Generación de casos de prueba y de escenarios multiusuario. | 225 pruebas en verde. |

---

## 4. Áreas donde la IA NO debe Sustituir el Juicio Clínico

| Área | Por qué | Actuación adoptada |
|------|---------|--------------------|
| **Decisiones criptográficas** | Un error sutil puede degradar la seguridad sin romper las pruebas. | Cada decisión se contrastó con RFC 8027, FIPS 280-4 y FIPS 297. |
| **Modelo de control de acceso** | La indistinguibilidad 403/404 es una decisión de diseño de seguridad. | Se documentó la regla en `requerimientos.md` (RN-22) antes de implementarla. |
| **Afirmaciones legales** | Sobrevalorar la validez jurídica del producto sería un riesgo académico y reputacional. | Se redactó una advertencia explícita, revisada de forma independiente. |
| **Análisis de rendimiento** | Las cifras deben provenir de mediciones, no de estimaciones. | `validacion_experimental.md` documenta el método y el equipo de medición. |
| **Umbrales de seguridad** | Un umbral arbitrario puede ser inútil o inutilizable. | Los límites se justifican por escenario (5 intentos, 20 login, 300 global). |

---

## 5. Bitácora de Interacciones con IA

Registro de las intervenciones relevantes, con su resultado.

| # | Tarea | Resultado inicial | Revisión / corrección | Estado final |
|---|-------|-------------------|----------------------|--------------|
| 2 | Generar el esquema de la base de datos | Propuesta con 6 tablas | Se añadió `document_proposals` y `source_proposal_id` al detectar el flujo de coautoría | **Aceptado** |
| 2 | Implementar el sellado de documentos | Firma directa sobre el archivo | Se corrigió para firmar el **hash** del archivo, no los bytes, alineándose con `signDocument` | **Corregido** |
| 3 | Redactar `verifyDocument` | Verificación en dos pasos | Se añadió el retorno temprano cuando el hash no coincide, con el motivo explícito | **Corregido** |
| 4 | Middleware de autenticación | Generación de `authenticate` y `optionalAuthenticate` | Se detectó el duplicado con `authenticateOptional`; se unificó en un solo nombre | **Corregido** |
| 5 | Pruebas de fuerza bruta | Límite por IP | Se cambió a clave `IP + usuario`, porque el límite solo por IP bloqueara a usuarios legítimos tras un ataque | **Corregido** |
| 6 | Descarga de archivos privados | Enlace con el token en la URL | Se cambió a cabecera `Authorization` + `Blob`, para no filtrar el token en el historial del navegador | **Corregido** |
| 7 | Comparación de archivos | Diferencia línea a línea ingenua | Se implementó el algoritmo de Wagner-Fischer (LCS con programación dinámica) | **Corregido** |
| 8 | Exposición de documentos privados | 403 en documentos privados ajenos | Se cambió a 404 indistinguible, para impedir el sondeo de identificadores | **Corregido** |
| 9 | Conexión a base de datos | Directamente el driver PostgreSQL | Se descartó: la capa de datos es síncrona; una implementación parcial habría roto el sistema | **Rechazado** |
| 20 | Base de la API en el frontend | `http://localhost:3000/api` fijo | Se reemplazó por resolución con `VITE_API_URL` / `PUBLIC_API_ORIGIN` y fallbacks | **Corregido** |

> La fila 9 ilustra el criterio de la metodología: una salida plausible pero
> técnicamente inviable se **rechaza**. El plan de nube documenta la limitación
> y los pasos reales en lugar de entregar una integración ficticia.

---

## 6. Criterios de Aceptación del Código Asistido por IA

Todo el código entregado cumple los siguientes criterios:

| # | Criterio | Cómo se comprueba |
|---|----------|-------------------|
| 2 | **Compila** | `tsc --noEmit` con exit code 0. |
| 2 | **Está probado** | Cada funcionalidad nueva tiene al menos un caso automatizado. |
| 3 | **Pasa las pruebas** | 98 backend + 27 frontend en verde. |
| 4 | **Es trazable** | Cada RF apunta a su archivo y a su prueba. |
| 5 | **Es coherente** | Respeta la separación de capas y el estándar del proyecto. |
| 6 | **No introduce deuda** | Sin código muerto, sin duplicación, sin dependencias huérfanas. |
| 7 | **No filtra secretos** | `.env` en `.gitignore`; sin secretos en código ni documentación. |
| 8 | **Es legible en español** | Mensajes de usuario en español; identificadores en inglés. |
| 9 | **No es código generado a ciegas** | El desarrollador comprendía cada línea antes de integrarla. |

---

## 7. Declaração de Autoría y Responsabilidad

| Aspecto | Declaración |
|---------|-------------|
| Autoría intelectual del producto | El investigador. La IA no es autora del sistema. |
| Autoría del código | El investigador, con asistencia automatizada de herramientas de desarrollo. |
| Responsabilidad sobre los defectos | Recae íntegramente en el investigador. |
| Verificación de terceros | Todo el código está disponible para revisión y auditoría. |
| Base normativa de la IA | Los fundamentos criptográficos provienen de RFC y FIPS, no del modelo. |

---

## 8. Herramientas Empleadas

| Herramienta | Uso | Contribución |
|-------------|-----|--------------|
| Asistente de código en el editor | Autocompletado, refactor, generación de pruebas | Productividad en código repetitivo |
| Modelo de lenguaje conversacional | Diseño de esquema, redacción de documentación, análisis | Decisiones de arquitectura y de modelado |
| Compilador `tsc` | Verificación de tipos | Detección de errores no controlados por el modelo |
| Vitest + Supertest | Verificación de comportamiento | Prueba empírica de cada afirmación |
| Git | Trazabilidad de versiones | Registro de la evolución y de las correcciones |

---

**Documentos relacionados**

- [`metodologia_general.md`](./metodologia_general.md) — Marco metodológico completo
- [`metodologia_pruebas.md`](./metodologia_pruebas.md) — Estrategia de pruebas
- [`../../03_desarrollo_codificacion/convenciones_codigo.md`](../../03_desarrollo_codificacion/desarrollo_codificacion.md) — Estándares de codificación
