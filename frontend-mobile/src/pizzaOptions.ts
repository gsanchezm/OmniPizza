export { SIZE_OPTIONS } from "./constants/pizza";

export const TOPPING_GROUPS = [
    {
        id: "meats",
        label: "toppingGroup_meats",
        items: [
            { id: "pepperoni", image: require('../assets/toppings/pepperoni.png'), label: "topping_pepperoni" },
            { id: "york_ham", image: require('../assets/toppings/york_ham.png'), label: "topping_york_ham" },
            { id: "italian_sausage", image: require('../assets/toppings/italian_sausage.png'), label: "topping_italian_sausage" },
            { id: "shredded_chicken", label: "topping_shredded_chicken" },
            { id: "sardines", label: "topping_sardines" },
            { id: "bacon", image: require('../assets/toppings/bacon.png'), label: "topping_bacon" },
        ],
    },
    {
        id: "cheeses",
        label: "toppingGroup_cheeses",
        items: [
            { id: "mozzarella", image: require('../assets/toppings/mozzarella.png'), label: "topping_mozzarella" },
            { id: "provolone", label: "topping_provolone" },
            { id: "gorgonzola", label: "topping_gorgonzola" },
            { id: "ricotta", label: "topping_ricotta" },
            { id: "parmesan", label: "topping_parmesan" },
        ],
    },
    {
        id: "veggies",
        label: "toppingGroup_veggies",
        items: [
            { id: "mushrooms", image: require('../assets/toppings/mushrooms.png'), label: "topping_mushrooms" },
            { id: "red_peppers", image: require('../assets/toppings/red_peppers.png'), label: "topping_red_peppers" },
            { id: "cherry_tomatoes", label: "topping_cherry_tomatoes" },
            { id: "black_olives", image: require('../assets/toppings/black_olives.png'), label: "topping_black_olives" },
            { id: "artichokes", label: "topping_artichokes" },
            { id: "onions", image: require('../assets/toppings/onions.png'), label: "topping_onions" },
            { id: "pineapple", image: require('../assets/toppings/pineapple.png'), label: "topping_pineapple" },
        ],
    },
    {
        id: "sauces",
        label: "toppingGroup_sauces",
        items: [
            { id: "pesto", label: "topping_pesto" },
            { id: "bbq", label: "topping_bbq" },
            { id: "alfredo", label: "topping_alfredo" },
            { id: "garlic_cream", label: "topping_garlic_cream" },
            { id: "extra_virgin_olive_oil", label: "topping_extra_virgin_olive_oil" },
        ],
    },
] as const;
