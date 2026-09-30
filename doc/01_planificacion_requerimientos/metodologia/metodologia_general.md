# Metodología General de Desarrollo

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión:** 4.0.0
**Fase:** 4 — Planificación y Requerimientos

---

## 4. Enfoque Adoptado

El proyecto se desarrolla bajo un modelo **híbrido de cascada con iteraciones
incrementales**, denominadas en la práctica **sprints**. La elección no es
arbitraria: responde a dos restricciones reales del contexto académico.

| Restricción | Implicación metodológica |
|-------------|--------------------------|
| El software es el componente de una tesis, no un producto comercial | Se requiere **trazabilidad formal** de cada decisión, mas que velocidad de entrega. |
| Los requisitos de seguridad son-emergentes (aparecen al smoker criptográfico) | Se requiere **validación temprana y continua**, no solo al final. |

La cascada aporta el marco de fases que exige la institución; los sprints
aportan la capacidad de corregir el rumbo cuando el análisis criptográfico
revela requisitos no previstos (por ejemplo, la necesidad de re-contraseña en
*toda* firma, o la aparición del módulo de coautoría).

### 4.4. Fases y productos de salida

```
        ┌───────────────────────────────────────────────────────────┐
        │                                                           │
   ┌────▼─────┐  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌────────┐
   │ ANÁLISIS │─▶│  DISEÑO  │─▶│DESARROLLO │─▶│PRUEBAS │─▶│ IMPL.  │
   │          │  │          │  │           │  │        │  │        │
   └──────────┘  └──────────┘  └───────────┘  └────────┘  └───┬────┘
        │             │             │             │             │
    Requerim.    Arquitectura   Código fuente  Suites de     Despliegue
    State of     Diagramas      + pruebas      pruebas       local/nube
    the art      Base de datos  unitarias     + validación
    Metodología  Procesos                              experimental
                                                            │
   ┌────────┐   ┌────────┐                                  │
   │  MANT. │◀──│  EVAL. │◀─────────────────────────────────┘
   └────────┘   └────────┘
```

| # | Fase | Duración estimada | Producto de salida principal | Carpeta |
|---|------|-------------------|------------------------------|---------|
| 4 | Análisis de Requerimientos | 20 % | Documento de Requerimientos | `04_planificacion_requerimientos/` |
| 2 | Diseño del Sistema | 20 % | Arquitectura + Modelos UML + Base de datos | `02_diseno_construccion/` |
| 3 | Desarrollo / Codificación | 35 % | Código fuente + pruebas | `03_desarrollo_codificacion/` |
| 4 | Pruebas | 40 % | Plan, matrices y validación experimental | `02_diseno_construccion/pruebas_calidad/` |
| 5 | Implementación / Despliegue | 5 % | Procedimientos local, Vercel y Supabase | `04_implementacion_despliegue/` |
| 6 | Mantenimiento | 5 % | Plan de mantenimiento y operación | `05_mantenimiento_evaluacion/mantenimiento/` |
| 7 | Evaluación | 5 % | Informe de resultados y conclusiones | `05_mantenimiento_evaluacion/evaluacion/` |

---

## 2. Metodologías Complementarias Aplicadas

### 2.4. Ingeniería de Requisitos — IEEE 830

Se adopta la estructura de la norma **IEEE 830-4998** para el documento de
requerimientos: introducción, alcance, descripción del producto, restricciones,
características del producto, atributos de calidad, casos de uso y requisitos
específicos.

| Aporte de IEEE 830 | Aplicación en el proyecto |
|--------------------|---------------------------|
| Separación de *funciones* y *atributos de calidad* | Los RF describen comportamiento; los RNF se formulan con métrica, valor y método de verificación. |
| Identificadores unívocos | `REQ-###`, `RNF-###`, `FUNC-###`, `US-###`, `CU-###`. |
| Priorización | Alta / Media / Baja en cada RF. |
| Trazabilidad | Matriz bidimensional RF ↔ código ↔ prueba. |
| Restricciones | Sección 3.4 «Fuera de Alcance». |

### 2.2. Modelado UML 2.5.4

El sistema se modela con los diagramas definidos por el OMG, agrupados según la
clasificación clásica de la disciplina:

