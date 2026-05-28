export const SIZE_OPTIONS = [
  { id: "small", usd: 0, label: { en: "Small", es: "Chica", de: "Klein", fr: "Petite", ja: "小" } },
  { id: "medium", usd: 3, label: { en: "Medium (+$3)", es: "Mediana (+$3)", de: "Mittel (+$3)", fr: "Moyenne (+$3)", ja: "中 (+$3)" } },
  { id: "large", usd: 4, label: { en: "Large (+$4)", es: "Grande (+$4)", de: "Groß (+$4)", fr: "Grande (+$4)", ja: "大 (+$4)" } },
  { id: "family", usd: 5, label: { en: "Family (+$5)", es: "Familiar (+$5)", de: "Familie (+$5)", fr: "Familiale (+$5)", ja: "ファミリー (+$5)" } },
] as const;

// Builder UI strings — kept in sync with the web customizer
// (frontend/src/components/PizzaCustomizerModal.jsx), which is the source of truth.
// TOPPING_GROUPS lives in ../pizzaOptions.ts (it carries the require()'d images);
// it is intentionally not duplicated here.
export const UI_STRINGS = {
  title: { en: "Customize Pizza", es: "Personalizar Pizza", de: "Pizza Anpassen", fr: "Personnaliser Pizza", ja: "ピザをカスタマイズ" },
  size: { en: "Choose Size", es: "Elige Tamaño", de: "Größe Wählen", fr: "Choisir Taille", ja: "サイズを選択" },
  toppings: { en: "Add Toppings", es: "Agregar Toppings", de: "Beläge Hinzufügen", fr: "Ajouter Garnitures", ja: "トッピング追加" },
  required: { en: "Required", es: "Requerido", de: "Erforderlich", fr: "Requis", ja: "必須" },
  each: { en: "each", es: "c/u", de: "pro stück", fr: "chacun", ja: "各" },
  estimatedTotal: { en: "Estimated Total", es: "Total Estimado", de: "Geschätzter Gesamtbetrag", fr: "Total Estimé", ja: "推定合計" },
  confirm: { en: "Add to Cart", es: "Agregar", de: "Hinzufügen", fr: "Ajouter", ja: "追加" },
  update: { en: "Update", es: "Actualizar", de: "Aktualisieren", fr: "Mettre à jour", ja: "更新" },
  cancel: { en: "Cancel", es: "Cancelar", de: "Abbrechen", fr: "Annuler", ja: "キャンセル" },
  edit: { en: "Edit", es: "Editar", de: "Bearbeiten", fr: "Modifier", ja: "編集" },
  remove: { en: "Remove", es: "Eliminar", de: "Entfernen", fr: "Supprimer", ja: "削除" },
} as const;
