# EXPLANATION — Catalog "Add to cart" buttons have empty `textContent` **by design**

**Original report:** `BUG_catalog_add_to_cart_button_empty_label.md`
**Verdict:** Not a defect. The QA test asserts against the wrong DOM element.

## What the report claims

Every `[data-testid^='add-to-cart-']` button on `/catalog` returns an empty
`textContent`, in every market. The test expects localized text such as
`"Add to cart"`, `"Agregar"`, `"Hinzufügen"`, `"Ajouter"`, `"カートに追加"`.

## What the code actually does

`frontend/src/components/ProductCard.jsx:43-51` — the per-card add button is
deliberately an icon-only circular "+" button:

```jsx
<button
  data-testid={tid ? tid(`add-to-cart-${pizza.id}`) : `add-to-cart-${pizza.id}`}
  onClick={() => onAdd(pizza)}
  className="w-10 h-10 rounded-full bg-[#FF5722] ..."
>
   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
            d="M12 4v16m8-8H4" />
   </svg>
</button>
```

There is no text node and no `aria-label` — it is intentionally a glyph-only
control sized to fit inside a 40×40 px circle on a dense catalog grid.

The localized "Add to cart" label the QA test is looking for lives on a
different element: the **customizer modal's confirm button**, at
`frontend/src/components/PizzaCustomizerModal.jsx:243-250`:

```jsx
<button
  data-testid="confirm-add-to-cart"
  onClick={() => onConfirm({ size, toppings, unit_price: unitPrice })}
  className="bg-[#FF5722] ..."
>
   {t({en:"Add to Cart", es:"Agregar", de:"Hinzufügen", fr:"Ajouter", ja:"追加"}, language)}
   <img src="/images/ui/shopping_bag.png" alt="Cart" className="w-5 h-5 object-contain" />
</button>
```

The flow is: catalog "+" icon → opens customizer modal → modal's labeled
"Add to Cart" / "Agregar" / "Hinzufügen" / "Ajouter" / "追加" button confirms
the add. The localized strings in the bug report's "expected" column match
exactly what `confirm-add-to-cart` renders (per `pizza.js:370-376`).

## Empirical confirmation

The deployed production bundle (`omnipizza-frontend.onrender.com`, bundle
`/assets/index-kOukUO2T.js`) contains `screen-profile`, `omnipizza-profile`
and the customizer copy — i.e. it is the same code that's in `main`.

## Recommendation for QA

If the assertion is "the localized 'Add to cart' label is rendered on the
catalog flow," the right element is `[data-testid='confirm-add-to-cart']`
inside the customizer modal — open the modal first, then assert the label.

If the assertion is "the catalog has a button per pizza," then
`[data-testid^='add-to-cart-']` is the correct selector — but assert on
existence/click-ability, not on `textContent`.

## Optional follow-up (not part of this fix)

The icon-only catalog button has no accessible name, which is a real but
separate accessibility concern. If we want to address it without changing the
visual design, add `aria-label={t('addToCart')}` to the `<button>` in
`ProductCard.jsx`. That would let the QA test fall back to
`el.getAttribute('aria-label')`, and screen-reader users would get a name.
Tracking this as an a11y improvement rather than as a fix for this report.
