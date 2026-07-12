# Diseño — Refactor QA backend: red de golden tests + limpieza de lógica (Pieza 1)

- **Fecha:** 2026-07-12
- **Fuente:** `documents/explanation/arquitectura_qa.md` (leído como *plan a ejecutar*, no como trabajo hecho — el código actual no coincide con el tiempo verbal del doc).
- **Estado:** aprobado el alcance; pendiente escribir plan de implementación.

## 1. Contexto

`arquitectura_qa.md` propone ~7 mejoras arquitectónicas sobre OmniPizza (sandbox de QA). Este spec **no** ejecuta todo el documento: lo descompone en piezas independientes y detalla la **Pieza 1**. La filosofía del repo se respeta: DB en memoria volátil, usuarios "chaos" deterministas y latencias artificiales son *requerimientos*, no defectos. Todo cambio aquí es **behavior-preserving** (no altera contratos externos).

## 2. Decomposición (roadmap)

Cada pieza es un ciclo spec→plan→verificación independiente.

| # | Pieza | Archivos | Estado |
|---|-------|----------|--------|
| **1** | **Red de golden tests + B/C/D backend** | `backend/database.py`, `backend/main.py`, `backend/constants.py`, `tests/` | **este spec** |
| 2 | Split de routers (A) | `backend/main.py` → `backend/routers/*` | futuro |
| 3 | Web performance (F): lazy routes + memo + devtools | `frontend/src/**` | futuro |
| 4 | Mobile performance (G): memo + virtualización de listas + selectores | `frontend-mobile/src/**` | futuro |

**Descartado:** `POST /api/qa/reset-db` global (sección E del doc). Razón: el estado limpio ya lo dan `POST /api/session/reset` (per-usuario) + el wipe por reinicio de la DB en memoria. Un reset **global** en el Render compartido es un footgun — un runner borraría el estado de otro a media prueba.

**Nota de alcance mobile (Pieza 4):** el objetivo declarado por el usuario es *performance real*. En React Native eso significa memoización, virtualización de listas (`FlatList`) y selectores memoizados — **no** Redux DevTools (que es ayuda de depuración, no rendimiento). El middleware `devtools` es opcional y secundario.

## 3. Alcance de la Pieza 1

Cuatro pasos secuenciales sobre el backend, cada uno verificado en verde antes de avanzar. Sin cambios en rutas, payloads de request/response, ni en el comportamiento de los usuarios chaos.

### Paso 1 — Red de golden tests (captura el comportamiento ACTUAL)

Nuevo `tests/golden.test.ts` (Vitest, mismo runner e infraestructura que `tests/api.test.ts`). Corre en **verde contra el backend intacto** — de ahí "golden": fija lo que hoy produce el sistema.

Cobertura, por mercado MX/US/CH/JP/SA:

1. **`customer_info`** vía `GET /api/orders` tras un checkout fijo. Debe capturar los matices que un data-drive ingenuo rompería:
   - Campos `required` presentes incondicionalmente (`colonia`/`zip_code`/`plz`/`prefectura`/`district`).
   - Tip presente **solo si `is not None`** — caso `propina=0` → presente; tip ausente → omitido.
   - `zip_code` opcional de MX presente **solo si truthy** — `zip_code=""` → omitido.
2. **Totales exactos** del `OrderSummary` de `POST /api/checkout` para un carrito + tip% fijos: `subtotal`, `delivery_fee`, `tax_rate`, `tip_percentage`, `tax`, `tip`, `total`, `currency`, `currency_symbol`.
3. **Catálogo** vía `GET /api/pizzas`: `price` + `name`/`description` traducidos por idioma para ≥2 pizzas; `problem_user` → `price == 0` + imagen rota.

Observación técnica: `customer_info` **solo** es observable vía `GET /api/orders` (lista) — `POST /api/checkout` y `GET /api/orders/{id}` devuelven `OrderSummary`, que no lo incluye. El test hace checkout, toma el `order_id` de la respuesta, y lo busca en la lista.

