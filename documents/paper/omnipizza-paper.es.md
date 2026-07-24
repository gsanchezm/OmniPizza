# OmniPizza: Un laboratorio controlado para la automatización de pruebas multiplataforma

> **Estado:** documento base (v0.5, 2026-07-23). **Gemelo en español** de
> `omnipizza-paper.md`; la versión canónica — y la destinada a publicación — es la inglesa:
> ante cualquier discrepancia, prevalece el original. Estructura IMRyD: 1 Introducción
> (CARS) · 2 Trabajo relacionado y marco teórico · 3 Métodos (derivación, materiales, instrumentos,
> procedimiento del ejemplar, método del estudio de caso) · 4 Resultados · 5 Discusión
> (prosa + guías + enumeración de amenazas) · 6 Conclusión y disponibilidad. Todas las
> secciones están en prosa redactada — no quedan esquemas. Todas las afirmaciones
> cuantitativas pasaron verificación adversarial contra el repositorio en el snapshot fijado
> (Sección 3.1).
>
> **Títulos alternativos de trabajo:**
> - *La testabilidad como funcionalidad del producto: OmniPizza, un testbed abierto y
>   multi-mercado para la automatización de QA*
> - *Una pizzería como laboratorio: un testbed realista y determinista para la automatización
>   de pruebas multiplataforma*
>
> **Destino:** preprint de estilo académico (arXiv, cs.SE), adaptable a un track de
> herramientas/artefactos o industrial. **Idioma de publicación:** inglés. **Tipo de
> estudio:** paper de artefacto (design science) con una evaluación retrospectiva de estudio
> de caso — sin experimentos nuevos; toda la evidencia ya existe en el repositorio.

---

## Resumen

La investigación y la práctica de la automatización de pruebas dependen de objetos de
estudio compartidos, pero las señales a escala de CI están permeadas de fallos no
deterministas y ruido de triage. Los objetos existentes divergen: los corpus de defectos
están congelados para puntuación offline, los sistemas de producción resisten la inspección,
y las aplicaciones demo no llevan contratos de testabilidad versionados. OmniPizza es un
laboratorio multiplataforma abierto y desplegado públicamente (FastAPI, React, React Native)
cuya controlabilidad y observabilidad son funcionalidades diseñadas: personas caos ancladas
a credenciales, reglas de mercado/i18n como datos, inyección atómica de estado y contratos
de selectores versionados. Una descripción de artefacto verificada contra un snapshot se
combina con un ejemplar ejecutado y un estudio de caso retrospectivo embebido de una semana
de QA automatizada externa. El defecto sembrado de precios $0 evadió las cuatro capas de
prueba ($0/4$): dos capas no fueron ejecutables (drift de esquema; tooling ausente), los
tests de componentes montaron solo fixtures, y la suite golden de caracterización pasó
$46/46$ assertando el defecto como comportamiento esperado — un oráculo de prueba derivado
invertido. De $N = 19$ hallazgos externos, $11$ fueron defectos reales; los ocho no-bugs se
repartieron en una taxonomía de veredictos de ocho clases con dos falsos positivos mediados
por la instrumentación, y el triage asistido por LLM registró dos retractaciones — ambas
atribuciones que cruzaban la frontera — y una reversión de veredicto. El laboratorio, la
tabla de codificación y el fact sheet son públicos; las guías de diseño-para-testabilidad
llevan etiquetas de fuerza de evidencia. Los benchmarks vivos necesitan oráculos ciegos al
defecto y ground truth legible por máquina; en el triage asistido por IA, la disciplina de
evidencia pesa más que la elección de modelo.

## 1. Introducción

Los equipos de software modernos dependen de pruebas automatizadas en integración continua
para decidir si un cambio es seguro de publicar. Alrededor de esas suites, herramientas de
localizadores, contratos, accesibilidad y, últimamente, testing asistido por LLMs (Wang et
al., 2024) compiten por hacer más confiables las señales resultantes. El progreso en este campo siempre ha
dependido de objetos de estudio compartidos. Los investigadores miden técnicas contra
infraestructuras curadas y corpus de defectos (Do et al., 2005; Just et al., 2014); los
profesionales aprenden y calibran contra sistemas demo; y una tradición de diseño que corre
desde Freedman (1991) y Binder (1994) trata la controlabilidad y la observabilidad como
propiedades que un sistema puede ser diseñado para tener, y no accidentes que resulta
exhibir.

Los objetos de estudio disponibles tiran en direcciones distintas, y ninguno sostiene las
preguntas cotidianas de la automatización multiplataforma de UI y API. Los corpus de
defectos son controlados pero están congelados: empaquetan fallas históricas para puntuación
offline, no un producto en ejecución que un harness pueda ejercitar hoy. Los sistemas de
producción están vivos pero son inseguros y cerrados a la inspección, y las señales
obtenidas al probarlos a escala están permeadas de no determinismo (Memon et al., 2017;
Parry et al., 2022). Las
aplicaciones demo ocupan el punto medio seguro pero estrechan el problema: las personas de
SauceDemo se detienen en un puñado de comportamientos web (Sauce Labs, n.d.), y Juice Shop
apunta solo a seguridad (OWASP Foundation, n.d.). Su maquinaria de testabilidad no lleva
contrato de compatibilidad — selectores y personas pueden cambiar sin aviso — y no ha sido
estudiada como objeto de investigación por derecho propio. Lo que falta es un sistema en ejecución lo bastante realista
para que los pitfalls importen y lo bastante determinista para que las afirmaciones sean
verificables, con una instrumentación de pruebas que pueda examinarse a sí misma — un
laboratorio controlado en lugar de una demo.

Este paper propone tal laboratorio y examina lo que una semana de uso real revela sobre él.
OmniPizza es un producto abierto de pedidos de pizza, desplegado públicamente — backend
FastAPI, web React, móvil React Native — construido para que la testabilidad sea una
funcionalidad del producto: personas de fallo deterministas cuyos comportamientos viajan en
las credenciales, reglas de mercado e idioma sostenidas como datos, entrada sancionada por
inyección de estado a cualquier pantalla, y contratos de instrumentación versionados como
APIs públicas. Describimos los mecanismos de diseño y su procedencia (RQ1), catalogamos lo
que la plataforma está instrumentada para medir y ejecutamos una fila del catálogo como
ejemplar (RQ2), evaluamos la plataforma bajo una semana de QA automatizada externa mediante
un estudio de caso retrospectivo (RQ3), y destilamos guías de diseño-para-testabilidad
etiquetadas por la fuerza de su evidencia (RQ4). El laboratorio está diseñado para cuatro audiencias:
profesionales que entrenan contra pitfalls embebidos a propósito (selectores dependientes
del viewport, widgets a medida, RTL, estado de fixtures compartidos); constructores de
herramientas que necesitan un blanco de benchmark estable con defectos sembrados
documentados; investigadores que necesitan fenómenos deterministas con captura de archivo
del lado del triage del proceso de QA; y docentes que necesitan un currículum gratuito,
desplegado y reseteable. La evidencia de adopción hasta la fecha es más estrecha que esa
lista: un único harness externo (Sección 5.2).

El dominio es deliberadamente mundano. El comercio multi-mercado ejercita la
internacionalización y el layout de derecha a izquierda, reglas de validación por mercado,
aritmética de moneda e impuestos, y flujos de checkout — una envolvente de complejidad
realista sobre un vocabulario lo bastante pequeño como para que ningún lector necesite
entrenamiento en el dominio.

- **Preguntas de investigación** (tipadas según Wieringa, 2014; cada una nombra su evidencia
  y su fuerza):
  - **RQ1 (pregunta descriptiva de diseño).** ¿Qué mecanismos de diseño hacen que un producto
    multiplataforma realista funcione como laboratorio de pruebas controlado — determinista,
    controlable, observable — sin dejar de ser realista? *Evidencia: la descripción verificada
    del artefacto, Secciones 3.1–3.2.*
  - **RQ2 (pregunta de capacidad/affordance).** ¿Qué propiedades relacionadas con el testing
    está instrumentada la plataforma para medir? *Evidencia: el catálogo de affordances,
    Sección 3.3; una fila se ejecuta vía el procedimiento de la Sección 3.4 (resultados en la
    Sección 4.1), la fila del proceso de QA la ejercita la Sección 4.2, y el resto siguen
    siendo afirmaciones de diseño.*
  - **RQ3 (pregunta de validación).** ¿Cómo se comporta la plataforma bajo uso real de QA
    automatizada externa? *Evidencia: el estudio de caso retrospectivo (método en la
    Sección 3.5, resultados en la Sección 4.2) — una prueba de existencia con un despliegue y
    un harness externo.*
  - **RQ4 (pregunta prescriptiva).** ¿Qué guías transferibles de diseño-para-testabilidad,
    con qué trade-offs, se siguen del diseño y de su evaluación? *Evidencia: Sección 5.1, cada
    guía etiquetada por fuerza de evidencia.*
