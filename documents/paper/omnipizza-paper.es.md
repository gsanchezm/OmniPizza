# OmniPizza: Un laboratorio controlado para la automatización de pruebas multiplataforma

> **Estado:** documento base (v0.4, 2026-07-23). **Gemelo en español** de
> `omnipizza-paper.md`; la versión canónica — y la destinada a publicación — es la inglesa:
> ante cualquier discrepancia, prevalece el original. Encuadre centrado en la plataforma (pivote
> desde el borrador anterior centrado en el triage); el estudio de triage QA de una semana es
> la evaluación (Sección 5). Las Secciones 3–6 están redactadas (3.1, 4.1 y los bloques de
> método de la Sección 5 en prosa completa); la Sección 7 lleva la discusión redactada más
> las amenazas en esquema; las Secciones 1–2 y 8 son esquemas. Todas las afirmaciones cuantitativas
> pasaron una verificación adversarial contra el repositorio en el snapshot fijado
> (Sección 3.1); tres afirmaciones refutadas en revisión fueron corregidas en esta versión.
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

## Resumen (esquema)

- Pitch: practicar, hacer benchmarking y estudiar la automatización de pruebas requieren un
  sistema lo bastante realista para ser relevante y lo bastante controlado para poder medir —
  las apps de producción no son ni seguras ni deterministas; los sandboxes existentes son
  monoplataforma o de un solo ámbito.
- OmniPizza: un producto abierto de pedidos de pizza, desplegado públicamente (backend
  FastAPI, web React, móvil Expo/React Native), construido para que la testabilidad sea una
  funcionalidad del producto: 7 usuarios caos deterministas cuyos modos de fallo viajan en el
  JWT, 5 mercados data-driven / 6 idiomas incluido árabe RTL, entrada por inyección atómica de
  estado a cualquier pantalla, y contratos de instrumentación versionados (165 ocurrencias de
  selectores estables en web + 114 en móvil).
- Evaluación: una semana de uso real por QA automatizada externa (19 hallazgos, 6 ciclos de
  triage) aporta evidencia inicial del laboratorio en sus dos papeles — app bajo prueba y
  generador de fenómenos QA estudiables — incluidos falsos positivos mediados por la propia
  instrumentación de testing.
- Salida: un catálogo de patrones de diseño para testabilidad, un catálogo de lo que el
  laboratorio está instrumentado para medir — con una fila ejecutada como ejemplar: el
  defecto sembrado de precios $0 pasa sin detección por las cuatro capas de prueba existentes
  tal cual están (Sección 4.1) — y guías de diseño-para-testabilidad etiquetadas por fuerza
  de evidencia.

## 1. Introducción (esquema)

- Motivación: ¿dónde se practica la automatización de pruebas — funcional, de performance,
  de accesibilidad, de seguridad, visual, en web y en móvil —, se evalúa una herramienta de
  testing nueva o se estudian procesos de QA? Los sistemas de producción son inseguros, no
  deterministas e inobservables; las demos de juguete carecen de los modos de fallo que hacen
  difícil la automatización. El hueco es un *laboratorio controlado*: superficie de producto
  realista, modos de fallo deterministas y enumerables, observabilidad/controlabilidad
  sancionadas.
- A quién está diseñado para servir (audiencias previstas; la evidencia de adopción hasta la
  fecha es un único harness de QA externo — Sección 7): **profesionales de la automatización** (un campo de
  entrenamiento cuyos pitfalls — selectores dependientes del viewport, widgets a medida, RTL,
  condiciones de carrera de estado — están embebidos a propósito, no por accidente); **constructores de
  herramientas** (un blanco de benchmark estable con defectos sembrados documentados; un
  manifiesto de defectos legible por máquina está planificado como material suplementario);
  **investigadores** (fenómenos deterministas más captura de archivo completa del lado del
  triage del proceso de QA — el lado del harness no es observado); **docentes** (un
  currículum gratuito, desplegado y reseteable).
- Por qué una pizzería: el comercio multi-mercado ejercita i18n/RTL, reglas de validación por
  mercado, aritmética de moneda/impuestos y flujos de checkout — una envolvente de
  complejidad realista con un vocabulario de dominio pequeño.
- **Preguntas de investigación** (tipadas según Wieringa; cada una nombra su evidencia y su
  fuerza):
  - **RQ1 (pregunta descriptiva de diseño).** ¿Qué mecanismos de diseño hacen que un producto
    multiplataforma realista funcione como laboratorio de pruebas controlado — determinista,
    controlable, observable — sin dejar de ser realista? *Evidencia: la descripción verificada
    del artefacto, Sección 3.*
  - **RQ2 (pregunta de capacidad/affordance).** ¿Qué propiedades relacionadas con el testing
    está instrumentada la plataforma para medir? *Evidencia: el catálogo de affordances, Sección 4;
    una fila se ejecuta como ejemplar (4.1), la fila del proceso de QA la ejercita la
    Sección 5, y el resto siguen siendo afirmaciones de diseño.*
  - **RQ3 (pregunta de validación).** ¿Cómo se comporta la plataforma bajo uso real de QA
    automatizada externa? *Evidencia: el estudio de caso retrospectivo, Sección 5 — una
    prueba de existencia con un despliegue y un harness externo.*
  - **RQ4 (pregunta prescriptiva).** ¿Qué guías transferibles de diseño-para-testabilidad,
    con qué trade-offs, se siguen del diseño y de su evaluación? *Evidencia: Sección 6, cada
    guía etiquetada por fuerza de evidencia.*
