# Paper OmniPizza — Índice de avance

Documento de trabajo (en español) para seguir el progreso del paper. No forma parte del
paper publicable.

## Archivos

| Archivo | Rol |
|---|---|
| `omnipizza-paper.md` | **Versión canónica (inglés)** — la destinada a publicación; ante discrepancias, prevalece |
| `omnipizza-paper.es.md` | Gemelo en español — espejo 1:1; se actualiza tras cada cambio al canónico |
| `README.md` | Este índice de avance |

**Título actual:** *OmniPizza: A Controlled Laboratory for Multi-Platform Test Automation*
**Encuadre:** paper de artefacto (design science) con evaluación retrospectiva de estudio de
caso. La plataforma es la contribución central; la semana de triage QA (19 hallazgos,
2026-07-16 → 07-22) es la evaluación.

> **Estructura (desde v0.5):** IMRyD — 1 Introducción (CARS) · 2 Trabajo relacionado ·
> 3 Métodos (3.1 derivación, 3.2 materiales/plataforma con 3.2.1–3.2.7, 3.3 instrumentos,
> 3.4 procedimiento del ejemplar, 3.5 método del estudio de caso) · 4 Resultados (4.1
> ejemplar, 4.2 evaluación) · 5 Discusión (prosa + 5.1 guías + 5.2 amenazas) · 6 Conclusión.
> Los números de sección de la tabla siguiente y del mapeo de referencias usan la numeración
> PREVIA a v0.5 donde no se haya actualizado.

## Estado por sección

| Sección | Contenido | Estado |
|---|---|---|
| Abstract | 210 palabras, estructura 10/10/20/40/20 (contexto→brecha→método→resultados→impacto), alta densidad léxica | **Redactado** |
| 1. Introducción | Movimientos CARS (territorio/nicho/ocupación) + audiencias + RQ1–RQ4 + 5 contribuciones | **Redactada** |
| 2. Trabajo relacionado y marco teórico | 5 párrafos de related work (sandboxes, benchmarks, testabilidad/instrumentos, fenómenos, corrientes metodológicas) + 2.1 marco teórico (mapa operacional) | **Redactada completa** |
| 3. Principios de diseño (RQ1) | 3.1 método + 3.2–3.8 mecanismos (caos-por-identidad, mercado-como-datos, entrada atómica, contratos, estado efímero, currículum, portafolio) | **Redactado y verificado** (2 rondas adversariales) |
| 4. Catálogo de medibilidad (RQ2) | 9 dimensiones con instrumento + medición + estado | **Redactado** — 8/9 filas son affordances no ejecutadas |
| 5. Evaluación (RQ3) | Método autocontenido, veredictos (11/19), serie por ciclo, 8 clases, falsos positivos por instrumentación, modos de fallo del triage | **Redactado y verificado** |
| 6. Guías (RQ4) | 7 guías etiquetadas por fuerza de evidencia | **Redactado** |
| 7. Discusión / amenazas | 6 párrafos de discusión con fricción de citas (verificadas vía web) + párrafo íntegro de limitaciones; enumeración de amenazas como detalle | **Discusión redactada**; enumeración en esquema |
| 8. Conclusión y disponibilidad | Implicaciones (sin resumen) + vía destrabada: ablación de protocolo dentro de la plataforma | **Redactada** |
| Referencias | 36 en APA 7 con sangría francesa (29 peer-reviewed + 2 libros + 5 oficiales; +TasteJS desde la reserva); lista restringida a obras citadas — verificado 36/36 citadas, 0 huérfanas | **Completadas y verificadas** |

## Material suplementario comprometido

| Artefacto | Qué es | Estado |
|---|---|---|
| Fact sheet de la plataforma | Cada número de §3–5 con su regla de conteo, comando ejecutable y valor medido (snapshot `83b8ba4`) | **Construido** — `platform-fact-sheet.md` (extraído + re-ejecutado independientemente) |
| `findings.csv` | Codificación de los 19 hallazgos (veredicto en 3 variables, flags de confianza e instrumentación, release por ciclo) | **Construido** — verificado fila por fila contra los 6 EXPLANATION y git |
| Manifiesto de defectos sembrados | Legible por máquina; requerido para el caso de uso de tool builders | Por construir (puede ser trabajo futuro) |
| Snapshot archivado (commit fijado / DOI) | Compromiso de la Sección 8 | Al momento de publicar |

## Decisiones tomadas (no reabrir sin motivo)

- Inglés como idioma canónico; gemelo español sincronizado (glosario en memoria del proyecto).
- Solo evidencia retrospectiva para la evaluación (§5); ejecutar affordances de §4 es opcional
  y aditivo.
- Numeración/hechos verificados: 20 operaciones `/api`, 165/114 *ocurrencias* de selectores,
  9/11 widgets, 3 s solo en catálogo+checkout, header en 2 endpoints de lectura, serie no
  monótona con veredictos finales, releases solo de 4 ciclos (v1.1.6 excluida).
- Lecturas acotadas: §5 = prueba de existencia; taxonomía = clasificación preliminar;
  audiencias = previstas.

