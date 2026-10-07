# Fase 3 — Desarrollo y Codificación

**Proyecto:** SGD-FD · **Versión:** 1.0.0

---

## 1. Propósito

Documentar cómo se implementó el SGD-FD: el orden de construcción, las
decisiones de codificación tomadas, la correspondencia entre el diseño y el
código real, y los criterios de aceptación de cada módulo.

Esta fase conecta el diseño documentado en la Fase 2 con el código realmente
escrito. Su valor principal es hacer **verificable** la afirmación de que lo
implementado corresponde a lo especificado.

---

## 2. Stack de Implementación

| Capa | Tecnología | Versión declarada | Ubicación |
|------|------------|:-----------------:|-----------|
| Frontend | SvelteKit | `^2.63.0` | `frontend/package.json` |
| Frontend | Svelte | `^5.56.1` | `frontend/package.json` |
| Frontend | TypeScript | `^6.0.3` | `frontend/package.json` |
| Frontend | Vite | `8.0.16` | `frontend/package.json` |
| Frontend | Adaptador de despliegue | `@sveltejs/adapter-auto@^7.0.1` | `frontend/package.json` |
| Backend | Express | `^4.21.2` | `backend/package.json` |
| Backend | TypeScript (ESM) | `^5.7.3` | `backend/package.json` |
| Persistencia | `sql.js` (SQLite) | `^1.12.0` | `backend/package.json` |
| Autenticación | `jsonwebtoken` | `^9.0.2` | `backend/package.json` |
| Hash de contraseñas | `bcryptjs` | `^2.4.3` | `backend/package.json` |
| Seguridad HTTP | `helmet` y `cors` | `^8.0.0` y `^2.8.5` | `backend/package.json` |
| Criptografía | `node:crypto` | Node 18 o superior | Biblioteca estándar |
| Códigos QR | `qrcode` | `^1.5.4` | `backend/package.json` |
| Identificadores | `uuid` | `^11.0.5` | `backend/package.json` |
| Pruebas | Vitest y Supertest | `^5.0.0` y `^7.2.2` | `backend/package.json` |

Las versiones de esta tabla se leyeron directamente de los archivos
`package.json`. El inventario completo de las 32 dependencias, con su
justificación y sus licencias, está en
[`../06_diagramas_y_software/software_utilizado.md`](../06_diagramas_y_software/software_utilizado.md).

> **Inconsistencia conocida:** `@types/express` declara `^5.0.0` mientras que la
> dependencia real es `express@4.21.2`. Los tipos de Express 5 no corresponden al
> comportamiento de Express 4.

---

## 3. Orden de Construcción

El código se construyó en el orden siguiente, respetando el principio de que
**cada capa depende de la anterior ya probada**:

| Paso | Módulo | Depende de | Archivo de prueba | Verificación |
|:----:|--------|------------|--------------------|:------------:|
| 1 | Esquema de base de datos | — | — | 7 tablas creadas |
| 2 | Capa de persistencia `DbDriver` | 1 | — | Driver SQLite operativo |
| 3 | Criptografía (`keyGenerator`, `keyProtection`) | — | `tests/unit/crypto.test.ts` | 12 unitarias |
| 4 | Servicio de auditoría | 2 | `tests/services/audit.service.test.ts` | 5 de servicio |
| 5 | Servicio de autenticación | 2, 3 | `tests/services/auth.service.test.ts` | 7 de servicio |
| 6 | Servicio de documentos | 2, 3, 4, 5 | `tests/services/document.service.test.ts` | 11 de servicio |
| 7 | Middleware de autenticación | 5 | `tests/unit/auth-middleware.test.ts` | 9 unitarias |
| 8 | Límite de intentos de acceso | 5 | `tests/unit/rate-limit.test.ts` | 7 unitarias |
| 9 | Análisis y comparación de documentos | 1 | `tests/unit/document-analysis.test.ts` | 9 unitarias |
| 10 | Rutas de autenticación | 5, 7 | `tests/integration/auth.api.test.ts` | 10 de API |
| 11 | Rutas de documentos | 6 | `tests/integration/documents.api.test.ts` | 13 de API |
| 12 | Rutas de verificación y firma | 3, 6 | `tests/integration/verify.api.test.ts` | 6 de API |
| 13 | Rutas de auditoría | 4 | `tests/integration/audit.api.test.ts` | 4 de API |
| 14 | Escenarios de negocio | 6 a 13 | `tests/integration/scenarios.test.ts` | 5 de aceptación |
| 15 | Cliente HTTP del frontend | 10 a 13 | `frontend/src/lib/api.test.ts` | 15 de cliente |
| 16 | Estado de autenticación | 5, 7 | `frontend/src/lib/stores/auth.test.ts` | 7 de estado |

