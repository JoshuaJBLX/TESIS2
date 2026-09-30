# Evaluación del Proyecto

**Proyecto:** Sistema de Gestión Documental con Firma Digital y Trazabilidad (SGD-FD)
**Versión del documento:** 1.0.0
**Fase:** 5 — Mantenimiento y Evaluación
**Naturaleza:** informe de cierre de la fase de construcción y evaluación de resultados

---

## 1. Propósito y Método de Evaluación

Este documento evalúa el resultado del SGD-FD frente a los objetivos declarados al inicio del proyecto. No se limita a confirmar que el sistema funciona: distingue de forma explícita entre lo que se ha medido, lo que se ha estimado y lo que no se ha medido, porque esa distinción determina qué afirmaciones de la memoria son sostenibles y cuáles no.

El método consta de cuatro actividades. Primero, la revisión documental, que contrastó el catálogo funcional con el código efectivamente implementado. Segundo, la verificación técnica, que ejecutó seis comprobaciones sobre el sistema y registró sus resultados. Tercero, el análisis de trazabilidad, que enlazó cada requisito con al menos una prueba. Cuarto, el análisis comparativo frente a la situación de partida, que evaluó si los problemas descritos en los procesos AS-IS quedaron efectivamente resueltos.

Toda cifra incluida en este informe procede de una ejecución real y es reproducible con los comandos indicados. No se emplea ninguna estimación. Cuando un indicador no pudo medirse, se declara como no medido en lugar de inferirlo.

---

## 2. Resumen Ejecutivo

| Indicador | Valor | Naturaleza de la cifra |
|-----------|-------|-----------------------|
| Requisitos funcionales | 27 de 27 con al menos una prueba | Medido |
| Requisitos no funcionales | 44 de 44 con al menos una prueba | Medido |
| Casos de uso especificados | 24, de CU-001 a CU-024 | Medido |
| Historias de usuario | 33 | Medido |
| Pruebas del backend | 98 aprobadas en 12 archivos | Medido |
| Pruebas del frontend | 22 aprobadas en 2 archivos | Medido |
| Total de pruebas | 120 aprobadas en 14 archivos | Medido |
| Tasa de fallos | 0 sobre 120, equivalente al 0 % | Medido |
| Errores de tipos en el backend | 0 | Medido |
| Errores y advertencias en el frontend | 0 y 0 | Medido |
| Compilaciones correctas | 2 de 2, backend y frontend | Medido |
| Puntos de acceso HTTP | 25 | Medido |
| Eventos de auditoría | 9 | Medido |
| Tablas del modelo de datos | 7 | Medido |
| Dependencias con licencia libre | 32 de 32 | Medido |
| Bibliotecas criptográficas de terceros | 0 | Medido |
| Cobertura funcional de casos de prueba | 96 % sobre el total | Medido |
| Cobertura de la capa de interfaz de usuario | 3 de 7, equivalente al 43 % | Medido |
| Defectos abiertos conocidos | 1 de impacto alto, el campo de firma fijo en la ruta de verificación por identificador | Medido |
| Bloqueos para operar en producción | 5 | Medido |
| Pruebas con usuarios reales | 0 | No realizado |
| Pruebas de carga o rendimiento | 0 | No realizado |
| Auditorías externas de seguridad | 0 | No realizado |
| Certificaciones obtenidas | Ninguna | No aplica |

La conclusión de este resumen es que el sistema cumple su función técnica de sello, versionado y trazabilidad en el contexto de una demostración funcional verificada, y que no cumple todavía las condiciones de explotación en un entorno productivo real, por cinco bloqueos conocidos y por un defecto abierto de impacto alto.

---

## 3. Cumplimiento de los Objetivos del Proyecto

Los objetivos del proyecto se derivan de la descripción del producto y de los problemas identificados en los procesos AS-IS.

