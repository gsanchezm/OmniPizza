# Triage del reporte de bugs QA — 2026-08-13 (localización)

> **Fuente:** 2 hallazgos pegados por el usuario en el chat (sin archivo `BUG_*.md`).

## Resumen

| # | Área | Mercado | Veredicto |
|---|------|---------|-----------|
| 1 | Estado de tracking (Order Success) | SA/ar | **No es un bug de código nuevo — es la recurrencia de una decisión de copy de 2026-07-21/22 que nunca se resolvió por mérito, solo por logística de release. Decisión pendiente para el usuario (sección 6).** |
| 2 | Sub-formulario de PayPal (Checkout) | Todos | **La diferencia de validación entre plataformas que reportan sí es real y confirmada por código (era 100% decorativa, no bloqueaba la orden en ninguna). El usuario eligió Opción B (sección 11) — web ahora valida igual que mobile. Aplicado.** |

Cambio de código: hallazgo 2, Opción B aplicada en `frontend/src/pages/Checkout.jsx` (ver sección 11).

---

## 1. El reporte

> Esperado: `التوصيل` · Actual: `خرجت للتوصيل` · Order Success, mercado SA, idioma `ar`, campo de
> estado del pedido. Reproducido en web desktop, web responsive y Android.

## 2. Qué muestra el código hoy (con cita exacta)

El texto es el título `<h1>`/`Text` de la pantalla de Order Success, no un paso de una lista de
estados:

- Web: `frontend/src/pages/OrderSuccess.jsx:81` → `{t('outForDelivery')}` (dentro de
  `data-testid="order-success-title"`). Clave en `frontend/src/i18n/locales/ar.json:55` →
  `"outForDelivery": "خرجت للتوصيل"`.
- Mobile: `frontend-mobile/src/screens/OrderSuccessScreen.tsx:92` → `t("outForDelivery")`. Clave en
  `frontend-mobile/src/i18n/locales/ar.json:54` → `"outForDelivery": "خرجت للتوصيل"` — **idéntico**
  al valor de web.

## 3. Lo que sí está cerrado: el "esperado" del reporte es una frase incompleta

`التوصيل` es un sustantivo suelto ("la entrega"), no una frase de estado. Ningún otro idioma de
los 6 que soporta la app hace eso para esta misma clave — todos traducen el concepto completo:

| Idioma | `outForDelivery` |
|---|---|
| en | `Out for delivery` |
| es | `En camino` |
| fr | `En cours de livraison` |
| de | `In Zustellung` |
| ja | `配達中` |
| ar (actual, ambas plataformas) | `خرجت للتوصيل` ("salió para la entrega") |

Bajo ese criterio, el valor actual de la app es una traducción completa y correcta del concepto
"Out for delivery" — el fixture del reporte, no la app, es el que está incompleto como frase de
estado.

## 4. Lo que NO está cerrado: la elección actual se hizo por logística, no por mérito de copy

Esto ya se investigó una vez, con un veredicto que luego se corrigió — ver
`documents/explanation/EXPLANATION_qa_report_2026-07-21.md` (con el addendum del 2026-07-22) y el
commit `83b8ba4` ("fix(i18n): align web ar outForDelivery copy to mobile").

Resumen de esa historia:

1. Hasta el 2026-07-21, web tenía `"قيد التوصيل"` ("en proceso de entrega") y mobile tenía
   `"خرجت للتوصيل"` — única divergencia web/mobile de las 6 claves de idioma revisadas ese día.
2. El fixture de QA es un chequeo de *substring* (¿contiene `"التوصيل"`?) — pasaba contra el valor
   viejo de web (`"قيد التوصيل"` sí contiene ese substring exacto) y fallaba contra mobile
   (`"خرجت للتوصيل"` usa la contracción ortográfica `لل`, no `ال`, así que el substring con alef no
   aparece ahí a nivel de codepoint).
3. El 2026-07-22 se alineó **web a mobile** (no al revés, que es la convención habitual —
   [[omnipizza-web-is-base]]) explícitamente para **evitar cortar un release mobile nuevo**. La
   consecuencia — que el fixture de QA pasaría a fallar en **ambas** plataformas — se comunicó y
   QA aceptó no tocar su fixture "por ahora".

Ambas frases son árabe correcto. `"قيد التوصيل"` es, si acaso, el registro más convencional para
una etiqueta de estado corta (como hacen des/fr/ja arriba); `"خرجت للتوصيل"` es más una oración
narrativa. La elección de cuál usar nunca se decidió por cuál es mejor copy — se decidió por cuál
plataforma era más barato tocar ese día.

