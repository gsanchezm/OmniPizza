# Triage del reporte de bugs QA — 2026-07-29

> **Fuente:** reporte pegado por el usuario (AHM full all-test-types campaign contra Render,
> corrida `real-2026-07-28T20-06`, commit `18431ba`) — MobSF (estático del APK release), OWASP ZAP
> (crawl pasivo del frontend + scan activo autenticado del backend, 23 endpoints), axe-core
> (accesibilidad). Las suites funcionales (API, Web Playwright, Android Appium, visual PixelMatch,
> performance Gatling) vinieron 100% verdes — nada que reportar ahí.
>
> **Verificado contra:** código local (`main`, 1 commit adelante de `origin/main` — únicamente
> `documents/paper/`, sin drift en `backend/`/`frontend/`/`frontend-mobile/`), backend local
> (`127.0.0.1:8000`, suite `tests/api.test.ts` 46/46 verde con los middleware nuevos aplicados),
> bundle de producción real (`frontend/dist` tras build), y los endpoints en vivo de Render vía
> `curl`/`Invoke-WebRequest`. Dos hallazgos (A-1/A-2, y parte de C) resultaron ser una repetición de
> hallazgos ya triados el 2026-07-16 — verificados de nuevo contra el código actual, no reabiertos.

## Resumen de veredictos

| # | Hallazgo | Veredicto | Commit |
|---|----------|-----------|--------|
| A-1 | APK release firmado con certificado debug | **Aceptado por diseño** (decisión previa del usuario, 2026-07-16 — reafirmada) | — |
| A-2 | Certificado de firma usa SHA1withRSA | **Consecuencia directa de A-1** — no accionable por separado | — |
| B-1 | CSP: directiva sin fallback | **Bug real — corregido** (`form-action` agregado) | *(este commit)* |
| B-2 | CSP: `style-src` permite `unsafe-inline` | **Parcialmente corregido** — código propio migrado a 0 usos; la política conserva `unsafe-inline` por una dependencia real de React | *(este commit)* |
| B-3 | Falta `Strict-Transport-Security` | **Backend: bug real, corregido. Frontend: no reproduce hoy** | *(este commit)* |
| B-4 | Falta `X-Content-Type-Options` (backend) | **Bug real — corregido** | *(este commit)* |
| C-1/C-2 | Posibles secretos hardcodeados en el APK | **No determinable desde este repo** — más una corrección al registro del triage previo | — |
| C-3 | Uso de MD5 | **De terceros (Expo)** — reafirmado desde 2026-07-16 | — |
| C-4 | Creación de archivo temporal | **No-issue** — el código propio nunca llama una API de archivos temporales | — |
| C-5 | `ProfileInstallReceiver` exportado | **De terceros (React Native)** — reafirmado desde 2026-07-16 | — |
| D | `heading-order` (24 nodos) | **Bug real — corregido** (2 ubicaciones únicas) | *(este commit)* |
| — | TLS (`testssl.sh`) / fuzzing de esquema (`schemathesis`) | **No evaluado** — herramientas no instaladas del lado de QA; no hay veredicto que dar | — |

---

## A. Mobile — firma del APK

### A-1 / A-2 — certificado debug, SHA1withRSA

**Ya triado el 2026-07-16** (`EXPLANATION_qa_report_2026-07-16.md` §2, `documents/paper/findings.csv`
`F02`, veredicto `by-design`): `.github/workflows/mobile-release.yml` no configura ningún release
keystore — `expo prebuild --clean` genera un `build.gradle` cuyo `buildType release` apunta al
keystore de debug por defecto, y el workflow nunca lo sobreescribe (`assembleRelease` corre sin
ninguna property `-P` ni secret de firma). **Decisión ya tomada con el usuario:** este APK se
distribuye vía GitHub Releases para Appium/Detox, no en Play Store, y generar una clave de
producción es una decisión de custodia a largo plazo que el usuario decidió no tomar. No se
reabre esa decisión hoy.

Re-verificado hoy, sin cambios de código:
- Sigue sin existir ningún keystore real en el repo ni en su historial (`git log --all
  --diff-filter=A -- '*.jks' '*.keystore'` vacío).
- El único archivo tipo keystore es el `debug.keystore` autogenerado (no trackeado). Se corrió
  `keytool -list -v` directo sobre él: `CN=Android Debug`, válido desde 2013, **`Signature
  algorithm name: SHA1withRSA (weak)`** — el certificado debug genérico y público del SDK de
  Android, exactamente lo que MobSF describe. A-2 es una consecuencia inseparable de A-1, no un
  ítem accionable aparte.