- Contribuciones (lista aprobada):
  1. La plataforma, puesta a disposición de las cuatro audiencias anteriores: abierta,
     desplegada públicamente, reproducible (3 desplegables, 5 mercados / 6 idiomas incl. RTL,
     7 usuarios caos deterministas, 20 operaciones `/api` bajo contrato, suites de prueba
     heterogéneas).
  2. Un catálogo de patrones para el diseño de productos testability-first (Sección 3).
  3. Un catálogo de propiedades que el laboratorio está instrumentado para medir o estudiar
     (Sección 4).
  4. Evaluación en uso real: una semana de QA automatizada externa — 19 hallazgos, una
     clasificación preliminar de veredictos de 8 clases, y falsos positivos mediados por la
     instrumentación (Sección 5).
  5. Guías de diseño-para-testabilidad etiquetadas por fuerza de evidencia (Sección 6).

## 2. Trabajo relacionado (esquema)

- Sandboxes y apps demo de testing: SauceDemo (origen del patrón `problem_user` — OmniPizza
  lo extiende a personas de latencia, probabilísticas, de a11y y de seguridad), OWASP Juice
  Shop (entrenamiento en seguridad), TodoMVC / RealWorld (benchmarks de implementación, no
  laboratorios de testing).
- Benchmarks de defectos (Defects4J, BugsJS): *defectos históricos* curados para evaluar
  herramientas — contraste con un laboratorio *vivo* de modos de fallo sembrados,
  deterministas y reproducibles hoy, más captura de proceso.
- Diseño para testabilidad: controlabilidad/observabilidad como dimensiones de la
  testabilidad (Binder; Freedman) — OmniPizza operacionaliza ambas como funcionalidades del
  producto.
- Tests flaky y ruido de fallos de prueba (Luo et al.; reportes industriales); triage de
  falsos positivos; contaminación de fixtures — los fenómenos que, como muestra la Sección 5, el
  laboratorio genera.
- LLMs en testing y triage; supervisión humano-IA (contexto para el protocolo de triage de la
  evaluación).
- Metodología de estudio de caso y design science (Runeson & Höst; Yin; Wieringa).

## 3. La plataforma OmniPizza: principios de diseño (RQ1)

Tres desplegables — backend FastAPI, web React/Vite, móvil Expo/React Native — más suites de
prueba dentro y fuera de los paquetes de la app. La superficie de producto es un flujo de
pedido completo (login, catálogo, constructor de pizzas, checkout, seguimiento de pedido,
perfil) sobre un catálogo de 12 pizzas localizado en 6 idiomas. Los mecanismos de
testabilidad son funcionalidades del producto con las mismas garantías de compatibilidad que
las funcionalidades de usuario.

### 3.1 Cómo se derivó y verificó esta descripción (método)

La justificación de diseño se reconstruyó exclusivamente desde fuentes de archivo fechadas —
los documentos de requisitos de producto y de diseño del repo, las dos guías de testing atómico, el
documento de arquitectura QA y el historial de git ($209$ commits, 2026-02-07 → 2026-07-22) —
y no desde el recuerdo de los autores, de modo que cada afirmación de diseño traza a un
artefacto que el lector puede abrir. La exactitud descriptiva se impuso después de forma
mecánica. Cada afirmación cuantitativa de las Secciones 3–5 se verificó contra el repositorio — código
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

Los principios de diseño se etiquetan además por procedencia. Los mecanismos declarados como
metas en los documentos fundacionales (personas caos, mercado-como-datos, entrada atómica,
contratos de selectores) se marcan *ex-ante*; las codificaciones de lecciones operativas —
el anclaje del perfil al login de la Sección 3.6, introducido a mitad de la historia para
arreglar una carrera de login observada, y un guard defensivo de deep links — se marcan
*ex-post*. El etiquetado se adoptó para que el catálogo no presente la retrospectiva como
previsión.

### 3.2 Caos-por-identidad: los modos de fallo viajan en las credenciales

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
| `security_glitch_user` | campos de perfil sembrados con XSS (3 campos × 3 payloads), fugas de mensajes de error internos con p = 0.5, bypass de propiedad de pedidos |

Como el modo de fallo va anclado a la *identidad*, compone ortogonalmente con cada mercado,
idioma y plataforma — sin flags de entorno, sin configuración de prueba del lado del
servidor, y dos tests que usan personas distintas jamás interfieren entre sí.