### Paso 2 — (C) Optimización O(N)→O(1)

Indexar `PIZZA_CATALOG` por `id` una sola vez (dict `{id: pizza}`) y reemplazar los dos scans lineales `next((p for p in PIZZA_CATALOG if p["id"] == ...), None)` en `database.py:157` (`get_enriched_cart`) y `database.py:268` (`calculate_order_total`). Impacto de rendimiento real: nulo (~6 pizzas); valor: demostrativo/didáctico, alineado con el doc.

### Paso 3 — (D) DRY en la capa de datos

Extraer helpers privados para la lógica duplicada entre `get_catalog` y `get_enriched_cart`:
- resolución de idioma (`default_lang_by_country` + fallback `en` + primer valor);
- traducción de un campo dict → string;
- formateo de precio (conversión + redondeo según `decimal_places`).

**Preservar la asimetría:** `get_catalog` traduce `name` **y** `description`; `get_enriched_cart` traduce **solo** `name`. Ambos aplican el override `problem` (precio 0 + imagen rota).

### Paso 4 — (B) Open/Closed en checkout

Reemplazar el bloque `if/elif` por mercado (`main.py:285-306`) por ensamblado data-driven leído de `COUNTRY_CONFIG`. Regla exacta derivada del código actual:

- **`required_fields`** → copiar a `customer_info` **incondicionalmente** (ya validados como no vacíos antes).
- **`optional_fields`** → para cada campo:
  - si es el `tip_field` → copiar **si `value is not None`** (permite `0`);
  - si no (p.ej. `zip_code` en MX) → copiar **si `value` es truthy**.

Config de referencia (`constants.py:53-105`):

| Mercado | required_fields | optional_fields | tip_field |
|---------|-----------------|-----------------|-----------|
| MX | `colonia` | `propina`, `zip_code` | `propina` |
| US | `zip_code` | `tip` | `tip` |
| CH | `plz` | `trinkgeld` | `trinkgeld` |
| JP | `prefectura` | `chip` | `chip` |
| SA | `district` | `baksheesh` | `baksheesh` |

Orden en `customer_info`: required primero, luego optional (el orden de claves JSON no afecta a los asserts, pero se mantiene por prolijidad).

## 4. Invariantes que NO se rompen

- **Rutas de la API** — el contrato de automatización. Ningún path cambia.
- **Shapes de request/response** — `OrderSummary`, `customer_info`, `PizzaResponse`, `CartResponse` byte-idénticos.
- **Atomic entrypoints** — `test_api.py` (`/api/store/market`, `/api/cart`, `/api/session*`, `/api/profile`) y las 5 keys de `localStorage` del web quedan intactas (esta pieza no toca frontend).
- **Usuarios chaos** — `problem`/`error`/`performance_glitch`/`locked_out` sin cambios de comportamiento.
- **Cálculo de totales** — mismos valores exactos (los golden tests lo garantizan).

## 5. Estrategia de verificación

- Backend local en `:8000` (`cd backend && python main.py`).
- `cd tests && pnpm test` en **verde antes** (backend intacto, Paso 1) y **después de cada** Paso 2/3/4.
- Regla: si un golden test se pone rojo tras un refactor, el refactor cambió comportamiento → se revierte/corrige, no se ajusta el test.

## 6. Fuera de alcance

- Split de routers (Pieza 2), frontend web/mobile (Piezas 3/4).
- `POST /api/qa/reset-db` global (descartado).
- Cualquier cambio de persistencia, auth, o headers requeridos.

## 7. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Golden tests incompletos → refactor B deriva en silencio | Cubrir explícitamente `propina=0` y `zip_code=""` en MX (los casos frontera). |
| `customer_info` no observable por endpoint tipado | Usar `GET /api/orders` (lista) + búsqueda por `order_id`. |
| DB compartida en Render con estado residual | Tests corren contra backend **local** (`:8000`), no Render. |
| Perder la asimetría name/description en el DRY | Helper de traducción por campo, invocado distinto en catálogo vs cart. |