| Objetivo | Indicador de cumplimiento | Resultado | Estado |
|----------|---------------------------|-----------|--------|
| Sellar cada versión de documento con firma criptográfica del titular | Versiones firmadas y verificables | 9 versiones con firma RSA-2048 sobre huella SHA-256; una firma por versión | Cumplido |
| Registrar la huella de integridad de cada contenido almacenado | Campo `content_hash` presente y recalculable | SHA-256 calculado en la carga y recomprobado en la verificación | Cumplido |
| Encadenar los eventos del sistema en una bitácora no alterable | Cadena de sellos y verificación íntegra | 42 asientos encadenados; validación de la cadena disponible en la ruta de auditoría | Cumplido |
| Permitir la verificación pública sin necesidad de cuenta | Rutas accesibles sin autenticación | Vista pública del documento, perfil público del firmante y verificación por archivo disponible sin sesión | Cumplido |
| Proporcionar un canal de acceso al documento verificable | Generación de código QR | Código QR por documento y vista pública asociada | Cumplido |
| Permitir la coautoría gobernada por propuesta firmada | Flujo de propuesta, aceptación y rechazo | 13 propuestas registradas con los tres estados resueltos | Cumplido |
| Detectar la alteración de un documento recibido | Estados de verificación diferenciados | Cinco estados: `VALID`, `MANIPULATED`, `INVALID_SIGNATURE`, `NOT_FOUND` y `FOUND` | Parcial |
| Sustituir la gestión manual de versiones por un repositorio centralizado | Versionado automático con numeración | Numeración de versión por documento y comparación entre versiones | Cumplido |
| Ofrecer una interfaz web completa para todas las funciones | Cobertura de casos de prueba de interfaz | 3 de 7 casos, equivalente al 43 % | Parcial |
| Desplegar el sistema en un entorno de producción | Despliegue ejecutado y validado | No realizado; la configuración existe pero no se validó desplegando | No cumplido |
| Sustituir la comprobación manual de autenticidad por un mecanismo verificable | Evidencia criptográfica en la vista pública | La comprobación existe pero se expone un valor fijo en la ruta de verificación por identificador | No cumplido |
| Ofrecer valor como firma electrónica certificada bajo la Ley N.° 27269 | Autoridad de certificación y sello de tiempo | Fuera de alcance declarado; el sistema no es firma certificada | Fuera de alcance |

---

## 4. Evaluación de la Calidad del Producto

### 4.1. Resultados de las seis verificaciones

Las seis verificaciones siguientes se ejecutaron sobre el estado actual del código. Todas resultaron favorables; los resultados son reproducibles con los comandos indicados.

| Verificación | Comando | Alcance | Resultado medido |
|--------------|---------|---------|-------------------|
| Tipos del backend | `npx tsc --noEmit` | 45 archivos de código fuente | 0 errores |
| Tipos y plantillas del frontend | `npx svelte-check` | Componentes Svelte y tipos | 0 errores y 0 advertencias |
| Compilación del backend | `pnpm build` | Emisión a `dist/` | Compilación correcta |
| Compilación del frontend | `pnpm build` | Empaquetado del cliente y del servidor | Compilación correcta, con el aviso esperado de `adapter-auto` por no detectar entorno de producción |
| Suite de pruebas del backend | `npx vitest run` | 12 archivos | 98 de 98 aprobadas |
| Suite de pruebas del frontend | `pnpm test` | 2 archivos | 22 de 22 aprobadas |

El aviso del frontend durante la compilación no constituye un fallo. El adaptador automático inspecciona el entorno en busca de un destino de despliegue conocido y, al no encontrar ninguno en un equipo local, informa que la compilación se realizó sin adaptador concreto. Es un comportamiento documentado y esperado.

### 4.2. Cobertura funcional por capa

| Capa funcional | Casos cubiertos | Total declarado | Cobertura | Lectura del resultado |
|----------------|-----------------:|-----------------:|----------:|----------------------|
| Identidad | 6 | 6 | 100 % | Registro, inicio de sesión, renovación de sesión y perfil |
| Emisión y firma | 8 | 8 | 100 % | Generación de claves, cifrado de la clave privada y firma |
| Versionado | 5 | 5 | 100 % | Cadena de versiones y comparación |
| Visibilidad | 4 | 4 | 100 % | Alternancia entre documento privado y público |
| Coautoría | 6 | 6 | 100 % | Propuesta, aceptación y rechazo |
| Verificación | 5 | 5 | 100 % | Estados de verificación y detección de alteración |
| Auditoría | 5 | 5 | 100 % | Sellado, encadenamiento y validación de la cadena |
| Interfaz de usuario | 3 | 7 | 43 % | Brecha real, detalhada en la sección 10 |
| **Total** | **42** | **44** | **96 %** | |