**Recuento por nivel.** Las categorías son excluyentes entre sí y suman el total:

| Nivel | Archivos | Casos | Composición |
|-------|:--------:|:-----:|-------------|
| Unitarias (backend) | 4 | 37 | 12 + 9 + 7 + 9 |
| Servicios (backend) | 3 | 23 | 5 + 7 + 11 |
| API e integración (backend) | 4 | 33 | 10 + 13 + 6 + 4 |
| Aceptación (backend) | 1 | 5 | 5 |
| **Subtotal backend** | **12** | **98** | 37 + 23 + 33 + 5 |
| Cliente HTTP (frontend) | 1 | 15 | 15 |
| Estado de autenticación (frontend) | 1 | 7 | 7 |
| **Subtotal frontend** | **2** | **22** | 15 + 7 |
| **Total** | **14** | **120** | 98 + 22 |

Las pruebas de firma y verificación (paso 12) son pruebas de API, no unitarias:
comprueban el comportamiento HTTP completo, incluida la respuesta JSON con los
cinco estados (`VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND`, `FOUND`).

Este orden explica por qué las pruebas de servicios preceden a las de API: una
falla en `document.service` se detecta antes de necesitar un servidor HTTP.

---

## 4. Convenciones de Codificación

### 4.1. Estructura de carpetas

```
backend/
  src/
    config/        Configuracion por entorno
    crypto/        Generacion de claves, cifrado, firma, verificacion
    db/            Esquema, driver, conexion y consultas
    middleware/    Autenticacion, roles, limite de intentos
    routes/        Rutas HTTP
    services/      Logica de negocio
    types/         Tipos compartidos
    utils/         Utilidades
  tests/
    unit/          37 pruebas
    services/      23 pruebas
    integration/   38 pruebas

frontend/
  src/
    lib/
      api.ts       Cliente HTTP
      stores/      Estado con Svelte
    routes/        Rutas de SvelteKit
  static/          Recursos estaticos
```

### 4.2. Reglas aplicadas

| Regla | Detalle |
|-------|---------|
| TypeScript estricto | `strict: true` en ambos proyectos; 0 errores de tipos |
| ESM en el backend | `"type": "module"`; los imports llevan extension `.js` |
| Consultas parametrizadas | Todas las consultas SQL usan `?` con parametros |
| Sin secretos en el codigo | Claves y contrasenas solo en variables de entorno |
| Sin logica de negocio en rutas | Las rutas validan y delegan en servicios |
| Respuestas uniformes | `{ success: boolean, data?, error? }` |
| Manejo de errores explicito | `try/catch` con mensaje comprensible |

### 4.3. Patron de respuesta

```ts
res.status(200).json({ success: true, data: resultado });
res.status(400).json({ success: false, error: 'Mensaje comprensible' });
```

Unificar la forma de las respuestas permite al cliente de API tratar todos los
casos con una sola logica.

---

## 5. Correspondencia entre Diseño y Código

| Elemento de diseño | Implementación | Archivo |
|--------------------|----------------|---------|
| Arquitectura por capas | Rutas, Servicios, Driver | `routes/`, `services/`, `db/driver.ts` |
| Abstraccion de base de datos | Interfaz `DbDriver` | `db/driver.ts` |
| Firmas RSA | `generateKeyPair`, `signDocumentHash` | `crypto/keyGenerator.ts`, `crypto/signature.ts` |
| Cifrado de clave privada | PBKDF2 y AES-256-GCM | `crypto/keyProtection.ts` |
| Verificacion de documentos | `verifyDocument` | `crypto/verification.ts` |
| Bitacora encadenada | `AuditService.append`, `verifyChain` | `services/audit.service.ts` |
| Control de acceso | `authenticate`, `authenticateOptional`, `requireAdmin` | `middleware/auth.ts` |
| Limite de intentos | `bruteForceProtection` | `middleware/rateLimit.ts` |
| Diferencial de documentos | `compareComparableArtifacts` | `services/document-analysis.ts` |
| QR de verificacion | `QRCode.toDataURL` | `routes/documents.ts` |
| Verificacion publica sin cuenta | Rutas sin `authenticate` | `routes/verify.ts` |