**Que este mismo hallazgo vuelva a aparecer tres semanas después — y esta vez escalado como
"bug de traducción para el equipo de copy"** es la señal de que el acuerdo del 07-22 ("QA no va a
tocar el fixture") no se sostuvo. No es un bug nuevo; es el mismo trade-off sin resolver
resurgiendo.

## 5. Verificación empírica de hoy

- **Local vs `origin/main`:** `git fetch` + comparación de SHAs — ambos en `d72530d`, sin drift
  (ver [[omnipizza-check-local-vs-origin]]).
- **Bundle JS servido hoy por Render** (`https://omnipizza-frontend.onrender.com/assets/index-CsKei_Fx.js`,
  descargado y buscado directamente, no por inspección visual): contiene el string exacto
  `"خرجت للتوصيل"`; **no** contiene `"قيد التوصيل"` (el valor pre-fix de web). Confirma que el fix
  del 83b8ba4 está efectivamente en producción hoy, no solo en el repo — evidencia más fuerte que
  una sola captura renderizada, porque cubre el bundle completo que se le sirve a cualquier
  usuario.
- **Intento de repro visual en navegador** (Render, `standard_user`, mercado SA vía login):
  confirmado por captura que el login con mercado SA carga el catálogo en árabe con layout RTL
  correcto. Los clicks posteriores para abrir el pizza-builder y completar un checkout no
  avanzaron — las capturas de pantalla se colgaron repetidamente (`Page.captureScreenshot` timeout,
  patrón ya conocido, ver [[omnipizza-browser-tool-limitations]]) — así que no se llegó a leer
  visualmente el `<h1>` de Order Success esta sesión. Se sustituyó por la verificación de bundle en
  vivo de arriba, que en este caso es evidencia más directa (confirma el string exacto que se
  sirve, no depende de que un solo render específico haya salido bien).
- **Mobile:** sin dispositivo conectado esta sesión, dicho explícitamente en vez de asumir. Confianza
  basada en: (a) `git log` muestra que `83b8ba4` tocó únicamente
  `frontend/src/i18n/locales/ar.json` — el archivo mobile no ha cambiado desde que se introdujo
  (`65d79d0`/`6197144`); (b) el reporte de hoy mismo dice que Android muestra el mismo texto
  `"خرجت للتوصيل"` — coherente con este estado conocido, no lo contradice.

**Higiene:** el carrito de `standard_user` quedó vacío durante toda la sesión de verificación
(nunca se completó una orden) — no se dejó estado de prueba adicional.

## 6. Decisión pendiente para el usuario (no aplicada en este triage)

- **Opción A — dejar como está.** `"خرجت للتوصيل"` en ambas plataformas, sin cambio. El fixture de
  QA sigue en rojo en ambas, y es razonable esperar que este reporte (o uno equivalente) vuelva a
  aparecer.
- **Opción B — revertir ambas plataformas a `"قيد التوصيل"`.** Pasa el fixture de QA (substring
  match) y restaura la convención "web es la fuente de verdad" para esta clave. Costo: hay que
  actualizar también `frontend-mobile/src/i18n/locales/ar.json` y cortar un release mobile nuevo
  (ver [[omnipizza-mobile-release]]) para que el cambio llegue a la app ya instalada — el mismo
  costo que se evitó el 2026-07-22.

No se aplicó ninguna de las dos en este triage — es una decisión de copy, no un bug con un
veredicto binario.

## 7. Sobre "corresponde al equipo de traducciones/copy"

No hay un equipo externo de traducciones en este proyecto — OmniPizza es un sandbox de pruebas de
un solo mantenedor (ver [[omnipizza-harness-is-ours]]: el harness de QA externo tampoco es de
terceros, es del mismo usuario). La decisión de la sección 6 le corresponde al dueño del repo.

---

## Hallazgo 2 — Sub-formulario de PayPal en Checkout

> **El reporte:** cobertura actual de su framework de automatización — el radio button de PayPal ya
> tiene locators escritos, pero el sub-formulario completo (email, password, botón login,
> confirmación) todavía no se ejercita en sus tests. Además: "el comportamiento difiere por
> plataforma — mobile exige ambos campos no vacíos y resetea la confirmación al editar; web
> confirma sin validar nada. Un caso negativo... pasaría en mobile pero fallaría en web si se
> escribe como un solo escenario compartido."
>
> (Aclaración del usuario: "cero locators" se refería a la cobertura de su framework de
> automatización, no a que la app carezca de `data-testid`/`testID` — no aplica como hallazgo
> sobre la app y se omite del análisis.)

### 8. El dato más importante primero: esto no bloquea la orden en ninguna plataforma

Antes de diseñar cualquier escenario sobre esto: `paypalConnected` (web) / `paypalLoggedIn`
(mobile) **no se referencian en ningún otro lugar del archivo** más que para pintar el badge
"✓ Conectado" — no en el botón de enviar (`disabled={loading}` en ambas plataformas, sin más
condiciones — `frontend/src/pages/Checkout.jsx:1101`,
`frontend-mobile/src/screens/CheckoutScreen.tsx:850`), no en la validación de formulario
(`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts` no menciona `paypal` en
absoluto), y no en el payload (`payment_method` es el único dato de pago que sale hacia el
backend). Los comentarios del propio código lo dicen explícitamente: `// PayPal demo form —
client-side only, never sent to the backend.` (`Checkout.jsx:218`) y `// Emulated (demo) PayPal
login — client-side only, never placed on the order.` (`CheckoutScreen.tsx:157`). Se puede
seleccionar PayPal, no tocar el sub-formulario en absoluto, y completar la orden igual — en las
dos plataformas. Cualquier escenario tipo "no se puede ordenar sin iniciar sesión en PayPal"
sería incorrecto en ambas.

### 9. Diferencia de validación entre plataformas — confirmada, es real

| | Web (`Checkout.jsx`) | Mobile (`CheckoutScreen.tsx`) |
|---|---|---|
| Click "Log in" con campos vacíos | `onClick={() => setPaypalConnected(true)}` (898) — **confirma sin validar nada** | `onPress={() => setPaypalLoggedIn(!!paypalEmail.trim() && !!paypalPassword.trim())}` (561) — **exige ambos campos no vacíos (trimmed)** |
| Editar un campo tras confirmar | `onChange` solo actualiza `paypalForm` (871-873, 887-892) — **no resetea la confirmación** | `onChange` llama `setPaypalLoggedIn(false)` en ambos campos (536-537, 552-553) — **resetea la confirmación** |

Exactamente como describe el reporte. Un escenario negativo compartido (campos vacíos → sin
confirmación) pasaría en mobile y fallaría en web — el reporte tiene razón en no escribirlo como
un único escenario cross-platform.

### 10. Por qué esto no se corrigió aquí sin preguntar

Ambos archivos etiquetan explícitamente este sub-formulario como una simulación ("demo form" /
"Emulated (demo) PayPal login") — no representa una integración real de PayPal ni gatea nada. En
un sandbox deliberadamente diseñado para tener comportamientos "chaos" con propósito (personas
como `problem_user`/`error_user`/`a11y_glitch_user`), no se puede asumir desde el código que esta
asimetría sea deriva accidental y no una variación sembrada a propósito — y "cuál plataforma es
más correcta" no es una pregunta con respuesta objetiva cuando el control no simula nada real.
Alinear el comportamiento además invertiría la convención [[omnipizza-web-is-base]] (aquí sería
"mobile" el que dicta el comportamiento de "web"), la misma tensión ya señalada en el Hallazgo 1 —
y esa convención ya se invirtió una vez por conveniencia (sección 4) y generó un reporte repetido
tres semanas después. No se repite ese patrón sin que el usuario lo decida explícitamente esta vez.

### 11. Decisión del usuario: Opción B, aplicada

- ~~Opción A — dejar como está.~~
- **Opción B — alinear web a mobile. APLICADA.** `frontend/src/pages/Checkout.jsx`:
  - El botón `paypal-login-btn` ahora valida `!!paypalForm.email.trim() && !!paypalForm.password.trim()`
    antes de confirmar (antes: `setPaypalConnected(true)` incondicional).
  - Los `onChange` de `paypal-email` y `paypal-password` ahora también llaman
    `setPaypalConnected(false)`, reseteando la confirmación al editar cualquiera de los dos campos
    — igual que mobile.
  - Sin cambios en `frontend-mobile` (ya tenía el comportamiento objetivo) ni en el payload/backend
    (el campo sigue siendo puramente decorativo, nunca se envía). No requiere release mobile.
  - Verificado con `npx vite build` (dentro de `frontend/`): build limpio, sin errores.

### 12. Higiene

Solo lectura de código para el diagnóstico; el fix de la sección 11 es una edición mínima y
localizada (3 handlers en el mismo componente), sin tocar estado de sesión/carrito compartido.