La distribución revela un patrón que conviene explicitar: la brecha se concentra íntegramente en la capa de interfaz. Las siete capas de servidor están cubiertas al 100 %, mientras que la capa de cliente permanece en el 43 %. La causa es identificable y se expone en la sección 10.

### 4.3. Tasa de fallos

Sobre 120 casos ejecutados se registran 120 aprobados y 0 fallidos, sin pruebas ignoradas, omitidas ni pendientes. La tasa de fallos observada es del 0 %.

Esta cifra debe interpretarse con precisión. Mide la estabilidad de un conjunto cerrado de pruebas que el equipo controla, porque son precisamente las que se escribieron, y no la corrección del sistema frente a entradas no previstas. Una tasa de fallos del 0 % sobre un conjunto cerrado no permite inferir ausencia de defectos: de hecho, el defecto abierto descrito en la sección 10.1 sobrevive a la suite completa porque ninguna prueba examina ese campo. Tampoco debe confundirse con cobertura de código, que no se midió.

---

## 5. Evaluación de la Trazabilidad

| Elemento del catálogo | Cantidad | Verificación | Resultado |
|----------------------|----------|--------------|-----------|
| Requisitos funcionales | 27 | Al menos un caso de prueba asociado | 27 de 27 |
| Requisitos no funcionales | 44 | Al menos un caso de prueba o comprobación asociada | 44 de 44 |
| Casos de uso | 24 | Del CU-001 al CU-024, continuidad sin huecos | 24 de 24 |
| Historias de usuario | 33 | Descripción y criterio de aceptación | 33 de 33 |
| Puntos de acceso HTTP | 25 | 24 en cinco enrutadores más la sonda de estado | 25 de 25 |
| Eventos de auditoría | 9 | Con sello encadenado verificado | 9 de 9 |
| Tablas del modelo de datos | 7 | Migración ejecutada sin error | 7 de 7 |
| Estados de verificación | 5 | Alcanzables desde la verificación pública | 5 de 5 |

La continuidad de la numeración de los casos de uso y de los requisitos indica que no existen identificadores huérfanos ni huecos en la secuencia, lo que sugiere que la enumeración responde a un criterio explícito y no a una asignación arbitraria.

El desarrollo completo de estos cruces se encuentra en [matriz_trazabilidad.md](../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) y el catálogo de casos en [matriz_pruebas.md](../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md).

---

## 6. Evaluación Frente a los Objetivos AS-IS

El punto de partida se caracterizaba por un repositorio documental disperso en herramientas de ofimática, correo electrónico y mensajería instantánea, sin control de versiones, sin firma y con trazabilidad limitada a las cabeceras de los mensajes. Los procesos concretos están documentados en el mapa de procesos AS-IS. La tabla siguiente contrasta cada problema con la solución implementada y con la evidencia que permite medirla.

