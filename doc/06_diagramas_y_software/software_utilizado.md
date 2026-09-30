# Software Utilizado — SGD-FD

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad
**Versión del sistema:** 1.0.0

---

## 1. Propósito

Inventariar el software utilizado por el SGD-FD: dependencias de terceros,
librerías estándar, herramientas de desarrollo y su justificación.

La fuente de verdad son los archivos `package.json` de ambos proyectos, leídos
directamente del código. Toda dependencia listada aquí está declarada; ninguna se
usa sin declararse.

---

## 2. Dependencias del Backend

### 2.1. Dependencias de producción (10)

| Paquete | Versión | Uso | Justificación |
|---------|:-------:|-----|---------------|
| `express` | `^4.21.2` | Servidor HTTP y enrutado | Estándar de facto para API en Node; middleware componible |
| `sql.js` | `^1.12.0` | Motor SQLite compilado a WebAssembly | Persistencia sin proceso externo; la base reside en memoria |
| `bcryptjs` | `^2.4.3` | Hash de contraseñas | Implementación pura en JavaScript, sin binario nativo que compilar |
| `jsonwebtoken` | `^9.0.2` | Emisión y verificación de tokens | JWT es el estándar de facto para autenticación sin estado |
| `multer` | `^1.4.5-lts.1` | Subida de archivos | Multipart con límites de tamaño y filtros de tipo |
| `qrcode` | `^1.5.4` | Generación de códigos QR | Produce Data URI sin dependencias nativas |
| `helmet` | `^8.0.0` | Cabeceras de seguridad HTTP | Reduce la superficie de ataque por omisión |
| `cors` | `^2.8.5` | Política de origen cruzado | Permite separar API e interfaz en puertos distintos |
| `dotenv` | `^16.4.7` | Carga de variables de entorno | Evita incluir secretos en el código |
| `uuid` | `^11.0.5` | Identificadores únicos | UUID v4 sin riesgo de colisión |

### 2.2. Dependencias de desarrollo (5)

| Paquete | Versión | Uso |
|---------|:-------:|-----|
| `typescript` | `^5.7.3` | Compilación con comprobación de tipos estricta |
| `tsx` | `^4.19.2` | Ejecución directa de TypeScript en desarrollo |
| `vitest` | `^5.0.0` | Marco de pruebas |
| `vite` | `8.0.16` | Empaquetador y base de las pruebas |
| `supertest` | `^7.2.2` | Pruebas de rutas HTTP reales |

### 2.3. Paquetes de tipos (9)

| Paquete | Versión | Superficie cubierta |
|---------|:-------:|---------------------|
| `@types/node` | `^22.12.0` | API de Node |
| `@types/express` | `^5.0.0` | Express |
| `@types/jsonwebtoken` | `^9.0.7` | jsonwebtoken |
| `@types/bcryptjs` | `^2.4.6` | bcryptjs |
| `@types/multer` | `^1.4.12` | multer |
| `@types/qrcode` | `^1.5.5` | qrcode |
| `@types/cors` | `^2.8.17` | cors |
| `@types/uuid` | `^10.0.0` | uuid |
| `@types/supertest` | `^7.2.1` | supertest |

> **Inconsistencia detectada:** `@types/express` declara la versión 5 mientras
> que la dependencia real es `express@4.21.2`. Los tipos de Express 5 pueden no
> coincidir con el comportamiento de Express 4. Debe fijarse en
> `@types/express@^4`.

---

## 3. Dependencias del Frontend (8)

| Paquete | Versión | Uso |
|---------|:-------:|-----|
| `@sveltejs/kit` | `^2.63.0` | Framework de la interfaz y enrutado |
| `svelte` | `^5.56.1` | Biblioteca de componentes reactivos |
| `vite` | `8.0.16` | Servidor de desarrollo y empaquetado |
| `@sveltejs/vite-plugin-svelte` | `^7.1.2` | Integración de Svelte con Vite |
| `@sveltejs/adapter-auto` | `^7.0.1` | Adaptador de despliegue |
| `vitest` | `^5.0.0` | Pruebas del cliente y del estado |
| `svelte-check` | `^4.6.0` | Verificación de tipos de componentes Svelte |
| `typescript` | `^6.0.3` | Tipos de la interfaz |