Si este APK pasa a distribuirse en una tienda real, esta decisión debe revisarse (haría falta un
keystore de producción + wiring de `mobile-release.yml` vía GitHub Secrets) — sigue siendo la
misma nota de seguimiento del triage anterior.

---

## B. Web/Backend — CSP y headers de seguridad

### B-1 — CSP: directiva sin fallback (frontend, 2 instancias)

**Bug real, corregido.** El CSP vigente en `render.yaml` ya definía `default-src 'self'` más
`base-uri 'self'` y `frame-ancestors 'none'` explícitos (agregados en el triage 07-16, commit
`63a133a`) — pero le faltaba `form-action`, la tercera directiva que **no** cae al fallback de
`default-src` según la spec de CSP. Agregado `form-action 'self';`. Las "2 instancias" del reporte
son, con esta lectura, la misma brecha vista en 2 URLs distintas del crawl pasivo, no 2 directivas
distintas.

### B-2 — CSP: `style-src` permite `unsafe-inline` (frontend, 2 instancias)

**Parcialmente corregido — la política no puede endurecerse del todo.**

Se auditó todo `frontend/src` en busca de estilos inline. Había exactamente 3 sitios, los 3
estáticos y sin datos de usuario:
- `Profile.jsx` y `Checkout.jsx` (×2): `style={{colorScheme:'dark'}}` en inputs de fecha/select —
  migrado a la clase de Tailwind `[color-scheme:dark]` (propiedad arbitraria, sintaxis soportada
  desde Tailwind 3.1+, confirmado `^3.4.0` en `package.json`).
- `Flag.jsx`: el branch de fallback (código de mercado desconocido) calculaba tamaño/color vía
  `style={{width:size,...}}`. Reescrito como SVG inline con `width`/`height` como **atributos**
  (no CSS), igual que hacen los 5 shapes de mercado ya definidos en el mismo archivo — consistente
  con el propio comentario del componente ("Flag — a round country flag drawn as inline SVG"). Este
  branch es además inalcanzable hoy: los 5 mercados activos (MX/US/CH/JP/SA) tienen shape propio.

Con los 3 sitios migrados, **el código propio del frontend ya no usa `style=""` en ninguna parte**
(confirmado: cero coincidencias de `dangerouslySetInnerHTML` en todo `frontend/src` también, así
que tampoco hay una vía de inyección de HTML/CSS vía props).

Se intentó quitar `'unsafe-inline'` de `style-src` en `render.yaml` y se verificó contra el bundle
de producción real (`frontend/dist/assets/*.js` tras build) antes de dar el cambio por bueno — y
ahí apareció el motivo por el que no se puede quitar:

1. **React 18 mismo lo necesita.** El chunk principal minificado contiene
   `l.style.display=Ac("display",s)` — código interno del reconciler de React para manejar
   subárboles ocultos (el mecanismo detrás de `Suspense`/hidden trees). `CSP style-src` cubre
   *cualquier* mutación de `.style.*`, no solo el atributo `style=""` literal en el HTML — así que
   esto se ejecuta en cualquier página con una frontera `Suspense`, que es exactamente cómo están
   montadas las rutas protegidas (`React.lazy` + `<Suspense>`, mecanismo del que depende la entrada
   atómica de Playwright documentada en `ATOMIC_WEB_TESTING.md`).
2. **Código propio también lo usa**, fuera del grep original (no es un prop `style={{}}` de JSX,
   así que no apareció en la primera pasada): `OrderSuccess.jsx`, el handler `onError` de la imagen
   del repartidor — `t.target.style.display="none"; t.target.parentNode.style.backgroundColor=...`.

Quitar `'unsafe-inline'` con estos dos casos activos habría roto silenciosamente (sin excepción
JS, sin fallo de build — CSP simplemente ignora la declaración de estilo violatoria) el manejo de
Suspense y el fallback de imagen rota. Revertido: `style-src` conserva `'unsafe-inline'`. Una
política basada en nonce/hash sí lo evitaría, pero requiere render server-side por request — no
disponible en este SPA estático servido por Vite. Riesgo residual considerado bajo: no hay
`dangerouslySetInnerHTML` en todo el frontend, así que no existe hoy una vía por la que un
atacante pueda inyectar contenido en un `style=""`/`.style.*` — el vector que `unsafe-inline`
habilita en teoría no tiene un punto de entrada real en este código.

### B-3 — Falta `Strict-Transport-Security`

**Backend: bug real, corregido. Frontend: no reproduce contra el despliegue actual.**