- Contribuciones (lista aprobada):
  1. La plataforma, puesta a disposición de las cuatro audiencias anteriores: abierta,
     desplegada públicamente, reproducible (3 desplegables, 5 mercados / 6 idiomas incl. RTL,
     7 usuarios caos deterministas, 20 operaciones `/api` bajo contrato, suites de prueba
     heterogéneas).
  2. Un catálogo de patrones para el diseño de productos testability-first (Sección 3.2).
  3. Un catálogo de propiedades que el laboratorio está instrumentado para medir o estudiar
     (Sección 3.3).
  4. Evaluación en uso real: una semana de QA automatizada externa — 19 hallazgos, una
     clasificación preliminar de veredictos de 8 clases, y falsos positivos mediados por la
     instrumentación (Secciones 3.5 y 4.2).
  5. Guías de diseño-para-testabilidad etiquetadas por fuerza de evidencia (Sección 5.1).

## 2. Trabajo relacionado y marco teórico

Las aplicaciones demo construidas a propósito son los parientes más cercanos. SauceDemo
introdujo la persona de prueba determinista — `problem_user` — como recurso pedagógico
(Sauce Labs, n.d.); OmniPizza extiende el patrón a personas de latencia, de fallo
probabilístico, de accesibilidad y de seguridad, y mueve la imposición al lado del servidor,
dentro de la credencial. OWASP Juice Shop siembra vulnerabilidades reales para entrenamiento
en seguridad (OWASP Foundation, n.d.), un primo de un solo ámbito de la persona
`security_glitch`. TodoMVC estandariza una aplicación a través de muchas implementaciones
(TasteJS, n.d.) — un benchmark de frameworks, no de testing. Ninguna de las tres versiona su
maquinaria de testabilidad ni captura el proceso de QA que hospeda.

Los benchmarks de defectos se acercan al ground truth desde la dirección opuesta. Defects4J
empaqueta fallas históricas de Java para evaluación controlada de herramientas (Just et al.,
2014), BugsJS hace lo mismo para JavaScript (Gyimesi et al., 2019), y la infraestructura SIR
defendió tempranamente los artefactos experimentales compartidos (Do et al., 2005). Esos
corpus están deliberadamente congelados; OmniPizza está deliberadamente vivo — sus modos de
fallo sembrados son reproducibles contra un despliegue en ejecución, y el proceso circundante
(hallazgos, veredictos, retractaciones) queda archivado como datos. El costo de la vida,
como muestra la Sección 4.1, es que el ground truth debe defenderse activamente de las
suites que lo caracterizan.

Una tercera vertiente diseña la testabilidad y sus instrumentos. La tradición de
controlabilidad/observabilidad (Freedman, 1991; Binder, 1994) se operacionaliza aquí como
funcionalidades del producto (Sección 2.1). El trabajo de localizadores robustos como
Robula+ trata la fragilidad de selectores como un problema algorítmico (Leotta et al.,
2016); OmniPizza la trata como uno contractual — selectores estables versionados como una
API — mientras embebe deliberadamente la fragilidad (sufijos dependientes del viewport) que
esos algoritmos combaten. Los fallos de presentación de internacionalización tienen
detectores dedicados (Alameer et al., 2016); el laboratorio provee la superficie
multi-mercado con RTL para ejercitarlos, con los criterios de éxito de WCAG (Campbell et
al., 2024) y axe-core (Deque Systems, 2026) anclando la dimensión de accesibilidad.

Los fenómenos que la evaluación genera tienen cada uno literatura propia: tests flaky y
ruido de CI (Luo et al., 2014; Memon et al., 2017; Parry et al., 2022); falsos positivos de
análisis estático y su recepción por desarrolladores (Bessey et al., 2010; Johnson et al.,
2013; Sadowski et al., 2018); contaminación de estado de prueba y sus remedios de
aislamiento (Zhang et al., 2014; Gyori et al., 2015; Bell & Kaiser, 2014); y calidad de
reportes de bugs, misclasificación y triage de duplicados (Bettenburg et al., 2008; Herzig
et al., 2013; Runeson et al., 2007). La Sección 5 dialoga con cada una donde los datos la
tocan. La novedad que aquí se reclama no es ningún fenómeno individual sino una plataforma
en la que todos ellos son deterministas, reproducibles y archivados.

Por último, el estudio se sitúa en dos corrientes metodológicas — testing y triage asistidos
por LLM bajo supervisión humana (Wang et al., 2024; Kang et al., 2023; Fan et al., 2023;
Amershi et al., 2019) y artefactos de design science validados por estudio de caso (Hevner
et al., 2004; Wieringa, 2014; Runeson & Höst, 2009; Yin, 2018) — ambas aplicadas como
restricciones operacionales en la Sección 2.1 en lugar de recitadas aquí.

### 2.1 Marco teórico: un mapa operacional

Cuatro lentes teóricos hicieron trabajo estructural en este estudio. Cada uno se enuncia aquí
solo en la forma en que restringió el diseño, y cada concepto abstracto queda anclado a una
variable que las Secciones 3–4 miden.

**La testabilidad como controlabilidad más observabilidad** (Freedman, 1991; Binder, 1994).
El lente sostiene que un sistema es testeable en la medida en que su estado puede fijarse y
su comportamiento verse. En este estudio, la controlabilidad se operacionaliza como el
mecanismo de personas caos y los puntos de entrada de inyección atómica de estado: el claim
JWT `behavior` con sus parámetros fijos — el retardo de $3.0\,\mathrm{s}$, el fallo de
checkout con $p = 0.5$ (un parámetro de diseño de la persona, no un nivel de
significancia), el pool de payloads $3 \times 3$ de la Sección 3.2.1 — y los
parámetros de entrada sancionados de la Sección 3.2.3. La observabilidad se operacionaliza
como el contrato de selectores (las $165$ ocurrencias web y $114$ móviles de la
Sección 3.2.4), los rechazos por header obligatorio y el archivo durable de triage de la
Sección 3.5. El lente dictó método, no solo vocabulario: como ambas propiedades se afirman
*diseñadas*, la RQ1 se responde con una descripción de artefacto verificada contra el código
(Sección 3.1) y no con encuestas de percepción, y el catálogo de la Sección 3.3 enumera
instrumentos dimensión por dimensión. Como flujo:
$\text{persona} \xrightarrow{\text{claim JWT}} \text{fallo determinista}
\xrightarrow{\text{selectores, archivos}} \text{observación medible}$.

**El problema del oráculo, en forma derivada** (Weyuker, 1982; Barr et al., 2015). Barr et
al. clasifican los oráculos de prueba en especificados, derivados, implícitos y ninguno; una
suite de caracterización es un *oráculo de prueba derivado* — aprende qué esperar del
comportamiento que observa. Para un sandbox cuyos defectos son intencionales, el lente
produce una predicción falsable: si $\text{oráculo} \leftarrow \text{comportamiento}$ y
$\text{defecto} \subseteq \text{comportamiento}$, el oráculo certifica el defecto y
$\text{detección} = 0$. El procedimiento del ejemplar de la Sección 3.4 somete esta predicción
a prueba directa — suites ejecutadas tal cual, ground truth confirmado en vivo
($12/12$ ítems a precio $0.0$) antes de cualquier corrida — y la Sección 4.1 reporta el
resultado para la capa del oráculo derivado junto a los modos de fallo independientes de las
otras tres capas; la lectura del lente se aplicó en tiempo de análisis, conforme a la
disciplina ex-ante/ex-post de la Sección 3.1. El concepto abstracto *ground truth* se operacionaliza hoy
como el estado sembrado confirmado en vivo y, prospectivamente, como el manifiesto de
defectos legible por máquina (Sección 5.2).

**Falsos positivos efectivos** (Sadowski et al., 2018). La noción abstracta de que la
utilidad de un hallazgo es relativa a su consumidor se operacionaliza en la descomposición
del veredicto en tres variables de la Sección 3.5 — veredicto binario, taxonomía de ocho
clases y narrativa de causa raíz con flag de confianza — más el flag ortogonal
`instrumentation-mediated`, todos transportados por hallazgo en `findings.csv`. La
prevalencia de misclasificación (Herzig et al., 2013) motivó la separación: una sola
variable de veredicto habría confundido retractación con reversión, así que el instrumento
las distingue por construcción.

**Design science con un brazo de validación por estudio de caso** (Hevner et al., 2004;
Wieringa, 2014; Runeson & Höst, 2009; Yin, 2018). La plataforma se trata como un artefacto
diseñado y validado en contexto: su justificación se reconstruye y etiqueta por procedencia
(Sección 3.1), el contexto es una semana de QA automatizada externa, y la validación es un
estudio de caso retrospectivo embebido cuyo requisito de triangulación se cumple con tres
fuentes de archivo (Sección 3.5). Este lente fijó el techo epistémico por adelantado —
generalización analítica y no estadística — y por eso las afirmaciones del paper son pruebas
de existencia, sus guías llevan etiquetas de fuerza de evidencia (Sección 5.1) y no aparece
estadística inferencial en ninguna parte.

