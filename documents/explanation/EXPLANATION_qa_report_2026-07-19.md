# Seguimiento QA — re-verificación del triage 2026-07-18 (2026-07-19)

> **Fuente:** respuesta del equipo de QA a `EXPLANATION_qa_report_2026-07-18.md`, pegada por el
> usuario. Antes de cerrar los 3 hallazgos de ese triage de su lado, QA hizo su propia
> re-verificación empírica contra Render — y corrige dos de las tres causas raíz que propusimos en
> esa triage. El **veredicto** de los 3 hallazgos no cambia (2 no son bug de la app, 1 ya estaba
> corregido); lo que cambia es la **explicación** de por qué en los casos #1 y #2. Este documento
> retracta esas dos causas raíz y dobla el registro histórico de `EXPLANATION_qa_report_2026-07-18.md`
> — ese archivo se deja intacto, no se edita.
>
> **Atribución:** toda la verificación empírica citada en las secciones #1–#3 (barrido axe en 6
> mercados/idiomas, 3 corridas completas de la suite `@api`, inspección de DOM en vivo a 390×844,
> dos corridas del flujo de checkout completo) la hizo **el equipo de QA**, no esta sesión — el
> contexto de la sesión que escribió el triage 07-18 se limpió (`/clear`) antes de este seguimiento,
> así que no hay reproducción propia de este lado salvo donde se marca explícitamente "confirmado en
> este repo" (sección 1).

## Resumen

| # | Hallazgo | Veredicto (sin cambios) | Causa raíz 07-18 | Causa raíz 07-19 |
|---|----------|--------------------------|-------------------|--------------------|
| 1 | Perfil vacío tras guardar | No es un bug de la app | Re-auth del harness entre guardado y verificación | **Retractada** — el path `@api` usa un solo token, verificado por QA. Candidato distinto sin confirmar: `seedProfile()` + falta de poll de lectura-tras-escritura en el path de UI |
| 2 | Checkout responsive no clickeable | No es un bug de la app | Selectores del harness sin el sufijo `-responsive` en el paso de checkout | **Retractada** — los selectores ya tenían las dos ramas antes del reporte original. Causa del 10/10 original: sin identificar |
| 3 | Contraste CH catálogo | Bug real, ya corregido (07-18) | — | Confirmado: 0 violaciones en 6 mercados/idiomas + primera auditoría de `Checkout.jsx` (0 violaciones) |

Ningún hallazgo requiere un cambio de código nuevo — los 3 quedan cerrados. Mobile (v1.1.5, 11
archivos del sweep de contraste) **no se re-verificó de forma independiente en esta ronda**; QA
tomó el commit por su palabra porque su automatización mobile sigue pausada (pendiente el refactor
de locators).

---

## 1. Perfil vacío tras guardar — la causa "re-auth del harness" no se sostiene

### Lo que dijimos en 07-18

Propusimos como causa más probable que el paso de verificación se autenticaba con un token distinto
al del guardado (re-login entre medio), dado que el backend ya estaba confirmado limpio (8/8
ciclos login→PATCH→GET de un solo token).

### Lo que QA encontró

QA revisó el código del driver `@api`: `saveProfile()` y `verifyProfileApi()` leen el mismo
`world.auth.token`, fijado una sola vez en el `Background` del escenario — no hay ninguna llamada
de login entre guardar y verificar. Corrieron la suite `@api` **3 veces, 100% secuencial, contra
CH/JP/SA** (los mercados exactos del reporte original): las 3 corridas salieron limpias, cero
discrepancias en `full_name`. Esto descarta re-auth como causa para el path que efectivamente
reportó el bug.

### Candidato alternativo (sin confirmar, aportado por QA)

Si el bug se observó en cambio en un path de **UI**, ese flujo llama `seedProfile()` — un
`POST /api/profile {}` que resetea el perfil de la sesión actual **antes de abrir la pantalla** — y
el guardado por UI no hace poll de lectura-tras-escritura por diseño. Eso podría leerse como "el
perfil se vació" sin que haya ninguna re-autenticación real de por medio.

**Confirmado en este repo (verificación propia, contra Render en vivo, 2026-07-19):**

```
PATCH /api/users/me/profile {full_name: "QA Reset Probe"} → 200, full_name="QA Reset Probe"
GET   /api/users/me/profile (mismo token)                 → full_name="QA Reset Probe"
POST  /api/profile {}       (mismo token, = seedProfile()) → 200, full_name=""
GET   /api/users/me/profile (mismo token)                 → full_name=""
```