`backend/main.py` no tenía ningún middleware de headers de seguridad — CORS era el único
`add_middleware`. Confirmado con `curl` directo contra `127.0.0.1:8000/health`: sin
`Strict-Transport-Security`, sin `X-Content-Type-Options`. Agregado un middleware
(`add_security_headers`) que setea ambos en toda respuesta. `Strict-Transport-Security` es un
no-op sobre HTTP plano (los navegadores solo lo honran en HTTPS), así que es seguro enviarlo
incondicionalmente sin condicionar por `settings.environment`. Verificado tras el cambio: ambos
headers presentes en la respuesta local, y la suite `tests/api.test.ts` completa (46/46) sigue en
verde con el middleware aplicado.

El frontend, en cambio, **ya envía HSTS hoy** — verificado en vivo contra
`omnipizza-frontend.onrender.com`:
```
Strict-Transport-Security: max-age=315360000; includeSubdomains; preload
```
Este valor **no coincide** con lo declarado en `render.yaml` (`max-age=63072000;
includeSubDomains`, sin `preload` — agregado en el triage 07-16, commit `a943483`, que
**explícitamente decidió no incluir `preload`** por ser un compromiso difícil de revertir). El
header real en producción es más fuerte que el declarado y sí incluye `preload` — casi seguro
inyectado por la capa Cloudflare/Render que sirve `onrender.com` por delante del origen (`Server:
cloudflare` en la respuesta), no por el propio `render.yaml`. No se puede determinar ni controlar
el origen exacto de ese header desde este repo. Dos notas para el usuario, sin acción tomada: (1)
la "1 instancia" del reporte no reproduce contra el estado actual — puede haber sido una respuesta
puntual (redirect, error) fuera de las páginas típicas, o una condición ya resuelta antes de la
corrida del 28-jul; (2) el header real ya lleva `preload`, algo que la decisión del 07-16 evitó
deliberadamente — vale la pena que quede registrado, aunque no sea accionable desde este repo.

### B-4 — Falta `X-Content-Type-Options` (backend, 5 instancias)

**Bug real, corregido** — mismo middleware que B-3 backend (ver arriba).

---

## C. Mobile — oportunidades de hardening (MobSF, WARNING)

### C-1 / C-2 — posibles secretos hardcodeados

**No determinable desde este repo — más una corrección al registro previo.** Se buscó el string
`258EAFA5` (el prefijo que MobSF extrajo) en todo `frontend-mobile/`, **incluyendo
`node_modules`** instalado: cero coincidencias. No hay `ios/` local, ni `google-services.json`, ni
`.env*`. Tampoco se encontraron secretos reales en un barrido más amplio (`apiKey`, `secret`,
`password`, `token` asignados a literales) — el único hit es la contraseña compartida
`"pizza123"` (`LoginScreen.tsx`, `auth.service.ts`), que es el fixture de prueba público y
documentado en `CLAUDE.md`, no una credencial filtrada.

**Corrección al registro:** `EXPLANATION_qa_report_2026-07-16.md` (línea ~179) afirma haber
*"confirmado que \[el string] aparece en node_modules de varias dependencias"*. Un grep fresco
contra el `node_modules` actual no reproduce eso — cero coincidencias. O la afirmación original no
se verificó realmente por grep en su momento, o el contenido de las dependencias cambió desde
entonces. Si el string viene de una dependencia compilada (p. ej. la implementación de WebSocket
de OkHttp, que Android resuelve desde Maven en build time, no desde `node_modules`), simplemente
no está presente en ningún archivo de este repo — ninguna de las dos lecturas se puede confirmar
ni descartar solo con el código fuente.

### C-3 — Uso de MD5

**De terceros — reafirmado desde 2026-07-16 (`findings.csv` F06).** Cero referencias a MD5 en
`frontend-mobile/src/**`. Todo el uso vive dentro de `expo-asset` (dependencia transitiva de
`expo`, no declarada directamente) — `AssetModule.kt` (migrado de `.java` a Kotlin desde el
triage anterior, mismo propósito) y `expo-file-system`, como checksum de integridad de cache, no
como hash de credenciales.

### C-4 — Creación de archivo temporal

**No-issue.** Cero uso de APIs de archivos temporales (`FileSystem`, `cacheDirectory`,
`writeAsStringAsync`, etc.) en `frontend-mobile/src/**`. Ni `expo-file-system` ni `expo-asset` son
dependencias directas — solo llegan transitivamente vía el paquete `expo`, y el código propio
nunca las importa. La app no escribe nada (token, PII, ni datos de pago) a un archivo temporal
porque no llama ninguna API de archivos temporales.