### 3.3 La complejidad multi-mercado como datos, no como código

Una tabla de configuración gobierna 5 mercados (MX, US, CH, JP, SA): moneda y conversión,
reglas de decimales (JPY: 0 decimales), tasas de impuesto (8–16%), un campo de dirección
obligatorio específico del mercado (`colonia` / `zip_code` / `plz` / `prefectura` /
`district`) y un nombre localizado para el campo de propina (`propina` / `tip` / `trinkgeld`
/ `chip` / `baksheesh`). Una regla de validación a nivel de modelo impone además el formato
de 5 dígitos del zip de US. SA ejercita adicionalmente el layout árabe de derecha a
izquierda. Las reglas de mercado son, por tanto, *dimensiones de prueba enumerables*: un
generador de tests puede recorrer la tabla en lugar de hacer ingeniería inversa de ramas.

### 3.4 Inyección atómica de estado: entrada O(1) a cualquier pantalla

Ambas plataformas exponen bypasses sancionados que colocan un test *directamente en* el
estado objetivo en lugar de repetir el recorrido del usuario:

- **Web:** sembrar `localStorage` (conjunto de claves documentado con el formato de envelope
  del store), sembrar estado de backend vía `POST /api/cart` y `POST /api/store/market`, y
  navegar directo a la ruta objetivo; la página de Checkout se hidrata desde `GET /api/cart`
  cuando su carrito local está vacío.
- **Móvil:** deep links `omnipizza://` a 6 pantallas con parámetros universales
  (`accessToken` evita el login, `market`, `lang`, `resetSession`, `hydrateCart`), más un
  argumento de lanzamiento de Detox para la selección de mercado.

Los bypasses son funcionalidades versionadas y estructurales — y la Sección 5 muestra su
costo: la misma maquinaria, funcionando exactamente como fue diseñada, propició falsos positivos
durante el uso real de QA.

### 3.5 Contratos de instrumentación como APIs versionadas

Cada elemento interactivo lleva un selector estable (165 ocurrencias de `data-testid` en web,
114 de `testID` en móvil, convención de prefijos compartida); las rutas y las formas de
respuesta están congeladas. La superficie de API bajo contrato es de 20 operaciones de ruta
`/api` (18 paths distintos; 22 operaciones incluyendo la raíz y los probes de salud). Los
endpoints de *lectura* sensibles al mercado — obtención de catálogo e hidratación de carrito
— rechazan solicitudes sin el header `X-Country-Code` (HTTP 400); el checkout, en cambio,
lleva el mercado en el cuerpo de la solicitud. Renombrar un selector se trata como cambio
rompiente — la testabilidad tiene la misma disciplina de compatibilidad que una API pública.

### 3.6 Estado efímero como aislamiento

El backend persiste todo en memoria: reinicio = borrón determinista y cuenta nueva. El estado
editable del perfil se ancla a la sesión de login (un claim JWT `sid` por login), de modo que
sesiones concurrentes del mismo usuario de prueba compartido obtienen perfiles aislados — una
lección de diseño *ex-post*: el anclaje se introdujo a mitad de la historia para arreglar una
carrera de login observada. La contracara, la retención de estado en instancias calientes
sobre fixtures compartidos, se conserva deliberadamente: genera exactamente los fenómenos de
fixture compartido que la Sección 5 estudia.

### 3.7 Un currículum de automatización deliberadamente embebido

Los pitfalls reales de la automatización están reproducidos a propósito: sufijos de selector
dependientes del viewport que conmutan en un breakpoint responsivo, una clave de
deploy-guard que borra silenciosamente el estado de auth sembrado ingenuamente, un envelope
de persistencia que debe reproducirse con exactitud, y un zoológico de widgets interactivos
hechos a mano (9 en web, 11 en móvil: toasts, modales de confirmación, dropdowns a medida, un
flujo de pago falso en formulario, date pickers multiparte). Practicar contra
OmniPizza es encontrarse con los pitfalls que las apps de producción contienen por accidente
— aquí documentados y estables.

### 3.8 Un portafolio de pruebas de referencia sobre un mismo sistema

Cuatro capas de prueba heterogéneas — desde tests de componentes dentro del repo hasta una
suite de API externa — apuntan al mismo producto: tests de contrato generados por esquema
(Schemathesis, el número de casos escala con el esquema OpenAPI), 41 casos de integración de
API escritos a mano que incluyen una suite golden de caracterización, 11 specs de tests de
componentes, y experimentos E2E de resiliencia a latencia por plataforma. Esto habilita la
comparación en igualdad de condiciones de qué detecta cada capa (ejecutada como ejemplar en
la Sección 4.1). El documento de requisitos del producto entrega además una
matriz de aceptación de flujos negativos de 13 escenarios (códigos de estado y resultados de
UI esperados), usable directamente como dataset de oráculos.