---

## 6. Módulos y su Complejidad Conceptual

### 6.1. Capa criptografica

**Archivos**: `crypto/keyGenerator.ts`, `crypto/keyProtection.ts`,
`crypto/signature.ts`, `crypto/verification.ts`

Es la capa mas critica y la de **menor dependencia**: solo utiliza `node:crypto`
y no importa nada del resto del proyecto. Esta separacion permite verificar la
criptografia de forma aislada.

| Operacion | Detalle |
|-----------|---------|
| Generacion de claves | RSA-2048 |
| Huella publica | SHA-256 de la clave publica, hexadecimal con separadores `:` |
| Formato de la clave privada almacenada | JSON con `encryptedData`, `iv`, `authTag` y `salt` |
| Derivacion de la clave de cifrado | PBKDF2-HMAC-SHA512, 100 000 iteraciones, salt de 16 bytes |
| Cifrado simetrico | AES-256-GCM, IV de 12 bytes |
| Firma | RSA-SHA256 sobre el hash SHA-256 del contenido |
| Verificacion | Recalculo del hash y validacion de la firma con la clave publica |

### 6.2. Capa de servicios

| Servicio | Responsabilidad | Pruebas de servicio |
|----------|----------------|:------------------:|
| `AuthService` | Registro, inicio de sesion, emision de tokens | 7 |
| `DocumentService` | Emision, versionado, propuestas, visibilidad, comparacion | 11 |
| `AuditService` | Registro encadenado, consulta y verificacion | 5 |

### 6.3. Capa de rutas

| Archivo | Rutas | Autenticacion |
|---------|:-----:|---------------|
| `routes/auth.ts` | Registro, inicio de sesion, perfil | Parcial |
| `routes/users.ts` | Administracion de usuarios | `admin` |
| `routes/documents.ts` | 14 rutas de documentos y propuestas | `authenticate` y `authenticateOptional` |
| `routes/verify.ts` | 2 rutas de verificacion | **Ninguna** (publicas por diseno) |
| `routes/audit.ts` | 2 rutas de auditoria | `admin` |

---

## 7. Decisiones de Codificación Relevantes

### 7.1. Sin dependencias de Python

La extraccion de texto para el diferencial se implemento en TypeScript, sin
llamar a un interprete externo. Esto elimina una dependencia del entorno y
permite que las pruebas se ejecuten en cualquier maquina con Node.

**Consecuencia:** los archivos binarios (PDF, DOCX comprimidos) no producen
diferencial de lineas, solo de metadatos. La prueba
`no muestra diffs de linea cuando no hay texto extraible` documenta este
comportamiento esperado.

### 7.2. Abstraccion de la base de datos desde el inicio

Aunque el unico driver implementado es SQLite, la interfaz `DbDriver` se
definio antes de escribir las consultas. Esto reduce el costo de una futura
migracion a PostgreSQL, aunque **no la elimina**: la interfaz es sincrona y
`sql.js` opera en memoria, por lo que un driver asincrono requerira cambiar la
firma de los metodos.

### 7.3. Verificacion sin autenticacion

`routes/verify.ts` no aplica ningun middleware de autenticacion. Es una decision
consciente, no una omision: el objetivo de negocio es que un destinatario
externo pueda verificar sin cuenta.

El riesgo se controla limitando los datos expuestos: la ruta publica devuelve
titulo, version vigente, firmante y fecha, nunca el archivo ni la clave privada.

### 7.4. Persistencia explicita de la base de datos

Al ser `sql.js` una base en memoria, cada operacion que modifica datos llama a
`saveDatabase()` para volcar el estado al archivo. Sin esta llamada, los datos
se perderian al reiniciar el proceso.

---

## 8. Pruebas como Criterio de Aceptación del Código

Cada modulo se acepto cuando su prueba correspondiente paso:

| Modulo | Prueba de aceptacion | Resultado |
|--------|----------------------|:---------:|
| Criptografia | 12 pruebas unitarias | Pasa |
| Firma y verificacion | 5 pruebas | Pasa |
| Autenticacion | 9 de middleware, 7 de servicio, 10 de API | Pasa |
| Documentos | 11 de servicio y 13 de API | Pasa |
| Propuestas | Incluidas en las pruebas de documentos | Pasa |
| Auditoria | 5 de servicio y 4 de API | Pasa |
| Verificacion | 6 de API | Pasa |
| Analisis de documentos | 9 pruebas unitarias | Pasa |
| Limite de intentos | 7 pruebas unitarias | Pasa |
| Cliente frontend | 15 pruebas | Pasa |
| Estado de autenticacion frontend | 7 pruebas | Pasa |
| Escenarios de extremo a extremo | 5 pruebas | Pasa |