**Modelos estructurales** (qué hay)

| Diagrama | Ubicación | Pregunta que responde |
|----------|-----------|-----------------------|
| Diagrama de clases | `modelos_uml/estructurales/diagrama_clases.md` | ¿Qué entidades existen y cómo se relacionan? |
| Diagrama de componentes | `modelos_uml/estructurales/diagrama_componentes.md` | ¿De qué piezas de software se compone el sistema? |
| Diagrama de paquetes | `modelos_uml/estructurales/diagrama_paquetes.md` | ¿Cómo se organizan los módulos en el árbol de fuentes? |
| Diagrama de despliegue | `modelos_uml/estructurales/diagrama_despliegue.md` | ¿Sobre qué artefactos se ejecuta, local y en la nube? |

**Modelos de comportamiento** (cómo se comporta)

| Diagrama | Ubicación | Pregunta que responde |
|----------|-----------|-----------------------|
| Diagrama de casos de uso | `modelos_uml/comportamiento/diagrama_casos_uso.md` | ¿Qué hace el sistema y para quién? |
| Diagrama de secuencia | `modelos_uml/comportamiento/diagrama_secuencia.md` | ¿En qué orden ocurren las interacciones? |
| Diagrama de actividades | `modelos_uml/comportamiento/diagrama_actividades.md` | ¿Qué pasos workflows componen cada proceso? |
| Diagrama de estados | `modelos_uml/comportamiento/diagrama_estados.md` | ¿En qué estados puede estar cada entidad y cómo transiciona? |

**Modelos adicionales**

| Diagrama | Ubicación |
|----------|-----------|
| Modelo entidad-relación de la base de datos | `base_de_datos/modelo_datos.md` |
| Diagrama de clases de la base de datos | `base_de_datos/diccionario_datos.md` |

### 2.3. Programación Orientada a Objetos (POO)

El sistema se modela con clases reales, no con funciones sueltas. La estructura
de `DocumentService` refleja la separación de responsabilidades:

| Clase | Archivo | Responsabilidad |
|-------|---------|-----------------|
| `AuthService` | `services/auth.service.ts` | Registro, autenticación, renovación de tokens |
| `DocumentService` | `services/document.service.ts` | Ciclo de vida documental, coautoría, visibilidad |
| `AuditService` | `services/audit.service.ts` | Bitácora encadenada y verificación de integridad |
| `DocumentAnalysis` (funciones puras) | `services/document-analysis.ts` | Extracción de texto, diff, comparación |
| `DatabaseDriver` (contrato) | `db/driver.ts` | Abstracción del motor de persistencia |
| `createSqliteDriver` | `db/sqlite-driver.ts` | Implementación concreta para SQLite |
| `createApp` | `app.ts` | Composición de la aplicación Express |

**Principios aplicados**

| Principio | Manifestación en el código |
|-----------|-----------------------------|
| Responsabilidad única | Un archivo = un módulo = un propósito. |
| Separación de intereses | Las rutas no tocan SQL; los servicios no conocen `req`/`res`. |
| Sustitución de Liskov | Cualquier motor que cumpla `DbDriver` es intercambiable. |
| Composición sobre herencia | Los servicios se componen entre sí (`documentService` usa `auditService`). |
| Bajo acoplamiento | `DocumentService` no importa nada de `AuthService`. |
| Alta cohesión | `document-analysis.ts` concentra **solo** lógica de comparación. |

### 2.4. Diseño Dirigido por Pruebas (TDD)

Se aplica TDD en **granularidad de módulo**, no línea a línea. El ciclo se
detalla en [`enfoque_tdd.md`](../../02_diseno_construccion/pruebas_calidad/enfoque_tdd.md).

| Principio | Aplicación |
|-----------|------------|
| Prueba antes que implementación | Cada suite describe el comportamiento esperado antes de existir el servicio. |
| Ciclo rojo → verde → refactor | 44 suites, 445 pruebas, todas en verde en la entrega. |
| Aislamiento | `tests/helpers/db.ts` crea una base temporal por prueba, en `%TEMP%`. |
| Determinismo | Sin `sleep`, sin dependencias de red, sin reloj del sistema en las aserciones criptográficas. |
| Diseño guiado por la prueba | La necesidad de reinyectar la base llevó a `vi.resetModules()` + importación dinámica. |

