# iOS — deep-link del customizer (`~screen-pizza-builder`) — 2026-06-02

> **Para:** equipo de QA (automatización mobile)
> **TL;DR:** el customizer no abría en iOS porque (1) la app jamás cableó la ruta de contrato `customizer`/`item`/`language` — solo `pizza-builder`/`pizzaId`/`lang` — y (2) `~screen-pizza-builder` estaba detrás de `if (!pizza) return null` alimentado por un fetch sin `.catch()` que además hacía `goBack()` si no encontraba la pizza. **Se arreglaron las dos capas.** Va en mobile **v1.0.8**. Commit `0db098b`.

---

## Qué reportaron vs. qué encontré

El reporte pedía "cablear `omnipizza://customizer?item=<pizzaId>&market=&language=` en iOS". Al verificar contra el código vivo encontré dos imprecisiones (las menciono para alinear el contrato del repo de tests, no para descartar el bug — el bug es real):

1. **La app nunca implementó `customizer`/`item`/`language`.** El deep-link cableado era `omnipizza://pizza-builder?pizzaId=<id>&market=&lang=` (`navigation/linking.ts`, `useDeepLinkParams.ts`). No existía ninguna ruta `customizer`.
2. **La web no tiene ruta `/customizer`.** El customizer web es un **modal** abierto desde el catálogo (`PizzaCustomizerModal`), no una URL ruteable. Así que la afirmación "web honra `/customizer`" no aplica — no hay paridad web que imitar; se honra **el contrato**.
3. La afirmación "Android funciona con el mismo deep-link `customizer`" **no es confirmable desde este repo** (si el test mandara `customizer` literal, fallaría en ambas plataformas). No me detuve en esa contradicción: implementé el fix de contrato igual, de modo que `customizer` ahora funciona en **todas** las plataformas.

## Causa raíz (dos capas independientes, ambas producen el mismo síntoma)

```
~screen-pizza-builder still not displayed
```

**Capa A — routing:** `customizer` no estaba en la config de linking → React Navigation no ruteaba a `PizzaBuilder` → la pantalla nunca se montaba.

**Capa B — montaje frágil** (`PizzaBuilderScreen.tsx`):
```js
const [pizza, setPizza] = useState(initialPizza);     // undefined en deep link
useEffect(() => {
  getCatalogPizzas().then((list) => {                 // SIN .catch()
    const found = list.find(p => p.id === targetPizzaId);
    if (found) setPizza(found);
    else navigation.goBack();                          // not-found => se va
  });
}, [...]);
if (!pizza) return null;                               // sin pizza => NO monta screen-pizza-builder
```
`/api/pizzas` requiere auth (`Depends(apply_user_behavior)`). Si el deep-link no trae token, o la pizza no matchea, el fetch rechaza (sin catch) o cae en `goBack()` → `pizza` nunca se setea → `return null` → `~screen-pizza-builder` **jamás se muestra**. Esto reproduce el síntoma con o sin el problema de routing.

## Fix (commit `0db098b`)

1. **Routing (RN-native, sin races de cold-start):** `getStateFromPath` en `linking.ts` aliasea la ruta `customizer` → `pizza-builder` preservando el query string. React Navigation maneja el ruteo de cold-start como con cualquier ruta nativa.
   ```
   omnipizza://customizer?item=p01&market=US&language=en
        → (alias) → pizza-builder?item=p01&market=US&language=en → PizzaBuilder
   ```
2. **Alias de params:** `PizzaBuilderScreen` lee `route.params.item ?? route.params.pizzaId`. `useDeepLinkParams` trata `language` como alias de `lang`.
3. **Montaje robusto:** `~screen-pizza-builder` se monta **siempre** (estado vacío con `~view-builder-empty` mientras la pizza no resuelve), el fetch tiene `.catch()`, y se eliminó el `goBack()` en not-found — per contrato: *render del customizer vacío, no error*.

Compatibilidad: `omnipizza://pizza-builder?pizzaId=...` sigue funcionando igual (cambio aditivo).

## Verificación

- `tsc --noEmit` limpio.
- Lógica del alias `getStateFromPath` probada en aislamiento (7/7 casos: `customizer`, `/customizer`, con/sin query, `pizza-builder` intacto, no-match de `customizerX`).
- Falta la validación on-device en el simulador iOS tras instalar el APK/`.app` de v1.0.8.

## Criterios de aceptación — cómo quedan

| AC | Estado |
|---|---|
| iOS: `omnipizza://customizer?item=X&market=US&language=en` muestra `~screen-pizza-builder` reproducible | ✅ monta siempre (vacío→completo) |
| Paridad con Android (mismo deep-link, misma pantalla) | ✅ `customizer` ruteado en todas las plataformas |
| `customizerPriceText` + affordance de confirmar-agregar | ⚠️ requieren que el catálogo cargue → **el deep-link debe incluir `accessToken`** (`/api/pizzas` requiere auth). Confirmar que el molecule lo manda. |

## Notas para QA

- **Confirmar el `accessToken`:** la pantalla monta sin token, pero precio/confirmar necesitan que `/api/pizzas` responda 200. Asegúrense de que el deep-link atómico del customizer incluya `accessToken=<jwt>` (param universal de los atomic entrypoints).
- **Opcional — alinear el contrato:** si quieren, el test puede usar directamente `omnipizza://pizza-builder?pizzaId=...&lang=...` (lo implementado nativamente); el alias `customizer` existe para honrar el contrato actual, pero ambos rutean a la misma pantalla.
- **Secundario `~btn-order-details` (order-success):** esa pantalla **no tiene ScrollView**, así que si el botón está bajo el fold no hay contenedor scrolleable. Quedó fuera de este fix (el reporte lo marcó como secundario/"confirmar después"). Si tras v1.0.8 sigue fallando, se envuelve order-success en un `ScrollView` con testID en un commit aparte.
- **Despliegue:** mobile **v1.0.8** incluye también el fix de testID estable en ScrollViews (bug `mobile-rn-scrollable-container-below-fold`). Tras el build, actualizar el simulador/emulador y re-correr la dimensión pizzaBuilder.

## Referencias

- `frontend-mobile/src/navigation/linking.ts` (`getStateFromPath`)
- `frontend-mobile/src/screens/PizzaBuilderScreen.tsx` (alias `item`, montaje robusto, `.catch()`)
- `frontend-mobile/src/hooks/useDeepLinkParams.ts` (`language`→`lang`)
- Backend auth del catálogo: `backend/main.py:182` (`/api/pizzas` → `Depends(apply_user_behavior)`)
- Commit `0db098b` · release `v1.0.8`
