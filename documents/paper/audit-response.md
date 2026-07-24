# Respuesta a la auditoría "Turning the Tables" (omnipizza-paper-Audit.md)

Fecha: 2026-07-23. Cada hallazgo se verificó contra el texto real antes de decidir.

## Hallazgo previo al triage: citas fabricadas en la auditoría

Ocho oraciones que la auditoría "cita" del paper **no existen como se citan** — el auditor
parafraseó de memoria en lugar de citar. Ninguna invalida por sí sola el diagnóstico
estilístico, pero obligan a triage en lugar de aplicación ciega:

1. §3.2.2 (audit L158): cita `chippu` / `iikramiya` — el paper dice `chip` / `baksheesh`
   (valores verificados contra `constants.py`).
2. §3.2.6 (L173): lista de widgets "quantity steppers, radio groups, checkbox cards, tab
   panels, ARIA comboboxes, payment toggles" — inventada; el paper lista toasts, modales,
   dropdowns, flujo de pago falso, date pickers (9 web / 11 móvil).
3. §3.2.7 (L178): "a Vitest/React Testing Library component layer (137 test declarations),
   and Cypress E2E specifications parameterized over viewports and personas" — fabricado;
   el portafolio real es Schemathesis + 41 Vitest API + 11 specs Cypress de componentes +
   experimentos Detox.
4. §3.5 Datos (L188): "deleted outside the authors' control" — contradice el paper (los
   borra el flujo de triage propio).
5. §3.5 Codificación (L193): "the finding 5.1 reversal" — no existe tal identificador (es
   F15); redacción citada no coincide.
6. §3.5 Protocolo (L198): "including self-evident UI/layout defects... without requiring
   every diagnostic channel" — el paper dice otra cosa (code audit + medición dirigida).
7. §5 (L215): "the purest possible non-actionable signal" — no aparece; el paper dice
   "the limit case of non-actionability".
8. §5 (L220): anécdota del "phone terminal allowed npm install" — fabricada; lo real (y lo
   que el paper dice) es el doble fallo del instalador de Cypress y el tooling Detox
   ausente. (L225 además re-cita "dominate at scale", redacción que ya se había corregido
   a "pervade / large share of transitions".)

Moraleja registrada: también los auditores necesitan verificación empírica.

## Aceptado y aplicado (commit de esta fecha)

- **Reescritura 1** (intro, "buy confidence"): eslogan eliminado; dividida en dos
  oraciones, cita de Wang conservada.
- **Reescritura 2** (demo apps): dividida; la crítica queda en dos oraciones y el claim de
  nicho ("not studied as a research object") se conserva — la versión del auditor lo
  borraba.
- **Reescritura 3** (tríada del gap): cadencia de tres partes rota conservando las tres
  propiedades.
- **Reescritura 4** (cuatro audiencias): dividida; el caveat de adopción ahora es oración
  propia ("narrower than that list") — sin perder los detalles que el auditor eliminaba.
- **Reescritura 5** (línea "smug" sobre la literatura LLM): sustituida por la afirmación
  estrecha; la conclusión protocolo-no-modelo ya vivía más abajo en el párrafo, así que no
  se duplicó.
- **Estructura repetitiva** (near-miss del párrafo de limitaciones, 7/8 The/This):
  variados tres arranques (We built / Our verdict classification / Eleven fixes...) — de
  paso gana primera persona honesta.
- **Ghost-citation, ítem axe-core**: versión pineada en el texto (§3.5: "axe-core 4.9.1
  runs" — la versión realmente usada en el triage, verificada en el EXPLANATION del
  07-20 y `findings.csv` F12).

## Rechazado, con razón

- **Densidad del Abstract**: la densidad léxica (≥2 términos técnicos por oración) fue un
  requisito explícito del autor para esa sección; conflicto de plantillas resuelto a favor
  del requisito. Sin cambios.
- **Aforismos de la Conclusión** ("A laboratory is a promise...", "The interesting question
  stops being..."): la plantilla de Conclusión pedía cierre afilado; se conservan como
  firma — uno por sección, no en capa.
- **"deliberately frozen / deliberately live"**: paralelismo intencional que carga la tesis
  del contraste con los corpus; se conserva.
- **Sugerencias sobre oraciones fabricadas** (widgets, 137 declarations, purest possible,
  phone terminal): nada que arreglar — las oraciones no existen.

## Diferido a preparación de submission (anotado en README)

- Citas web con snapshot archivado o tag/release pineado (SauceDemo, Juice Shop, TodoMVC,
  axe-core como release de GitHub además de la mención de versión en texto).
- Apéndice/log de verificación de referencias inspeccionable por el lector (hoy la
  verificación vive en el proceso; el preámbulo declara método y fecha).
- Los DOI/snapshot para las URLs vivas ya estaban comprometidos en Availability.