| Problema en la situación de partida | Solución implementada | Evidencia y forma de medición |
|--------------------------------------|------------------------|---------------------------------|
| El destinatario no puede confirmar si el archivo recibido es el auténtico | Verificación por carga del archivo en la ruta de verificación pública, accesible sin cuenta | El destinatario carga el archivo y obtiene uno de cinco estados; si la huella difiere del contenido registrado, el sistema responde `MANIPULATED`; la comprobación está cubierta por 5 casos de prueba |
| El documento se distribuye sin referencia verificable de origen | Código QR por documento y vista pública que conduce a la ficha de verificación | La ruta del código se genera desde la ficha del documento y la vista pública responde sin credenciales; verificado en 4 casos de prueba de visibilidad |
| Cualquiera puede alterar el contenido sin dejar rastro | Huella SHA-256 calculada en la carga y comprobada en cada verificación | La alteración de un solo byte del archivo cambia la huella y el estado pasa a `MANIPULATED` |
| El historial de versiones depende de sufijos de archivo y carpetas | Cadena de versiones numeradas por documento, con comparación entre dos versiones | 9 versiones registradas con su numeración y huella; la comparación entre versiones está implementada y probada en 5 casos |
| No existe quien responda por el contenido | Firma de la versión con la clave privada del titular, generada en el registro | 9 firmas RSA-2048 sobre huella SHA-256, una por versión; huella de la clave pública expuesta en el perfil del firmante |
| Los cambios de un tercero se aplican sin control | Propuesta firmada por un coautor que solo el propietario convierte en versión oficial | 13 propuestas registradas con los estados pendiente, aceptada y rechazada; ninguna propuesta modifica el documento sin intervención del propietario |
| No hay registro de quién hizo qué | Bitácora de solo anexado con nueve tipos de evento encadenados por hash | 42 asientos encadenados; la validación de la cadena recorre cada sello y detecta cualquier alteración retroactiva; verificado en 5 casos de prueba de auditoría |
| Los intentos de acceso indebido no se limitan | Limitador de 300 peticiones por 15 minutos y bloqueo temporal por intentos de conexión fallidos que expira solo | Comportamiento verificado mediante pruebas del limitador; el bloqueo no requiere reinicio manual para levantarse |

La reducción más significativa se produce en el ámbito de la comprobación de autenticidad: en la situación de partida exigía una consulta presencial al emisor, y en el sistema entregado se resuelve en un procedimiento autoservicio de dos pasos. Esta reducción es funcional y está verificada; no se dispone sin embargo de mediciones de tiempo con usuarios reales que permitan cuantificarla.

---

## 7. Cumplimiento de los Requisitos No Funcionales

### 7.1. Requisitos no funcionales medidos

| Requisito no funcional | Evidencia | Veredicto |
|------------------------|-----------|-----------|
| Integridad criptográfica de contenidos | Huella SHA-256 en carga y verificación, con cinco estados diferenciados | Cumplido y verificado |
| Confidencialidad de la clave privada | AES-256-GCM con clave derivada por PBKDF2-HMAC-SHA512, 100 000 iteraciones y sal de 16 bytes | Cumplido y verificado |
| Robustez de credenciales | Política de contraseña de 12 caracteres con cuatro clases de caracteres y derivación con coste 12 | Cumplido y verificado |
| Ausencia de dependencias criptográficas de terceros | 32 dependencias, todas de licencia libre, ninguna criptográfica | Cumplido |
| Robustez estática del código | 0 errores de tipos en el backend y 0 errores y advertencias en el frontend | Cumplido |
| Trazabilidad de los eventos | Cadena de sellos con verificación íntegra disponible | Cumplido y verificado |
| Estabilidad del conjunto de pruebas | 120 de 120 aprobadas | Cumplido |
| Cabeceras de seguridad y política de orígenes | Middleware de cabeceras y lista explícita de orígenes permitidos | Cumplido y verificado |

### 7.2. Requisitos no funcionales declarados pero no medidos

| Requisito no funcional | Situación | Motivo por el que no se midió |
|------------------------|-----------|--------------------------------|
| Rendimiento bajo carga | No medido | No se ejecutó ninguna prueba de carga ni de concurrencia |
| Tiempo de respuesta | No medido | No se levantaron marcas de tiempo de servicio |
| Disponibilidad y continuidad | No medido | El sistema nunca operó de forma ininterrumpida |
| Usabilidad y satisfacción | No medido | No participaron usuarios reales en pruebas de usabilidad |
| Escalabilidad | No medido | La arquitectura actual limita el volumen de datos por memoria del proceso |
| Recuperación ante desastres | No medido | No se ensayó restauración de copias de seguridad |
| Auditoría externa de seguridad | No realizado | No se contrató ni se simuló una revisión externa |
| Certificación normativa | No obtenida | El sistema no está certificado bajo norma alguna |
| Cumplimiento legal de firma electrónica | Fuera de alcance | Excluido de forma explícita por requerir autoridad acreditada |

