# Triage del reporte de bugs QA — 2026-07-20

> **Fuente:** reporte pegado por el usuario (recon pass previo a una corrida cronometrada de las 7
> categorías de prueba, contra `omnipizza-frontend.onrender.com` / `omnipizza-backend.onrender.com`).
> 2 hallazgos de la app (no incluye los 2 bugs propios del harness AHM que el reporte menciona
> aparte). Verificado contra `origin/main` al día — `git fetch` confirmó local al mismo commit que
> Render (`657f0b6`), sin drift que investigar esta vez.

## Resumen

| # | Hallazgo | Veredicto | Commit |
|---|----------|-----------|--------|
| 1 | Contraste de color en Checkout — payment method inactivo (web) | **Bug real — corregido** | `fd73b6d` |
| 1b | Mismo patrón (`text-gray-500`-equivalente), nunca portado a mobile — encontrado al revisar mobile por paridad | **Bug real — corregido** | `b8c82d0` |
| 2 | Order Success (CH/de): tracking/courier tardan en aparecer | **No es bug de la app** — latencia de cold-start de Render free-tier | — |

Los 3 commits (`fd73b6d`, `b8c82d0`, bump de versión `f3c0dda`) están pusheados a `origin/main`.
Mobile release **v1.1.7** disparado vía `mobile-release.yml` (run `29794833594`) para llevar el
fix de mobile a los usuarios — ver `documents/explanation` o `gh run view 29794833594` para el
resultado final.

---

## 1. Violación de contraste de color en Checkout — botones de método de pago inactivos

**Veredicto: bug real, corregido.** El reporte no traía los selectores exactos de los 2 nodos
(axe-core no los incluyó en el log `progress`), así que se reconstruyó la causa desde el código y
se confirmó en vivo.

### Causa raíz

`frontend/src/pages/Checkout.jsx`, sección "Payment Method": los tres botones (`Credit Card`,
`Cash`, `PayPal`) usan una clase condicional — el botón **inactivo** recibe `opacity-60` sobre
**todo** el subárbol (fondo, borde y texto):