**Total: 120 de 120.**

---

## 9. Defectos Detectados y Corregidos Durante el Desarrollo

| # | Defecto | Ubicacion | Correccion |
|---|---------|-----------|------------|
| D-1 | Middleware `optionalAuthenticate` registrado dos veces | `app.ts` | Se elimino el duplicado; se conservo `authenticateOptional` |
| D-2 | `resolveApiBase()` devolvia el origen del puerto 5173 en desarrollo | `frontend/src/lib/api.ts` | Se elimino la rama; el valor por defecto es `http://localhost:3000/api` |
| D-3 | Conteo de versiones devuelto como texto en lugar de numero | `document.service.ts` | Conversion numerica en el servicio |
| D-4 | El enlace publico visible y el que copiaba el boton «Copiar enlace» estaban fijos a `http://localhost:5173` | `frontend/src/routes/documents/[id]/+page.svelte` | Se construyen con `$page.url.origin`, de modo que reflejan el origen real desde el que se sirve la interfaz |
| D-5 | Tras subir un documento se mostraba un panel de confirmacion con una URL de verificacion que apuntaba al backend y no a la interfaz | `frontend/src/routes/documents/+page.svelte` | Se elimino el panel; el QR y el enlace publico permanecen en la barra de compartir del detalle |

Los defectos D-1 a D-3 se detectaron mediante pruebas automatizadas; D-4 y D-5
provienen de una revision manual de la interfaz. El defecto latente identificado
en `GET /api/verify/:documentId` permanece abierto y esta documentado en el
proceso TO-BE 03.

---

## 10. Verificación Final de la Fase

```bash
# Tipos
cd backend && npx tsc --noEmit
cd frontend && npx svelte-check

# Pruebas
cd backend && pnpm test
cd frontend && pnpm test

# Compilacion
cd backend && pnpm build
cd frontend && pnpm build
```

| Verificacion | Resultado |
|--------------|:---------:|
| Errores de tipos en el backend | 0 |
| Errores de tipos en el frontend | 0 |
| Pruebas del backend | 98 de 98 |
| Pruebas del frontend | 22 de 22 |
| Compilacion del backend | Correcta |
| Compilacion del frontend | Correcta |

---

## 11. Limitaciones de la Implementación

| # | Limitacion | Impacto |
|---|------------|---------|
| L-1 | Base de datos en memoria (`sql.js`) | No escala a multiples procesos |
| L-2 | Interfaz `DbDriver` sincrona | La migracion a PostgreSQL exige cambio de firmas |
| L-3 | Archivos en el sistema de archivos local | No apto para funciones serverless |
| L-4 | Sin implementacion asincrona de persistencia | Bloquea el despliegue en Vercel |
| L-5 | Sin cache | Cada verificacion recalcula el hash del archivo |
| L-6 | Sin internacionalizacion | Interfaz y mensajes solo en espanol |

---

## 12. Conclusiones

La implementacion sigue fielmente el diseno de la Fase 2: cada elemento
arquitectonico tiene su contraparte en el codigo, y cada pieza de codigo tiene
al menos una prueba que verifica su comportamiento.

El resultado es un sistema de **120 pruebas en verde y cero errores de tipos**,
con tres defectos corregidos durante el desarrollo y uno documentado como
latente. Las limitaciones identificadas son conocidas, acotadas y se traducen
en trabajo futuro planificado, no en incognitas.

---

## 13. Referencias Cruzadas

- [`../02_diseno_construccion/arquitectura/arquitectura.md`](../02_diseno_construccion/arquitectura/arquitectura.md) — Arquitectura
- [`../02_diseno_construccion/arquitectura/analisis_tecnico.md`](../02_diseno_construccion/arquitectura/analisis_tecnico.md) — Analisis tecnico
- [`../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md`](../02_diseno_construccion/pruebas_calidad/plan_de_pruebas.md) — Plan de pruebas
- [`../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md`](../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) — Catalogo de pruebas
- [`../04_implementacion_despliegue/plan_nube_vercel_supabase.md`](../04_implementacion_despliegue/plan_nube_vercel_supabase.md) — Plan de nube
