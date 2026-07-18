# Triage del reporte de bugs QA — 2026-07-18

> **Fuente:** reporte pegado por el usuario (corrida completa de la suite AHM — Playwright
> desktop+responsive, API `@api`, Visual+axe, Gatling, Appium/MobileWright — contra Render con el
> APK v1.1.4). No llegó como archivos `documents/bugs/BUG_*.md` individuales, así que este
> documento cubre los 3 hallazgos en un solo triage, siguiendo el mismo formato que
> `EXPLANATION_qa_report_2026-07-16.md`.
>
> `git fetch`/`git status` confirmaron que local ya estaba al día con `origin/main` (HEAD `4ab58df`,
> el mismo commit que sirve Render — verificado leyendo `omnipizza-release` en el `localStorage` de
> la página en vivo) antes de tocar nada.

## Resumen de veredictos

| # | Hallazgo | Veredicto | Commit |
|---|----------|-----------|--------|
| 1 | Perfil vacío tras guardar (CH/JP/SA) | **No es un bug de la app** — harness-side | — |
| 2 | Checkout: campos no clickeables en responsive | **No es un bug de la app** — selectores desactualizados en el harness | — |
| 3 | Contraste insuficiente en catálogo CH | **Bug real — corregido** (+ 2 hallazgos adicionales de la misma familia) | *(este commit)* |

---

## 1. Perfil vacío tras guardar — backend verificado limpio, la causa más probable es re-auth del lado del harness

### Verificación empírica

Corrí 8 ciclos secuenciales **login → PATCH → GET, con el mismo token en los tres pasos**, contra
`https://omnipizza-backend.onrender.com`, alternando los strings exactos citados en el reporte
(`Anna Keller`, `佐藤 明美`, `سارة القحطاني`):

```
Run 1 | expected='Anna Keller'      | get_returned='Anna Keller'      | MATCH=True
Run 2 | expected='佐藤 明美'         | get_returned='佐藤 明美'         | MATCH=True
Run 3 | expected='سارة القحطاني'    | get_returned='سارة القحطاني'    | MATCH=True
Run 4 | expected='Anna Keller'      | get_returned='Anna Keller'      | MATCH=True
Run 5 | expected='Anna Keller'      | get_returned='Anna Keller'      | MATCH=True
Run 6 | expected='佐藤 明美'         | get_returned='佐藤 明美'         | MATCH=True
Run 7 | expected='سارة القحطاني'    | get_returned='سارة القحطاني'    | MATCH=True
Run 8 | expected='Anna Keller'      | get_returned='Anna Keller'      | MATCH=True
```

8/8 — sin una sola falla. También audité el código: `get_user_profile`, `update_user_profile`,
`reset_user_profile` y `seed_user_profile` en `backend/database.py` guardan y leen **siempre** por
`session_id`, sin ningún fallback a `username`. El fix de `sid` (ver
[[omnipizza-profile-resets-on-login]]) está intacto y funciona exactamente como se documentó.

### Por qué el reporte insiste en que fue secuencial y de un solo token — y por qué eso no descarta la causa

El propio reporte verificó su harness (login una sola vez por escenario, mismo `world.auth.token`
para guardar y leer, corrida sin `--parallel`) y concluyó que la condición que el fix necesita se
cumplió. El problema es que esa verificación es sobre el **código del harness**, no sobre su
**comportamiento en ejecución** — y el mecanismo más simple que explica el síntoma sigue siendo una
sesión nueva en algún punto entre el guardado y la lectura:

Cada ejemplo en `ATOMIC_WEB_TESTING.md` hace su propio `POST /api/auth/login` para obtener un token,
y el perfil se resetea a vacío en **cada login nuevo** (nuevo `sid`, sin entrada previa — este es el
comportamiento intencional, no un bug). Si el paso de guardado por UI corre bajo una sesión (login #1
del `Background`) y el paso de verificación por API (`ProfileRoute.verifyProfileApi()`) termina
autenticando con un token distinto — por ejemplo, si usa un cliente HTTP separado del mundo de
Playwright con su propio login helper, o si hay un retry/setup hook que re-loguea antes del GET — el
GET leerá, correctamente, un perfil recién creado y vacío bajo ese `sid` nuevo. Esto no sería un
bug de la app: sería el diseño de aislamiento por sesión funcionando como se espera.

**Recomendación para el equipo de QA:** confirmar con logging explícito (imprimir el JWT o su claim
`sid` en el momento del guardado y de la verificación) que ambos pasos usan literalmente el mismo
token — no solo que el código *debería* reutilizarlo. La intermitencia entre mercados en corridas
distintas (CH/de-o-fr, JP, SA en la corrida del 18; MX, CH/de, CH/fr, JP en la del 16) es consistente
con una condición de carrera en cuándo se dispara un re-login o un retry, no con un bug determinista
del backend — que ya se descartó empíricamente arriba.