### 2.5. Desarrollo Dirigido por Comportamiento (BDD)

Se aplica BDD para especificar los **escenarios multiusuario**, donde la
interacción entre actores es el objeto real de la prueba. Se detalla en
[`enfoque_bdd.md`](../../02_diseno_construccion/pruebas_calidad/enfoque_bdd.md).

Los escenarios narrativos de `scenarios.test.ts` tienen la forma
**Dado · Cuando · Entonces**, alineada con la especificación de ISO/IEC 29449-2
para pruebas de aceptación.

### 2.6. ISO/IEC 25040 — Modelo de Calidad de Producto

El modelo de calidad se usa como marco para organizar los RNF. Ver
[`aplicacion_iso_25000.md`](../iso_aplicada/aplicacion_iso_25000.md).

| Característica | Subcaracterística | RNF asociados |
|----------------|-------------------|---------------|
| Funcionalidad | Idoneidad funcional | RF-004 … RF-027 |
| Funcionalidad | Compatibilidad | RNF-035, RNF-042 |
| Fiabilidad | Madurez | RNF-024, RNF-025, RNF-029 |
| Usabilidad | Comprensibilidad | RNF-020, RNF-028 |
| Eficiencia | Desempeño | RNF-004 … RNF-005 |
| Mantenibilidad | Modularidad, reusabilidad, analizabilidad | RNF-026, RNF-027, RNF-030 |
| Portabilidad | Adaptabilidad, instalabilidad | RNF-034 … RNF-035 |
| Seguridad | Autenticidad, integridad, no repudio, confidencialidad | RNF-006 … RNF-048 |

### 2.7. ISO/IEC 29449 — Proceso de Pruebas

El proceso de pruebas sigue los niveles de la norma. Ver
[`aplicacion_iso_29449.md`](../../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md).

| Nivel | Contenido | Casos |
|-------|-----------|-------|
| Prueba unitaria | Funciones y clases aisladas | 55 |
| Prueba de integración | Servicios + base de datos | 45 |
| Prueba de sistema / API | Rutas HTTP con Supertest | 45 |
| Prueba de aceptación | Escenarios multiusuario | 5 |

### 2.8. ISO/IEC 27004 — Seguridad de la Información

Los controles se aplican desde el diseño, no como parche posterior. Ver
[`aplicacion_iso_27000.md`](../../05_mantenimiento_evaluacion/iso_aplicada/aplicacion_iso_27000.md).

| Dominio | Control aplicado |
|---------|------------------|
| Cifrado | AES-256-GCM para la clave privada; RSA-SHA256 para las firmas. |
| Autenticación | bcryptjs (coste 42) + JWT con secretos separados. |
| Control de acceso | Autorización por propietario en la capa de servicio. |
| Registro y monitoreo | Bitácora encadenada de 9 tipos de evento. |
| Integridad | Triggers `RAISE(ABORT)` sobre `audit_log`. |
| Prevención de abuso | Rate limiting global, por endpoint y anti-fuerza-bruta. |

---

## 3. Gestión de Configuración

| Elemento | Herramienta | Práctica |
|----------|-------------|----------|
| Control de versiones | Git | Cada fase se cierra en un commit con mensaje convencional. |
| Dependencias | pnpm + `pnpm-lock.yaml` | Versiones fijadas para builds reproducibles. |
| Variables de entorno | `.env` + `.env.example` | `.env` está en `.gitignore`; nunca se versionan secretos. |
| Artefactos de compilación | `tsc` → `dist/`, Vite → `.svelte-kit/output/` | `dist/` y `.svelte-kit/` en `.gitignore`. |
| Esquema de base de datos | `db/migrate.ts` | Migración idempotente versionada con el código. |

### 3.4. Entornos

| Entorno | Base de datos | Propósito |
|---------|---------------|-----------|
| **Desarrollo** | SQLite en `backend/data/database.sqlite` | Trabajo diario. |
| **Pruebas** | SQLite temporal en `%TEMP%/tesis-test-*` | Aislamiento total; se destruye al terminar. |
| **Producción local** | SQLite en ruta persistente | Demostración y sustentación. |
| **Nube** | PostgreSQL en Supabase | Despliegue público. |