`seed_user_profile()` (`backend/database.py:101`) hace `pop` del perfil de la sesión y lo recrea con
los defaults antes de aplicar los campos del body — con `{}` no hay campos que aplicar, así que el
resultado es un perfil vacío bajo el **mismo** `session_id`, sin ningún login de por medio. Esto
confirma que el mecanismo que QA propone como candidato es real y se comporta exactamente como
describen; no confirma (ni esta sesión puede confirmar, al no tener acceso al harness externo) que
sea efectivamente lo que dispara el síntoma reportado originalmente — eso depende de si el path de
UI del harness llama a este endpoint en el punto que QA describe.

### Estado

Backend confirmado limpio dos veces (07-18 y ahora). Sin acción de código. Si el síntoma reaparece,
la pista a seguir es el candidato de QA (`seedProfile` + ausencia de poll en el path de UI), no
re-auth.

---

## 2. Checkout responsive no clickeable — la causa "testid stale" no se sostiene

### Lo que dijimos en 07-18

Propusimos que el paso de checkout del harness no había sido actualizado para usar el sufijo
`-desktop`/`-responsive` que ya usan los pasos de login/catálogo/perfil, y documentamos el patrón
en `ATOMIC_WEB_TESTING.md` para que el harness lo adoptara.

### Lo que QA encontró

`checkout.wright.locators.json` (harness externo, no vive en este repo) **ya tenía** las ramas
desktop/responsive para `street`/`fullName`/`phone`/`placeOrder` **desde antes** de que se reportara
este bug, y el resolver las selecciona correctamente según el viewport — es decir, nuestra causa
raíz de 07-18 (selector stale) no era correcta; el harness ya sabía manejar el sufijo. QA
inspeccionó el DOM en vivo a 390×844 (mercado MX, con `colonia` en vez del split
`street`/`city`/`zip`) y todo se renderiza visible y en la posición correcta. Corrieron el flujo de
checkout completo (5 mercados, pago en efectivo) **dos veces** — con un script Playwright
independiente y con la suite real del harness — y las 10 combinaciones pasaron sin ningún timeout,
ambas veces.

### Causa real: sin identificar

QA no reprodujo el fallo original de 10/10 y no encontró qué lo causó. Dos candidatos, **ninguno
confirmado**:

1. Un cold-start de Render coincidiendo con esa corrida (ya hay warm-up explícito, pero no es
   100% infalible).
2. Un efecto secundario del barrido amplio de contraste en `Checkout.jsx` (commit `e6bfb9e`, el
   mismo día que el reporte original), que tocó ~15 líneas del archivo (todas `className`, ninguna
   cambió el *valor* de un `data-testid` — confirmado con `git show e6bfb9e -- Checkout.jsx`).

No se persigue ninguna de las dos hipótesis en este documento — QA ya corrió el flujo completo dos
veces con resultado limpio (10/10 ambas), así que intentar reproducir un fallo que ya no se
manifiesta sería investigar a ciegas. Si reaparece, lo único que hace falta para diagnosticarlo es
el selector exacto que falla (el reporte original no lo tenía) — QA ya lo señaló como el dato que
faltó.

### Estado

Sin acción de código — la documentación agregada en 07-18 a `ATOMIC_WEB_TESTING.md` (tabla de
sufijos responsive) queda como estaba; no hace daño aunque la causa raíz original resultó
incorrecta.

---

## 3. Contraste CH catálogo — confirmado corregido, extendido a Checkout

QA re-corrió el barrido `@a11y` sobre catálogo en los 6 mercados/idiomas del sweep de 07-18
(incluyendo específicamente CH/de y CH/fr, los dos casos que originaron el hallazgo): **0
violaciones de `color-contrast`** en los 6. Aprovecharon que `Checkout.jsx` fue tocado por el mismo
commit para auditarlo con axe **por primera vez** — también **0 violaciones**. Sin acción adicional.

---

## Mobile — no re-verificado esta ronda

QA no verificó de forma independiente los 11 archivos / v1.1.5 del sweep de contraste mobile en
esta ronda; tomaron el commit por su palabra. Su automatización mobile sigue pausada a propósito
(pendiente un refactor de locators — sin relación con este repo, es un dato de su lado). No hay
acción de este lado; queda pendiente de una corrida real cuando retomen esa automatización.

---

## Higiene

La única llamada de verificación propia (`POST /api/profile {}` en la sección 1) dejó el perfil de
`standard_user` en el estado vacío por defecto — no hace falta limpieza adicional, es el mismo
estado que deja un `seed` vacío intencional.