### C-5 — `androidx.profileinstaller.ProfileInstallReceiver` exportado

**De terceros — reafirmado desde 2026-07-16 (`findings.csv` F06).** No es una dependencia
declarada por OmniPizza ni por Expo: rastreado hasta `frontend-mobile/node_modules/react-native/
gradle/libs.versions.toml`, que declara `androidx-profileinstaller` como parte del tooling de
build propio de React Native. El `AndroidManifest.xml` generado no tiene ningún `<receiver>`
explícito para esto ni ningún override `tools:node` — se contribuye enteramente al mergear el
manifiesto, fuera del control directo de este repo. Protegido por el permiso de firma
`android.permission.DUMP`, presente en prácticamente cualquier app RN/Expo moderna.

---

## D. Accesibilidad — `heading-order` (24 nodos)

**Bug real, corregido.** Se reconstruyó la jerarquía completa de encabezados de las 5 páginas
(`Login`, `Catalog`, `Checkout`, `Profile`, `OrderSuccess`) más los componentes compartidos.
`Checkout` y `Profile` ya estaban correctamente anidados; `Login` también. Solo había **2
ubicaciones estructurales** con salto de nivel (`h1` → `h3`, sin `h2` de por medio), ambas dentro
de código propio y sin ningún componente de encabezado reutilizable en el proyecto (cada
`<hN>` es un tag JSX literal):

1. `Catalog.jsx:97` (`<h1 className="sr-only">`, agregado en el fix 07-16 F07) seguido
   directamente por `ProductCard.jsx:36` (`<h3>`, nombre de cada pizza).
2. `OrderSuccess.jsx:80` (`<h1>`, estado "Out for delivery") seguido directamente por
   `OrderSuccess.jsx:129` (`<h3>`, "Order Details", solo si hay un pedido cargado).

En ambos casos el `h3` pasó a `h2` — cambio de una sola línea, sin impacto visual (el tamaño/peso
de fuente lo controlan las clases de Tailwind explícitas, no el tag), y sin tocar ningún
`data-testid`. `Catalog` queda `h1→h2×N(pizzas)→h2(CartSidebar "yourOrder")→h3(ítems del
carrito)`; `OrderSuccess` queda `h1→h2`. El modal `PizzaCustomizerModal` (h2→h3→h3→h4×4,
compartido por Catalog y Checkout) no se tocó — ya anidaba bien contra cualquiera de los dos
encabezados que ahora lo preceden.

Sobre el conteo de "24 nodos": axe-core solo marca la transición exacta donde el nivel salta, no
cada hermano subsiguiente del mismo nivel (confirmado contra el algoritmo real de la regla
`heading-order` de axe-core) — así que 12 tarjetas de producto repetidas no producen 12 nodos
marcados, producen 1. Las 2 violaciones únicas de arriba, repetidas a través de varias
combinaciones de viewport/mercado/idioma que la campaña recorre, explican el total sin necesidad
de una tercera ubicación. (Nota: `axe-core` no está instalado en este repo — ni en
`package.json`, ni en ningún workflow — el scan corre enteramente del lado del harness AHM.)

---

## No evaluado en esta corrida

`testssl.sh` (configuración TLS) y `schemathesis` (fuzzing de esquema API) figuran como "not
installed" en el dashboard de QA, no como pass ni como fail. No hay nada que triar aquí — ni un
hallazgo que confirmar ni uno que refutar. Queda pendiente instalar ambas herramientas (o correr
la campaña en un runner que las tenga) antes de poder decir algo sobre postura TLS o robustez de
esquema.

---

## Higiene

- Backend local levantado en `127.0.0.1:8000` (venv existente) solo para verificar los headers
  nuevos y correr la suite `tests/` con `API_BASE_URL` explícito — el puerto 8000 en esta máquina
  tiene además otros dos procesos escuchando en `::1`/`::` ajenos a este repo (no identificados, no
  tocados); usar `127.0.0.1` explícito evita pegarle al proceso equivocado. Proceso del backend
  detenido al terminar.
- `pnpm build` en `frontend/` falla en esta máquina por un preflight de dependencias
  (`cypress`/`esbuild` con build scripts ignorados) que además reescribe
  `frontend/pnpm-workspace.yaml` con un bloque `allowBuilds:` placeholder — evitado invocando
  `node node_modules/vite/bin/vite.js build` directo; el `pnpm-workspace.yaml` tocado por el
  intento fallido se revirtió (`git checkout --`) antes de continuar.
- No se tocó `documents/paper/findings.csv` ni ningún otro artefacto del estudio en curso — ver
  nota aparte al usuario.