| Concepto abstracto | Operacionalizado como | Dónde |
|---|---|---|
| Controlabilidad | claim `behavior` de las personas ($3.0\,\mathrm{s}$; $p = 0.5$; payloads $3 \times 3$); parámetros de entrada atómica | 3.2.1, 3.2.3 |
| Observabilidad | ocurrencias de selectores ($165$ web, $114$ móvil); rechazos por header obligatorio; archivo durable de triage | 3.2.4, 3.5 |
| Oráculo derivado | aserciones de la suite golden (p. ej., `expect(p01.price).toBe(0)`) | 3.4, 4.1 |
| Ground truth | estado sembrado confirmado en vivo ($12/12$ a $0.0$); manifiesto de defectos planificado | 3.4, 5.2 |
| Falso positivo efectivo | veredicto binario, clase de taxonomía y flag `instrumentation-mediated` como variables separadas | 3.5, `findings.csv` |
| Triangulación | tres fuentes de archivo (documentos de explicación, historial de git, reportes QA citados) | 3.5 |
| Tratamiento en contexto | plataforma desplegada ejercitada por un harness externo | 3.5, 4.2 |
| Generalización analítica | etiquetas de fuerza de evidencia en las guías | 5.1 |

## 3. Métodos

El estudio combina dos instrumentos unidos por un ejemplar ejecutado de bajo costo: una
descripción de artefacto de design science y un estudio de caso retrospectivo embebido. Las
preguntas de investigación mapean a evidencia así: RQ1 → la descripción verificada de la
plataforma (3.2); RQ2 → el catálogo de instrumentación (3.3), con una fila ejecutada vía el
procedimiento de 3.4 (resultados en 4.1); RQ3 → el método del estudio de caso (3.5;
resultados en 4.2); RQ4 → las guías derivadas en la discusión (5.1).

### 3.1 Derivación y verificación de la descripción de la plataforma

La justificación de diseño se reconstruyó exclusivamente desde fuentes de archivo fechadas —
los documentos de requisitos de producto y de diseño del repo, las dos guías de testing atómico, el
documento de arquitectura QA y el historial de git ($209$ commits, 2026-02-07 → 2026-07-22) —
y no desde el recuerdo de los autores, de modo que cada afirmación de diseño traza a un
artefacto que el lector puede abrir. La exactitud descriptiva se impuso después de forma
mecánica. Cada afirmación cuantitativa de las Secciones 3–4 se verificó contra el repositorio — código
y documentos de archivo — en un snapshot fijado, commit `83b8ba4` (2026-07-22, el último commit de
producto de la ventana de estudio), mediante una pasada adversarial de verificación de hechos
ejecutada con independencia de la pasada de redacción; la separación se eligió porque las
descripciones auto-verificadas heredan los supuestos de quien redacta, y aquí se ganó el
sueldo — tres afirmaciones redactadas (la superficie de imposición del header obligatorio, el alcance
de la latencia inyectada y un conteo de widgets) fueron refutadas contra el código y
corregidas. Cada conteo
superviviente lleva una regla de conteo explícita — qué se cuenta, qué se excluye y el
comando que reproduce el número — consolidada en el apéndice de hoja de datos, compañero
obligatorio de este paper y no material opcional.

Los principios de diseño llevan una segunda etiqueta: la procedencia. Los mecanismos declarados como
metas en los documentos fundacionales (personas caos, mercado-como-datos, entrada atómica,
contratos de selectores) se marcan *ex-ante*; las codificaciones de lecciones operativas —
el anclaje del perfil al login de la Sección 3.2.5, introducido a mitad de la historia para
arreglar una carrera de login observada, y un guard defensivo de deep links — se marcan
*ex-post*. El etiquetado se adoptó para que el catálogo no presente la retrospectiva como
previsión.

### 3.2 Materiales: la plataforma OmniPizza (RQ1)

Tres desplegables — backend FastAPI, web React/Vite, móvil Expo/React Native — más suites de
prueba dentro y fuera de los paquetes de la app. La superficie de producto es un flujo de
pedido completo (login, catálogo, constructor de pizzas, checkout, seguimiento de pedido,
perfil) sobre un catálogo de 12 pizzas localizado en 6 idiomas. Los mecanismos de
testabilidad son funcionalidades del producto con las mismas garantías de compatibilidad que
las funcionalidades de usuario.

#### 3.2.1 Caos-por-identidad: los modos de fallo viajan en las credenciales

Siete usuarios de prueba deterministas (contraseña compartida), cada uno con un claim
`behavior` en su JWT que el backend impone del lado del servidor:

| Usuario | Comportamiento impuesto |
|---|---|
| `standard_user` | comportamiento nominal |
| `locked_out_user` | login siempre rechazado |
| `problem_user` | precios en $0 e imágenes de catálogo rotas |
| `performance_glitch_user` | retardo fijo de 3.0 s inyectado en los endpoints habilitados para behavior (obtención de catálogo y checkout) |
| `error_user` | el checkout falla con HTTP 500 con p = 0.5 |
| `a11y_glitch_user` | un modo de defecto de accesibilidad por llamada de catálogo/carrito, sorteado entre 3 modos; el modo de idioma-equivocado sortea entre los 6 idiomas soportados |
| `security_glitch_user` | campos de perfil sembrados con XSS (un par aleatorio por login de un pool de 3 campos × 3 payloads), fugas de mensajes de error internos con p = 0.5, bypass de propiedad de pedidos |

Como el modo de fallo va anclado a la *identidad*, compone ortogonalmente con cada mercado,
idioma y plataforma — sin flags de entorno, sin configuración de prueba del lado del
servidor, y dos tests que usan personas distintas jamás interfieren entre sí.

#### 3.2.2 La complejidad multi-mercado como datos, no como código

Una tabla de configuración gobierna 5 mercados (MX, US, CH, JP, SA): moneda y conversión,
reglas de decimales (JPY: 0 decimales), tasas de impuesto (8–16%), un campo de dirección
obligatorio específico del mercado (`colonia` / `zip_code` / `plz` / `prefectura` /
`district`) y un nombre localizado para el campo de propina (`propina` / `tip` / `trinkgeld`
/ `chip` / `baksheesh`). Una regla de validación a nivel de modelo impone además el formato
de 5 dígitos del zip de US. SA suma el layout árabe de derecha a izquierda. Las reglas de mercado son, por tanto, *dimensiones de prueba enumerables*: un
generador de tests puede recorrer la tabla en lugar de hacer ingeniería inversa de ramas.

#### 3.2.3 Inyección atómica de estado: entrada O(1) a cualquier pantalla

Ambas plataformas exponen bypasses sancionados que colocan un test *directamente en* el
estado objetivo en lugar de repetir el recorrido del usuario:

- **Web:** sembrar `localStorage` (conjunto de claves documentado con el formato de envelope
  del store), sembrar estado de backend vía `POST /api/cart` y `POST /api/store/market`, y
  navegar directo a la ruta objetivo; la página de Checkout se hidrata desde `GET /api/cart`
  cuando su carrito local está vacío.
- **Móvil:** deep links `omnipizza://` a 6 pantallas con parámetros universales
  (`accessToken` evita el login, `market`, `lang`, `resetSession`, `hydrateCart`), más un
  argumento de lanzamiento de Detox para la selección de mercado.

Los bypasses son funcionalidades versionadas y estructurales — y la Sección 4.2 desglosa su
costo: la misma maquinaria, funcionando exactamente como fue diseñada, propició falsos
positivos durante el uso real de QA.

#### 3.2.4 Contratos de instrumentación como APIs versionadas

Cada elemento interactivo lleva un selector estable (165 ocurrencias de `data-testid` en web,
114 de `testID` en móvil, convención de prefijos compartida); las rutas y las formas de
respuesta están congeladas. La superficie de API bajo contrato es de 20 operaciones de ruta
`/api` (18 paths distintos; 22 operaciones incluyendo la raíz y los probes de salud). Los
endpoints de *lectura* sensibles al mercado — obtención de catálogo e hidratación de carrito
— rechazan solicitudes sin el header `X-Country-Code` (HTTP 400); el checkout, en cambio,
lleva el mercado en el cuerpo de la solicitud. Renombrar un selector se trata como cambio
rompiente — la testabilidad tiene la misma disciplina de compatibilidad que una API pública.

#### 3.2.5 Estado efímero como aislamiento