Debe subrayarse con energía que no existe ningún dato de carga, ningún dato de usuarios reales y ninguna medición de rendimiento en este trabajo. Cualquier afirmación sobre el comportamiento del sistema bajo concurrencia, o sobre su aceptación por parte de usuarios, sería una conjetura y no debe aparecer en la memoria como resultado.

---

## 8. Riesgos Materializados y Riesgos Abiertos

### 8.1. Riesgos que se materializaron

| Riesgo | Manifestación observada | Impacto | Respuesta aplicada |
|--------|--------------------------|---------|-------------------|
| Reportar una firma válida sin comprobarla | La ruta de verificación por identificador devuelve el campo de firma fijo | Alto: induce a error al destinatario sobre la autenticidad | Identificado, documentado como defecto abierto y con plan de corrección en 10.2 |
| Desajuste entre tipos y versión del servidor | `@types/express` de la versión 5 frente a `express` de la versión 4 | Bajo en ejecución, medio en fiabilidad de la comprobación de tipos | Registrado en la deuda técnica; corrección acotada a una línea |
| Dependencia de una biblioteca en rama de mantenimiento | `multer` permanece en su rama 1 sin funcionalidad nueva | Bajo inmediato, medio a plazo | Registrado; alternativa identificada como almacenamiento de objetos |
| Arquitectura de persistencia sin escalabilidad | Interfaz de acceso a datos síncrona y base en memoria | Alto para despliegue en nube | Interfaz de driver diseñada para permitir el cambio; bloqueos documentados |
| Almacenamiento local efímero | Archivos en el sistema de archivos del proceso | Alto en plataforma sin disco persistente | Documentado como bloqueo de despliegue |
| Cobertura de interfaz insuficiente | Cuatro de siete casos de prueba de cliente ausentes | Medio: varias decisiones de interfaz se validan sin prueba automatizada | Brecha declarada y analizada en la sección 10 |

### 8.2. Riesgos que permanecen abiertos

| Riesgo abierto | Probabilidad | Impacto | Indicador temprano |
|----------------|-------------|---------|-------------------|
| Uso de la base en memoria con volumen elevado de documentos | Media | Alto | Aumento del tiempo de respuesta y del consumo de memoria del proceso |
| Pérdida de datos por cierre abrupto del proceso | Media | Alto | Ausencia de la serialización esperada tras un reinicio |
| Agotamiento del límite de tasa en uso compartido | Baja | Medio | Errores de estado por exceso de peticiones en la ruta de autenticación |
| Falsificación de identidad por ausencia de verificación de correo | Media | Medio | Uso del perfil público por terceros no verificados |
| Confianza indebida en la bitácora por ausencia de sellado de tiempo | Media | Medio | Registros sin referencia temporal confiable |
| Adopción de la vista pública como prueba de validez jurídica | Media | Alto | Uso del código QR como constancia formal ante terceros |

---

## 9. Limitaciones del Propio Estudio

Esta sección delimita el valor de lo que precede. Las limitaciones no son defectos del producto sino de la evidencia disponible.

| Limitación | Descripción | Consecuencia para las conclusiones |
|------------|-------------|-------------------------------------|
| Sin usuarios reales | No se contou con usuarios de la organización objetivo | No puede afirmarse nada sobre usabilidad, aceptación ni tiempo de ahorro real |
| Sin pruebas de carga | No se ejecutaron pruebas de concurrencia ni de volumen | No puede afirmarse nada sobre el comportamiento bajo carga |
| Sin auditoría externa de seguridad | La revisión de seguridad fue interna | Las vulnerabilidades potencialmente presentes no están cubiertas por un tercero independiente |
| Sin certificación | El sistema no está certificado bajo norma alguna | No puede presentarse como producto certificado |
| Sin despliegue en producción | La configuración de despliegue no se validó desplegando | El comportamiento en el entorno objetivo es desconocido |
| Sin verificación de correo | No hay confirmación de propiedad del correo registrado | La identidad declarada puede no corresponder a una identidad verificada |
| Legalización de la firma excluida | La firma no tiene valor de firma electrónica certificada | El uso como constancia legal queda fuera del alcance del sistema |
| Cobertura de código no medida | Se midieron casos de prueba, no líneas o ramas ejecutadas | La cifra de 96 % no es una medida de cobertura de código |