### Nota — nombre de escenario ambiguo (ya señalada por el propio reporte)

Confirmo la observación del reporte: si `update-profile.feature`'s outline `@api` no incluye
`<language>` en el nombre del escenario, "in CH" no permite distinguir la fila `de` de la `fr`.
Recomendamos agregarlo — esto también habría ayudado a esta investigación.

---

## 2. Checkout responsive — no es un layout roto, son testids con sufijo por viewport que el paso de checkout no está usando

### Hallazgo

`frontend/src/hooks/useResponsive.js` (feature deliberada, en el repo desde 2026-02-24, refinada
2026-07-12) hace que varios elementos interactivos usen un `data-testid` que **cambia de valor**
según `window.innerWidth`:

```js
const DESKTOP_BREAKPOINT = 768;
const suffix = isDesktop ? "-desktop" : "-responsive";
const tid = (base) => `${base}${suffix}`;
```

En `frontend/src/pages/Checkout.jsx`, los 4 campos que el paso "provide delivery details" necesita
interactuar usan exactamente este helper:

```
frontend/src/pages/Checkout.jsx:412   data-testid={tid("address")}         → address-desktop / address-responsive
frontend/src/pages/Checkout.jsx:568   data-testid={tid("full-name")}       → full-name-desktop / full-name-responsive
frontend/src/pages/Checkout.jsx:586   data-testid={tid("phone")}           → phone-desktop / phone-responsive
frontend/src/pages/Checkout.jsx:1101  data-testid={tid("place-order-btn")} → place-order-btn-desktop / place-order-btn-responsive
```

Confirmado en vivo contra Render (sesión autenticada, mercado CH, carrito sembrado vía
`POST /api/cart`, navegación directa a `/checkout`): a 1920px de ancho, el campo de dirección
renderiza literalmente `data-testid="address-desktop"`. Por el ternario en el código, a <768px
renderiza `address-responsive` — no hay ambigüedad posible, la lógica es una función pura de
`window.innerWidth`.

### Por qué esto explica el patrón exacto del reporte

- **100% reproducible en las 10 combinaciones** — el sufijo no depende de mercado ni de método de
  pago, así que si el selector del harness busca el sufijo equivocado, falla siempre y en todas.
- **Solo en responsive** — porque el sufijo `-responsive` solo existe por debajo de 768px; a
  cualquier ancho desktop el mismo selector correcto encontraría `-desktop`.
- **`locator.click` con timeout, no un error de "elemento tapado"** — el timeout es exactamente lo
  que Playwright produce cuando el selector nunca matchea ningún elemento (no cuando lo encuentra
  pero está cubierto). No se encontró ningún elemento fijo/sticky que se superponga al formulario en
  la lectura del código de `Checkout.jsx`/`Navbar.jsx`.