El backend persiste todo en memoria: reinicio = borrón determinista y cuenta nueva. El estado
editable del perfil se ancla a la sesión de login (un claim JWT `sid` por login), de modo que
sesiones concurrentes del mismo usuario de prueba compartido obtienen perfiles aislados — una
lección de diseño *ex-post*: el anclaje se introdujo a mitad de la historia para arreglar una
carrera de login observada. La contracara, la retención de estado en instancias calientes
sobre fixtures compartidos, se conserva deliberadamente: genera exactamente los fenómenos de
fixture compartido que la Sección 4.2 estudia.

#### 3.2.6 Un currículum de automatización deliberadamente embebido

Los pitfalls reales de la automatización están reproducidos a propósito: sufijos de selector
dependientes del viewport que conmutan en un breakpoint responsivo, una clave de
deploy-guard que borra silenciosamente el estado de auth sembrado ingenuamente, un envelope
de persistencia que debe reproducirse con exactitud, y un zoológico de widgets interactivos
hechos a mano (9 en web, 11 en móvil: toasts, modales de confirmación, dropdowns a medida, un
flujo de pago falso en formulario, date pickers multiparte). Practicar contra
OmniPizza es encontrarse con los pitfalls que las apps de producción contienen por accidente
— aquí documentados y estables.

#### 3.2.7 Un portafolio de pruebas de referencia sobre un mismo sistema

Cuatro capas de prueba heterogéneas — desde tests de componentes dentro del repo hasta una
suite de API externa — apuntan al mismo producto: tests de contrato generados por esquema
(Schemathesis, el número de casos escala con el esquema OpenAPI), 41 casos de integración de
API escritos a mano que incluyen una suite golden de caracterización (46 ejecutados en
runtime vía expansión parametrizada; regla de conteo en el fact sheet), 11 specs de tests de
componentes, y experimentos E2E de resiliencia a latencia por plataforma. Esto habilita la
comparación en igualdad de condiciones de qué detecta cada capa (procedimiento en la
Sección 3.4; resultados en la Sección 4.1). El documento de requisitos del producto entrega
además una
matriz de aceptación de flujos negativos de 13 escenarios (códigos de estado y resultados de
UI esperados), usable directamente como dataset de oráculos.

### 3.3 Instrumentos: lo que el laboratorio está instrumentado para medir (RQ2)

Formato del catálogo: dimensión → instrumento que provee la plataforma → medición de ejemplo
→ estado. Este es un catálogo de *affordances*: las filas son afirmaciones de diseño sobre
qué estudios habilita la plataforma, no resultados ejecutados; la columna de estado registra
qué filas ejercita este paper.

| Dimensión | Instrumento | Medición de ejemplo | Estado |
|---|---|---|---|
| Poder de detección por capa de prueba | el mismo defecto sembrado (p. ej., los precios $0 de `problem_user`) observable en las capas de contrato, API, componente y E2E | qué capas lo atrapan; costo por detección | **ejecutada como ejemplar (4.1): 0 de 4 capas lo detectan tal cual** |
| Resiliencia a latencia | `performance_glitch_user` (3 s fijos en catálogo y checkout) + endpoint de debug latency-spike (0.5–5 s aleatorios) | manejo de timeouts, corrección de estados de carga, tasa de flakes vs. retardo | affordance — aún no ejecutada |
| Manejo de fallos probabilísticos | `error_user` (checkout 500 con p = 0.5) | lógica de reintentos, consistencia de la UX de error, comportamiento de políticas de test-retry | affordance — aún no ejecutada |
| Detección de accesibilidad | `a11y_glitch_user` (3 modos de defecto en llamadas de catálogo/carrito) | recall del tooling de a11y contra defectos sembrados conocidos | affordance — aún no ejecutada |
| Detección de seguridad | `security_glitch_user` (payloads XSS, fugas de información, bypass de propiedad) | recall de escáneres contra vulnerabilidades sembradas conocidas | affordance — aún no ejecutada |
| Corrección de i18n / RTL | 6 idiomas incl. árabe RTL; 5 conjuntos de reglas de mercado; copy multiplataforma | divergencia de copy entre plataformas; verificaciones de layout RTL; cobertura de validación por mercado | ejercitada incidentalmente en la Sección 4.2 (hallazgos de divergencia de copy) |
| Costo de setup y superficie de flakes | entrada atómica (3.2.3) vs. recorrido completo hasta el mismo estado | pasos/tiempo-al-estado; qué flakes desaparecen con entrada atómica | affordance — aún no ejecutada |
| Robustez de estrategias de selectores | sufijos dependientes del viewport, zoológico de widgets, RTL | supervivencia de localizadores entre viewports/idiomas | affordance — aún no ejecutada |
| Fenómenos del proceso de QA | replay determinista + artefactos de triage durables + despliegues públicos | taxonomías de triage, procedencia de falsos positivos, estudios de artefactos de harness | ejercitada — Sección 4.2 |

### 3.4 Procedimiento del ejemplar: el defecto sembrado de precios $0 a través de las cuatro capas

Para convertir una fila del catálogo de afirmación de diseño en evidencia, el portafolio de
la Sección 3.2.7 se ejecutó **tal cual está** — sin modificar ninguna suite — contra el defecto
sembrado de `problem_user`, el 2026-07-23, sobre una instancia local en el snapshot fijado
(backend servido en el puerto $8000$ con estado en memoria fresco; Vitest 4.0.18 vía
`npx vitest run`, con el `fileParallelism: false` fijado en el repositorio porque las suites
comparten un único backend con estado; Cypress 15.11.0 headless vía `cypress run --component`;
Schemathesis 3.25.1 bajo pytest 7.4.4 con `max_examples = 50` por endpoint). El ground truth
se confirmó en vivo antes de las corridas: un login de `problem_user` seguido de una
obtención de catálogo devolvió $12/12$ pizzas a precio $0.0$ con la URL de imagen rota. Los
resultados se reportan en la Sección 4.1.

### 3.5 Método del estudio de caso: una semana de QA automatizada externa (RQ3)

**Escenario.** Un harness externo de QA automatizada — suites de UI y API que abarcan
múltiples mercados e idiomas en web y móvil, operado por un tercero y observable para los
autores únicamente a través de sus reportes — ejercitó la plataforma desplegada públicamente
durante una semana (2026-07-16 → 2026-07-22). Resultaron seis ciclos de triage: cinco
reportes con hallazgos más una ronda de re-verificación. Cada hallazgo fue triado por un
agente LLM (Claude, Anthropic) bajo reglas permanentes definidas por humanos y con puntos de
control de decisión humana por lote, y cada ciclo produjo un documento de explicación durable
y fechado en el momento del triage — antes de que este paper fuera concebido (caveats de
procedencia documental: Sección 5.2).

**Diseño.** La evaluación se enmarcó como un estudio de caso retrospectivo embebido de caso
único (Runeson & Höst, 2009; Yin, 2018): el caso es la semana de operación; las unidades
embebidas son los hallazgos. Se eligió un diseño retrospectivo porque el triage ocurrió como
trabajo de ingeniería normal, lo que elimina el sesgo de diseñar-para-publicar del proceso
bajo estudio — al costo de las preocupaciones de auto-reporte declaradas en la Sección 5.2.

**Datos e inclusión.** Se triangularon tres fuentes de archivo: los seis documentos de
explicación fechados (escritos en español), el historial de git (los commits de fix se citan
por hash dentro de los documentos y fueron re-resueltos contra el repositorio) y el contenido
de los reportes de QA citado en los documentos — los reportes crudos los borra el flujo de
triage y sobreviven solo como citas, una limitación declarada. Un hallazgo equivale a un ítem
numerado en la segmentación contemporánea de los documentos; la regla se adoptó para no
re-segmentar el corpus con retrospectiva. Tres reglas de exclusión producen $N = 19$: un ítem
que el equipo reportante había descartado antes de la ventana, dos bugs que el propio reporte
atribuyó al código del harness, y bugs hermanos del mismo patrón autodescubiertos en sweeps
de fixes. Las dos primeras exclusiones eliminan no-bugs del denominador y por tanto sesgan
*al alza* la tasa medida de bugs reales; la dirección se declara para que el lector pueda
razonar sobre ella (Sección 5.2).