---

## 10. Análisis de la Brecha Restante y Plan de Corrección

### 10.1. La brecha del 43 % en la capa de interfaz

De los siete casos de prueba declarados para la interfaz de usuario, tres están cubiertos. Los cuatro ausentes se concentran en los recorridos que dependen de la vista pública y de la presentación de resultados al usuario final, precisamente el conjunto de recorridos donde el defecto abierto se manifiesta.

Esta concentración no es casual. Las siete capas de servidor están cubiertas al 100 %, de modo que el fallo de la vista pública no fue detectado por las pruebas de servicio ni de integración: la ruta responde con la forma de objeto esperada y contiene un campo de resultado, de modo que una prueba que verifique el código de estado y las claves presentes la da por correcta. Solo una prueba que examine el valor del campo, o que recorra la interfaz de usuario, habría revelado el problema. La brecha de pruebas de interfaz y el defecto funcional están, por tanto, relacionados de forma directa.

### 10.2. El defecto de la ruta de verificación por identificador

La ruta de verificación por identificador de documento devuelve el campo de firma con el valor fijo verdadero, sin efectuar comprobación criptográfica alguna. La comprobación real, que recalcula la huella SHA-256 del contenido y valida la firma con la clave pública del firmante, reside en la ruta de verificación por carga de archivo.

| Aspecto | Descripción |
|---------|-------------|
| Ubicación | Enrutador de verificación, ruta de consulta por identificador de documento |
| Comportamiento esperado | El campo de validez de la firma debe reflejar el resultado de una comprobación criptográfica efectiva |
| Comportamiento actual | El campo se devuelve con valor fijo verdadero, sin comprobación |
| Origen | La ruta responde al escaneo del código QR, donde no se dispone del archivo que hay que verificar |
| Impacto funcional | Un destinatario que solo use el código QR obtiene una afirmación de validez sin fundamento criptográfico |
| Impacto en la evaluación | Explica buena parte de la brecha del 43 % en la capa de interfaz |
| Gravedad | Alta, por ser el mecanismo que el usuario final interpreta como garantía de autenticidad |

### 10.3. Plan de corrección

| Paso | Acción | Criterio de cierre |
|------|--------|-------------------|
| 1 | Eliminar el valor fijo y sustituirlo por el resultado de la verificación criptográfica efectiva | El campo refleja el estado real del documento |
| 2 | Cuando el sistema no disponga del archivo, indicar de forma explícita que se trata de un dato declarativo y no verificado | La interfaz no puede inducir a error sobre la naturaleza del dato |
| 3 | Añadir casos de prueba de interfaz para los cuatro recorridos ausentes, incluido el alcanzado desde el código QR | La cobertura de la capa de interfaz pasa de 3 de 7 a 7 de 7 |
| 4 | Añadir una prueba de integración que examine el valor del campo y no solo su presencia | El defecto no puede volver a introducirse sin romper la suite |
| 5 | Revisar el resto de respuestas públicas en busca del mismo patrón de valor constante | No quedan afirmaciones de validez no verificadas |

---

## 11. Conclusión sobre el Alcance de la Tesis

El trabajo développée un sistema web completo que resuelve el problema de trazabilidad y autenticidad documental que motivó su planteamiento. En el plano de los objetivos técnicos, el alcance se cumple: el sistema sella cada versión con firma criptográfica del titular, registra la huella del contenido, encadena sus eventos en una bitácora no alterable, ofrece verificación pública sin necesidad de cuenta y gobierna la coautoría mediante propuestas firmadas.

En el plano de la calidad de construcción, el alcance también se cumple dentro de lo viable: 120 pruebas aprobadas, ausencia de errores de tipos y compilación correcta en ambos paquetes. En el plano de la trazabilidad documental, la continuidad de identificadores entre requisitos, casos de uso, historias de usuario y pruebas es completa.

En el plano de la explotación real, el alcance no se cumple y así debe declararse. Cinco bloqueos impedían operar en producción: la interfaz de acceso a datos síncrona, la ausencia de un adaptador de despliegue concreto, el almacenamiento local efímero, la configuración de despliegue no validada y la base en memoria. A ello se suma un defecto abierto de impacto alto. Ninguno de estos puntos invalida el trabajo; todos condicionan el alcance de las afirmaciones posibles.

