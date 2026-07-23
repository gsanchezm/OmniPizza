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

## Estado por sección

| Sección | Contenido | Estado |
|---|---|---|
| Abstract | Arco, números clave, claim de cierre | Outline |
| 1. Introducción | Motivación, audiencias previstas, RQ1–RQ4 (tipadas por Wieringa), 5 contribuciones | Outline (RQs y contribuciones ya definitivas) |
| 2. Related Work | Sandboxes, benchmarks de defectos, testabilidad, flaky/triage, LLMs, metodología | Outline — falta pasada de literatura |
| 3. Principios de diseño (RQ1) | 3.1 método + 3.2–3.8 mecanismos (caos-por-identidad, mercado-como-datos, entrada atómica, contratos, estado efímero, currículum, portafolio) | **Redactado y verificado** (2 rondas adversariales) |
| 4. Catálogo de medibilidad (RQ2) | 9 dimensiones con instrumento + medición + estado | **Redactado** — 8/9 filas son affordances no ejecutadas |
| 5. Evaluación (RQ3) | Método autocontenido, veredictos (11/19), serie por ciclo, 8 clases, falsos positivos por instrumentación, modos de fallo del triage | **Redactado y verificado** |
| 6. Guías (RQ4) | 7 guías etiquetadas por fuerza de evidencia | **Redactado** |
| 7. Discusión / amenazas | Amenazas de artefacto + de evaluación + ética + drift documental | Outline (lista de amenazas ya definitiva) |
| 8. Conclusión y disponibilidad | Restate + trabajo futuro + snapshot archivado | Outline |
| Referencias | 8 candidatas | Por completar y fijar |

## Material suplementario comprometido

| Artefacto | Qué es | Estado |
|---|---|---|
| Fact sheet de la plataforma | Cada número de §3–5 con su regla de conteo y snapshot (`83b8ba4`) | **Por construir — obligatorio** |
| `findings.csv` | Codificación de los 19 hallazgos (veredicto en 3 variables, flags de confianza e instrumentación, release por ciclo) | **Por construir — obligatorio** |
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

## Historial de versiones

| Commit | Versión | Cambio |
|---|---|---|
| `721d6d7` | v0.2 | Base inicial (encuadre de estudio de triage) + primera ronda adversarial |
| `fd7b8fd` | v0.4 | Pivote a encuadre de plataforma + segunda ronda adversarial |
| `c761f76` | — | Gemelo en español (fidelidad + calidad verificadas) |
| `d7156fd` | — | Título ampliado a multiplataforma |

## Próximos pasos (orden propuesto)

1. `findings.csv` + fact sheet de la plataforma (los dos compañeros obligatorios).
2. Pasada de literatura para Related Work; fijar referencias.
3. Redactar Intro y Abstract completos (fluyen de lo ya aprobado).
4. Opcional (convierte una affordance en evidencia): ejecutar el ejemplar barato de §4 —
   el defecto de precios $0 de `problem_user` a través de las 4 suites existentes.
5. Redactar Results/Discussion/Conclusion en prosa completa.
6. Al publicar: snapshot archivado + manifiesto de defectos.
