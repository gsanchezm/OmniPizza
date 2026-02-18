export const SIZE_OPTIONS = [
  {
    id: "small",
    usd: 0,
    label: { en: "Small", es: "Chica", de: "Klein", fr: "Petite", ja: "小" },
  },
  {
    id: "medium",
    usd: 3,
    label: {
      en: "Medium (+$3)",
      es: "Mediana (+$3)",
      de: "Mittel (+$3)",
      fr: "Moyenne (+$3)",
      ja: "中 (+$3)",
    },
  },
  {
    id: "large",
    usd: 4,
    label: {
      en: "Large (+$4)",
      es: "Grande (+$4)",
      de: "Groß (+$4)",
      fr: "Grande (+$4)",
      ja: "大 (+$4)",
    },
  },
  {
    id: "family",
    usd: 5,
    label: {
      en: "Family (+$5)",
      es: "Familiar (+$5)",
      de: "Familie (+$5)",
      fr: "Familiale (+$5)",
      ja: "ファミリー (+$5)",
    },
  },
];

export const TOPPING_GROUPS = [
  {
    id: "meats",
    label: {
      en: "Meats",
      es: "Embutidos y Carnes",
      de: "Fleisch",
      fr: "Viandes",
      ja: "肉類",
    },
    items: [
      {
        id: "pepperoni",
        image: "/images/toppings/pepperoni.png",
        label: {
          en: "Pepperoni",
          es: "Pepperoni",
          de: "Pepperoni",
          fr: "Pepperoni",
          ja: "ペパロニ",
        },
      },
      {
        id: "york_ham",
        image: "/images/toppings/york_ham.png",
        label: {
          en: "York ham",
          es: "Jamón york",
          de: "Kochschinken",
          fr: "Jambon",
          ja: "ハム",
        },
      },
      {
        id: "italian_sausage",
        image: "/images/toppings/italian_sausage.png",
        label: {
          en: "Italian sausage",
          es: "Salchicha italiana",
          de: "Italienische Wurst",
          fr: "Saucisse italienne",
          ja: "イタリアンソーセージ",
        },
      },
      {
        id: "shredded_chicken",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Chicken",
        label: {
          en: "Shredded chicken",
          es: "Pollo desmenuzado",
          de: "Zerrupftes Hähnchen",
          fr: "Poulet effiloché",
          ja: "ほぐしチキン",
        },
      },
      {
        id: "sardines",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Sardine",
        label: {
          en: "Sardines",
          es: "Sardinas",
          de: "Sardinen",
          fr: "Sardines",
          ja: "サーディン",
        },
      },
      {
        id: "bacon",
        image: "/images/toppings/bacon.png",
        label: {
          en: "Bacon",
          es: "Tocino",
          de: "Speck",
          fr: "Lardons",
          ja: "ベーコン",
        },
      },
    ],
  },
  {
    id: "cheeses",
    label: {
      en: "Cheeses",
      es: "Quesos",
      de: "Käse",
      fr: "Fromages",
      ja: "チーズ",
    },
    items: [
      {
        id: "mozzarella",
        image: "/images/toppings/mozzarella.png",
        label: {
          en: "Mozzarella",
          es: "Mozzarella",
          de: "Mozzarella",
          fr: "Mozzarella",
          ja: "モッツァレラ",
        },
      },
      {
        id: "provolone",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Prov",
        label: {
          en: "Provolone",
          es: "Provolone",
          de: "Provolone",
          fr: "Provolone",
          ja: "プロヴォローネ",
        },
      },
      {
        id: "gorgonzola",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Gorg",
        label: {
          en: "Gorgonzola",
          es: "Gorgonzola",
          de: "Gorgonzola",
          fr: "Gorgonzola",
          ja: "ゴルゴンゾーラ",
        },
      },
      {
        id: "ricotta",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Ricotta",
        label: {
          en: "Ricotta",
          es: "Ricotta",
          de: "Ricotta",
          fr: "Ricotta",
          ja: "リコッタ",
        },
      },
      {
        id: "parmesan",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Parm",
        label: {
          en: "Parmesan",
          es: "Parmesano",
          de: "Parmesan",
          fr: "Parmesan",
          ja: "パルメザン",
        },
      },
    ],
  },
  {
    id: "veggies",
    label: {
      en: "Veggies",
      es: "Vegetales y Frescos",
      de: "Gemüse",
      fr: "Légumes",
      ja: "野菜",
    },
    items: [
      {
        id: "mushrooms",
        image: "/images/toppings/mushrooms.png",
        label: {
          en: "Mushrooms",
          es: "Champiñones",
          de: "Pilze",
          fr: "Champignons",
          ja: "きのこ",
        },
      },
      {
        id: "red_peppers",
        image: "/images/toppings/red_peppers.png",
        label: {
          en: "Red peppers",
          es: "Pimientos rojos",
          de: "Rote Paprika",
          fr: "Poivrons rouges",
          ja: "赤ピーマン",
        },
      },
      {
        id: "cherry_tomatoes",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Tomato",
        label: {
          en: "Cherry tomatoes",
          es: "Tomates cherry",
          de: "Cherrytomaten",
          fr: "Tomates cerises",
          ja: "ミニトマト",
        },
      },
      {
        id: "black_olives",
        image: "/images/toppings/black_olives.png",
        label: {
          en: "Black olives",
          es: "Aceitunas negras",
          de: "Schwarze Oliven",
          fr: "Olives noires",
          ja: "ブラックオリーブ",
        },
      },
      {
        id: "artichokes",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Artich",
        label: {
          en: "Artichokes",
          es: "Alcachofas",
          de: "Artischocken",
          fr: "Artichauts",
          ja: "アーティチョーク",
        },
      },
      {
        id: "onions",
        image: "/images/toppings/onions.png",
        label: {
          en: "Onions",
          es: "Cebollas",
          de: "Zwiebeln",
          fr: "Oignons",
          ja: "玉ねぎ",
        },
      },
      {
        id: "pineapple",
        image: "/images/toppings/pineapple.png",
        label: {
          en: "Pineapple",
          es: "Piña",
          de: "Ananas",
          fr: "Ananas",
          ja: "パイナップル",
        },
      },
    ],
  },
  {
    id: "sauces",
    label: {
      en: "Sauces",
      es: "Salsas",
      de: "Saucen",
      fr: "Sauces",
      ja: "ソース",
    },
    items: [
      {
        id: "pesto",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Pesto",
        label: {
          en: "Pesto",
          es: "Pesto",
          de: "Pesto",
          fr: "Pesto",
          ja: "ペスト",
        },
      },
      {
        id: "bbq",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=BBQ",
        label: { en: "BBQ", es: "BBQ", de: "BBQ", fr: "BBQ", ja: "BBQ" },
      },
      {
        id: "alfredo",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Alf",
        label: {
          en: "Alfredo",
          es: "Salsa Alfredo",
          de: "Alfredo-Soße",
          fr: "Sauce Alfredo",
          ja: "アルフレッド",
        },
      },
      {
        id: "garlic_cream",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Garlic",
        label: {
          en: "Garlic cream",
          es: "Crema de ajo",
          de: "Knoblauchcreme",
          fr: "Crème à l'ail",
          ja: "ガーリッククリーム",
        },
      },
      {
        id: "extra_virgin_olive_oil",
        image: "https://placehold.co/100x100/2A2A2A/FF5722.png?text=Oil",
        label: {
          en: "Extra virgin olive oil",
          es: "Aceite de oliva virgen",
          de: "Natives Olivenöl extra",
          fr: "Huile d'olive vierge extra",
          ja: "エクストラバージンオリーブオイル",
        },
      },
    ],
  },
];