## Figuras (plan en `figures-plan.md`)

| # | Tipo | Qué visualiza | Ancla |
|---|---|---|---|
| 1 | Diagrama conceptual | Mapa operacional: instrumentos de controlabilidad/observabilidad + el cortocircuito del oráculo derivado (detection = 0) | Final de §2.1 |
| 2 | Flowchart 3 carriles | Pipeline del estudio: descripción del artefacto (con back-edge de 3 refutaciones) · ejemplar · estudio de caso (con compuertas) | Apertura de §3 |
| 3 | Barras apiladas + línea | Los 19 hallazgos por ciclo × clase final, tasa de bugs reales (final vs inicial), hatching de mediación por instrumentación, retractaciones y reversión | §4.2 (serie por ciclo) |
| 4 | Diagrama de secuencia | Mecanismo del falso positivo mediado por instrumentación (F17: carrito huérfano + hidratación "as designed") | §4.2 (bullet de destacados) |

Regla: toda cifra de una figura debe re-derivarse del fact sheet o de `findings.csv`.

## Mapeo referencia → sección (guía para redactar)

| Sección del paper | Referencias (autor, año) |
|---|---|
| §1 Motivación (ruido de CI, costo del triage) | Memon 2017; Parry 2022; Bessey 2010 |
| §2 Sandboxes y benchmarks | Sauce Labs (SauceDemo); OWASP Juice Shop; Just 2014 (Defects4J); Gyimesi 2019 (BugsJS); Do 2005 (SIR) |
| §2/§3 Testabilidad y diseño (RQ1) | Binder 1994; Freedman 1991; Basiri 2016 (chaos); Leotta 2016 (locators) |
| §4 Medibilidad y oráculos (RQ2, ejemplar 4.1) | Weyuker 1982; Barr 2015; Campbell 2024 (WCAG 2.2); Deque (axe-core) |
| §5 Evaluación: ruido, veredictos, fixtures (RQ3) | Luo 2014; Johnson 2013; Sadowski 2018; Herzig 2013; Zhang 2014; Gyori 2015; Bell & Kaiser 2014; Vahabzadeh 2015; Bettenburg 2008; Runeson 2007 |
| §5/§6 Triage LLM-asistido + supervisión humana | Wang 2024; Kang 2023 (LIBRO); Fan 2023; Amershi 2019 |
| §6.1/§9 (metodología) | Runeson & Höst 2009; Yin 2018; Wieringa 2014; Hevner 2004 |
| §3.3/§5 i18n/RTL | Alameer 2016 |

**Reserva verificada** (no incluidas en las 35; registro canónico confirmado, usables al
redactar): Ralph et al. 2021 (Empirical Standards, arXiv); Lam et al. 2019 (iDFlakies);
Eck et al. 2019 (flaky, percepción de devs); Bell et al. 2018 (DeFlaker); Christakis & Bird
2016; Sadowski et al. 2015 (Tricorder); TasteJS TodoMVC; Voas & Miller 1995; Garousi et al.
2019 (testability survey); van Deursen et al. 2001 (test smells); Kang et al. 2024 (fault
localization); Hou et al. 2024 (LLM4SE SLR); Anvik et al. 2006; Zimmermann et al. 2012
(reopened bugs); Principles of Chaos Engineering (2019).

## Historial de versiones

| Commit | Versión | Cambio |
|---|---|---|
| `721d6d7` | v0.2 | Base inicial (encuadre de estudio de triage) + primera ronda adversarial |
| `fd7b8fd` | v0.4 | Pivote a encuadre de plataforma + segunda ronda adversarial |
| `c761f76` | — | Gemelo en español (fidelidad + calidad verificadas) |
| `d7156fd` | — | Título ampliado a multiplataforma |

## Próximos pasos (orden propuesto)

1. ~~`findings.csv` + fact sheet de la plataforma~~ — hecho (2026-07-23).
2. ~~Commitear los documentos fuente sin trackear~~ — hecho (`78b7631`, 2026-07-23).
3. ~~Pasada de literatura para Related Work; fijar referencias~~ — hecho (2026-07-23):
   35 referencias APA 7 verificadas (50 encontradas, 0 rechazadas por los verificadores;
   15 quedan en reserva, abajo).
4. Redactar Intro y Abstract completos (fluyen de lo ya aprobado).
5. ~~Ejecutar el ejemplar de §4~~ — hecho (2026-07-23): **0 de 4 capas detectan el defecto
   sembrado tal cual están** (contrato no ejecutable por drift OpenAPI 3.1 + `price` sin
   mínimo; Vitest 46/46 verde con oráculo invertido; Cypress ciega por fixtures + 1 spec
   podrida; Detox = andamiaje sin tooling). Resultados en §4.1 del paper y §6 del fact sheet.
   Opcional futuro: hacer ejecutable la capa Detox (deps + jest.config + build instrumentado)
   y correrla en dispositivo físico.
6. Redactar Results/Discussion/Conclusion en prosa completa.
7. Al publicar: snapshot archivado + manifiesto de defectos + extractos en idioma original
   para findings.csv.
