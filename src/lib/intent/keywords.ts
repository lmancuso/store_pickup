import type { Category } from "@/types";

/**
 * Palabras clave y sinónimos (es-AR) por categoría.
 * Se escriben en minúscula; la comparación ignora mayúsculas y tildes.
 * Pueden ser frases de varias palabras.
 */
export const CATEGORY_KEYWORDS: Readonly<Record<Category, readonly string[]>> = {
  pizza: [
    "pizza",
    "pizzas",
    "pizzeria",
    "muzza",
    "muza",
    "muzzarella",
    "mozzarella",
    "mozzarela",
    "fugazzeta",
    "fugazeta",
    "fugazza",
    "faina",
  ],
  empanadas: ["empanada", "empanadas", "empanadita", "empanaditas"],
  hamburguesas: [
    "hamburguesa",
    "hamburguesas",
    "hamburgueseria",
    "burger",
    "burgers",
    "cheeseburger",
  ],
  sushi: ["sushi", "roll", "rolls", "nigiri", "nigiris", "sashimi", "maki", "makis"],
  helado: [
    "helado",
    "helados",
    "heladeria",
    "cucurucho",
    "cucuruchos",
    "cucuru",
  ],
};