export const UI_STRINGS = {
  title: {
    en: "Customize your pizza",
    es: "Configura tu pizza",
    de: "Pizza Anpassen",
    fr: "Personnaliser",
    ja: "ピザをカスタム",
  },
  size: { en: "Size", es: "Tamaño", de: "Größe", fr: "Taille", ja: "サイズ" },
  toppings: {
    en: "Toppings",
    es: "Toppings",
    de: "Beläge",
    fr: "Garnitures",
    ja: "トッピング",
  },
  upTo10: {
    en: "Up to 10 toppings",
    es: "Hasta 10 toppings",
    de: "Bis zu 10 Beläge",
    fr: "Jusqu’à 10",
    ja: "最大10個",
  },
  cancel: {
    en: "Cancel",
    es: "Cancelar",
    de: "Abbrechen",
    fr: "Annuler",
    ja: "キャンセル",
  },
  confirm: {
    en: "Add to cart",
    es: "Agregar",
    de: "Hinzufügen",
    fr: "Ajouter",
    ja: "追加",
  },
  edit: {
    en: "Edit",
    es: "Editar",
    de: "Bearbeiten",
    fr: "Modifier",
    ja: "編集",
  },
  remove: {
    en: "Remove",
    es: "Eliminar",
    de: "Entfernen",
    fr: "Supprimer",
    ja: "削除",
  },
  toppingCostInfo: {
    en: "Each topping costs {usd} (~{local})",
    es: "Cada topping cuesta {usd} (~{local})",
    de: "Jeder Belag kostet {usd} (~{local})",
    fr: "Chaque garniture coûte {usd} (~{local})",
    ja: "各トッピングは{usd}（約{local}）",
  },
};
