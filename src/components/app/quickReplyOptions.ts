import type { ConversationState } from "@/lib/conversation";
import { isCartEmpty } from "@/lib/order";
import { CATEGORIES, type Category } from "@/types";

const CATEGORY_OPTIONS: Readonly<Record<Category, string>> = {
  pizza: "Pizza",
  empanadas: "Empanadas",
  hamburguesas: "Hamburguesas",
  sushi: "Sushi",
  helado: "Helado",
};

/** Respuestas rápidas en confirmación: se envían como texto del usuario. */
export const CONFIRM_YES = "Sí, confirmar";
export const CONFIRM_NO = "No, seguir pidiendo";
export const SHOW_MENU = "Ver menú";
export const SHOW_TOTAL = "Ver total";

/**
 * Chips sugeridos según la fase de la conversación. Cada opción se envía como
 * un mensaje de texto del usuario, así pasa por el mismo motor que lo tipeado.
 */
export function quickReplyOptions(state: ConversationState): string[] {
  switch (state.phase) {
    case "greeting":
    case "awaitingOrder":
    case "confirmed":
      return CATEGORIES.map((c) => CATEGORY_OPTIONS[c]);
    case "clarifying":
      return state.candidates.map((c) => CATEGORY_OPTIONS[c]);
    case "ordering":
      return isCartEmpty(state.cart) ? [SHOW_MENU] : [SHOW_MENU, SHOW_TOTAL];
    case "confirming":
      return [CONFIRM_YES, CONFIRM_NO];
  }
}