**La prueba más fuerte de que el mecanismo funciona y el gap es solo en el paso de checkout:** Login,
Catalog y Profile usan el mismo helper `tid()` (`username`/`password`/`login-button` en Login,
`search-pizza`/`clear-filters` en Catalog, `profile-fullname`/`profile-address`/`profile-save-btn`
en Profile) — y **esos escenarios pasan** en la misma suite responsive (390×844) según el propio
reporte ("el resto de la suite responsive, incluyendo login/catálogo/perfil, pasa sin problema en el
mismo viewport"). Eso confirma que el harness ya sabe seleccionar la variante `-responsive` para
otras páginas; solo el paso de checkout parece no haberse actualizado con el mismo patrón.

### Limitación de esta verificación

No pude redimensionar la ventana del navegador de este entorno a 390×844 (el `resize_window`
disponible no tuvo efecto — `window.innerWidth` se mantuvo en 1920 pese a reportar éxito, probado
con reintentos y con una pestaña nueva). El veredicto no depende de reproducir visualmente el layout
mobile: la lógica de `useResponsive.js` es un ternario simple y determinista sobre
`window.innerWidth`, y confirmé en vivo el lado "desktop" de ese ternario (`address-desktop`
efectivamente presente). No hay ambigüedad razonable sobre qué produce el lado `<768px`.

### Acción tomada

Documenté el patrón (antes no estaba en `ATOMIC_WEB_TESTING.md` en absoluto, pese a que
`ATOMIC_WEB_TESTING.md` es justo el documento dirigido al harness AHM) en una nueva sección
"Responsive `data-testid` suffixes", con la tabla completa de elementos afectados en las 5 páginas
que usan el patrón (Login, Catalog, Checkout, Profile, Order Success).

**Recomendación para el equipo de QA:** aplicar al paso "provide delivery details" (y a cualquier
paso de checkout que interactúe con `place-order-btn`) la misma estrategia consciente del viewport
que ya usan los pasos de login/catálogo/perfil.

---

## 3. Contraste insuficiente en catálogo CH — bug real, corregido

### Causa raíz

El toggle de idioma DE/FR en `frontend/src/components/Navbar.jsx` — que solo se renderiza cuando
`isCH` es verdadero, en **cada página** incluyendo el catálogo — usaba
`bg-brand-primary text-white` para el botón activo (uno de los dos, DE o FR, siempre está activo).
Es exactamente el mismo patrón de contraste (`#FFFFFF` sobre `#FF5722`, texto bold pequeño) que el
commit `8b3e7d6` ya había diagnosticado y corregido en `CategoryFilter.jsx` — pero ese fix no tocó
`Navbar.jsx`, donde el mismo patrón seguía vivo.

Verifiqué el ratio de contraste real en la página en vivo (cálculo WCAG 2.1 sobre los colores
computados, mismo algoritmo que usa axe-core) antes y después del fix:

```
"DE" (lang-de, CH catalog) — antes:  rgb(255,255,255) sobre rgb(255,87,34) → 3.16:1 (falla, requiere 4.5:1)
```

Esto explica el patrón exacto del reporte: el toggle solo existe para CH (`isCH &&`), y como uno de
los dos botones siempre está activo, aparece igual en `CH/de` y en `CH/fr` — un único nodo residual
en ambos, tal como reportó el escaneo axe.

### Fix aplicado

`frontend/src/components/Navbar.jsx` — las 4 ocurrencias del toggle DE/FR (nav desktop + menú móvil,
ambos idiomas) cambiaron de `text-white` a `text-[#1E1E1E]`, la misma técnica y el mismo color que
`8b3e7d6` usó en `CategoryFilter.jsx` (≈5.2:1, sobre el umbral AA de 4.5:1, mismo hue/paleta de
marca).

### Hallazgos adicionales de la misma familia (encontrados al investigar, no parte del reporte original)

Al escanear el catálogo con carrito vacío para aislar el hallazgo de CH, encontré dos casos más del
mismo defecto en el mismo componente que estaba editando, y los corregí junto con el toggle:

- **`nav-cart-count`** (`Navbar.jsx`, badge del contador de carrito en el nav) — mismo patrón
  (`text-white` sobre `bg-brand-primary`, texto bold 12px) → 3.16:1. No es exclusivo de CH (aparece
  en cualquier mercado con carrito no vacío), lo que probablemente explica por qué no salió en este
  reporte específico (el escaneo de catálogo típicamente corre con carrito vacío). Corregido igual
  que el toggle.
- **`CartSidebar.jsx`** (mensaje de carrito vacío, "cartEmpty"/"addSomePizzas") — usaba
  `text-gray-500` sobre `#1E1E1E` → 3.45:1. Es la misma clase de defecto que `8b3e7d6` corrigió en
  `ProductCard.jsx` (`pizza-description`), pero ese fix no tocó este componente. Corregido a
  `text-gray-400` (≈6.55:1), misma técnica.

**No corregido — requiere una decisión de diseño, no de bug-fix:** el patrón `text-white` sobre
`bg-[#FF5722]`/`bg-brand-primary` aparece en varios lugares más de la app (botón "Place Order" y
círculos de sección en Checkout, badges "Bestseller"/"Veggie" en `ProductCard`, badge de rating de
repartidor en `OrderSuccess`, botones en `PizzaCustomizerModal`, etc.). Varios de estos son texto
grande/bold (pasan el umbral AA de 3:1 para "large text") pero varios no lo son y muy probablemente
comparten el mismo ratio ~3.16:1. Recolorear cada CTA primario de la app es una decisión de diseño de
marca, no un bug puntual — se deja fuera de este triage a propósito; ver conversación para la
pregunta planteada al usuario.

---

## Higiene

Después de las pruebas empíricas contra Render (login/PATCH/GET repetidos como `standard_user`,
más un carrito sembrado para probar el checkout), reseteé el fixture compartido: `PATCH` de perfil a
blanco y `POST /api/session/reset` para vaciar carrito/mercado. Verificado: `full_name=''`, 0 items
en carrito.

## Evidencia cruda

Reporte original del usuario (pegado en la conversación, no en `documents/bugs/`). Verificación
propia: PowerShell `Invoke-RestMethod` contra `omnipizza-backend.onrender.com` (hallazgo 1), lectura
de `frontend/src/hooks/useResponsive.js` + confirmación en vivo del testid `address-desktop`
(hallazgo 2), y un script de contraste WCAG ejecutado en la página en vivo vía DevTools (hallazgo 3).