**Codificación.** Los hallazgos se codificaron mediante una pasada de extracción asistida por
LLM sobre las fuentes en español y fueron revisados por un humano fila por fila contra el
texto citado; la traducción al inglés ocurrió durante la codificación y fue revisada por
humanos. El estado del veredicto se descompuso deliberadamente en tres variables — un
veredicto binario (bug de la app / no bug de la app), una de ocho clases de taxonomía, y una
narrativa de causa raíz con flag de confianza `confirmed` / `candidate` / `unidentified` —
porque el corpus contiene eventos que una sola variable de veredicto confundiría: dos
retractaciones de causa raíz que dejaron en pie los veredictos binarios, y una reversión de veredicto que
invirtió un veredicto binario por completo. Un cuarto atributo codificado, el flag
`instrumentation-mediated`, toma los valores true / false / candidate y se fija en true solo
cuando un mecanismo sancionado de inyección de estado — hidratación de carrito,
`resetSession`, sembrado de perfil — es el vehículo del hallazgo; los patrones de uso del
harness, como logins en paralelo, no califican. Todas las tasas usan veredictos finales; la única
divergencia bajo veredictos iniciales (un ciclo puntuó $3/3$ al final pero $2/3$ al inicio)
se reporta al lado. La tabla completa de codificación se entrega como `findings.csv`
(apéndice), que además registra el release en el que se publicaron los fixes de cada ciclo,
porque $11$ bugs se arreglaron y cinco releases se publicaron *durante* la ventana (cuatro
de ellos derivados del triage; el quinto, v1.1.6, fue trabajo concurrente de features) — las
tasas por ciclo describen por tanto un artefacto en movimiento, una amenaza que la Sección 5.2
registra.

**Protocolo bajo estudio.** El propio protocolo de triage — el objeto de la RQ3 — imponía
reproducción empírica contra el sistema en ejecución (replay de API, reproducción con estado
sembrado, reproducción en dispositivo vía `adb`, corridas de axe-core 4.9.1 en página) antes de
cualquier veredicto que exonerara a la app; los bugs confirmados con causa evidente a nivel
de código podían veredictarse por auditoría de código más medición dirigida. Exigía además
fix-and-commit con hashes de conventional commits para los bugs confirmados, documentos de
explicación durables para cada ciclo, y autorización humana explícita por push y por release.

## 4. Resultados

### 4.1 El ejemplar: el defecto sembrado de precios $0 a través de las cuatro capas

Ninguna capa reportó un fallo atribuible al defecto sembrado — detección de $0/4$. Dos de
las cuatro capas no llegaron a ejecutarse. Observaciones por capa:

| Capa | Resultado observado (tal cual está) |
|---|---|
| Contrato (Schemathesis) | La colección falló antes de ejecutar caso alguno: la versión 3.25.1 lanza `SchemaError` sobre el documento OpenAPI 3.1.0 del backend ("currently not fully supported"). Independientemente, `price` no lleva restricción `minimum` en ninguno de los dos esquemas de respuesta (`Pizza`, `EnrichedCartItem`); un valor de $0$ es válido contra el esquema |
| Integración de API (Vitest) | $46/46$ casos pasaron con el defecto activo. Dos casos assertan el defecto como comportamiento esperado de `problem_user`: `expect(p01.price).toBe(0)` y la URL de imagen rota (`tests/golden.test.ts`) |
| Componentes (Cypress) | $14/15$ casos en $11$ specs pasaron. Cada spec se monta con datos de fixture (`price: 12.99`); ninguno emite una solicitud al backend. El único spec fallido (`ProductCard.cy.jsx`) lanzó `TypeError: t is not a function` al montar; el spec es anterior a la prop `t` del componente. La capa corre bajo `continue-on-error: true` en CI |
| E2E (Detox) | No se ejecutó. `detox` y `jest` no figuran en las dependencias del workspace; `e2e/jest.config.js`, referenciado por `.detoxrc.js`, no existe; el APK `androidTest` publicado contiene $4$ entradas ($8{,}518$ bytes) y ninguna clase Detox. El único spec no contiene aserciones de precio y se autentica solo como `standard_user` y `performance_glitch_user` |

La interpretación de estos resultados — la tensión detección-vs-caracterización, las capas
decaídas y el requisito de oráculos que implican — se difiere a la Sección 5.

### 4.2 Una semana de QA automatizada externa

**El laboratorio como app bajo prueba.** 19 hallazgos; 11/19 bugs reales, todos arreglados y
liberados (4 de los 6 ciclos produjeron un release). Tasa de bugs reales por ciclo: 6/8
(07-16) → 1/3 (07-18) → re-verificación, 0 nuevos (07-19) → 1/2 (07-20) → 3/3 (07-21) → 0/3
(07-22) — no monótona; el declive es en severidad y en los extremos (el ciclo tardío
todo-real fue exclusivamente drift de copy de localización de baja severidad).

**El laboratorio como generador de fenómenos.** Los 19 hallazgos se distribuyen en una
clasificación preliminar de veredictos de 8 clases (bug real; artefacto del harness; estado
de fixture compartido; infraestructura; aceptado-por-diseño; terceros; no
reproducible; exonerado-sin-atribución). Los 8 hallazgos no-bug se descomponen así: 1
artefacto del harness, 1 estado de fixture compartido, 1 infraestructura, 2
exonerados-sin-atribución, 1 aceptado-por-diseño, 1 de terceros, 1 no reproducible.
Destacados:

- **Falsos positivos mediados por la instrumentación:** 2 confirmados — un deep link
  `resetSession` disparado a mitad de sesión por el harness (clase: artefacto del harness) y
  la hidratación de carrito haciendo aflorar un carrito huérfano dejado por tests anteriores
  (clase: estado de fixture compartido; la funcionalidad de hidratación es el vehículo, el
  remanente del fixture la causa) — más 1 candidato (el sembrado de perfil, uno del par
  exonerado-sin-atribución). El atributo `instrumentation-mediated` es ortogonal a la clase.
- **Fenómenos de entorno:** un único arranque en frío del free tier medido oportunistamente
  en 31.5 s (las solicitudes calientes oscilaron entre 215–663 ms en verificaciones
  repetidas) presentándose como un bug de "tracking lento" específico de un mercado.
- **Modos de fallo del triage:** 2 retractaciones de causa raíz y 1 reversión de veredicto
  (un falso negativo del triage que se revirtió cuando se conoció la semántica de aserción
  contains-substring del harness) — ambas explicaciones retractadas eran atribuciones sobre
  el harness externo inobservable, mientras que toda exoneración empírica del lado de la app
  sobrevivió.

La interpretación de estos resultados se difiere a la Sección 5.

## 5. Discusión

El número titular del ejemplar es pequeño pero afilado. Cero de cuatro capas marcaron un
defecto cuyo ground truth era conocido y estaba confirmado en vivo. Los datos sugieren que
en un sandbox cuyos defectos son intencionales, la detección y la caracterización tiran en
direcciones opuestas: la suite que vigila el catálogo más de cerca es precisamente la que
certifica los precios de $0$ como correctos. Esto se lee como el problema del oráculo de
Weyuker (1982) en forma invertida — un oráculo existe y se ejecuta, pero está alineado con
el defecto y no con el requisito. Barr et al. (2015) clasifican los oráculos de prueba en especificados, derivados, implícitos
y ninguno; una suite de caracterización es un oráculo de prueba derivado, y la derivación es
aquí la vulnerabilidad, porque deriva del comportamiento y el comportamiento está sembrado. Donde
los benchmarks de defectos tratan las fallas curadas como ground truth contra el que se
puntúa la detección (Just et al., 2014; Do et al., 2005), un laboratorio vivo aparentemente
debe mantener la disciplina opuesta: conservar al menos un oráculo ciego a lo que la
plataforma sembró. El manifiesto de defectos planificado es esa disciplina hecha explícita.

Las dos capas no ejecutables cuentan una historia más silenciosa. El drift de versión de
esquema y el tooling ausente no son fallas exóticas; son la bugosidad ordinaria del código
de prueba que documentan Vahabzadeh et al. (2015), agravada aquí por una configuración de CI
que corre la capa de componentes en modo no bloqueante — de modo que su único spec fallido
no tenía canal por el cual hacerse notar. Es plausible que el modo no bloqueante, adoptado
para mantener el ruido fuera del camino del merge, funcionara exactamente como se pretendía
y aun así produjera rot: Sadowski et al. (2018) argumentan que los desarrolladores descartan
los hallazgos que perciben como no accionables, y una suite permanentemente ignorable es el
caso límite de la no accionabilidad. El mecanismo que protege la velocidad del trunk también
silencia la alarma de humo. Ejecutar incluso las capas nominalmente sanas no fue pulcro: en
la máquina del estudio, el binario pineado de Cypress falló dos veces al desempacarse con su
propio instalador y hubo que descargarlo y extraerlo a mano antes de que la suite de
componentes arrancara, y una corrida planeada de la capa E2E en un dispositivo Android
físico quedó cancelada en el momento en que afloró el tooling ausente. La fricción de
apenas revivir capas decaídas es, encontramos, parte de su costo.