La contribución defendible de esta tesis es un diseño y una implementación verificables de gestión documental con firma digital y trazabilidad, acompañado de un proceso de validación documentado y reproducible. La contribución no incluye, y no puede incluir, una demostración de viabilidad en producción ni una validación con usuarios reales.

---

## 12. Lecciones Aprendidas

1. **La cobertura por capas revela más que la cobertura total.** Una cifra global del 96 % habría parecido suficiente. La distribución por capas mostró que toda la brecha estaba en un único estrato, y ese hallazgo guió el diagnóstico del defecto abierto.

2. **Verificar la forma de una respuesta no es verificar su contenido.** La ruta defectuosa devolvía la estructura esperada con un campo constante. Ninguna prueba de integración que solo comprobara códigos de estado y claves presentes podía detectarlo. La lección es que las aserciones deben apuntar a los valores, no a la presencia de los campos.

3. **Un contrato síncrono en la capa de persistencia es una decisión de largo alcance.** La interfaz `DbDriver` se diseñó para permitir cambiar de motor, y aun así su carácter síncrono condiciona esa posibilidad. Abstracciones bien pensadas siguen siendo difíciles de evolucionar cuando fijan un modelo de concurrencia.

4. **Las decisiones de despliegue determinan la arquitectura, no al contrario.** Elegir un sistema de archivos local y una base en memoria fue viable en desarrollo y se convirtió en un bloqueo en producción. Las restricciones del entorno destino deben identificarse antes de diseñar la persistencia.

5. **La criptografía delegada en la plataforma reduce la superficie de ataque.** El uso exclusivo del módulo nativo `node:crypto` evitó incorporar bibliotecas criptográficas de terceros. La contrapartida aceptada fue el rendimiento inferior de la implementación pura de derivación de contraseñas, decisión razonable en un sistema de demostración.

6. **Un límite legal debe declamarse con la misma claridad que una función.** La diferencia entre firma criptográficamente válida y firma electrónica certificada no es un matiz: condiciona el uso del sistema. Mantener esa distinción visible desde la documentación inicial evitó atribuir al producto capacidades que no posee.

7. **La documentación de referencia técnica es parte del entregable, no un añadido.** La reorganización de la documentación por fases, con referencias cruzadas verificadas, es lo que permite que el conocimiento del proyecto sobreviva a la entrega.

---

## 13. Trabajo Futuro Priorizado

| Prioridad | Acción | Justificación | Dependencia |
|:---------:|--------|---------------|-------------|
| 1 | Corregir el campo de firma fijo de la ruta de verificación por identificador | Defecto de impacto alto que induce a error al usuario final | Ninguna |
| 2 | Completar las pruebas de interfaz hasta cubrir los siete casos | Cierra la brecha declarada del 43 % | Depende de la acción 1 |
| 3 | Instalar y configurar un adaptador de despliegue concreto | Elimina el bloqueo B2 | Ninguna |
| 4 | Sustituir el almacenamiento local por almacenamiento de objetos | Elimina el bloqueo B3 y habilita el despliegue sin disco | Ninguna |
| 5 | Rediseñar el contrato de acceso a datos en términos asíncronos | Habilita la adopción de un motor cliente-servidor | Refactorización amplia |
| 6 | Validar la configuración de despliegue ejecutando un despliegue de prueba | Convierte una configuración no verificada en un hecho comprobado | Depende de las acciones 3 y 4 |
| 7 | Añadir pruebas de carga y de concurrencia | Ninguna afirmación sobre rendimiento es posible sin ellas | Depende de la acción 5 |
| 8 | Alinear los tipos de Express con la versión del servidor | Resta ruido a la comprobación de tipos | Ninguna |
| 9 | Actualizar la biblioteca de recepción de archivos fuera de la rama de mantenimiento | Reduce la dependencia de un tercero sin mantenimiento | Cambios en el contrato de la biblioteca |
| 10 | Implementar verificación de propiedad del correo | Reduce el riesgo de suplantación de identidad | Servicio de correo |
| 11 | Incorporar sellado de tiempo confiable | Acorta la distancia entre firma criptográfica y constancia temporal | Servicio externo |
| 12 | Someter el sistema a una auditoría externa de seguridad | Aporta evidencia independiente sobre la postura de seguridad | Depende de la acción 6 |
| 13 | Ensayar con usuarios reales de la organización objetivo | Único camino para evaluar usabilidad y aceptación | Depende de la acción 6 |
| 14 | Evaluar la vía de certificación de firma electrónica | Cierra la brecha legal, a costa de integración con una autoridad acreditada | Decisión institucional |

