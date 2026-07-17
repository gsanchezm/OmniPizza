# Triage del reporte de bugs QA — 2026-07-16

> **Fuente:** reporte pegado por el usuario (Atomic Helix Model TS suite contra Render + análisis
> estático MobSF del APK). No llegó como archivos `documents/bugs/BUG_*.md` individuales, así que
> este documento cubre los 8 hallazgos + el descartado en un solo triage, siguiendo el mismo
> formato que `appium-android-retriage-2026-05-29.md`.
>
> **Nota de proceso importante:** el repo local estaba 5 commits detrás de `origin/main` al empezar
> este triage. Uno de esos commits (`cf8d2c9 feat(a11y): fix WCAG 4.1.2/4.1.3/3.1.1 gaps`) ya
> desplegado en Render tocaba exactamente los archivos de los hallazgos #3/#4/#7. Se hizo
> `git pull --ff-only` antes de tocar nada — todo lo que sigue está verificado contra el código
> post-pull (= lo que Render ya sirve).

## Resumen de veredictos

| # | Hallazgo | Veredicto | Commit |
|---|----------|-----------|--------|
| 1 | Perfil vacío tras guardar | **Bug real — corregido** | `82d1b74` |
| 2 | APK firmado con certificado debug | **Aceptado por diseño** (decisión del usuario) | — (minSdk sí corregido en `c773043`) |
| 3 | Botón "agregar al carrito" en alemán | **Bug real — corregido** | `fa6184d` |
| 4 | Contraste de color insuficiente | **Bug real — corregido** | `8b3e7d6` |
| 5 | Falta `Content-Security-Policy` | **Bug real — corregido** | `63a133a` |
| 6 | Hallazgos de higiene MobSF | **Mayormente de terceros — sin acción** | `c773043` (allowBackup) |
| 7 | Catálogo sin `<h1>` | **Bug real — corregido** | `8b3e7d6` |
| 8 | Falta `Strict-Transport-Security` | **Bug real — corregido** | `a943483` |
| — | Usuario bloqueado, mensaje distinto | Ya descartado por el equipo — sin acción nueva | — |

---

## 1. Perfil vacío tras guardar — race condition confirmada y corregida

**Verificado empíricamente contra Render** (no solo lectura de código, por
[[qa-bug-empirical-verification]]): un segundo login de `standard_user` borra el perfil que otra
sesión del **mismo usuario** acababa de guardar, antes de que el poll de 60s de esa sesión pudiera
leerlo.

```
PATCH (sesión A, MX): full_name="Valentina Herrera (session A)" → 200 OK, guardado
login (sesión B, mismo standard_user) → 200 OK
GET  (sesión A, MISMO token de A): full_name="" ← el guardado de A desapareció
```

### Causa raíz

El fix del 2026-05-24/2026-07-09 (`reset_user_profile` en cada login, ver
[[omnipizza-profile-resets-on-login]]) resetea el perfil **por username**, no por sesión. Si el
harness de QA corre escenarios de distintos mercados (MX, CH/de, CH/fr, JP) autenticando como el
mismo `standard_user` de forma concurrente (patrón normal para paralelizar por mercado, ya que
`TEST_USERS` es un set fijo y compartido — no hay un usuario por mercado), el login de un escenario
resetea el perfil que otro escenario dejó a medio verificar. Esto explica exactamente el patrón
reportado: falla en MX/CH-de/CH-fr/JP, no en US — y por qué el mismo poll de 60s que resolvió el
incidente anterior (dato viejo) ahora se agota igual (dato **ausente**, no viejo).

### Fix aplicado

Cada login ahora emite un claim `sid` único (`uuid4().hex`) en el JWT. El perfil se guarda por
`session_id` en vez de por `username` (`backend/database.py`, `backend/middleware.py`,
`backend/routers/auth.py`, `backend/test_api.py`). Una sesión nueva empieza vacía automáticamente
(ya no hace falta un reset explícito), y dos sesiones concurrentes del mismo username ya no
comparten slot de almacenamiento. Cart/mercado siguen compartidos por username exactamente como
antes — **fuera de alcance** de este fix (ver "Nota" abajo).

Reproducido el bug y la corrección localmente (ver arriba); la suite completa
`tests/api.test.ts` (23 tests) pasa con el fix aplicado.

### ⚠️ Supuesto a confirmar con QA