Los hallazgos no-bug de la evaluación caen en una tasa reconocible pero en una ubicación
poco familiar. Ocho de diecinueve hallazgos ($8/19$) no eran, bajo veredictos finales, bugs de
la aplicación — el mismo orden de magnitud que el tercio aproximado de misclasificación que
Herzig et al. (2013) reportan para issue trackers, y consistente con el hallazgo de la
literatura de tests flaky de que los fallos no deterministas y acoplados al entorno permean
las señales de CI a gran escala (Luo et al., 2014; Parry et al., 2022) y explican una parte
grande de las transiciones pasa-a-falla observadas a escala (Memon et al., 2017).
La procedencia, sin embargo, es donde nuestros datos divergen del relato estándar. Mientras
la literatura de análisis estático ubica las falsas alarmas en el analizador (Bessey et al.,
2010; Johnson et al., 2013), y Sadowski et al. (2018) las reubican en el juicio del
desarrollador, los dos hallazgos confirmados mediados por instrumentación sugieren un tercer
locus: la propia maquinaria sancionada de entrada de pruebas, operando como fue diseñada. La
contaminación de fixtures completa el cuadro — el hallazgo del carrito huérfano es una
instancia de campo de la contaminación de estado que Gyori et al. (2015) detectan y que
Zhang et al. (2014) encontraron en cada suite que examinaron, salvo que aquí las escrituras
contaminantes llegaron desde otros tests a través de una cuenta compartida en una instancia
caliente en memoria.
Bettenburg et al. (2008) encontraron que reportadores y desarrolladores valoran información
distinta; la reversión de veredicto es una instancia concreta en la que la información
faltante no era esfuerzo del reportador sino la semántica de aserción del harness, y por eso
la guía 7 aboga por metadatos transportados por máquina en lugar de mejor prosa.

Del lado del diseño, la fricción es con la forma canónica del chaos engineering. Basiri et
al. (2016) abogan por inyectar eventos del mundo real en sistemas de producción —
aleatorizados en herramientas como Chaos Monkey — evaluados contra hipótesis de estado
estable; el caos de OmniPizza es casi lo opuesto — determinista, anclado a
credenciales, componible — y se alinea más con el programa de
controlabilidad/observabilidad de Binder (1994) y la testabilidad de dominio de Freedman
(1991) que con la experimentación en producción. No leemos ambos como competidores. Los
datos sugieren que el determinismo es lo que hace usable un laboratorio de enseñanza y
benchmarking — la misma persona falla siempre de la misma manera, así que una afirmación de
detección es verificable — mientras que el caos aleatorio en producción responde una
pregunta distinta sobre la resiliencia de un despliegue específico. La persona de error con
$p = 0.5$ se sitúa deliberadamente entre ambos regímenes: probabilística por solicitud,
determinista en distribución. El `problem_user` de Sauce Labs demostró el valor pedagógico
del patrón de personas (Sauce Labs, n.d.); la extensión aquí es la amplitud — latencia,
fallo probabilístico, accesibilidad, seguridad — y la imposición del lado del servidor a
través del JWT.

Los resultados del triage sostienen una afirmación más estrecha que la que buena parte de
la literatura de LLMs-en-testing avanza. Kang et al. (2023) demuestran que los
LLMs pueden reproducir bugs a partir de sus reportes; Wang et al. (2024) mapean el uso de
LLMs a lo largo del ciclo de testing; Fan et al. (2023) señalan la alucinación y la
necesidad de supervisión como problemas abiertos. Nuestra semana de triage es consistente
con los tres, y es plausible que el protocolo, no el modelo, cargara con la confiabilidad
observada: las dos explicaciones retractadas fueron las dos afirmaciones de causa raíz que
rebasaron la frontera reproducible — atribuciones sobre un harness que el agente no podía
observar — y el único veredicto revertido descansó en una brecha emparentada, la semántica
de aserción no observada del harness; toda afirmación disciplinada por
reproducir-antes-de-veredicto sobrevivió. Esto se alinea con las guidelines de Amershi et
al. (2019) de que los errores de un sistema de IA deben poder descartarse y corregirse con
eficiencia (G8–G9); los puntos de control humanos por lote y los documentos de explicación
durables y fechados fueron el mecanismo de visibilidad. Runeson et al. (2007) automatizaron el apoyo al triage con el procesamiento de
lenguaje natural de su época. La continuidad es el patrón, no el tooling: la automatización
propone, la evidencia dispone.

Las limitaciones son sustanciales y vale la pena decirlas sin rodeos. Este es un caso — un
sandbox construido a propósito, una semana, un harness externo, diecinueve hallazgos —
números que sostienen afirmaciones de existencia y nada más fuerte, y por eso no aparece
estadística inferencial en ninguna parte de este paper. Nosotros construimos la
plataforma, definimos las reglas del triage, supervisamos el triage y ahora evaluamos las
tres cosas; la metodología de estudio de caso archiva esto como observación participante con
su sesgo correspondiente (Runeson & Höst, 2009; Yin, 2018), mitigado solo en parte por el
rastro de archivo y la verificación adversarial de cada conteo. Nuestra clasificación de
veredictos se indujo post hoc de los mismos diecinueve hallazgos que organiza, por un único
pipeline codificador, con varias clases en $n = 1$; los fallos de triage registrados son una
cota inferior porque la cobertura de re-verificación externa fue asimétrica. Once fixes y
cinco releases se publicaron durante la ventana, así que el artefacto mismo se movió; tres
de los seis documentos fuente entraron a control de versiones solo después de cerrada. La generalización desde
un sistema diseñado para ser testeable hacia sistemas que no lo son es, en el mejor de los
casos, analítica. El sandbox mide lo que fue construido para exhibir. Esa circularidad aquí
se declara, no se resuelve.

### 5.1 Guías de diseño para testabilidad (RQ4)

Patrones transferibles, cada uno etiquetado con la fuerza de su evidencia:

1. **Pon los modos de fallo en las credenciales.** Las personas caos deterministas componen
   ortogonalmente con cualquier otra dimensión de prueba y no requieren mutar el entorno.
   *[Fundado en la historia de diseño, Sección 3.2.1.]* Trade-off (anticipado, aún no
   observado): las personas son parte del contrato público; cambiar su comportamiento es un
   cambio rompiente.
2. **Haz de las reglas de mercado/i18n datos, no ramas.** Las tablas de reglas enumerables
   convierten el cumplimiento en dimensiones de prueba recorribles. *[Fundado en la historia
   de diseño, Sección 3.2.2; trade-off observado en la Sección 4.2: el drift entre la tabla de
   reglas/copy y las plataformas es en sí una clase de bug.]*
3. **Entrega puntos de entrada sancionados de inyección de estado — y trata sus efectos
   secundarios como parte del diseño.** El setup O(1) elimina la parte más flaky de las
   suites E2E *[fundado en la historia de diseño, Sección 3.2.3]*; el costo observado es que
   los mismos bypasses propician falsos positivos *[observado en la Sección 4.2]*. La mitad
   prescriptiva — guardarraíles como rechazar `resetSession` a mitad de escenario, más
   telemetría de uso — es diseño futuro propuesto: OmniPizza hoy solo incluye un guard
   defensivo parcial y ninguna telemetría.
4. **Versiona tu instrumentación.** Selectores, headers y formas de respuesta tratados como
   API pública hacen durable la automatización. *[Fundado en el racional de diseño,
   Sección 3.2.4; en la ventana de evaluación no ocurrió ningún episodio de renombre rompiente
   que lo pusiera a prueba.]*
5. **Prefiere estado reseteable; ancla el estado mutable de sesión al login.** Reinicio-como-
   reset más el aislamiento de perfil por login eliminaron una carrera observada *[fundado en
   la historia de diseño, Sección 3.2.5]*; donde quedan fixtures compartidos mutables, sus
   remanentes imitan bugs deterministas de la app *[observado en la Sección 4.2]* — decide
   deliberadamente qué hacer con cada clase de estado.
6. **Haz el triage durable y falsable.** Documentos de explicación fechados que registran sus
   propias retractaciones convierten el triage en datos auditables — y toda atribución sobre
   un sistema que no puedes observar es una hipótesis para su dueño, no un veredicto.
   *[Observado en la Sección 4.2: ambas explicaciones retractadas eran atribuciones que
   cruzaban la frontera de observabilidad.]*
7. **Lleva la semántica de aserción junto con los hallazgos.** Un desajuste
   contains-vs-exact invirtió un veredicto; los contratos de aserción del harness deberían
   viajar como metadatos con cada hallazgo reportado. *[Conjetura generalizada desde un único
   incidente observado.]*

### 5.2 Amenazas a la validez (enumeración detallada — esquema)

- Amenazas propias de un paper de artefacto: los autores construyeron la plataforma (la evidencia de
  adopción es exactamente un harness externo; las cuatro audiencias de la Sección 1 son
  previstas, no demostradas); realismo del sandbox vs. representatividad de producción (el
  caos sembrado deliberadamente infla fenómenos específicos; el hosting free-tier infla la
  clase de infraestructura); aún no existe un manifiesto de defectos sembrados legible por
  máquina (el pitch para constructores de herramientas depende de él; planificado como
  material suplementario); sostenibilidad archivística (los despliegues vivos corren en un free
  tier — la Sección 6 se compromete a un snapshot archivado con commit fijado/DOI).
