# Métricas de Calidad — SGD-FD

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Propósito

Definir las métricas de calidad del SGD-FD, indicar **cómo se mide cada una** y
reportar el valor observado cuando existe evidencia real.

> **Regla de este documento:** una métrica sin medición se marca como
> **«No medida»**. No se presentan objetivos como si fueran resultados.

---

## 2. Sistema de Métricas

Las métricas se agrupan en cuatro familias, siguiendo la taxonomía de calidad
de software:

| Familia | Qué mide | Métricas |
|---------|----------|----------|
| Correctitud | El sistema hace lo que debe | Tasa de pruebas Satisfactorias, Densidad de defectos |
| Confiabilidad | El sistema no falla | Disponibilidad, Tasa de errores, Tiempo de recuperación |
| Usabilidad | El sistema se puede usar | Esfuerzo de aprendizaje, Errores de usuario |
| Mantenibilidad | El sistema se puede modificar | Complejidad, Acoplamiento, Cobertura de pruebas |

---

## 3. Métricas de Correctitud

### 3.1 Tasa de Pruebas Satisfactorias

**Definición**

```
TPS = (Pruebas superadas / Pruebas ejecutadas) × 100
```

**Medición**

```bash
cd backend && pnpm test    # 98 pruebas
cd frontend && pnpm test   # 22 pruebas
```

| Suite | Superadas | Ejecutadas | TPS |
|-------|:---------:|:----------:|:---:|
| Backend — unitarias | 37 | 37 | 100 % |
| Backend — servicios | 23 | 23 | 100 % |
| Backend — API | 33 | 33 | 100 % |
| Backend — aceptación | 5 | 5 | 100 % |
| Frontend — API | 15 | 15 | 100 % |
| Frontend — estado | 7 | 7 | 100 % |
| **Total** | **120** | **120** | **100 %** |

**Estado: MEDIDA — 100 %.**

### 3.2 Densidad de Defectos

**Definición**

```
DD = Defectos detectados / Defectos escapados
```

**Medición**

| Categoría | Cantidad | Detalle |
|-----------|:--------:|---------|
| Defectos detectados en pruebas | 3 | Middleware `optionalAuthenticate` duplicado; `resolveApiBase()` devolviendo el origen 5173; conteo de versiones en `documentVersions` |
| Defectos escapados a producción | 0 | El sistema no está en producción |
| Defectos latentes conocidos | 1 | `GET /api/verify/:id` devuelve `signature.valid: true` sin comprobar la firma |

**Estado: MEDIDA parcialmente.** La tasa de escape es 0 % porque no hay
producción; este dato no debe interpretarse como evidencia de calidad operativa.

### 3.3 Trazabilidad Requerimiento–Prueba

**Definición**

```
Trazabilidad = Requerimientos con al menos una prueba / Total de requerimientos
```

| Tipo | Total | Con prueba | Porcentaje |
|------|:-----:|:----------:|:----------:|
| Requerimientos funcionales (RF) | 27 | 27 | 100 % |
| Requerimientos no funcionales (RNF) | 44 | 44 | 100 % |

**Estado: MEDIDA — 100 %.** Detalle en
[`matriz_trazabilidad.md`](matriz_trazabilidad.md).

---

## 4. Métricas de Confiabilidad

### 4.1 Tasa de Errores en la API

**Definición**

```
TE = (Peticiones con error / Peticiones totales) × 100
```

**Estado: NO MEDIDA.** No se ejecutaron pruebas de carga ni de estrés, por lo
que no existe un denominador estadísticamente significativo.

### 4.2 Tiempo de Respuesta

**Definición**

```
TR = tiempo entre la petición y la respuesta completa
```

| Operación | Objetivo de diseño | Valor medido |
|-----------|:------------------:|:------------:|
| `POST /api/docs` (firma + hash + QR) | < 2 s | No medido |
| `POST /api/verify` (verificación) | < 2 s | No medido |
| `GET /api/audit/verify-chain` | < 2 s por evento | No medido |
| `GET /api/docs/:id/compare` | < 2 s | No medido |

