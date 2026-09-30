# Proceso AS-IS 04 — Gestión de cambios y propuestas

**Proyecto:** SGD-FD · **Versión:** 1.0.0 · **Fase:** 2 — Diseño y Construcción

---

## 1. Identificación

| Campo | Valor |
|-------|-------|
| **Código** | P-04 |
| **Nombre** | Gestión de cambios y propuestas |
| **Proceso TO-BE equivalente** | P-04 — Coautoría gobernada |
| **Área** | Todas las áreas |
| **Responsable** | Propietario del documento |
| **Tipo** | Operativo |
| **Estado** | Vigente (acordado por teléfono o correo) |

---

## 2. Objetivo del Proceso

Incorporar al documento los cambios sugeridos por otra persona, de modo que
queda claro quién propuso qué, quién lo aprobó y quién responde por la versión
final.

En el estado actual, **la autoría conjunta no queda registrada**: el documento
resultante es atribuible únicamente a quien lo guardó por última vez.

---

## 3. Disparador y Resultado

### 3.1. Evento Disparador

Un coautor (colega, asesor, área distinta) necesita aportar modificaciones al
documento de otro.

### 3.2. Resultado Esperado

Un documento actualizado. No hay registro formal de la propuesta ni de su
autor.

---

## 4. Entradas y Salidas

### 4.1. Entradas

| Entrada | Origen |
|---------|--------|
| Documento vigente | Propietario |
| Modificaciones sugeridas | Coautor |
| Decisión de aceptar o rechazar | Propietario |

### 4.2. Salidas

| Salida | Formato |
|--------|---------|
| Documento actualizado | PDF / DOCX |
| Acuerdo informal (a veces un correo) | Mensaje |

### 4.3. Consumidores

Propietario, coautor, todos los que lean el documento después.

---

## 5. Actores y Roles

| Actor | Rol |
|-------|-----|
| Propietario | Decide si acepta los cambios |
| Coautor | Propone modificaciones |
| *(Ausente)* | Nadie valida ni consolida la autoría |

---

## 6. Reglas de Negocio Actuales

| # | Regla | Formalidad |
|---|-------|-----------|
| RN-1 | El coautor envía sus cambios por correo con el archivo completo | Consuetudinaria |
| RN-2 | El propietario revisa y decide | Consuetudinaria |
| RN-3 | Si acepta, integra los cambios manualmente y guarda como nueva versión | Consuetudinaria |
| RN-4 | A veces se acuerda por teléfono, sin registro escrito | **Informal** |
| RN-5 | No hay registro de la autoría de cada versión | **Ausente** |

---

## 7. Diagrama del Proceso

```
 Inicio (un coautor propone cambios)
   |
   v
 El coautor edita una copia y la envia
   |
   v
 (Envia un diff o el archivo completo?)
   |  Solo archivo completo --> el propietario debe comparar a ojo
   |  Con diff
   v
 El propietario compara manualmente
   |
   v
 (Acepta los cambios?)
   |  No --> Responder al coautor --> Fin
   |  Si
   v
 Integrar manualmente los cambios
   |
   v
 Guardar como nueva version
   |
   v
 (Anotar quien propuso los cambios?)
   |  No --> (La autoria conjunta NO queda registrada)
   |  Si
   v
 Guardar en una nota al pie del documento
   |
   v
 Fin
```

### 7.1. Puntos de Decisión

| # | Decisión | Consecuencia |
|---|----------|--------------|
| D-1 | ¿Diff o archivo completo? | El archivo completo obliga a comparar a ojo |
| D-2 | ¿Acepta los cambios? | Bifurca el proceso |
| D-3 | ¿Se anota la autoría? | Si no, se pierde la trazabilidad |

---

## 8. Actividades Actuales

| # | Actividad | Tiempo | Problema |
|---|-----------|:------:|----------|
| A-1 | El coautor edita una copia | 40 min | Sin control de concurrencia |
| A-2 | Envía el archivo por correo | 2 min | Se pierde el contexto del cambio |
| A-3 | El propietario compara a mano | 30 min | Propenso a errores |
| A-4 | Decide aceptar o rechazar | 15 min | Sin criterio documentado |
| A-5 | Integra los cambios | 20 min | Puede olvidar algún cambio |
| A-6 | Guarda la nueva versión | 1 min | — |
| A-7 | (Opcional) Anota al pie quién propuso | 3 min | Rara vez se hace |
| A-8 | *(No existe)* Registro estructurado de la propuesta | — | — |
| A-9 | *(No existe)* Diferencial calculado por el sistema | — | — |