### 3.1. Observación sobre la estructura

El `package.json` del frontend declara **todas** sus dependencias dentro de
`devDependencies`, sin bloque `dependencies`. Funciona porque SvelteKit compila
desde el propio repositorio, pero es una convención atípica que conviene
documentar.

### 3.2. Adaptador de despliegue

`frontend/svelte.config.js` selecciona el adaptador mediante la variable
`ADAPTER`:

```js
const adapter = process.env.ADAPTER === 'node'
  ? adapterNode()
  : process.env.ADAPTER === 'vercel'
    ? adapterVercel()
    : adapterAuto();
```

**Estado real:** solo `adapter-auto` está instalado.

| Valor de `ADAPTER` | Resultado |
|--------------------|-----------|
| Sin definir (por defecto) | Funciona |
| `node` | Falla: `@sveltejs/adapter-node` no está instalado |
| `vercel` | Falla: `@sveltejs/adapter-vercel` no está instalado |

---

## 4. Software del Sistema

### 4.1. Bibliotecas estándar de Node

| Módulo | Uso | Por qué no se sustituye |
|--------|-----|-------------------------|
| `node:crypto` | RSA-2048, SHA-256, PBKDF2, AES-256-GCM, firma y verificación | Implementación auditada del propio lenguaje |
| `node:crypto` | Comparación en tiempo constante para contraseñas |Protección nativa frente a ataques de temporización |
| `node:fs` | Lectura y escritura de archivos y de la base de datos | API estándar, sin dependencias |
| `node:path` | Resolución de rutas de almacenamiento | Evita errores en la construcción de rutas |
| `node:http` | Tipos de respuesta y cabeceras | Base sobre la que opera Express |

> **La criptografía del SGD-FD no usa bibliotecas de terceros.** Todas las
> primitivas provienen de `node:crypto`. Esto elimina la categoría de riesgo
> asociada a implementaciones criptográficas ajenas, que ha sido la causa
> histórica más frecuente de vulnerabilidades graves en el software de firma.

### 4.2. Herramientas del entorno

| Herramienta | Versión mínima | Uso |
|-------------|:--------------:|-----|
| Node.js | 18 | Entorno de ejecución del backend |
| pnpm | 8 | Gestor de paquetes |
| Git | Cualquiera | Control de versiones del código |

---

## 5. Herramientas de Desarrollo y Pruebas

| Herramienta | Tipo | Uso | Configuración |
|-------------|------|-----|---------------|
| TypeScript | Compilador | Comprobación de tipos estricta | `tsconfig.json` con `strict: true` |
| Vitest | Marco de pruebas | 120 pruebas automatizadas | `vite.config.ts` |
| Supertest | Biblioteca de pruebas | Pruebas de rutas HTTP | Integrada en Vitest |
| svelte-check | Analizador estático | Verificación de tipos de Svelte | `svelte.config.js` |
| `tsc --noEmit` | Comando | Cero errores de tipos como criterio de aceptación | — |

### 5.1. Alcance de cada herramienta

| Herramienta | Qué verifica | Qué no verifica |
|-------------|---------------|------------------|
| TypeScript | Corrección de tipos | Lógica incorrecta con tipos correctos |
| Vitest | Comportamiento observable | Tipos, de ahí que se combinen ambas |
| svelte-check | Tipos de componentes Svelte | Comportamiento visual |
| Supertest | Contrato HTTP | Interfaz de usuario |

---

## 6. Software NO Utilizado

Declarar lo que **no** se usa tiene la misma utilidad que declarar lo que sí:

| Software | Motivo de no uso |
|----------|-----------------|
| PostgreSQL (`pg`) | La capa de datos es síncrona y `sql.js` cubre el alcance actual |
| SDK de Supabase | El almacenamiento es local; el plan de nube aún no está implementado |
| ORM (Prisma, TypeORM, Sequelize) | Las consultas son directas y explícitas; un ORM añadiría indirección |
| Redis | No hay caché ni necesidad de alta concurrencia |
| Docker | El despliegue objetivo es serverless; el proceso local no lo requiere |
| Cucumber (BDD en Gherkin) | El enfoque BDD se aplicó por especificación en lenguaje natural, no con archivos `.feature` |
| Passport.js | El esquema JWT es simple y se implementó directamente sobre `jsonwebtoken` |
| Bibliotecas de PDF o DOCX | Los binarios se verifican por hash; el diferencial se limita al texto extraíble |
| Librerías criptográficas de terceros | Se usa exclusivamente `node:crypto` |