---

## 14. Referencias Cruzadas

**Evaluación y mantenimiento**
- [guia_tecnica.md](./operacion/guia_tecnica.md) — arquitectura interna, catálogo de rutas y puntos de extensión
- [roadmap_produccion.md](./operacion/roadmap_produccion.md) — hoja de ruta posterior a la entrega
- [guia_despliegue_produccion.md](./operacion/guia_despliegue_produccion.md) — procedimiento de despliegue y condiciones previas
- [manual_usuario.md](./operacion/manual_usuario.md) — comportamiento del sistema desde la perspectiva del usuario

**Calidad y trazabilidad**
- [matriz_pruebas.md](../02_diseno_construccion/pruebas_calidad/matriz_pruebas.md) — catálogo de los casos de prueba
- [matriz_trazabilidad.md](../02_diseno_construccion/pruebas_calidad/matriz_trazabilidad.md) — enlace entre requisitos y pruebas
- [metricas_calidad.md](../02_diseno_construccion/pruebas_calidad/metricas_calidad.md) — indicadores de calidad y su origen
- [validacion_experimental.md](../02_diseno_construccion/pruebas_calidad/validacion_experimental.md) — protocolo de validación ejecutado
- [aplicacion_iso_29119.md](../02_diseno_construccion/pruebas_calidad/aplicacion_iso_29119.md) — correspondencia con la norma de pruebas

**Requisitos y situación de partida**
- [requerimientos.md](../01_planificacion_requerimientos/requerimientos/requerimientos.md) — catálogo de requisitos funcionales y no funcionales
- [casos_uso.md](../01_planificacion_requerimientos/requerimientos/casos_uso.md) — casos de uso CU-001 a CU-024
- [historias_usuario.md](../01_planificacion_requerimientos/requerimientos/historias_usuario.md) — historias de usuario
- [procesos_as_is.md](../02_diseno_construccion/procesos_empresa/as_is/procesos_as_is.md) — mapa de procesos de la situación de partida

**Seguridad y normas**
- [seguridad.md](./seguridad/seguridad.md) — controles implementados y amenazas analizadas
- [aplicacion_iso_27000.md](./iso_aplicada/aplicacion_iso_27000.md) — correspondencia con la familia de normas de seguridad
- [aplicacion_iso_25000.md](../01_planificacion_requerimientos/iso_aplicada/aplicacion_iso_25000.md) — modelo de calidad de producto

**Diseño e implementación**
- [arquitectura.md](../02_diseno_construccion/arquitectura/arquitectura.md) — vistas del sistema
- [modelo_datos.md](../02_diseno_construccion/arquitectura/modelo_datos.md) — diccionario de datos
- [implementacion_despliegue.md](../04_implementacion_despliegue/implementacion_despliegue.md) — procedimiento de puesta en marcha
- [plan_nube_vercel_supabase.md](../04_implementacion_despliegue/plan_nube_vercel_supabase.md) — plan de despliegue en nube
- [software_utilizado.md](../06_diagramas_y_software/software_utilizado.md) — inventario de software y licencias
- [diagrama_paquetes.md](../06_diagramas_y_software/diagrama_paquetes.md) — grafo de dependencias
- [diagrama_despliegue.md](../06_diagramas_y_software/diagrama_despliegue.md) — topología de despliegue
- [diagrama_clases.md](../06_diagramas_y_software/diagrama_clases.md) — clases y relaciones
- [glosario_tecnico.md](./referencia/glosario_tecnico.md) — definiciones de términos técnicos