## 4. Lo que el laboratorio está instrumentado para medir (RQ2)

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
| Corrección de i18n / RTL | 6 idiomas incl. árabe RTL; 5 conjuntos de reglas de mercado; copy multiplataforma | divergencia de copy entre plataformas; verificaciones de layout RTL; cobertura de validación por mercado | ejercitada incidentalmente en la Sección 5 (hallazgos de divergencia de copy) |
| Costo de setup y superficie de flakes | entrada atómica (3.4) vs. recorrido completo hasta el mismo estado | pasos/tiempo-al-estado; qué flakes desaparecen con entrada atómica | affordance — aún no ejecutada |
| Robustez de estrategias de selectores | sufijos dependientes del viewport, zoológico de widgets, RTL | supervivencia de localizadores entre viewports/idiomas | affordance — aún no ejecutada |
| Fenómenos del proceso de QA | replay determinista + artefactos de triage durables + despliegues públicos | taxonomías de triage, procedencia de falsos positivos, estudios de artefactos de harness | ejercitada — Sección 5 |

### 4.1 Un ejemplar ejecutado: el defecto sembrado de precios $0 a través de las cuatro capas

Para convertir una fila del catálogo de afirmación de diseño en evidencia, el portafolio de
la Sección 3.8 se ejecutó **tal cual está** — sin modificar ninguna suite — contra el defecto
sembrado de `problem_user`, el 2026-07-23, sobre una instancia local en el snapshot fijado
(backend servido en el puerto $8000$ con estado en memoria fresco; Vitest 4.0.18 vía
`npx vitest run`, con el `fileParallelism: false` fijado en el repositorio porque las suites
comparten un único backend con estado; Cypress 15.11.0 headless vía `cypress run --component`;
Schemathesis 3.25.1 bajo pytest 7.4.4 con `max_examples = 50` por endpoint). El ground truth
se confirmó en vivo antes de las corridas: un login de `problem_user` seguido de una
obtención de catálogo devolvió $12/12$ pizzas a precio $0.0$ con la URL de imagen rota.

Ninguna capa reportó un fallo atribuible al defecto sembrado — detección de $0/4$. Dos de
las cuatro capas no llegaron a ejecutarse. Observaciones por capa:

| Capa | Resultado observado (tal cual está) |
|---|---|
| Contrato (Schemathesis) | La colección falló antes de ejecutar caso alguno: la versión 3.25.1 lanza `SchemaError` sobre el documento OpenAPI 3.1.0 del backend ("currently not fully supported"). Independientemente, `price` no lleva restricción `minimum` en ninguno de los dos esquemas de respuesta (`Pizza`, `EnrichedCartItem`); un valor de $0$ es válido contra el esquema |
| Integración de API (Vitest) | $46/46$ casos pasaron con el defecto activo. Dos casos assertan el defecto como comportamiento esperado de `problem_user`: `expect(p01.price).toBe(0)` y la URL de imagen rota (`tests/golden.test.ts`) |
| Componentes (Cypress) | $14/15$ casos en $11$ specs pasaron. Cada spec se monta con datos de fixture (`price: 12.99`); ninguno emite una solicitud al backend. El único spec fallido (`ProductCard.cy.jsx`) lanzó `TypeError: t is not a function` al montar; el spec es anterior a la prop `t` del componente. La capa corre bajo `continue-on-error: true` en CI |
| E2E (Detox) | No se ejecutó. `detox` y `jest` no figuran en las dependencias del workspace; `e2e/jest.config.js`, referenciado por `.detoxrc.js`, no existe; el APK `androidTest` publicado contiene $4$ entradas ($8{,}518$ bytes) y ninguna clase Detox. El único spec no contiene aserciones de precio y se autentica solo como `standard_user` y `performance_glitch_user` |

La interpretación de estos resultados — la tensión detección-vs-caracterización, las capas
decaídas y el requisito de oráculos que implican — se difiere a la Sección 7.

## 5. Evaluación: una semana de QA automatizada externa (RQ3)

**Escenario.** Un harness externo de QA automatizada — suites de UI y API que abarcan
múltiples mercados e idiomas en web y móvil, operado por un tercero y observable para los
autores únicamente a través de sus reportes — ejercitó la plataforma desplegada públicamente
durante una semana (2026-07-16 → 2026-07-22). Resultaron seis ciclos de triage: cinco
reportes con hallazgos más una ronda de re-verificación. Cada hallazgo fue triado por un
agente LLM (Claude, Anthropic) bajo reglas permanentes definidas por humanos y con puntos de
control de decisión humana por lote, y cada ciclo produjo un documento de explicación durable
y fechado en el momento del triage — antes de que este paper fuera concebido (caveats de
procedencia documental: Sección 7).