---

## 7. Licencias

| Dependencia | Licencia | Uso comercial |
|-------------|----------|:--------------:|
| `express` | MIT | Permitido |
| `sql.js` | MIT | Permitido |
| `bcryptjs` | MIT | Permitido |
| `jsonwebtoken` | MIT | Permitido |
| `multer` | MIT | Permitido |
| `qrcode` | MIT | Permitido |
| `helmet` | MIT | Permitido |
| `cors` | MIT | Permitido |
| `dotenv` | BSD-2-Clause | Permitido |
| `uuid` | MIT | Permitido |
| Svelte y SvelteKit | MIT | Permitido |
| Vite y Vitest | MIT | Permitido |
| Supertest | MIT | Permitido |
| TypeScript | Apache-2.0 | Permitido |
| Node.js | MIT | Permitido |

**Todas las dependencias son de licencia libre.** Ninguna exige atribución
adicional más allá de incluir la declaración de licencias.

> **Nota:** esta tabla se elaboró a partir de la información pública de los
> paquetes. Para una distribución comercial debe verificarse el archivo
> `LICENSE` de cada versión efectivamente instalada.

---

## 8. Resumen de la Dependencia Externa

| Categoría | Cantidad | Naturaleza |
|-----------|:--------:|------------|
| Backend, producción | 10 | Paquetes npm |
| Backend, desarrollo | 5 | Paquetes npm |
| Tipos de TypeScript | 9 | Paquetes npm |
| Frontend | 8 | Paquetes npm |
| Criptografía de terceros | 0 | `node:crypto` |
| Base de datos en servidor | 0 | SQLite en memoria |

**32 paquetes en total**, de los cuales ninguno implementa criptografía: esa
función reside por completo en la biblioteca estándar de Node.

---

## 9. Riesgos de las Dependencias

| # | Riesgo | Severidad | Mitigación |
|:-:|--------|:---------:|------------|
| 1 | `@types/express@5` no corresponde a `express@4` | Media | Fijar `@types/express@^4` |
| 2 | `multer@1` está en mantenimiento y `multer@2` fue reescrito | Media | Planificar la actualización y revisar la gestión de errores |
| 3 | Sin bloqueo de versiones consolidado entre proyectos | Baja | pnpm genera el bloqueo por proyecto |
| 4 | `adapter-auto` puede elegir un destino inesperado | Baja | Fijar el adaptador explícitamente en producción |
| 5 | Sin auditoría automática de vulnerabilidades | Media | Ejecutar `pnpm audit` periódicamente |

---

## 10. Conclusiones

El SGD-FD depende de **32 paquetes**, todos de licencia libre, y **no depende de
ninguna biblioteca criptográfica de terceros**: toda la criptografía proviene de
`node:crypto`. Esta es la decisión de dependencia más relevante del proyecto,
porque reduce a cero la superficie de ataque asociada a implementaciones
criptográficas ajenas.

Se han identificado y documentado dos inconsistencias menores: la versión de
`@types/express` no corresponde a la de `express`, y `multer` se encuentra en su
rama de mantenimiento. Ninguna afecta al comportamiento actual y ambas tienen
corrección directa.

---

## 11. Referencias Cruzadas

- [`diagrama_componentes.md`](diagrama_componentes.md) — Diagrama de componentes
- [`diagrama_paquetes.md`](diagrama_paquetes.md) — Diagrama de paquetes
- [`../02_diseno_construccion/arquitectura/analisis_tecnico.md`](../02_diseno_construccion/arquitectura/analisis_tecnico.md) — Análisis técnico
- [`../04_implementacion_despliegue/plan_nube_vercel_supabase.md`](../04_implementacion_despliegue/plan_nube_vercel_supabase.md) — Dependencias necesarias para la nube
