# Triage del reporte de bugs QA — 2026-07-22

> **Fuente:** 3 hallazgos reportados por el usuario en el chat (sin archivo pegado): 1 en web
> (Checkout) y 2 en mobile (Checkout kicks-out, pago con tarjeta en SA). Los 2 de mobile fueron
> detectados por automatización externa (Appium/Detox/MobileWright, no vive en este repo), no por
> taps manuales — dato relevante para el hallazgo #2. Verificado con dispositivo Android físico
> (`R5CX71NFF9H`, app `com.omnipizza.app` v1.1.8) conectado por USB, más pruebas directas contra
> `omnipizza-frontend.onrender.com` / `omnipizza-backend.onrender.com`.

## Resumen

| # | Área | Veredicto |
|---|------|-----------|
| 1 | Web Checkout muestra Pepperoni pre-seleccionado en vez de carrito vacío | **No es bug de la app** — hidratación real de un carrito huérfano dejado por pruebas previas en la cuenta compartida `standard_user` |
| 2 | Mobile: sign in → tap Checkout te saca de la app | **Mecanismo real y reproducible, pero no es un defecto de código** — un deep-link `resetSession=true` emitido mientras la sesión ya está activa fuerza logout instantáneo por diseño; el disparador es del harness externo de QA, no de OmniPizza |
| 3 | Mobile: pago con tarjeta falla solo en SA (árabe) | **No reproducible** — la reproducción exacta (mismos datos: `standard_user`, tarjeta `4242…`/12/28/123) tuvo éxito tanto en el dispositivo real como contra el backend en vivo |