**Diseño.** La evaluación se enmarcó como un estudio de caso retrospectivo embebido de caso
único (Runeson & Höst, 2009; Yin, 2018): el caso es la semana de operación; las unidades
embebidas son los hallazgos. Se eligió un diseño retrospectivo porque el triage ocurrió como
trabajo de ingeniería normal, lo que elimina el sesgo de diseñar-para-publicar del proceso
bajo estudio — al costo de las preocupaciones de auto-reporte declaradas en la Sección 7.

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
razonar sobre ella (Sección 7).

**Codificación.** Los hallazgos se codificaron mediante una pasada de extracción asistida por
LLM sobre las fuentes en español y fueron revisados por un humano fila por fila contra el
texto citado; la traducción al inglés ocurrió durante la codificación y fue revisada por
humanos. El estado del veredicto se descompuso deliberadamente en tres variables — un
veredicto binario (bug de la app / no bug de la app), una de ocho clases de taxonomía, y una
narrativa de causa raíz con flag de confianza `confirmed` / `candidate` / `unidentified` —
porque el corpus contiene eventos que una sola variable de veredicto confundiría: dos
retractaciones de causa raíz que dejaron en pie los veredictos binarios, y una reversión de veredicto que
invirtió un veredicto binario por completo. Todas las tasas usan veredictos finales; la única
divergencia bajo veredictos iniciales (un ciclo puntuó $3/3$ al final pero $2/3$ al inicio)
se reporta al lado. La tabla completa de codificación se entrega como `findings.csv`
(apéndice), que además registra el release en el que se publicaron los fixes de cada ciclo,
porque $11$ bugs se arreglaron y cinco releases se publicaron *durante* la ventana (cuatro
de ellos derivados del triage; el quinto, v1.1.6, fue trabajo concurrente de features) — las
tasas por ciclo describen por tanto un artefacto en movimiento, una amenaza que la Sección 7
registra.

**Protocolo bajo estudio.** El propio protocolo de triage — el objeto de la RQ3 — imponía
reproducción empírica contra el sistema en ejecución (replay de API, reproducción con estado
sembrado, reproducción en dispositivo vía `adb`, corridas de axe-core en página) antes de
cualquier veredicto que exonerara a la app; los bugs confirmados con causa evidente a nivel
de código podían veredictarse por auditoría de código más medición dirigida. Exigía además
fix-and-commit con hashes de conventional commits para los bugs confirmados, documentos de
explicación durables para cada ciclo, y autorización humana explícita por push y por release.

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

La interpretación de estos resultados se difiere a la Sección 7.

## 6. Guías de diseño para testabilidad (RQ4)

Patrones transferibles, cada uno etiquetado con la fuerza de su evidencia:

1. **Pon los modos de fallo en las credenciales.** Las personas caos deterministas componen
   ortogonalmente con cualquier otra dimensión de prueba y no requieren mutar el entorno.
   *[Fundado en la historia de diseño, Sección 3.2.]* Trade-off (anticipado, aún no
   observado): las personas son parte del contrato público; cambiar su comportamiento es un
   cambio rompiente.
2. **Haz de las reglas de mercado/i18n datos, no ramas.** Las tablas de reglas enumerables
   convierten el cumplimiento en dimensiones de prueba recorribles. *[Fundado en la historia
   de diseño, Sección 3.3; trade-off observado en la Sección 5: el drift entre la tabla de
   reglas/copy y las plataformas es en sí una clase de bug.]*
3. **Entrega puntos de entrada sancionados de inyección de estado — y trata sus efectos
   secundarios como parte del diseño.** El setup O(1) elimina la parte más flaky de las
   suites E2E *[fundado en la historia de diseño, Sección 3.4]*; el costo observado es que
   los mismos bypasses median falsos positivos *[observado en la Sección 5]*. La mitad
   prescriptiva — guardarraíles como rechazar `resetSession` a mitad de escenario, más
   telemetría de uso — es diseño futuro propuesto: OmniPizza hoy solo incluye un guard
   defensivo parcial y ninguna telemetría.
4. **Versiona tu instrumentación.** Selectores, headers y formas de respuesta tratados como
   API pública hacen durable la automatización. *[Fundado en el racional de diseño,
   Sección 3.5; en la ventana de evaluación no ocurrió ningún episodio de renombre rompiente
   que lo pusiera a prueba.]*
5. **Prefiere estado reseteable; ancla el estado mutable de sesión al login.** Reinicio-como-
   reset más el aislamiento de perfil por login eliminaron una carrera observada *[fundado en
   la historia de diseño, Sección 3.6]*; donde quedan fixtures compartidos mutables, sus
   remanentes imitan bugs deterministas de la app *[observado en la Sección 5]* — decide
   deliberadamente qué hacer con cada clase de estado.
6. **Haz el triage durable y falsable.** Documentos de explicación fechados que registran sus
   propias retractaciones convierten el triage en datos auditables — y toda atribución sobre
   un sistema que no puedes observar es una hipótesis para su dueño, no un veredicto.
   *[Observado en la Sección 5: ambas explicaciones retractadas eran atribuciones que
   cruzaban la frontera de observabilidad.]*