- Amenazas de la evaluación (condensadas del instrumento de la Sección 3.5): documentos de
  triage auto-reportados escritos por el propio agente que hizo el triage;
  investigador-como-participante; la validez del LLM como agente de triage como clase de amenaza
  propia; los fallos de triage registrados son una cota inferior (la cobertura de
  re-verificación externa fue asimétrica); N = 19 bajo reglas de inclusión declaradas cuyas
  exclusiones sesgan al alza la tasa de bugs reales; la ventana de estudio termina donde
  se detuvieron los datos; fuentes primarias en español, la codificación implica traducción
  revisada por humanos; tres de los seis documentos de explicación entraron a control de
  versiones solo después de cerrada la ventana, así que su procedencia al-momento-del-triage
  descansa en timestamps del sistema de archivos.
- Validez de constructo de la taxonomía: la clasificación de 8 clases es preliminar —
  inducida post hoc de los mismos 19 hallazgos por un único pipeline codificador (LLM + un
  autor supervisor), varias clases tienen n = 1, sin segundo codificador ni fiabilidad
  inter-evaluador todavía.
- Artefacto en movimiento: se arreglaron 11 bugs y se publicaron 5 releases *durante* la
  ventana de evaluación (4 derivados del triage; v1.1.6 fue trabajo concurrente de features),
  así que las tasas por ciclo miden un artefacto cambiante (`findings.csv` registra el
  release en que se publicaron los fixes de cada ciclo; una columna de versión-vigente real
  queda como trabajo futuro).
- Ética hacia terceros: la evaluación publica atribuciones de fallo sobre un operador de
  harness externo identificable cuyo sistema no podemos observar — las atribuciones se
  etiquetan como hipótesis y el operador permanece anónimo.
- El drift documental como riesgo para el usuario: partes de la documentación de producto del
  repo preceden al mercado y a los usuarios caos más nuevos (describen 4 mercados / 5
  personas vs. los 5 / 7 actuales) — una advertencia para adoptantes de la plataforma y, en
  sí mismo, un fenómeno medible.
- Frontera de alcance: una fila del catálogo se ejecutó como ejemplar de bajo costo
  (procedimiento 3.4, resultados 4.1; 2026-07-23, instancia local en el snapshot fijado);
  las demás filas de la Sección 3.3 están habilitadas, no ejecutadas — por diseño de este
  paper; candidatos para
  trabajo posterior. La generalizabilidad de las guías está acotada a un dominio (e-commerce)
  y un equipo.

## 6. Conclusión y disponibilidad

Un laboratorio es una promesa sobre el futuro, no un reporte sobre el pasado. La promesa que
esta plataforma hace a sus audiencias es compatibilidad: personas, selectores, puntos de
entrada y formas de respuesta sostenidos estables como se sostienen las APIs públicas, de
modo que un test escrito hoy contra el sandbox siga significando algo mañana. Para quienes
construyen sistemas de producción, la implicación corre en la misma dirección. La maquinaria
que abarata probar el software es software también — con sus propios modos de fallo, efectos
secundarios y obligaciones de versionado — y presupuestar esas obligaciones desde el inicio
es lo que separa la testabilidad diseñada de la deuda de pruebas acumulada.

Para quienes diseñan benchmarks, la implicación es más filosa. Un benchmark vivo no puede
tomar prestado el contrato del corpus de defectos, en el que el ground truth queda a salvo
fuera del sistema bajo estudio; cuando los defectos viven dentro del artefacto y sus suites
caracterizan el comportamiento, el ground truth debe cercenarse deliberadamente del
comportamiento y transportarse en un artefacto propio. Es plausible que todo sandbox de
enseñanza longevo derive hacia certificar sus propias fallas sembradas a menos que un
manifiesto legible por máquina — versionado, independiente de los oráculos, verificable
contra el despliegue — ancle qué significa *defecto*. Consideramos tales manifiestos higiene
de benchmark, no un extra opcional.

Para el trabajo de calidad asistido por IA, la implicación es que la disciplina de
evidencia, no la elección de modelo, puede ser la superficie de diseño que más importa. Si
los veredictos fallan donde las afirmaciones rebasan lo observable y se sostienen donde un
protocolo fuerza primero la reproducción, entonces los equipos que adopten triage con LLMs
deberían ingeniar la frontera: etiquetar las atribuciones entre sistemas como hipótesis,
transportar la semántica de aserción como metadatos, y mantener puntos de control humanos
donde los errores serían de otro modo invisibles. La pregunta interesante deja de ser si un
modelo puede hacer triage. Pasa a ser qué protocolo hace baratos de atrapar los fallos de
cualquier triager.

Esa pregunta es ahora directamente contrastable, y esta plataforma está construida para
contrastarla. Los pasos más próximos ya están en cola — las filas no ejecutadas del
catálogo, estudios de adopción independiente — pero la vía que este estudio destraba
específicamente es una ablación de protocolo dentro de la plataforma: repetir el stream de
hallazgos archivado — los reportes tal como quedaron citados en los documentos de
explicación, la única forma en que los reportes crudos sobreviven, con el sesgo de selección
que eso implica — con el mismo modelo bajo componentes del protocolo conmutados
(reproducir-antes-de-veredicto activado y desactivado; puntos de control humanos activados y
desactivados) y puntuar los veredictos resultantes contra los veredictos finales adjudicados
en `findings.csv`. Los ciclos que retengan reportes crudos y capturen los contratos de
aserción del harness según la guía 7 extienden el diseño a entradas no seleccionadas, a un
brazo de metadatos de aserción, y a sondas de defectos sembrados puntuadas contra el
manifiesto. Las tasas de retractación y reversión se vuelven resultados medidos en lugar de
anécdotas. Cualquiera puede correrla; el laboratorio es público.