Este fix asume que **cada escenario reutiliza un solo token** entre el guardado por UI y el GET de
verificación (el patrón documentado en `ATOMIC_WEB_TESTING.md`/`ATOMIC_MOBILE_TESTING.md`: "obtener
el token una vez, reusarlo"). Si en cambio el harness llama a `/api/auth/login` de nuevo para hacer
el GET de verificación (un token nuevo = una sesión nueva = perfil vacío por diseño), el síntoma
persistiría — pero ya no sería un bug de la app, sino el comportamiento esperado de una sesión
nueva. Por favor confirmen que no re-autentican entre el guardado y la lectura.

### Nota — la misma clase de problema queda latente en cart/session

Este fix es **solo para el perfil**. `cart`/`market` (`backend/database.py::_ensure_session`) siguen
compartidos por username — si el harness corre escenarios concurrentes del mismo usuario que tocan
carrito o mercado en paralelo, la misma clase de race condition podría aparecer ahí. No hay
evidencia de que esto esté pasando (no fue reportado), así que no se tocó, pero no asuman que el
mismo fix aplica automáticamente a cart/session.

---

## 2. APK firmado con certificado debug — aceptado por diseño

Confirmado en código: `.github/workflows/mobile-release.yml` no configura ningún release
keystore — `expo prebuild` genera un `build.gradle` cuyo `buildType release` apunta al keystore de
debug por defecto, y el workflow no lo sobreescribe. Esto explica los 3 hallazgos `high` de MobSF
(certificado debug, SHA1withRSA, instalable en Android 7.0 sin parches).

**Decisión (con el usuario):** este APK se publica en GitHub Releases para pruebas Appium/Detox, no
en Play Store — no es una distribución de tienda, así que "producción no debe llevar certificado
debug" no aplica en este contexto. Generar una clave de firma de producción es una decisión de
custodia de largo plazo (perderla significa no poder actualizar nunca una app firmada con ella) que
el usuario decidió no tomar ahora. El **minSdk sí se subió a 29** (Android 10, `c773043`) porque es
una mejora de bajo riesgo independiente de la decisión de firma, y coincide con la recomendación
explícita de MobSF ("Android >= 10, API 29").

**Si en el futuro este APK se convierte en una distribución real** (Play Store u otra tienda), esta
decisión debe revisarse: haría falta generar un keystore de producción y wirear
`.github/workflows/mobile-release.yml` para usarlo vía GitHub Secrets.

---

## 3. Botón "agregar al carrito" en alemán — regresión real, corregida

Confirmado que **no** era el código local desactualizado (verificado contra el bundle JS real
servido por Render tras el `git pull`, y contra el DOM renderizado en vivo vía navegador). El commit
`cf8d2c9` (migración de accesibilidad WCAG 4.1.2/4.1.3/3.1.1) movió el botón de confirmar del modal
de personalización de un literal local (`de:"Hinzufügen"`) a la clave i18n compartida
`t("addToCart")` — pero esa clave ya existía con una frase **más larga y distinta** por idioma:

| Idioma | Confirmado correcto (2026-05-24) | Post-migración (regresión) | ¿Por qué no se detectó? |
|---|---|---|---|
| de | `Hinzufügen` | `In den Warenkorb` | no es substring → **detectado** |
| es | `Agregar` | `Agregar al Carrito` | `Agregar al Carrito` contiene `Agregar` |
| fr | `Ajouter` | `Ajouter au panier` | `Ajouter au panier` contiene `Ajouter` |
| ja | `追加` | `カートに追加` | `カートに追加` contiene `追加` |
| en | `Add to Cart` | `Add to Cart` | sin cambio |

Es decir: el texto del botón cambió en **los 5 idiomas**, no solo alemán — pero el test (aparente
comparación tipo "contains") solo lo detectó en alemán porque ahí, por pura casualidad de
traducción, la frase nueva no contiene la palabra corta confirmada. Restaurado el valor corto
verificado en `frontend/src/i18n/locales/{de,es,fr,ja}.json` (`addToCart` no tiene otro call site en
el código, así que el fix está acotado a este botón). `ar` (mercado nuevo, sin valor previo
confirmado) se dejó sin tocar.

---

## 4. Contraste de color insuficiente — corregido

Ambos patrones reportados por axe-core se confirmaron en el código actual y se corrigieron:

- `button[data-testid="category-all"]` (chip de categoría seleccionado): texto blanco sobre
  `#FF5722` → 3.16:1. Cambiado a `text-[#1E1E1E]` (el mismo tono oscuro que ya usa el resto de la
  UI) → **5.3:1**. No se tocó el color naranja de marca en sí (se usa en decenas de lugares del
  frontend — cambiarlo habría tenido un radio de impacto mucho mayor al reportado).
- `p[data-testid="pizza-description-*"]`: `text-gray-500` sobre `#1E1E1E` → 3.44:1. Cambiado a
  `text-gray-400` → **6.6:1**. Mismo tono de gris, un paso más claro.

**Nota:** el mismo patrón (texto blanco pequeño y en negrita sobre `#FF5722`) se repite en
`Checkout.jsx:1344` (pills de horario de entrega), fuera del alcance de esta auditoría (que solo
cubrió Catálogo). No se tocó — vale la pena que la próxima corrida de axe incluya Checkout.

---

## 5. Falta `Content-Security-Policy` — corregido

Agregada una política **enforced** (no report-only) al bloque `headers:` de `render.yaml`, que es el
mecanismo que realmente gobierna el sitio estático en producción (el `nginx.conf` del repo solo
aplica al path de `docker-compose`, no a Render).

La política permite explícitamente `'self'` + los hosts externos reales que usa la app (Wikimedia,
Unsplash, placehold.co, dicebear para imágenes; Google Fonts para estilos/fuentes; el origen del
backend de Render para llamadas API — `httpClient.js` cae a `http://localhost:8000` si
`VITE_API_URL` no está seteado, así que no hay ruta relativa/same-origin real y `connect-src` debe
permitir el origen absoluto del backend).

**Validado localmente antes de deployar** (no solo leído el código): build de producción con
`VITE_API_URL` apuntando al backend real de Render, servido con estos headers exactos, y navegado
en Chrome real — login, Google Fonts, imagen de Unsplash y la llamada cross-origin a
`omnipizza-backend.onrender.com` cargaron sin ninguna violación de CSP en consola.

---

## 6. Hallazgos de higiene MobSF — mayormente de terceros, sin acción adicional

- **`allowBackup=true`** → **corregido** (`allowBackup: false` en `app.json`, commit `c773043`).
- **Broadcast receiver exportado** (`androidx.profileinstaller.ProfileInstallReceiver`): es un
  componente de AndroidX (no de OmniPizza), protegido por el permiso de sistema
  `android.permission.DUMP` (firma, no definido por la app). Presente en prácticamente cualquier
  app RN/Expo. Sin acción.
- **Uso de MD5** en `expo/modules/asset/AssetModule.java` y `expo/modules/filesystem/*`: código de
  la librería Expo, no de OmniPizza. Sin acción (actualizar Expo, no "arreglar" código propio).
- **Secretos hardcodeados — verificado uno de los dos:** `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` es
  la constante GUID del protocolo WebSocket (RFC 6455) — usada literalmente por `ws`, `undici`, y
  la implementación de WebSocket de OkHttp (la librería de networking que usa React Native/Expo).
  Confirmado que aparece en `node_modules` de varias dependencias (no es un secreto, es texto del
  estándar). El segundo string (`01360240043788015936020505`) no se pudo verificar en este repo —
  no se encontró en ninguna dependencia ni código propio, así que ni se confirma ni se descarta;
  igual que señala el propio reporte, la detección heurística de "secretos" es propensa a falsos
  positivos y requiere revisión manual con el binario real del APK, que no está disponible en este
  repo.
- **Archivos con posible info sensible / temporales** apuntando a `coil3/*` y `expo/modules/*`:
  código de librería, no de la app.

---

## 7. Catálogo sin `<h1>` — corregido

Confirmado: ni la página de Catálogo ni sus componentes hijos (`CategoryFilter`, `ProductCard`)
tenían ningún `<h1>`. Agregado un `<h1 className="sr-only">` (mismo patrón `sr-only` ya usado en
Checkout/Profile/Checkbox) reusando la clave i18n existente `"catalog"` — no cambia el diseño
visual, solo satisface `page-has-heading-one` para lectores de pantalla.

---

## 8. Falta `Strict-Transport-Security` — corregido

Agregado `Strict-Transport-Security: max-age=63072000; includeSubDomains` al mismo bloque
`headers:` de `render.yaml`. No se agregó `preload` — enviar el dominio a la lista de precarga de
HSTS de los navegadores es un compromiso adicional (difícil de revertir) que no se pidió.

---

## Hallazgo descartado — usuario bloqueado en login

Sin cambios de este lado: el reporte mismo indica que ya fue revisado y descartado con el equipo
(la app muestra intencionalmente "Sorry, this user has been locked out." en vez del mensaje
genérico, por claridad de estado en una plataforma de pruebas). La única acción pendiente es del
lado del **repo de tests**: `invalid-credentials.feature` todavía declara que el mensaje debe
contener "Invalid credentials" para *todos* los casos — ese contrato necesita actualizarse para
aceptar el mensaje específico de cuenta bloqueada, o el escenario seguirá fallando indefinidamente
contra un comportamiento ya aceptado como correcto.