**Estado: NO MEDIDA.** Los objetivos provienen del diseño, no de mediciones.

### 4.3 Disponibilidad

**Definición**

```
Disponibilidad = Tiempo activo / Tiempo total
```

**Estado: NO APLICABLE.** El sistema opera en un servidor local de desarrollo,
sin propósito de disponibilidad continua.

### 4.4 Robustez ante Errores

**Definición**: proportionar de entradas inválidas que producen un error
controlado en lugar de una excepción no capturada.

| Tipo de entrada inválida | Tratamiento | Verificado por |
|--------------------------|-------------|----------------|
| Archivo sin extension permitida | `400` con mensaje | `rechaza tipos de archivo no permitidos` |
| Archivo mayor a 10 MB | `400` por límite de `multer` | Límite configurado |
| Petición sin cabecera `Authorization` | `401` | `rechaza peticiones sin cabecera Authorization` |
| Cabecera que no usa `Bearer` | `401` | `rechaza cabeceras que no usan Bearer` |
| Token expirado o inválido | `401` | `rechaza tokens inválidos o expirados` |
| Contraseña de firma incorrecta | `400` | `lanza error si la contraseña es incorrecta (auth GCM)` |
| Contraseña de firma ausente | `400` | `rechaza la subida sin contraseña de firma` |
| Verificación sin archivo | `400` | `rechaza la verificación sin archivo` |
| Usuario no administrador en la bitácora | `403` | `exige rol de administrador` |
| Más de 5 intentos de inicio de sesión | `429` | `bloquea usuarios sin rol admin con 403` / `rechaza con 429 una vez superado el límite` |

**Estado: MEDIDA a nivel funcional — 10 categorías controladas.**

---

## 5. Métricas de Usabilidad

| Métrica | Definición | Estado |
|---------|------------|:------:|
| Esfuerzo de aprendizaje | Tiempo hasta la primera verificación correcta | **No medida** |
| Errores de usuario | Acciones incorrectas por sesión | **No medida** |
| Tasa de finalización | Verificaciones completadas / iniciadas | **No medida** |
| Tareas por paso | Número de pasos para verificar un documento | Teórica: 2 (escanear QR, subir archivo) |

**Justificación de la «No medida»:** no se realizaron pruebas de usabilidad con
usuarios reales. Afirmar una tasa de éxito sin esas pruebas sería inventar el
dato. El diseño de 2 pasos es una decisión de diseño, no un resultado medido.

---

## 6. Métricas de Mantenibilidad

### 6.1 Complejidad Ciclomática por Módulo

**Definición**: número de caminos independientes a través de un módulo.

**Estado: NO MEDIDA.** No se ejecutó una herramienta de análisis estático
(ESLint con reglas de complejidad, o `complexity-report`). La afirmación de que
el código es mantenible sin esta métrica sería subjetiva.

### 6.2 Acoplamiento entre Módulos

**Definición**: número de dependencias entre módulos.

| Módulo | Depende de | Acoplamiento |
|--------|------------|:------------:|
| Rutas (`routes/`) | Servicios, middleware, base de datos | Alto |
| Servicios (`services/`) | Criptografía, base de datos, auditoría | Medio |
| Criptografía (`crypto/`) | `node:crypto` | **Bajo** |
| Análisis de documentos | Sistema de archivos | **Bajo** |
| Bitácora (`audit.service.ts`) | `node:crypto`, base de datos | Bajo |

**Observación:** la capa criptográfica no depende de nada del proyecto, lo que
la hace verificable de forma aislada. Es el módulo con mejor encapsulated.

**Estado: MEDIDA cualitativamente** (inspección de imports), no cuantitativa.

### 6.3 Cobertura Funcional por Capa

**Definición**: proporción de funcionalidades especificadas cubiertas por al
menos una prueba.

