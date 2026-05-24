# EXPLANATION — Pizza builder topping timeouts caused by test contract referencing non-existent toppings

**Original report:** `BUG_pizza_builder_topping_click_timeout.md`
**Verdict:** Not a defect. The test contract names topping IDs that OmniPizza has never shipped.

## What the report claims

`page.click` times out after 30 s on these topping selectors:

| Market | Topping fixtures the test clicks  |
|--------|------------------------------------|
| US     | `extra-cheese`                     |
| MX     | `mushrooms,olives`                 |
| CH     | `extra-cheese`                     |
| JP     | `extra-cheese,jalapeño`            |

i.e. selectors of the form `[data-testid='topping-extra-cheese']`,
`[data-testid='topping-olives']`, `[data-testid='topping-jalapeño']`, etc.

## What the code actually does

The modal renders one button per topping at
`frontend/src/components/PizzaCustomizerModal.jsx:194-201`:

```jsx
<button
  key={it.id}
  data-testid={`topping-${it.id}`}
  onClick={() => toggleTopping(it.id)}
  ...
>
```

The complete topping catalog is enumerated in
`frontend/src/constants/pizza.js:42-338`. The full list of `it.id` values is:

- **Meats:** `pepperoni`, `york_ham`, `italian_sausage`, `shredded_chicken`, `sardines`, `bacon`
- **Cheeses:** `mozzarella`, `provolone`, `gorgonzola`, `ricotta`, `parmesan`
- **Veggies:** `mushrooms`, `red_peppers`, `cherry_tomatoes`, `black_olives`, `artichokes`, `onions`, `pineapple`
- **Sauces:** `pesto`, `bbq`, `alfredo`, `garlic_cream`, `extra_virgin_olive_oil`

Mapping the test's expected IDs to what actually exists:

| Test wants            | Exists?                    | Closest match in catalog                          |
|-----------------------|----------------------------|----------------------------------------------------|
| `extra-cheese`        | **No**                     | `mozzarella`, `provolone`, etc. (the "Cheeses" group) |
| `olives`              | **No** (wrong slug)        | `black_olives` (note the underscore prefix)        |
| `jalapeño`            | **No**                     | _(no jalapeño in the catalog)_                     |
| `mushrooms`           | **Yes**                    | `mushrooms`                                        |

So `topping-extra-cheese`, `topping-jalapeño`, and `topping-olives` simply do
not exist as `data-testid`s. Playwright cannot find them → it waits for them
to appear → 30 s timeout. The `mushrooms` step would succeed, but the test
fails on the first non-existent topping in each scenario before reaching it.

## Empirical confirmation

The deployed production bundle (`omnipizza-frontend.onrender.com`, bundle
`/assets/index-kOukUO2T.js`) returns **0** matches for `topping-extra`,
confirming no `extra-cheese` testid has ever shipped.

## Why this is not a regression

There is no commit in `git log -- frontend/src/constants/pizza.js` that ever
introduced `extra_cheese`, `olives`, or `jalapeño`. These IDs were never part
of OmniPizza's topping inventory; the QA framework's seed data simply
assumes a generic "common toppings" set that doesn't match this product.

## Recommendation for QA

Update the test fixtures (or `src/plugins/playwright/locators/pizzaBuilder.locators.json`)
to use IDs that actually exist. Suggested per-market mapping that keeps the
spirit of the original scenarios:

| Market | Original (broken)            | Suggested replacement (real IDs)        |
|--------|------------------------------|-----------------------------------------|
| US     | `extra-cheese`               | `mozzarella` (or `parmesan` for "extra cheese" feel) |
| MX     | `mushrooms,olives`           | `mushrooms,black_olives`                |
| CH     | `extra-cheese`               | `mozzarella`                            |
| JP     | `extra-cheese,jalapeño`      | `mozzarella,pineapple`                  |

If the test wants stable "common topping" semantics across markets without
hard-coding IDs, add a helper that picks the first item from the `veggies`
and `cheeses` groups returned by the bundle — but the simplest fix is to
correct the fixture.