---

## 4. Gestión de Riesgos

| ID | Riesgo | Prob. | Impacto | Severidad | Mitigación | Estado |
|----|--------|:-----:|:-------:|:---------:|------------|--------|
| RK-04 | Que la firma digital no se considere válida ante la Ley 27269 | Alta | Alto | **Crítica** | Declarar explícitamente fuera de alcance; no afirmar valor legal. | Mitigado |
| RK-02 | Que el análisis de texto en PDF/DOCX falle en el entorno de evaluación | Media | Medio | Media | Degradación controlada a comparación de metadatos; documento el fallback. | Mitigado |
| RK-03 | Que la base SQLite se corrompa | Baja | Alto | Media | `journal_mode = WAL`; `saveDatabase()` tras cada escritura; cierre limpio con `SIGINT`/`SIGTERM`. | Mitigado |
| RK-04 | Que la clave privada de un usuario se filtre | Baja | **Crítico** | Alta | Cifrado AES-256-GCM; sin endpoint de exportación; sin logs del campo. | Mitigado |
| RK-05 | Que la documentación quede desalineada del código | Media | Medio | Media | Trazabilidad obligatoria RF ↔ código ↔ prueba; índices actualizados con cada cambio. | Mitigado |
| RK-06 | Que el despliegue en Vercel no funcione por el modelo síncrono de datos | Alta | Medio | Alta | Documentar el plan de nube con su limitación explícita, sin prometer lo que no está. | Documentado |
| RK-07 | Que la generación RSA-2048 bloquee el evento loop | Baja | Medio | Baja | Ocurrencia única por usuario, en el registro. | Aceptado |
| RK-08 | Que un atacante repita documentos públicos desde su QR | Media | Medio | Media | Rate limiting global de 300/45 min; verificación por hash limitada a respuestas genéricas. | Mitigado |
| RK-09 | Que el sistema se use para falsificar documentos oficiales | Baja | **Crítico** | Alta | Advertencia visible en la interfaz; sección de limitación legal en el README. | Mitigado |
| RK-40 | Que la clave privada cifrada se vuelva irrecuperable si el usuario olvida su contraseña | Media | Medio | Media | Consecuencia intencional: sin la contraseña no se puede firmar; el documento existente sigue verificable. | Aceptado |

---

## 5. Estrategia de Commits

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| `feat` | `feat(scope): descripción` | `feat(auth): emitir par de claves RSA en el registro` |
| `fix` | `fix(scope): descripción` | `fix(audit): encadenar hash con la última entrada verificada` |
| `test` | `test(scope): descripción` | `test(scenarios): cubrir ciclo privado → público → propuesta` |
| `docs` | `docs(scope): descripción` | `docs(uml): agregar diagrama de despliegue para nube` |
| `refactor` | `refactor(scope): descripción` | `refactor(db): extraer contrato DbDriver` |
| `chore` | `chore(scope): descripción` | `chore(deps): fijar versiones con pnpm` |

---

## 6. Definición de «Terminado» (Definition of Done)

Una funcionalidad se considera terminada cuando cumple **todos** estos puntos:

- [ ] El código compila sin errores de tipos (`tsc --noEmit` con exit code 0).
- [ ] Existen pruebas automatizadas que cubren el flujo principal y los flujos alternos críticos.
- [ ] Todas las pruebas del proyecto pasan.
- [ ] El RF correspondiente está documentado con reglas de aceptación verificables.
- [ ] La trazabilidad RF ↔ código ↔ prueba está actualizada.
- [ ] No se introducen secretos en el código ni en la documentación.
- [ ] Los mensajes de error están en español y son comprensibles por un usuario final.
- [ ] El caso de uso correspondiente está documentado en `casos_uso.md`.
- [ ] El índice documental refleja el cambio.

---

**Documentos relacionados**

- [`metodologia_ia_aplicada.md`](./metodologia_ia_aplicada.md) — Uso de IA en el proceso
- [`metodologia_pruebas.md`](./metodologia_pruebas.md) — Estrategia de pruebas
- [`estado_del_arte/estado_del_arte.md`](../estado_del_arte/estado_del_arte.md) — Análisis de soluciones existentes