7. **Lleva la semántica de aserción junto con los hallazgos.** Un desajuste
   contains-vs-exact invirtió un veredicto; los contratos de aserción del harness deberían
   viajar como metadatos con cada hallazgo reportado. *[Conjetura generalizada desde un único
   incidente observado.]*

## 7. Discusión, limitaciones y amenazas (discusión redactada; amenazas en esquema)

**Discusión (redactada).**

- Ejemplar de RQ2 (resultados en la Sección 4.1): en un sandbox cuyos defectos sembrados son
  *intencionales*, la detección y la caracterización tiran en direcciones opuestas — la única
  capa que observa el defecto lo pinnea como correcto, un oráculo invertido. Dos de las
  cuatro capas habían decaído silenciosamente hasta la no-ejecutabilidad (drift de versión de
  esquema; tooling ausente), un hecho que solo salió a la luz al intentar la ejecución. La
  medición que la fila del catálogo promete (poder de detección por capa) requiere además
  oráculos ciegos al defecto — que el manifiesto de defectos sembrados legible por máquina
  habilitaría.
- Lectura de RQ3 (resultados en la Sección 5): en este único despliegue, los hallazgos
  clasificados como bugs reales declinaron en los extremos de la ventana (con un pico tardío
  de baja severidad) — consistente con, pero sin demostrar, la convergencia de la app; con un
  solo harness no puede excluirse la saturación de su inventario de checks como explicación
  alternativa. Los hallazgos no-bug instancian varias clases de fenómenos que el diseño
  persigue; como la clasificación se derivó de estos mismos hallazgos, esto es una prueba de
  existencia de generación de fenómenos, no una confirmación del catálogo de la Sección 4.

**Limitaciones y amenazas (esquema).**

- Amenazas propias de un paper de artefacto: los autores construyeron la plataforma (la evidencia de
  adopción es exactamente un harness externo; las cuatro audiencias de la Sección 1 son
  previstas, no demostradas); realismo del sandbox vs. representatividad de producción (el
  caos sembrado deliberadamente infla fenómenos específicos; el hosting free-tier infla la
  clase de infraestructura); aún no existe un manifiesto de defectos sembrados legible por
  máquina (el pitch para constructores de herramientas depende de él; planificado como
  material suplementario); sostenibilidad archivística (los despliegues vivos corren en un free
  tier — la Sección 8 se compromete a un snapshot archivado con commit fijado/DOI).
- Amenazas de la evaluación (condensadas del instrumento de la Sección 5): documentos de
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
  (Sección 4.1, 2026-07-23, instancia local en el snapshot fijado); las demás filas de la
  Sección 4 están habilitadas, no ejecutadas — por diseño de este paper; candidatos para
  trabajo posterior. La generalizabilidad de las guías está acotada a un dominio (e-commerce)
  y un equipo.

## 8. Conclusión y disponibilidad (esquema)

- Reafirmar: un producto realista puede ser un laboratorio controlado si el determinismo, la
  controlabilidad y la observabilidad son funcionalidades del producto; una semana de uso
  real por QA externa aporta una prueba de existencia en ambos papeles — app bajo prueba y
  generador de fenómenos — incluido el modo de fallo instructivo en el que la propia
  instrumentación del laboratorio actúa como vehículo de falsos positivos.
- Trabajo futuro: estudios de adopción independiente; ejecutar el catálogo de la Sección 4
  (poder de detección por capa, comparación de costo de setup de la entrada atómica); un
  manifiesto de defectos sembrados legible por máquina; metadatos de semántica de aserción
  del lado del harness.
- Disponibilidad: repositorio público (backend, web, móvil, tests, documentación) y
  despliegues vivos (`https://omnipizza-backend.onrender.com`,
  `https://omnipizza-frontend.onrender.com`); un snapshot archivado (commit fijado, DOI)
  acompañará al preprint.

## Referencias

Formato APA 7; las entradas se mantienen en inglés (el idioma del paper y de las fuentes).
Las 35 fueron verificadas contra su registro canónico (resolución de DOI o página del
editor/oficial) el 2026-07-23; la lista de reserva verificada vive en el índice de avance.

