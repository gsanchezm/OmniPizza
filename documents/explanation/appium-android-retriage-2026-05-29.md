# Re-triage de findings — Appium Android (Galaxy Z Flip 6) — 2026-05-29

> **Para:** equipo de QA
> **Criterio aplicado:** la **web es la fuente de verdad** (base de paridad). Cada divergencia app↔feature se resolvió comparando contra lo que renderiza la web; el mobile se alinea a la web.
> **Verificación:** lectura del código fuente real de web (`frontend/`) y mobile (`frontend-mobile/`) en `main` @ commit `02e04b1`. No se ejecutó otro run de Appium; el suite de tests (cucumber/molecules) vive en **otro repo** y no está en este working tree.

---

## TL;DR

De los 12 fallos del run (76 PASS / 12 FAIL):

| Clasificación | Fallos | Dónde se arregla |
|---|---|---|
| **Examples desactualizados** (contenido app↔feature) | 8 (A: 5 profile + B: 3 builder) | **Repo de tests** (feature files) |
| **Scroll/visibilidad** (test-side) | 3 (C: toppings) | **Repo de tests** (molecule) |
| **Contenedor sub-instrumentado** (D: pills JP) | 1 | **App** (fix ya aplicado) + **repo de tests** (molecule) |
| **Bugs funcionales de app** | **0** | — |

**Decisión clave:** los 8 de contenido **no requieren decisión de PO/i18n**. La web ya define la copy canónica y el mobile la replica **idénticamente**. Las expectativas del feature no coinciden con web **ni** con mobile → son Examples viejos. Hay que actualizar el feature, no la app.

**Corrección importante al triage previo:** la causa raíz propuesta para el cluster **D** estaba invertida (ver sección D).

---

## A — Labels del formulario de profile · 5 fallos · Examples desactualizados

**El contenido del mobile es idéntico al de la web.** Ambos pasan el label por mayúsculas (web: clase Tailwind `uppercase` en `frontend/src/pages/Profile.jsx:88`; mobile: `textTransform: "uppercase"` en `frontend-mobile/src/screens/ProfileScreen.tsx:304-310`). Los strings i18n son los mismos en los dos (`frontend/src/i18n/locales/*` == `frontend-mobile/src/i18n/locales/*`).

`AssertText` usa comparación estricta (`!==`), así que el Examples debe contener el **string renderizado exacto** (en MAYÚSCULAS):

| Mercado | Feature espera (mal) | Valor canónico correcto (rendered) |
|---|---|---|
| US/en | `Full name` | `FULL NAME` |
| MX/es | `Nombre` | `NOMBRE COMPLETO` |
| CH/de | `Vollständiger Name` | `VOLLSTÄNDIGER NAME` |
| CH/fr | `Nom complet` | `NOM COMPLET` |
| JP/ja | `フルネーム` | `氏名` *(uppercase no afecta a CJK)* |

> ⚠️ **No** relajar `AssertText` a case-insensitive: enmascararía las diferencias reales de palabra (MX `Nombre` → `Nombre completo`, JP `フルネーム` → `氏名`).

**Acción QA:** actualizar la tabla de Examples en `…/profile/features/update-profile.feature` con los valores de la columna derecha.

---

## B — Headings de sección y total del builder · 3 fallos · Examples desactualizados

Mismo patrón que A: **mobile == web** en los 3. A diferencia del profile, los headings del builder **no** llevan `text-transform` (web: `<h3 ... font-black text-xl>` sin uppercase; mobile: `styles.sectionTitle` en `PizzaBuilderScreen.tsx:416-420` sin `textTransform`), así que el rendered es en **case natural**.

| Locator | Feature espera (mal) | Valor canónico correcto | Fuente |
|---|---|---|---|
| `sectionToppingsText` (es) | `Ingredientes` | `Agregar Toppings` | web `PizzaCustomizerModal.jsx:184` == mobile `pizza.ts:15` |
| `sectionSizeText` (de) | `Grösse` | `Größe Wählen` | web `PizzaCustomizerModal.jsx:161` == mobile `pizza.ts:14` |
| `estimatedTotalLabel` (ja) | `概算合計` | `推定合計` | web `PizzaCustomizerModal.jsx:238` == mobile `pizza.ts:18` |

> El `estimatedTotalLabel` (mobile `styles.totalLabel:541-547`) sí tiene `textTransform: uppercase`, pero sobre CJK es no-op → `推定合計` se queda igual. Para mercados no-CJK ese label sí saldría en mayúsculas (p.ej. `TOTAL ESTIMADO`), tenerlo en cuenta si se agregan filas.

**Acción QA:** actualizar los Examples del feature del builder con la columna "valor canónico correcto".

---

## C — `~btn-topping-mozzarella` no encontrado · 3 fallos (US/CH/JP) · scroll/visibilidad

**No es contract drift.** El id `mozzarella` existe en ambos (`frontend-mobile/src/pizzaOptions.ts:20`, grupo `cheeses`; web `frontend/src/constants/pizza.js:132`). En Android, `getReadableControlProps(id, label)` (`frontend-mobile/src/utils/qa.ts:46-59`) expone el id **tanto en `content-desc` como en `resource-id`**, así que el selector `~btn-topping-mozzarella` (accessibility-id = content-desc) **sí resuelve**.

Causa: el grupo `cheeses` se renderiza **debajo** del grupo `meats` dentro del `ScrollView` vertical del builder (`PizzaBuilderScreen.tsx`), fuera del viewport en el primer render → el elemento existe en el árbol pero no es "clickeable" sin hacer scroll.

