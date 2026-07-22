# Triage del reporte de bugs QA — 2026-07-21 (localización)

> **Fuente:** 3 discrepancias de texto/localización pegadas por el usuario, severidad baja, no
> bloqueantes. El propio reporte marca que el "esperado" viene de un fixture propio sin respaldo
> del copy deck oficial — pidió verificar antes de asumir que el fixture es la fuente de verdad.

## Resumen

| # | Área | Mercado | Veredicto |
|---|------|---------|-----------|
| 1 | "Agregar al carrito" (Pizza Builder mobile) | CH/de | **Bug real — corregido** |
| 2 | Estado de tracking (Order Success) | SA/ar | **Bug real — corregido en web (ver corrección 2026-07-22)** |
| 3 | Etiqueta de total (Pizza Builder) | CH/de | **Bug real — corregido en web y mobile** |

Los 3 hallazgos resultaron ser del mismo flujo: mobile's `PizzaBuilderScreen.tsx` (la pantalla que
se abre al tocar una pizza en el Catálogo) — de ahí que "Catálogo" (#1) y "Constructor de pizza"
(#3) sean, en la práctica, la misma pantalla nombrada de dos formas distintas por el reporte.

---

## 1. Botón "agregar al carrito" — divergencia real entre web y mobile

**Veredicto: bug real, corregido.** `addToCart` en alemán:

| | Web (`frontend/src/i18n/locales/de.json`) | Mobile (`frontend-mobile/.../de.json`) |
|---|---|---|
| Antes | `"Hinzufügen"` | `"In den Warenkorb"` |
| Después | `"Hinzufügen"` (sin cambio) | `"Hinzufügen"` |

El valor "esperado" del reporte coincide exacto con el valor **actual de web**; el "obtenido"
coincide exacto con el valor **actual de mobile** — confirma que la corrida de QA fue contra
mobile, con un fixture derivado de la copy de web. Se alinea mobile a web
([[omnipizza-web-is-base]]: web es la fuente de verdad para trabajo de consistencia).

**Encontrado al investigar, no corregido (fuera de lo reportado):** el mismo patrón — web usa un
verbo corto ("Add"/"Agregar"/"Ajouter"/"追加"), mobile usa la frase larga ("Add to
Cart"/"Agregar al Carrito"/"Ajouter au panier"/"カートに追加") — se repite en **es, fr y ja** para
esta misma clave (`addToCart`). Inglés y árabe sí coinciden entre ambas plataformas, lo que sugiere
que la intención original era consistencia y esto es deriva, no diseño intencional — pero no se
tocó porque no fue lo que se reportó y no hay tanta certeza como en el caso #3 (abajo). Si quieren
que se alinee el resto de los idiomas también, es un cambio de una línea por idioma en
`frontend-mobile/src/i18n/locales/{es,fr,ja}.json`.

---

## 2. Estado de tracking en Order Success (SA/ar) — bug real, veredicto original corregido

**Veredicto original (este documento, 2026-07-21): "no es un bug — el fixture no coincide con
ninguna de las dos plataformas". Ese veredicto era incorrecto — corregido el 2026-07-22 tras
contraevidencia de QA con verificación a nivel de codepoint.**

El error: asumí que el "esperado" del fixture (`"التوصيل"`) requería una coincidencia exacta de
frase completa. QA aclaró que su aserción es *contains* (substring, insensible a mayúsculas) — y
bajo esa semántica, sí matchea contra el valor **actual de web**:

| | Web (antes del fix) | Mobile |
|---|---|---|
| `outForDelivery` (ar) | `"قيد التوصيل"` | `"خرجت للتوصيل"` |
| ¿Contiene `"التوصيل"`? | ✅ sí (substring literal) | ❌ no |

Verificado a nivel de codepoint (no por inspección visual de glifos árabes, que es propensa a
error): `"التوصيل"` = U+0627,0644,062a,0648,0635,064a,0644. La segunda palabra de `"قيد التوصيل"`
coincide codepoint-a-codepoint. `"خرجت للتوصيل"` en cambio empieza esa palabra con `للـ` (lam-lam,
por la contracción ortográfica árabe لـ + ال → لل), no con `الـ` (alef-lam) — por eso el mismo
substring no aparece ahí. El fixture **no estaba desactualizado**: pasaba correctamente contra web
y fallaba correctamente contra mobile, exponiendo una divergencia real de copy entre plataformas.

**Dato adicional encontrado al re-investigar:** de los 6 idiomas, `outForDelivery` coincide
exacto entre web y mobile en **los 5 restantes** (en/es/fr/ja/de) — `ar` era el único divergente.
Mismo patrón que el caso #1 (mobile se desvió de web en una sola clave).

**Fix aplicado (2026-07-22):** por pedido explícito de QA — priorizando no cortar un release
mobile nuevo sobre mantener el patrón "mobile se alinea a web" — se alineó **web** al valor de
**mobile**: `outForDelivery` (ar) → `"خرجت للتوصيل"` en
`frontend/src/i18n/locales/ar.json`. Se publica solo con el próximo deploy de web, sin build
mobile.

**Consecuencia conocida y aceptada por QA:** el fixture de QA (que verifica el substring
`"التوصيل"`) va a pasar de estar en verde en web a fallar también en web, ya que
`"خرجت للتوصيل"` no contiene ese substring — quedará en rojo en ambas plataformas hasta que QA
actualice su fixture. QA confirmó que no van a tocar el fixture por ahora; quedó explícitamente
señalado antes de aplicar el fix, no es un efecto secundario no comunicado.

---

## 3. Etiqueta de total estimado — alemán es el único idioma sin "estimado"

**Veredicto: bug real, corregido en ambas plataformas.** `estimatedTotal`, todos los idiomas:

| Idioma | Valor (antes de este fix) |
|---|---|
| en | `ESTIMATED TOTAL` |
| es | `TOTAL ESTIMADO` |
| fr | `TOTAL ESTIMÉ` |
| ja | `推定合計` (= "estimado total") |
| ar | `الإجمالي التقديري` (= "el total estimado") |
| **de** | **`GESAMTSUMME`** (= solo "total/suma total" — sin la palabra "estimado") |

El alemán es el único de los 6 idiomas al que le falta el calificador "estimado" — y esto es
**idéntico en web y mobile** (no es una divergencia entre plataformas como el caso #1; ambas
plataformas comparten el mismo error). Esto confirma que es un hueco de traducción real,
independientemente del fixture del reporte (que además coincide exacto con la corrección aplicada).

**Fix:** `estimatedTotal` (de) → `"GESCHÄTZTER GESAMTBETRAG"` ("monto total estimado") en
`frontend/src/i18n/locales/de.json` y `frontend-mobile/src/i18n/locales/de.json`.

---

## Higiene

Ningún cambio de código toca estado de sesión/carrito compartido — son ediciones estáticas a
archivos de locale, verificadas con `JSON.parse` en ambos archivos tras el cambio. No hace falta
build mobile nuevo para publicar la corrección de mobile en un release — pero si se quiere que
llegue a usuarios de la app instalada, sí requeriría cortar una versión (mobile no tiene
auto-actualización, a diferencia de web que despliega en cada push).

**Addendum 2026-07-22:** el fix del caso #2 (arriba) toca solo `frontend/src/i18n/locales/ar.json`
— verificado con `JSON.parse` tras el cambio y con comparación de codepoints contra el valor de
mobile (match exacto). No requiere build mobile; se publica con el próximo deploy de web.