Sin cambios de código en este triage — los 3 hallazgos resultaron ser comportamiento correcto
(#1, #3) o comportamiento correcto de una feature de testing atómico disparado en un mal momento
por el harness externo (#2).

---

## 1. Web Checkout: Pepperoni pre-seleccionado en vez de "carrito vacío"

**Veredicto: no es un bug de la app.**

### Cómo funciona la hidratación

`frontend/src/pages/Checkout.jsx:132-187`: un `useEffect` que corre al montar, **solo si el
carrito local (Zustand) está vacío** (`Checkout.jsx:142`), llama a `GET /api/cart` y, si el
backend devuelve items, los escribe en el store (`Checkout.jsx:179`). Esto es intencional —
`ATOMIC_WEB_TESTING.md` documenta este mismo mecanismo como el punto de entrada para Playwright
(`POST /api/cart` seedea, luego se navega directo a `/checkout`).

### Verificación empírica

1. Login como `standard_user` en `omnipizza-frontend.onrender.com`: el sidebar de Catalog mostró
   correctamente "Your cart is empty" — el carrito local **sí** arranca vacío en cada login (ver
   más abajo por qué).
2. Al navegar a Checkout, apareció una Pepperoni Large ($18.99) ya en el pedido.
3. Query directo a `GET /api/cart` (con el token de `standard_user`) confirmó que el backend
   **realmente tenía** ese item: `{"cart_items":[{"pizza_id":"p02","name":"Pepperoni",...}],
   "updated_at":"2026-07-22T19:15:51"}` — un timestamp de hoy, es decir, un carrito real dejado
   por actividad de pruebas anterior en esta misma sesión de trabajo, no un valor inventado por el
   frontend.
4. Con `problem_user` (cuenta sin actividad de carrito previa), el mismo flujo (login → Checkout
   sin tocar nada) mostró correctamente "Your cart is empty." + botón "Start Your Order" —
   descarta que sea un bug genérico de la pantalla de checkout vacío.

### Por qué no es "carrito local que sobrevive entre sesiones"

Se investigó una hipótesis alternativa: `logout()` (`store.js:43-60`) **no** limpia
`omnipizza-cart` de `localStorage` (solo borra `token`/`username`/`omnipizza-profile`) — en teoría
un carrito podría "filtrarse" de una cuenta a otra en el mismo navegador. Se probó explícitamente:
sembrar un item falso en `localStorage`, hacer logout, loguearse con otra cuenta vía UI normal
(sin recargar la página) — el carrito llegó vacío al nuevo login. Causa: **todo login** (no solo
un cambio de mercado) llama `setCountryCode(selectedMarket)` (`Login.jsx:80`), y `setCountryCode`
limpia el carrito incondicionalmente (`store.js:112`, comentado "Clear cart on market change" pero
se ejecuta en cada login, cambie o no el mercado). Por lo tanto el carrito local **siempre**
arranca vacío tras un login normal — la única fuente posible del Pepperoni visto en Checkout es la
hidratación desde el backend, confirmada en el punto 3.

### Conclusión

Comportamiento correcto de una feature de testing intencional (`ATOMIC_WEB_TESTING.md`) que
tropieza con el patrón ya conocido de fixtures compartidos ([[omnipizza-shared-test-fixtures]]):
la cuenta `standard_user` es de uso compartido entre pruebas manuales y automatizadas, y el
backend en memoria de Render retiene el carrito mientras el dyno está caliente.

---

## 2. Mobile: "sign in → tap Checkout" te saca de la app

**Veredicto: mecanismo real y 100% reproducible — pero no es un defecto de la app.**

### Descartado primero (no repetir esta investigación)

Se leyó completo `CheckoutScreen.tsx`, `client.ts`, `useAppStore.ts`, `App.tsx`, `BottomNavBar.tsx`
y `CustomNavbar.tsx`. Confirmado que **no existe** ningún mecanismo de logout automático accesible
desde un flujo normal de UI:
- `client.ts` no tiene interceptor de respuesta (solo de request) — un 401 no dispara nada.
- No hay guard de autenticación en el navigator ni en el tab de Checkout.
- El efecto de hidratación de carrito de `CheckoutScreen.tsx` está envuelto en `try/catch` que
  absorbe cualquier error sin navegar ni hacer logout.
- 2 intentos de reproducción manual en dispositivo real (US con carrito vacío; SA con carrito
  poblado) tocando el tab Checkout normalmente — **ningún crash, ninguna sesión cerrada**, sin
  ninguna entrada `FATAL`/`AndroidRuntime` para `com.omnipizza.app` en `adb logcat` durante toda la
  sesión de pruebas.

Esto ya apuntaba a que el trigger no vive en el flujo manual de UI — y el usuario confirmó que los
2 bugs de mobile fueron detectados por **automatización que entra vía deep link**, no por taps.

### Causa raíz confirmada

`frontend-mobile/src/hooks/useDeepLinkParams.ts:77-86`: si la URL entrante trae
`resetSession=true`, se llama `store.logout()` y se resetea la navegación a `Login` —
**incondicionalmente**, sin importar en qué pantalla está el usuario en ese momento. Este listener
está activo tanto en cold-start (`Linking.getInitialURL()`) como en **warm-start** (evento `url`
mientras la app ya está corriendo, `useDeepLinkParams.ts:142-149`).

**Reproducido en el dispositivo real:**
1. Deep-link cold-start `omnipizza://checkout?accessToken=<token>&market=US` → login automático,
   aterriza en Checkout, carrito vacío. Sin problema.
2. Con la app **todavía en foreground**, se disparó un segundo intent
   `omnipizza://checkout?resetSession=true` (`adb shell am start -a android.intent.action.VIEW -d
   "omnipizza://checkout?resetSession=true" com.omnipizza.app` → log confirma "delivered to
   currently running top-most instance", o sea el mismo path de warm-start `url` event que usa
   cualquier deep link disparado por un harness externo). **Resultado: la pantalla saltó
   instantáneamente a Login** — reproduce exactamente "tap Checkout → te saca de la app".

### Por qué no es un bug de OmniPizza

`resetSession=true` es una feature de testing atómico **documentada e intencional**
(`ATOMIC_MOBILE_TESTING.md` / CLAUDE.md, sección de deep links) — su propósito explícito es forzar
un logout instantáneo para aislar tests entre sí. La app hace exactamente lo que ese parámetro le
pide, en el momento en que se lo piden. El problema es de **secuenciación del harness externo**:
si el runner de automatización dispara `resetSession=true` (p. ej., como parte de su limpieza
entre pasos o entre tests) en un momento que se solapa con un test todavía en curso sobre
Checkout — en vez de estrictamente *antes* de arrancar el siguiente test — el resultado observable
es indistinguible de "la app se cerró sola". Es el mismo patrón que
[[omnipizza-mobile-deeplink-catalog-race-resolved]]: un artefacto de timing del harness, no del
código de la app.

No se tiene acceso al harness externo desde este repo para confirmar el punto exacto donde emite
ese `resetSession=true` de más — queda para quien mantenga la suite de Appium/Detox/MobileWright
revisar si hay una llamada de reset-entre-tests que se está disparando tarde (p. ej. el teardown
del test anterior llegando durante el setup del siguiente).

### Estado

Sin cambio de código. Recomendación de proceso (no aplicada aquí): que el harness espere
confirmación de que el `resetSession=true` fue aplicado (p. ej., esperar a ver la pantalla de
Login) antes de considerar terminado el paso de limpieza, en vez de dispararlo y continuar de
inmediato al siguiente test.

---

## 3. Mobile: pago con tarjeta falla solo en SA (árabe)

**Veredicto: no reproducible.** Reportado con `standard_user` (cuenta sin comportamiento "chaos" —
descarta la hipótesis de una falla aleatoria del 50% de `error_user`/`security_glitch_user`).

### Verificación — dos reproducciones independientes, ambas exitosas

1. **Directo contra el backend en vivo**: réplica byte-a-byte del payload que construye
   `buildCheckoutPayload.ts` para SA (incluyendo `district`, `baksheesh`, moneda `SAR`) →
   `POST /api/checkout` → `200 OK`.
2. **App real en dispositivo**: login `standard_user` / mercado SA, se agregó una Margherita al
   carrito, se completó el formulario de Checkout (dirección, حي/district, nombre, teléfono) y el
   pago con tarjeta usando **exactamente** los datos del reporte — `4242 4242 4242 4242`, `12/28`,
   CVV `123` — y "Confirmar y pagar". El pedido se procesó correctamente y navegó a la pantalla de
   tracking ("خرجت للتوصيل" / Out for delivery, ETA 15-20 min).

### Código revisado (sin defecto encontrado)

- `district` (no `zip_code`) es el campo requerido para SA tanto en frontend
  (`buildCheckoutPayload.ts:61-62`, `validateCheckoutForm.ts:18`) como backend
  (`backend/models.py`, `COUNTRY_CONFIG["SA"]["required_fields"]`).
- Campo de propina `baksheesh` correctamente mapeado en ambos lados.
- `CURRENCY_RATES["SAR"] = 3.75` presente y correcto en `backend/constants.py`.
- Los campos de tarjeta (número/vencimiento/CVV) **nunca se envían al backend** en ningún mercado
  — son solo validación client-side — así que ninguna transformación de moneda/locale puede
  corromperlos antes de enviarlos.
- El mensaje de error `"فشل إتمام الدفع. حاول مرة أخرى."` (`ar.json:147`) sale de un `catch` único
  y genérico en `CheckoutScreen.tsx:246` que no distingue red/4xx/5xx — cualquier falla transitoria
  (incluyendo un cold-start de Render, que devolvió un `503` real durante esta misma
  investigación antes de que el backend despertara) produce el mismo texto, sin más detalle.

### Conclusión

Con dos reproducciones limpias usando los datos exactos del reporte, y sin ningún defecto
SA-específico encontrado en el código de ninguno de los dos lados, lo más consistente es un
episodio transitorio (cold-start de Render u otro hueco de red puntual durante la corrida original
de QA) — no un bug determinístico. Si vuelve a aparecer, lo más útil sería capturar el
status/body real de la respuesta HTTP de esa corrida específica (el catch genérico de
`CheckoutScreen.tsx:246` no lo expone hoy).

---

## Higiene

- Se creó una orden real de prueba (`standard_user`, mercado SA, Margherita, tarjeta) durante la
  verificación del punto 3 — queda en la base en memoria de Render como cualquier otra orden
  histórica ([[omnipizza-shared-test-fixtures]]).
- El carrito de `standard_user` quedó con estado de prueba varias veces (web: Pepperoni Large;
  mobile: Margherita SA) durante la verificación de los puntos 1 y 3. Se limpió con
  `POST /api/session/reset` al cierre de este triage — confirmado con `GET /api/cart` posterior:
  `cart_items: []`.