> ⚠️ **Pendiente de explicar:** un fallo puramente de scroll sería **independiente del idioma**, pero C falla en **US/CH/JP y no en MX**. Esa asimetría no la justifica "needs scroll". El mecanismo exacto necesita confirmación on-device (no tengo acceso al molecule). Posible pista: orden/altura de grupos según longitud de etiquetas por idioma, o un paso previo que en MX sí deja el topping visible.

**Acción QA:** hacer scroll del `ScrollView` del builder hasta la sección de toppings (o `scrollIntoView` sobre `~btn-topping-mozzarella`) antes del tap; **no** renombrar el testID (es correcto).

---

## D — Filtro de categoría "meat" en JP · 1 fallo · contenedor sub-instrumentado

**La diagnosis del triage previo estaba invertida.** Decía que `view-category-pills` "vive en `resource-id`, no en `content-desc`" y proponía cambiar el molecule a `resourceId("view-category-pills")`. Pero:

1. El contenedor (`frontend-mobile/src/components/CategoryPills.tsx`) usaba un `accessibilityLabel="view-category-pills"` **crudo, sin `testID`** → en Android eso da **content-desc, pero NO resource-id**.
2. El molecule **ya usaba `description("view-category-pills")` (content-desc)** y el fix estaba aplicado antes del run — **y aun así D falló**. O sea: en runtime el content-desc no localizó el contenedor (consistente con "content-desc vacío en los dumps").

Es decir: ese `ScrollView` era **el único nodo de la app que no usaba la convención de instrumentación propia** (todo lo demás pasa por `getTestProps`/`getReadable*`, que en Android setean `testID` **y** `accessibilityLabel`).

### Fix de app aplicado (en este repo)

`frontend-mobile/src/components/CategoryPills.tsx:27`:

```diff
- accessibilityLabel="view-category-pills"
+ {...getTestProps("view-category-pills")}
```

Ahora el contenedor expone `view-category-pills` en **content-desc Y resource-id**, lo que valida el selector `resourceId(...)` y mantiene también el `description(...)`.

> ⚠️ **Pendiente de confirmar on-device** (no garantizable desde código):
> - Requiere **rebuild del APK** (ver sección Build) — el cambio no está en el `omnipizza-release.apk` actual.
> - El molecule muy probablemente necesite además **`setAsHorizontalList()`**: la fila de pills es horizontal y JP solo falla porque las etiquetas en japonés empujan "meat" más fuera de pantalla. Un `UiScrollable` por defecto scrollea **vertical**.
>
> Nota: ni web (`frontend/src/components/CategoryFilter.jsx:16`, `<div>` sin `data-testid`) ni mobile instrumentaban el contenedor de scroll, así que esto **no** es una divergencia de paridad — es instrumentación faltante que ahora se agrega.

**Acción QA:** tras el rebuild, en el molecule usar `resourceId("view-category-pills")` (o mantener `description`) **+ `setAsHorizontalList()`**, y verificar on-device.

---

## Hallazgos app-side NO bloqueantes (no tocar / informativos)

- **a11y del botón add-to-cart (`content-desc` = testID crudo, p.ej. `btn-add-pizza-p01`): es intencional, NO cambiar.** `getReadableControlProps` pone deliberadamente el id en `content-desc` en Android para que los selectores `~id` de Appium resuelvan (`qa.ts:46-59`). El label legible se usa solo en iOS. Cambiarlo rompería la resolución de selectores del suite en Android.
- **Alert nativo "Profile saved":** existe de verdad (`ProfileScreen.tsx:36-38`). El feature lo descarta correctamente. Es una pregunta menor de honestidad de UI para el PO; sin impacto en tests.

---

## Resumen de acciones

### En el repo de la app (este repo)
- [x] `CategoryPills.tsx` — instrumentar el contenedor de pills con `getTestProps` (cluster D). **Pendiente de commit + rebuild del APK.**

### En el repo de tests (QA)
- [ ] **A** — corregir Examples de labels de profile (5 filas) con los valores en MAYÚSCULAS de la tabla A.
- [ ] **B** — corregir Examples de headings del builder (3 filas) con la tabla B.
- [ ] **C** — agregar scroll/`scrollIntoView` antes del tap de toppings; no renombrar el testID. Investigar la asimetría MX vs US/CH/JP on-device.
- [ ] **D** — `resourceId("view-category-pills")` + `setAsHorizontalList()` en el molecule de filtro; verificar contra el APK rebuildeado.

---

## Referencias de código (app, `main`)

- Profile: `frontend/src/pages/Profile.jsx:88` · `frontend-mobile/src/screens/ProfileScreen.tsx:114,304-310`
- i18n: `frontend/src/i18n/locales/*.json` · `frontend-mobile/src/i18n/locales/*.json`
- Builder: `frontend/src/components/PizzaCustomizerModal.jsx:161,184,238` · `frontend-mobile/src/constants/pizza.ts:14,15,18` · `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:177,233,321,416-420`
- Toppings: `frontend/src/constants/pizza.js:132` · `frontend-mobile/src/pizzaOptions.ts:20`
- Instrumentación: `frontend-mobile/src/utils/qa.ts:7-60`
- Pills: `frontend-mobile/src/components/CategoryPills.tsx:27` · `frontend/src/components/CategoryFilter.jsx:16`
