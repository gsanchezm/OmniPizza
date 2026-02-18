export { SIZE_OPTIONS, UI_STRINGS } from "./constants/pizza";

export const TOPPING_GROUPS = [
    {
        id: "meats",
        label: { en: "Meats", es: "Embutidos y Carnes", de: "Fleisch", fr: "Viandes", ja: "肉類" },
        items: [
            { id: "pepperoni", image: require('../assets/toppings/pepperoni.png'), label: { en: "Pepperoni", es: "Pepperoni", de: "Pepperoni", fr: "Pepperoni", ja: "ペパロニ" } },
            { id: "york_ham", image: require('../assets/toppings/york_ham.png'), label: { en: "York ham", es: "Jamón york", de: "Kochschinken", fr: "Jambon", ja: "ハム" } },
            { id: "italian_sausage", image: require('../assets/toppings/italian_sausage.png'), label: { en: "Italian sausage", es: "Salchicha italiana", de: "Italienische Wurst", fr: "Saucisse italienne", ja: "イタリアンソーセージ" } },
            { id: "shredded_chicken", label: { en: "Shredded chicken", es: "Pollo desmenuzado", de: "Zerrupftes Hähnchen", fr: "Poulet effiloché", ja: "ほぐしチキン" } },
            { id: "sardines", label: { en: "Sardines", es: "Sardinas", de: "Sardinen", fr: "Sardines", ja: "サーディン" } },
            { id: "bacon", image: require('../assets/toppings/bacon.png'), label: { en: "Bacon", es: "Tocino", de: "Speck", fr: "Lardons", ja: "ベーコン" } },
        ],
    },
    {
        id: "cheeses",
        label: { en: "Cheeses", es: "Quesos", de: "Käse", fr: "Fromages", ja: "チーズ" },
        items: [
            { id: "mozzarella", image: require('../assets/toppings/mozzarella.png'), label: { en: "Mozzarella", es: "Mozzarella", de: "Mozzarella", fr: "Mozzarella", ja: "モッツァレラ" } },
            { id: "provolone", label: { en: "Provolone", es: "Provolone", de: "Provolone", fr: "Provolone", ja: "プロヴォローネ" } },
            { id: "gorgonzola", label: { en: "Gorgonzola", es: "Gorgonzola", de: "Gorgonzola", fr: "Gorgonzola", ja: "ゴルゴンゾーラ" } },
            { id: "ricotta", label: { en: "Ricotta", es: "Ricotta", de: "Ricotta", fr: "Ricotta", ja: "リコッタ" } },
            { id: "parmesan", label: { en: "Parmesan", es: "Parmesano", de: "Parmesan", fr: "Parmesan", ja: "パルメザン" } },
        ],
    },
    {
        id: "veggies",
        label: { en: "Veggies", es: "Vegetales y Frescos", de: "Gemüse", fr: "Légumes", ja: "野菜" },
        items: [
            { id: "mushrooms", image: require('../assets/toppings/mushrooms.png'), label: { en: "Mushrooms", es: "Champiñones", de: "Pilze", fr: "Champignons", ja: "きのこ" } },
            { id: "red_peppers", image: require('../assets/toppings/red_peppers.png'), label: { en: "Red peppers", es: "Pimientos rojos", de: "Rote Paprika", fr: "Poivrons rouges", ja: "赤ピーマン" } },
            { id: "cherry_tomatoes", label: { en: "Cherry tomatoes", es: "Tomates cherry", de: "Cherrytomaten", fr: "Tomates cerises", ja: "ミニトマト" } },
            { id: "black_olives", image: require('../assets/toppings/black_olives.png'), label: { en: "Black olives", es: "Aceitunas negras", de: "Schwarze Oliven", fr: "Olives noires", ja: "ブラックオリーブ" } },
            { id: "artichokes", label: { en: "Artichokes", es: "Alcachofas", de: "Artischocken", fr: "Artichauts", ja: "アーティチョーク" } },
            { id: "onions", image: require('../assets/toppings/onions.png'), label: { en: "Onions", es: "Cebollas", de: "Zwiebeln", fr: "Oignons", ja: "玉ねぎ" } },
            { id: "pineapple", image: require('../assets/toppings/pineapple.png'), label: { en: "Pineapple", es: "Piña", de: "Ananas", fr: "Ananas", ja: "パイナップル" } },
        ],
    },
    {
        id: "sauces",
        label: { en: "Sauces", es: "Salsas", de: "Saucen", fr: "Sauces", ja: "ソース" },
        items: [
            { id: "pesto", label: { en: "Pesto", es: "Pesto", de: "Pesto", fr: "Pesto", ja: "ペスト" } },
            { id: "bbq", label: { en: "BBQ", es: "BBQ", de: "BBQ", fr: "BBQ", ja: "BBQ" } },
            { id: "alfredo", label: { en: "Alfredo", es: "Salsa Alfredo", de: "Alfredo-Soße", fr: "Sauce Alfredo", ja: "アルフレッド" } },
            { id: "garlic_cream", label: { en: "Garlic cream", es: "Crema de ajo", de: "Knoblauchcreme", fr: "Crème à l'ail", ja: "ガーリッククリーム" } },
            { id: "extra_virgin_olive_oil", label: { en: "Extra virgin olive oil", es: "Aceite de oliva virgen", de: "Natives Olivenöl extra", fr: "Huile d'olive vierge extra", ja: "エクストラバージンオリーブオイル" } },
        ],
    },
] as const;