```jsx
className={`... ${paymentMethod === "cash" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
```

El texto descriptivo de cada botón (`creditCardDesc` / `payOnDelivery` / `paypalDesc`) usaba
`text-gray-400` — un color que por sí solo cumple WCAG AA (7.5:1 sobre `#0F0F0F`), pero al
heredar el `opacity-60` del botón contenedor, el píxel **renderizado** se mezcla con el fondo de
página (`#0F0F0F`) y el contraste efectivo cae a **3.41:1**, por debajo del umbral 4.5:1 para
texto normal. Por defecto `paymentMethod` arranca en `"card"`, así que **Cash y PayPal están
inactivos al cargar la pantalla** — exactamente 2 nodos con la misma violación, coincidiendo con
el `"nodes":2` del log de axe.

Esto **no es específico del mercado US** — el selector de método de pago es igual en los 5
mercados; el reporte simplemente usó US como mercado de prueba. Se reproduce en cualquier mercado.

### Por qué el barrido de contraste del 07-18 no lo agarró

`e6bfb9e` (el barrido app-wide de contraste, ver `EXPLANATION_qa_report_2026-07-18.md`) sí tocó
esas 3 líneas — cambió el color de texto a algo que pasa 4.5:1 **evaluado de forma aislada**. Pero
el `opacity-60` del elemento contenedor (agregado antes, en `61a47512`, 2026-07-09, no tocado por
el barrido) compone con cualquier color de texto que se elija — el barrido recalculó contraste
sobre el par de colores declarados en el CSS, sin componer la opacidad ambiental del ancestro. Es
un hueco de método, no un archivo que se saltaron.

### Verificación empírica

Con `vite dev` local apuntando al backend de Render (mismo patrón que
[[omnipizza-web-local-verify]]), sesión US atómica vía `localStorage`, primero una réplica en el
navegador del algoritmo de luminancia relativa WCAG (recorriendo ancestros para componer
`opacity`, igual que hace axe-core internamente) dio 3.413:1 pre-fix → 5.234:1 post-fix para ambos
nodos.

Para no depender de una reimplementación propia, se cargó **axe-core real** (4.9.1, vía CDN) en la
página y se corrió `axe.run(...,{runOnly:['color-contrast']})` sobre `[data-testid="screen-checkout"]`
— primero revirtiendo las clases en el DOM en vivo a como estaban antes del fix (sin tocar el
archivo fuente), después con el fix aplicado:

**Pre-fix (clases originales, vía JS, sin tocar el archivo):**
```json
{
  "violationCount": 1,
  "violations": [{
    "id": "color-contrast", "impact": "serious",
    "nodes": [
      { "target": ["button[data-testid=\"payment-method-cash\"] > .text-left > .text-left.text-xs.uppercase"] },
      { "target": ["button[data-testid=\"payment-method-paypal\"] > .text-left > .text-left.text-xs.uppercase"] }
    ],
    "summary": "insufficient color contrast of 3.42 (foreground #64686f, background #0f0f0f) — expected 4.5:1"
  }]
}
```

Esto es una coincidencia exacta con el reporte original de QA: mismo `id` (`color-contrast`), mismo
`impact` (`serious`), mismos `nodes: 2` — los dos textos descriptivos de Cash/PayPal cuando están
inactivos — y el 3.42 medido por axe está a 0.01 del 3.413-3.417 calculado a mano. Esto confirma que
son exactamente los 2 nodos que reportó QA, no una hipótesis.

**Post-fix (código real del commit):**
```json
{ "violationCount": 0, "violations": [] }
```

El ícono de tip-info (`text-gray-500`, ver sección "Bonus" abajo) se revirtió en el mismo scan
pre-fix y **no** apareció como violación — confirma que no es uno de los 2 nodos que reportó QA
(consistente con que axe-core no evalúa el glyph de un emoji como color de texto), aunque sigue
siendo el mismo defecto conocido y se corrigió igual. Screenshot del checkout post-fix tomado, sin
regresión visual.

### Fix

Subido el color de texto de las 3 descripciones (`creditCardDesc`/`payOnDelivery`/`paypalDesc`) de
`text-gray-400` a `text-gray-300` — sobrevive la composición con `opacity-60` y queda muy por
encima de 4.5:1 tanto activo como inactivo. Se dejó el `opacity-60` en su lugar (es la señal visual
intencional de "no seleccionado"); el fix ajusta el color base para que la señal visual siga
funcionando sin caer bajo el umbral de accesibilidad.

### Bonus: segundo hallazgo del mismo patrón, no reportado por QA

Revisando el archivo se encontró otra instancia del patrón exacto que el barrido 07-18 buscaba
eliminar (`text-gray-500` sobre fondo oscuro) que sobrevivió porque el elemento se agregó **antes**
del barrido y nunca se tocó: el botón del tooltip "ℹ️" de propina (`tip-info`, agregado en
`2b3a099`, 2026-07-09) usaba `text-gray-500` por defecto (3.75:1 sobre `#161616`, solo mejora a
blanco en `:hover`, que un scan estático de axe no evalúa). Corregido a `text-gray-400` (7.12:1),
consistente con el resto de la pantalla. No se confirma que sea uno de los 2 nodos que reportó axe
(un ícono emoji suele excluirse de la regla `color-contrast` porque los navegadores lo renderizan
con su propia paleta de emoji, no con el `color` CSS), pero es el mismo defecto conocido y se
corrigió de una vez.

### Nota — mobile no tenía el mismo bug, pero sí un hallazgo propio del mismo patrón (corregido a pedido del usuario, commit separado)

`frontend-mobile/src/screens/CheckoutScreen.tsx` usa el mismo patrón de 3 botones de pago, pero
**sin** wrapper de opacidad ambiental en el estado inactivo (`paymentCardActive` solo cambia
`borderColor`) — así que el bug *de este reporte* no aplicaba a mobile tal cual.

Se encontró, sin buscarlo, que `paymentSub` (`color: "#666"` sobre `backgroundColor: "#1A1A1A"`)
da **3.03:1**, también bajo AA. Al revisar el alcance real del patrón resultó ser más amplio: el
literal `"#666"` como color de texto (no placeholder) aparece **16 veces en 3 pantallas**
(`CheckoutScreen`, `OrderSuccessScreen`, `ProfileScreen`) — labels de sección, texto de courier,
detalles de ítem, etc., todos sobre los mismos fondos oscuros de la app (`#0F0F0F`/`#1A1A1A`).

**Por qué el sweep mobile del 07-18 no lo agarró:** `85afd81` (el "mirror" mobile del sweep web)
dice explícitamente en su propio mensaje que solo cubrió el patrón "white-on-brand-primary"
(texto blanco sobre `#FF5722`) — nunca tocó el patrón equivalente a "gray-500 sobre oscuro" que
el sweep *web* (`e6bfb9e`) sí cubrió. No es que se les haya escapado un archivo; ese patrón nunca
estuvo en el alcance del mirror mobile.

**Corregido** (commit separado de mobile, ver más abajo): las 16 ocurrencias de `color: "#666"`
se cambiaron a `Colors.text.muted` (`#9CA3AF`, el mismo token gray-400-equivalente ya usado en el
resto de la app — da 6.1-7.1:1 contra los fondos oscuros usados aquí). Los 4 usos de
`placeholderTextColor="#666"` en `ProfileScreen.tsx` se dejaron intactos — el placeholder de un
input no es el medio principal para transmitir la etiqueta (cada campo ya tiene su `<Text
style={styles.label}>` propio) y WCAG 1.4.3 no aplica de la misma forma a texto de placeholder.
`npx tsc --noEmit` pasa limpio tras el cambio.

---

## 2. Order Success (CH/de): tracking/courier no aparecen a tiempo — no es bug de la app

**Veredicto: no es un bug de la app.** Es latencia de cold-start del backend en el plan gratuito de
Render, expuesta por el patrón de hidratación atómica de Order Success — no un defecto de código.

### Cómo funciona la pantalla

`frontend/src/pages/OrderSuccess.jsx` monta con `order = null`. Si la navegación llega con
`?orderId=...` (el patrón **recomendado** documentado en `ATOMIC_WEB_TESTING.md`, "Variant A"),
un `useEffect` dispara `GET /api/orders/{id}` y recién cuando esa promesa resuelve se llama
`setLastOrder(...)`. Todo el bloque de tracking/courier/`order-details-label` está condicionado a
`{order && (...)}` — el estado "In Zustellung" del título **no** depende de `order` (usa una
traducción estática), por eso esa aserción pasa de inmediato mientras el bloque con datos reales
sigue esperando el round-trip de red. Esto es exactamente el patrón "timing, no funcional" que el
propio reporte de QA describe.

### Verificación empírica

1. Al arrancar esta investigación, un `GET /health` contra el backend de Render tardó **31.5
   segundos** — cold-start clásico de Render free-tier (el dyno se duerme tras inactividad).
2. Con el backend ya despierto, se creó una orden real de mercado CH / idioma `de` vía la API
   (`POST /api/checkout`, headers `X-Country-Code: CH`, `X-Language: de`) y se repitió
   `GET /api/orders/{id}` 3 veces: **413ms** (checkout), luego **663ms / 235ms / 215ms** — muy por
   debajo del presupuesto de 8s del reporte.
3. Reproducción en navegador real (`vite dev` local + sesión atómica CH/de, igual que el punto 1):
   navegación directa a `/order-success?orderId=<orden real>` — `order-details-label` y el texto
   `BESTELLDETAILS` aparecieron en **menos de 100ms** una vez el backend estaba caliente.

No existe ninguna ruta de código específica de CH o de `de` en `GET /api/orders/{order_id}`
(`backend/routers/checkout.py:119-155`) — es un lookup O(1) que solo sustituye `currency_symbol`
desde `COUNTRY_CONFIG`, sin lógica dependiente de idioma. La lentitud reportada no puede originarse
ahí cuando el backend está caliente, como confirma la medición del punto 2.

### Por qué CH/de específicamente, dos veces

No se puede confirmar el mecanismo exacto de scheduling del harness externo desde este repo, pero
la explicación más simple y consistente con "reproducido 2/2, solo en este escenario" es que
`order-success.feature` ejecuta CH/de en un punto fijo del orden de escenarios (p. ej. el primero
de ese archivo) — si ese orden es estable entre corridas, el mismo escenario será
consistentemente "el que le toca" un backend recién despertado tras cualquier hueco de inactividad
previo, sin que haga falta ningún defecto de la app.

### Estado

Sin cambio de código — no hay nada que arreglar en la app; el comportamiento observado con el
backend caliente es correcto y rápido. Sugerencia para el lado de QA (no aplicada aquí, es un
ajuste de harness): un ping de "warm-up" contra `/health` antes del primer escenario de
`order-success.feature`, o un presupuesto de espera mayor específicamente para esa aserción,
debería eliminar el flake sin tocar la app.

**Matiz — no es 100% infraestructura.** El `.catch(() => { /* fallback a vista solo-courier */ })`
del `useEffect` en `OrderSuccess.jsx` no distingue entre "la petición fue lenta pero va a resolver"
y "la petición falló de verdad" (Render free-tier a veces devuelve 502 durante el wake-up, no solo
tarda). Si eso pasa, la pantalla se queda permanentemente en la vista solo-courier, sin reintento
ni estado de error — no por diseño, sino porque nunca hubo necesidad de distinguir ambos casos
hasta ahora. No es la causa de lo que reportó QA (una petición lenta-pero-exitosa explica el
timeout de 8s sin necesitar un fallo real), pero es un hueco de robustez latente en el mismo código
que vale la pena que quede señalado. No se toca en este triage — es una decisión de alcance del
usuario (agregar reintento/estado de error), no algo que este reporte pida.

---

## Higiene

Se creó una orden de prueba real (`ORDER-F438EE1F`, CH/de, `standard_user`) durante la
verificación del punto 2 — queda en la base en memoria de Render como cualquier otra orden
histórica, sin efecto sobre otros tests (ver [[omnipizza-shared-test-fixtures]]). El carrito de
`standard_user` quedó con estado de prueba dos veces (US, 1x Pepperoni grande) durante la
verificación con axe-core del punto 1; `POST /api/cart {items:[]}` no sirve para vaciarlo
(`TestCartSetupRequest.items` exige `min_items=1` — está diseñado para *reemplazar*, no para
vaciar). Se usó `POST /api/session/reset` en su lugar (limpia carrito + mercado de sesión +
perfil) — confirmado con `GET` posterior: `cart_items: []`, `country_code: "MX"` (default). Sesión
de `standard_user` queda limpia al cierre de este triage.