| Capa | Funcionalidades cubiertas | Funcionalidades totales | Porcentaje |
|------|:------------------------:|:----------------------:|:----------:|
| Identidad y autenticación | 6 | 6 | 100 % |
| Emisión y firma | 8 | 8 | 100 % |
| Versionado | 5 | 5 | 100 % |
| Visibilidad y acceso | 4 | 4 | 100 % |
| Coautoría | 6 | 6 | 100 % |
| Verificación | 5 | 5 | 100 % |
| Auditoría | 5 | 5 | 100 % |
| Interfaz de usuario | 3 | 7 | **43 %** |

**Estado: MEDIDA.** La brecha del 43 % en la interfaz es real: las pruebas de
frontend cubren el cliente de API y el estado de autenticación, no el
renderizado de todos los componentes.

### 6.4 Verificación de Tipos

**Definición**: errores detectados por el compilador sin ejecutar el programa.

```bash
cd backend && npx tsc --noEmit
```

| Métrica | Valor |
|---------|:-----:|
| Errores de tipos | **0** |
| Modo | `strict` habilitado en `tsconfig.json` |

**Estado: MEDIDA — 0 errores.**

---

## 7. Cuadro Resumen de Métricas

| # | Métrica | Valor | Estado |
|---|---------|-------|:------:|
| M-01 | Tasa de pruebas Satisfactorias | 100 % (120/120) | **Medida** |
| M-02 | Trazabilidad RF–prueba | 100 % (27/27) | **Medida** |
| M-03 | Trazabilidad RNF–prueba | 100 % (44/44) | **Medida** |
| M-04 | Errores de tipos | 0 | **Medida** |
| M-05 | Cobertura de la interfaz | 43 % | **Medida** |
| M-06 | Categorías de error controladas | 10 | **Medida** |
| M-07 | Defectos escapados | 0 (sin producción) | **Medida parcial** |
| M-08 | Defectos latentes conocidos | 1 | **Medida** |
| M-09 | Tasa de errores en la API | — | No medida |
| M-10 | Tiempo de respuesta | — | No medida |
| M-11 | Disponibilidad | — | No aplicable |
| M-12 | Esfuerzo de aprendizaje | — | No medida |
| M-13 | Tasa de finalización de tareas | — | No medida |
| M-14 | Complejidad ciclomática | — | No medida |
| M-15 | Acoplamiento | Bajo en criptografía | Cualitativa |

**5 métricas medidas sobre 15 definidas. Las 5 no medidas están identificadas
como tal, no rellenadas con estimaciones.**

---

## 8. Objetivos de Calidad para la Fase de Mantenimiento

| Objetivo | Métrica | Meta |
|----------|---------|:----:|
| No introducir regresiones | M-01 | Mantener 100 % |
| Mantener la trazabilidad | M-02, M-03 | Mantener 100 % |
| Errores de tipos | M-04 | 0 |
| Elevar la cobertura de la interfaz | M-05 | ≥ 80 % |
| Cerrar el defecto latente | M-08 | 0 defectos abiertos |
| Introducir métricas faltantes | M-09, M-10, M-14 | Instrumentar en la siguiente iteración |

---

## 9. Conclusiones

El SGD-FD presenta métricas de correctitudaintamente fuertes: 120 pruebas
satisfactorias, trazabilidad completa de 27 RF y 44 RNF, y cero errores de
tipos. La cobertura funcional del backend es total.

Las brechas medidas son concretas: la interfaz de usuario está cubierta solo en
un 43 %, existe un defecto latente conocido en la ruta pública de verificación,
y cinco métricas de usabilidad, rendimiento y complejidad **no están
instrumentadas**. Declararlas requeriría ejecutar pruebas que este proyecto no ha
realizado.

La honestidad de este cuadro de métricas es, en sí misma, un indicador de
calidad del proceso de ingeniería.

---

## 10. Referencias Cruzadas

- [`plan_de_pruebas.md`](plan_de_pruebas.md) — Plan de pruebas
- [`matriz_pruebas.md`](matriz_pruebas.md) — Catálogo de pruebas
- [`matriz_trazabilidad.md`](matriz_trazabilidad.md) — Trazabilidad
- [`validacion_experimental.md`](validacion_experimental.md) — Validación experimental
- [`enfoque_tdd.md`](enfoque_tdd.md) — Enfoque TDD