**Disponibilidad.** Repositorio público
(`https://github.com/gsanchezm/OmniPizza` — backend, web, móvil, tests, documentación,
incluidos el fact sheet y `findings.csv` bajo `documents/paper/`) y despliegues vivos
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`); un
snapshot archivado (commit fijado, DOI) acompañará al preprint.

## Referencias

Formato APA 7 con sangría francesa (aproximada en esta fuente; se aplica al componer). Las
entradas se mantienen en inglés (el idioma del paper y de las fuentes). La lista se
restringe a las 36 obras citadas en el texto; cada entrada fue verificada contra su
registro canónico (resolución de DOI o página del editor/oficial) el 2026-07-23; la lista
de reserva verificada vive en el índice de avance.

Alameer, A., Mahajan, S., & Halfond, W. G. J. (2016). Detecting and localizing
    internationalization presentation failures in web applications. In *2016 IEEE International
    Conference on Software Testing, Verification and Validation (ICST)* (pp. 202–212). IEEE.
    https://doi.org/10.1109/ICST.2016.36

Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J., Iqbal,
    S., Bennett, P. N., Inkpen, K., Teevan, J., Kikin-Gil, R., & Horvitz, E. (2019). Guidelines
    for human-AI interaction. In *Proceedings of the 2019 CHI Conference on Human Factors in
    Computing Systems (CHI '19)* (Paper 3, pp. 1–13). ACM.
    https://doi.org/10.1145/3290605.3300233

Barr, E. T., Harman, M., McMinn, P., Shahbaz, M., & Yoo, S. (2015). The oracle problem in
    software testing: A survey. *IEEE Transactions on Software Engineering*, *41*(5), 507–525.
    https://doi.org/10.1109/TSE.2014.2372785

Basiri, A., Behnam, N., de Rooij, R., Hochstein, L., Kosewski, L., Reynolds, J., & Rosenthal, C.
    (2016). Chaos engineering. *IEEE Software*, *33*(3), 35–41.
    https://doi.org/10.1109/MS.2016.60

Bell, J., & Kaiser, G. (2014). Unit test virtualization with VMVM. In *Proceedings of the 36th
    International Conference on Software Engineering (ICSE 2014)* (pp. 550–561). ACM.
    https://doi.org/10.1145/2568225.2568248

Bessey, A., Block, K., Chelf, B., Chou, A., Fulton, B., Hallem, S., Henri-Gros, C., Kamsky, A.,
    McPeak, S., & Engler, D. (2010). A few billion lines of code later: Using static analysis to
    find bugs in the real world. *Communications of the ACM*, *53*(2), 66–75.
    https://doi.org/10.1145/1646353.1646374

Bettenburg, N., Just, S., Schröter, A., Weiss, C., Premraj, R., & Zimmermann, T. (2008). What
    makes a good bug report? In *Proceedings of the 16th ACM SIGSOFT International Symposium on
    Foundations of Software Engineering (FSE-16)* (pp. 308–318). ACM.
    https://doi.org/10.1145/1453101.1453146

Binder, R. V. (1994). Design for testability in object-oriented systems. *Communications of the
    ACM*, *37*(9), 87–101. https://doi.org/10.1145/182987.184077

Campbell, A., Adams, C., Bradley Montgomery, R., Cooper, M., & Kirkpatrick, A. (Eds.). (2024).
    *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation, 12 December 2024).
    World Wide Web Consortium. https://www.w3.org/TR/2024/REC-WCAG22-20241212/

Deque Systems. (2026). *axe-core: Accessibility engine for automated Web UI testing* [Computer
    software]. GitHub. Retrieved July 23, 2026, from https://github.com/dequelabs/axe-core

Do, H., Elbaum, S., & Rothermel, G. (2005). Supporting controlled experimentation with testing
    techniques: An infrastructure and its potential impact. *Empirical Software Engineering*,
    *10*(4), 405–435. https://doi.org/10.1007/s10664-005-3861-2

Fan, A., Gokkaya, B., Harman, M., Lyubarskiy, M., Sengupta, S., Yoo, S., & Zhang, J. M. (2023).
    Large language models for software engineering: Survey and open problems. In *2023 IEEE/ACM
    International Conference on Software Engineering: Future of Software Engineering
    (ICSE-FoSE)* (pp. 31–53). IEEE. https://doi.org/10.1109/ICSE-FoSE59343.2023.00008

Freedman, R. S. (1991). Testability of software components. *IEEE Transactions on Software
    Engineering*, *17*(6), 553–564. https://doi.org/10.1109/32.87281

Gyimesi, P., Vancsics, B., Stocco, A., Mazinanian, D., Beszédes, Á., Ferenc, R., & Mesbah, A.
    (2019). BugsJS: A benchmark of JavaScript bugs. In *2019 12th IEEE Conference on Software
    Testing, Validation and Verification (ICST)* (pp. 90–101). IEEE.
    https://doi.org/10.1109/ICST.2019.00019

Gyori, A., Shi, A., Hariri, F., & Marinov, D. (2015). Reliable testing: Detecting
    state-polluting tests to prevent test dependency. In *Proceedings of the 2015 International
    Symposium on Software Testing and Analysis (ISSTA 2015)* (pp. 223–233). ACM.
    https://doi.org/10.1145/2771783.2771793

Herzig, K., Just, S., & Zeller, A. (2013). It's not a bug, it's a feature: How misclassification
    impacts bug prediction. In *Proceedings of the 35th International Conference on Software
    Engineering (ICSE 2013)* (pp. 392–401). IEEE. https://doi.org/10.1109/ICSE.2013.6606585

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems
    research. *MIS Quarterly*, *28*(1), 75–106. https://doi.org/10.2307/25148625

Johnson, B., Song, Y., Murphy-Hill, E., & Bowdidge, R. (2013). Why don't software developers use
    static analysis tools to find bugs? In *Proceedings of the 35th International Conference on
    Software Engineering (ICSE 2013)* (pp. 672–681). IEEE.
    https://doi.org/10.1109/ICSE.2013.6606613

Just, R., Jalali, D., & Ernst, M. D. (2014). Defects4J: A database of existing faults to enable
    controlled testing studies for Java programs. In *Proceedings of the 2014 International
    Symposium on Software Testing and Analysis* (pp. 437–440). ACM.
    https://doi.org/10.1145/2610384.2628055

Kang, S., Yoon, J., & Yoo, S. (2023). Large language models are few-shot testers: Exploring
    LLM-based general bug reproduction. In *2023 IEEE/ACM 45th International Conference on
    Software Engineering (ICSE)* (pp. 2312–2323). IEEE.
    https://doi.org/10.1109/ICSE48619.2023.00194

Leotta, M., Stocco, A., Ricca, F., & Tonella, P. (2016). Robula+: An algorithm for generating
    robust XPath locators for web testing. *Journal of Software: Evolution and Process*,
    *28*(3), 177–204. https://doi.org/10.1002/smr.1771

Luo, Q., Hariri, F., Eloussi, L., & Marinov, D. (2014). An empirical analysis of flaky tests. In
    *Proceedings of the 22nd ACM SIGSOFT International Symposium on Foundations of Software
    Engineering* (pp. 643–653). ACM. https://doi.org/10.1145/2635868.2635920

Memon, A., Gao, Z., Nguyen, B., Dhanda, S., Nickell, E., Siemborski, R., & Micco, J. (2017).
    Taming Google-scale continuous testing. In *2017 IEEE/ACM 39th International Conference on
    Software Engineering: Software Engineering in Practice Track (ICSE-SEIP)* (pp. 233–242).
    IEEE. https://doi.org/10.1109/ICSE-SEIP.2017.16

OWASP Foundation. (n.d.). *OWASP Juice Shop*. Retrieved July 23, 2026, from
    https://owasp.org/www-project-juice-shop/

Parry, O., Kapfhammer, G. M., Hilton, M., & McMinn, P. (2022). A survey of flaky tests. *ACM
    Transactions on Software Engineering and Methodology*, *31*(1), 1–74.
    https://doi.org/10.1145/3476105

Runeson, P., Alexandersson, M., & Nyholm, O. (2007). Detection of duplicate defect reports using
    natural language processing. In *Proceedings of the 29th International Conference on
    Software Engineering (ICSE '07)* (pp. 499–510). IEEE. https://doi.org/10.1109/ICSE.2007.32

Runeson, P., & Höst, M. (2009). Guidelines for conducting and reporting case study research in
    software engineering. *Empirical Software Engineering*, *14*(2), 131–164.
    https://doi.org/10.1007/s10664-008-9102-8

Sadowski, C., Aftandilian, E., Eagle, A., Miller-Cushon, L., & Jaspan, C. (2018). Lessons from
    building static analysis tools at Google. *Communications of the ACM*, *61*(4), 58–66.
    https://doi.org/10.1145/3188720

Sauce Labs. (n.d.). *Swag Labs (Sauce Labs sample application)* [Demo web application].
    Retrieved July 23, 2026, from https://www.saucedemo.com/

TasteJS. (n.d.). *TodoMVC: Helping you select an MV\* framework*. Retrieved July 23, 2026, from
    https://todomvc.com/

Vahabzadeh, A., Milani Fard, A., & Mesbah, A. (2015). An empirical study of bugs in test code.
    In *2015 IEEE International Conference on Software Maintenance and Evolution (ICSME)* (pp.
    101–110). IEEE. https://doi.org/10.1109/ICSM.2015.7332456

Wang, J., Huang, Y., Chen, C., Liu, Z., Wang, S., & Wang, Q. (2024). Software testing with large
    language models: Survey, landscape, and vision. *IEEE Transactions on Software Engineering*,
    *50*(4), 911–936. https://doi.org/10.1109/TSE.2024.3368208

Weyuker, E. J. (1982). On testing non-testable programs. *The Computer Journal*, *25*(4),
    465–470. https://doi.org/10.1093/comjnl/25.4.465

Wieringa, R. J. (2014). *Design science methodology for information systems and software
    engineering*. Springer. https://doi.org/10.1007/978-3-662-43839-8

Yin, R. K. (2018). *Case study research and applications: Design and methods* (6th ed.). SAGE
    Publications.

Zhang, S., Jalali, D., Wuttke, J., Muşlu, K., Lam, W., Ernst, M. D., & Notkin, D. (2014).
    Empirically revisiting the test independence assumption. In *Proceedings of the 2014
    International Symposium on Software Testing and Analysis (ISSTA 2014)* (pp. 385–396). ACM.
    https://doi.org/10.1145/2610384.2610404

## Apéndice / material suplementario

- **Hoja de datos de la plataforma (compañero obligatorio):** cada número de las Secciones
  3–4 con su regla de conteo y el commit del snapshot fijado (operaciones de endpoint vs.
  paths; conteos de *ocurrencias* de selectores vs. IDs distintos; conteo de releases
  excluyendo tags legacy duplicados que difieren solo en mayúsculas/minúsculas; conteos de filas de la tabla de
  widgets).
- `findings.csv` — tabla de codificación de los 19 hallazgos de la evaluación (descomposición
  del veredicto, un flag de confianza, el flag `instrumentation-mediated` con conjunto de
  valores true / false / candidate, y el release en que se publicaron los fixes de cada
  ciclo), con extractos en el idioma original.
- Manifiesto de defectos sembrados legible por máquina (planificado; requerido para el caso
  de uso de constructores de herramientas).
- Punteros a artefactos primarios: `documents/explanation/EXPLANATION_qa_report_*.md`,
  `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `backend/constants.py`, commits de fix
  por hash.

---

*Disponibilidad de datos:* la plataforma de estudio y sus artefactos primarios son públicos:
repositorio (`https://github.com/gsanchezm/OmniPizza`, incluidos el fact sheet y
`findings.csv` bajo `documents/paper/`) y despliegues vivos
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`); el
manifiesto de defectos sembrados está planificado, y un snapshot archivado (commit fijado,
DOI) acompañará al preprint.