---

## 9. Sistemas y Puntos de Integración

```
 Coautor: Word --> Correo --> Propietario: Word --> Carpeta --> Correo
                                   (comparacion manual)
```

No hay sistema que compare, registre ni consolide.

---

## 10. Indicadores del Estado Actual

### 10.1. Tiempo de Ciclo

| Concepto | Valor |
|----------|-------|
| Tiempo activo | ~1 h 48 min |
| Tiempo de espera | ~2 días (agenda del propietario) |
| Tiempo de ciclo total | **~3 días** |

Es el proceso **más lento** de la cadena documental, y el principal responsable
del tiempo de ciclo total.

### 10.2. Tasa de Errores

| Error | Frecuencia estimada |
|-------|:-------------------:|
| Se integra un cambio parcialmente | 25 % |
| Se omite un cambio acordado | 20 % |
| Autoría conjunta no registrada | 70 % |
| Se pierde la propuesta sin resolver | 15 % |

### 10.3. Cumplimiento

| Objetivo | Estado |
|----------|--------|
| Incorporar cambios de un coautor | Se cumple |
| Registrar quién propuso | **No se cumple de forma fiable** |
| Registrar quién aprobó | Parcial: a veces un correo |
| Mostrar exactamente qué cambió | **No se cumple** |

---

## 11. Problemas Detectados

### PR-01 · Autoría conjunta invisible

Cuando el propietario integra los cambios, el documento resultante solo es
atribuible a él. El coautor desaparece del registro. Esto es especialmente
grave: si el coautor aportó un dato erróneo, nadie puede rastrear el origen.

### PR-02 · Comparación manual costosa y poco fiable

Comparar dos versiones a ojo sobre documentos largos es lento y muy
propenso a error. Un cambio de una cifra puede pasar desapercibido.

### PR-03 · Propuestas perdidas

Las propuestas que llegan por correo se entierran. No hay bandeja de entrada
de propuestas.

### PR-04 · Decisiones sin registro

«Lo acepté por teléfono» no deja constancia. Si la propuesta se rechaza, no
queda registro de qué se rechazó.

---

## 12. Brechas Identificadas

| # | Brecha | Cubierta por |
|---|--------|--------------|
| BR-01 | Sin registro de la propuesta ni de su autor | RF-015, RF-016 |
| BR-02 | Sin bandeja de propuestas | RF-016 |
| BR-03 | Sin Diferencial calculado por el sistema | RF-020 |
| BR-04 | Sin registro de autoría conjunta al aceptar | RNF-044 |
| BR-05 | Sin firma propia de la propuesta | RNF-043 |

---

## 13. Oportunidades de Automatización

| # | Oportunidad | Proceso TO-BE |
|---|------------|---------------|
| OP-01 | Bandeja de propuestas con estado (pendiente / aceptada / rechazada) | P-04 TO-BE |
| OP-02 | Diferencial línea a línea calculado automáticamente | P-04 TO-BE |
| OP-03 | Propuesta firmada con las claves del coautor | P-04 TO-BE |
| OP-04 | Motivo del cambio obligatorio | P-04 TO-BE |
| OP-05 | Registro del coautor en la versión resultante | P-04 TO-BE |
| OP-06 | Validación de que la propuesta se basa en la versión vigente | P-04 TO-BE |

---

## 14. Referencias Cruzadas

- [`procesos_as_is.md`](procesos_as_is.md) — Mapa de procesos AS-IS
- [`proceso_as_is_02.md`](proceso_as_is_02.md) — Control de versiones
- [`../to_be/proceso_to_be_04.md`](../to_be/proceso_to_be_04.md) — Proceso TO-BE equivalente
- [`../pruebas_calidad/matriz_trazabilidad.md`](../../pruebas_calidad/matriz_trazabilidad.md) — Trazabilidad