- Alameer, A., Mahajan, S., & Halfond, W. G. J. (2016). Detecting and localizing internationalization presentation failures in web applications. In *2016 IEEE International Conference on Software Testing, Verification and Validation (ICST)* (pp. 202–212). IEEE. https://doi.org/10.1109/ICST.2016.36
- Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J., Iqbal, S., Bennett, P. N., Inkpen, K., Teevan, J., Kikin-Gil, R., & Horvitz, E. (2019). Guidelines for human-AI interaction. In *Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19)* (Paper 3, pp. 1–13). ACM. https://doi.org/10.1145/3290605.3300233
- Barr, E. T., Harman, M., McMinn, P., Shahbaz, M., & Yoo, S. (2015). The oracle problem in software testing: A survey. *IEEE Transactions on Software Engineering*, *41*(5), 507–525. https://doi.org/10.1109/TSE.2014.2372785
- Basiri, A., Behnam, N., de Rooij, R., Hochstein, L., Kosewski, L., Reynolds, J., & Rosenthal, C. (2016). Chaos engineering. *IEEE Software*, *33*(3), 35–41. https://doi.org/10.1109/MS.2016.60
- Bell, J., & Kaiser, G. (2014). Unit test virtualization with VMVM. In *Proceedings of the 36th International Conference on Software Engineering (ICSE 2014)* (pp. 550–561). ACM. https://doi.org/10.1145/2568225.2568248
- Bessey, A., Block, K., Chelf, B., Chou, A., Fulton, B., Hallem, S., Henri-Gros, C., Kamsky, A., McPeak, S., & Engler, D. (2010). A few billion lines of code later: Using static analysis to find bugs in the real world. *Communications of the ACM*, *53*(2), 66–75. https://doi.org/10.1145/1646353.1646374
- Bettenburg, N., Just, S., Schröter, A., Weiss, C., Premraj, R., & Zimmermann, T. (2008). What makes a good bug report? In *Proceedings of the 16th ACM SIGSOFT International Symposium on Foundations of Software Engineering (FSE-16)* (pp. 308–318). ACM. https://doi.org/10.1145/1453101.1453146
- Binder, R. V. (1994). Design for testability in object-oriented systems. *Communications of the ACM*, *37*(9), 87–101. https://doi.org/10.1145/182987.184077
- Campbell, A., Adams, C., Bradley Montgomery, R., Cooper, M., & Kirkpatrick, A. (Eds.). (2024). *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation, 12 December 2024). World Wide Web Consortium. https://www.w3.org/TR/2024/REC-WCAG22-20241212/
- Deque Systems. (2026). *axe-core: Accessibility engine for automated Web UI testing* [Computer software]. GitHub. Retrieved July 23, 2026, from https://github.com/dequelabs/axe-core
- Do, H., Elbaum, S., & Rothermel, G. (2005). Supporting controlled experimentation with testing techniques: An infrastructure and its potential impact. *Empirical Software Engineering*, *10*(4), 405–435. https://doi.org/10.1007/s10664-005-3861-2
- Fan, A., Gokkaya, B., Harman, M., Lyubarskiy, M., Sengupta, S., Yoo, S., & Zhang, J. M. (2023). Large language models for software engineering: Survey and open problems. In *2023 IEEE/ACM International Conference on Software Engineering: Future of Software Engineering (ICSE-FoSE)* (pp. 31–53). IEEE. https://doi.org/10.1109/ICSE-FoSE59343.2023.00008
- Freedman, R. S. (1991). Testability of software components. *IEEE Transactions on Software Engineering*, *17*(6), 553–564. https://doi.org/10.1109/32.87281
- Gyimesi, P., Vancsics, B., Stocco, A., Mazinanian, D., Beszédes, Á., Ferenc, R., & Mesbah, A. (2019). BugsJS: A benchmark of JavaScript bugs. In *2019 12th IEEE Conference on Software Testing, Validation and Verification (ICST)* (pp. 90–101). IEEE. https://doi.org/10.1109/ICST.2019.00019
- Gyori, A., Shi, A., Hariri, F., & Marinov, D. (2015). Reliable testing: Detecting state-polluting tests to prevent test dependency. In *Proceedings of the 2015 International Symposium on Software Testing and Analysis (ISSTA 2015)* (pp. 223–233). ACM. https://doi.org/10.1145/2771783.2771793
- Herzig, K., Just, S., & Zeller, A. (2013). It's not a bug, it's a feature: How misclassification impacts bug prediction. In *Proceedings of the 35th International Conference on Software Engineering (ICSE 2013)* (pp. 392–401). IEEE. https://doi.org/10.1109/ICSE.2013.6606585
- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, *28*(1), 75–106. https://doi.org/10.2307/25148625
- Johnson, B., Song, Y., Murphy-Hill, E., & Bowdidge, R. (2013). Why don't software developers use static analysis tools to find bugs? In *Proceedings of the 35th International Conference on Software Engineering (ICSE 2013)* (pp. 672–681). IEEE. https://doi.org/10.1109/ICSE.2013.6606613
- Just, R., Jalali, D., & Ernst, M. D. (2014). Defects4J: A database of existing faults to enable controlled testing studies for Java programs. In *Proceedings of the 2014 International Symposium on Software Testing and Analysis* (pp. 437–440). ACM. https://doi.org/10.1145/2610384.2628055
- Kang, S., Yoon, J., & Yoo, S. (2023). Large language models are few-shot testers: Exploring LLM-based general bug reproduction. In *2023 IEEE/ACM 45th International Conference on Software Engineering (ICSE)* (pp. 2312–2323). IEEE. https://doi.org/10.1109/ICSE48619.2023.00194
- Leotta, M., Stocco, A., Ricca, F., & Tonella, P. (2016). Robula+: An algorithm for generating robust XPath locators for web testing. *Journal of Software: Evolution and Process*, *28*(3), 177–204. https://doi.org/10.1002/smr.1771
- Luo, Q., Hariri, F., Eloussi, L., & Marinov, D. (2014). An empirical analysis of flaky tests. In *Proceedings of the 22nd ACM SIGSOFT International Symposium on Foundations of Software Engineering* (pp. 643–653). ACM. https://doi.org/10.1145/2635868.2635920
- Memon, A., Gao, Z., Nguyen, B., Dhanda, S., Nickell, E., Siemborski, R., & Micco, J. (2017). Taming Google-scale continuous testing. In *2017 IEEE/ACM 39th International Conference on Software Engineering: Software Engineering in Practice Track (ICSE-SEIP)* (pp. 233–242). IEEE. https://doi.org/10.1109/ICSE-SEIP.2017.16
- OWASP Foundation. (n.d.). *OWASP Juice Shop*. Retrieved July 23, 2026, from https://owasp.org/www-project-juice-shop/
- Parry, O., Kapfhammer, G. M., Hilton, M., & McMinn, P. (2022). A survey of flaky tests. *ACM Transactions on Software Engineering and Methodology*, *31*(1), 1–74. https://doi.org/10.1145/3476105
- Runeson, P., Alexandersson, M., & Nyholm, O. (2007). Detection of duplicate defect reports using natural language processing. In *Proceedings of the 29th International Conference on Software Engineering (ICSE '07)* (pp. 499–510). IEEE. https://doi.org/10.1109/ICSE.2007.32
- Runeson, P., & Höst, M. (2009). Guidelines for conducting and reporting case study research in software engineering. *Empirical Software Engineering*, *14*(2), 131–164. https://doi.org/10.1007/s10664-008-9102-8
- Sadowski, C., Aftandilian, E., Eagle, A., Miller-Cushon, L., & Jaspan, C. (2018). Lessons from building static analysis tools at Google. *Communications of the ACM*, *61*(4), 58–66. https://doi.org/10.1145/3188720
- Sauce Labs. (n.d.). *Swag Labs (Sauce Labs sample application)* [Demo web application]. Retrieved July 23, 2026, from https://www.saucedemo.com/
- Vahabzadeh, A., Milani Fard, A., & Mesbah, A. (2015). An empirical study of bugs in test code. In *2015 IEEE International Conference on Software Maintenance and Evolution (ICSME)* (pp. 101–110). IEEE. https://doi.org/10.1109/ICSM.2015.7332456
- Wang, J., Huang, Y., Chen, C., Liu, Z., Wang, S., & Wang, Q. (2024). Software testing with large language models: Survey, landscape, and vision. *IEEE Transactions on Software Engineering*, *50*(4), 911–936. https://doi.org/10.1109/TSE.2024.3368208
- Weyuker, E. J. (1982). On testing non-testable programs. *The Computer Journal*, *25*(4), 465–470. https://doi.org/10.1093/comjnl/25.4.465
- Wieringa, R. J. (2014). *Design science methodology for information systems and software engineering*. Springer. https://doi.org/10.1007/978-3-662-43839-8
- Yin, R. K. (2018). *Case study research and applications: Design and methods* (6th ed.). SAGE Publications.
- Zhang, S., Jalali, D., Wuttke, J., Muşlu, K., Lam, W., Ernst, M. D., & Notkin, D. (2014). Empirically revisiting the test independence assumption. In *Proceedings of the 2014 International Symposium on Software Testing and Analysis (ISSTA 2014)* (pp. 385–396). ACM. https://doi.org/10.1145/2610384.2610404

## Apéndice / material suplementario

- **Hoja de datos de la plataforma (compañero obligatorio):** cada número de las Secciones
  3–5 con su regla de conteo y el commit del snapshot fijado (operaciones de endpoint vs.
  paths; conteos de *ocurrencias* de selectores vs. IDs distintos; conteo de releases
  excluyendo tags legacy duplicados que difieren solo en mayúsculas/minúsculas; conteos de filas de la tabla de
  widgets).
- `findings.csv` — tabla de codificación de los 19 hallazgos de la evaluación (descomposición
  del veredicto, flags de confianza y de mediación por instrumentación, y el release en que
  se publicaron los fixes de cada ciclo), con extractos en el idioma original.
- Manifiesto de defectos sembrados legible por máquina (planificado; requerido para el caso
  de uso de constructores de herramientas).
- Punteros a artefactos primarios: `documents/explanation/EXPLANATION_qa_report_*.md`,
  `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `backend/constants.py`, commits de fix
  por hash.

---

*Disponibilidad de datos:* la plataforma de estudio y todos los artefactos primarios son
públicos: repositorio (backend, web, móvil, tests, documentación) y despliegues vivos
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`).
