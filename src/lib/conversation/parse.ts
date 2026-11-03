import { normalizeText } from "@/lib/intent";
import type { MenuItem } from "@/types";

/** Ítem del menú reconocido en el texto, con su cantidad. */
export interface ItemRequest {
  item: MenuItem;
  quantity: number;
}

/** Comando de pedido interpretado a partir de un mensaje de texto. */
export type OrderCommand =
  | { kind: "add"; items: ItemRequest[] }
  | { kind: "remove"; items: ItemRequest[] }
  | { kind: "ambiguousItem"; options: MenuItem[] }
  | { kind: "confirm" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "showCart" }
  | { kind: "showMenu" }
  | { kind: "none" };

const ADD_WORDS = new Set([
  "agrega", "agregame", "agregale", "agregar", "agrego", "suma", "sumame", "sumar",
  "dame", "pone", "poneme", "quiero", "queria", "quisiera", "mandame", "traeme",
]);
const REMOVE_WORDS = new Set([
  "saca", "sacame", "sacale", "sacar", "quita", "quitame", "quitar", "borra",
  "borrame", "borrar", "elimina", "eliminame", "eliminar",
]);
const CONFIRM_WORDS = new Set(["confirmo", "confirmar", "confirma", "confirmalo", "listo", "finalizar", "terminar"]);
const CONFIRM_PHRASES = ["eso es todo", "nada mas", "es todo"];
const YES_WORDS = new Set(["si", "dale", "ok", "okay", "confirmo", "confirmar", "confirma", "confirmalo", "listo", "perfecto", "obvio", "bueno"]);
const NO_WORDS = new Set(["no", "cancelar", "cancela", "espera", "pera", "todavia"]);
const CART_WORDS = new Set(["total", "carrito", "cuanto", "resumen"]);
const MENU_WORDS = new Set(["menu", "carta", "opciones"]);

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
};

/** Palabras que no distinguen un ítem de otro dentro del menú. */
const STOP_WORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "y", "a", "al", "en"]);
/** Nombres genéricos de categoría: "una pizza" no elige un ítem concreto. */
const GENERIC_WORDS = new Set([
  "pizza", "empanada", "hamburguesa", "helado", "sushi",
]);

const MAX_QUANTITY = 20;

function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(" ") : [];
}

function singular(token: string): string {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

function tokensMatch(messageToken: string, itemToken: string): boolean {
  const a = singular(messageToken);
  const b = singular(itemToken);
  if (a === b) return true;
  // Prefijos ("muzza" → "muzzarella"), solo con palabras de 4+ letras.
  return (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));
}

function itemTokens(item: MenuItem): string[] {
  const tokens = tokenize(item.name).filter((t) => !STOP_WORDS.has(t));
  const specific = tokens.filter((t) => !GENERIC_WORDS.has(singular(t)));
  return specific.length > 0 ? specific : tokens;
}

type ItemMatch = { kind: "item"; item: MenuItem } | { kind: "ambiguous"; options: MenuItem[] } | null;

/** Busca el ítem del menú que mejor coincide con las palabras del mensaje. */
export function matchMenuItem(text: string, menu: readonly MenuItem[]): ItemMatch {
  const messageTokens = tokenize(text).filter((t) => !STOP_WORDS.has(t));
  if (messageTokens.length === 0) return null;

  const scored = menu
    .map((item) => {
      const tokens = itemTokens(item);
      const score = tokens.filter((it) => messageTokens.some((mt) => tokensMatch(mt, it))).length;
      return { item, score, coverage: tokens.length > 0 ? score / tokens.length : 0 };
    })
    .filter((s) => s.score > 0);
  if (scored.length === 0) return null;

  const best = Math.max(...scored.map((s) => s.score));
  let top = scored.filter((s) => s.score === best);
  if (top.length > 1) {
    const bestCoverage = Math.max(...top.map((s) => s.coverage));
    top = top.filter((s) => s.coverage === bestCoverage);
  }
  return top.length === 1
    ? { kind: "item", item: top[0].item }
    : { kind: "ambiguous", options: top.map((s) => s.item) };
}

/** Cantidad pedida en un fragmento ("dos", "3", "una"…); 1 por defecto. */
export function parseQuantity(text: string): number {
  for (const token of tokenize(text)) {
    if (Object.hasOwn(NUMBER_WORDS, token)) return NUMBER_WORDS[token];
    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (n >= 1) return Math.min(n, MAX_QUANTITY);
    }
  }
  return 1;
}

function hasQuantity(text: string): boolean {
  return tokenize(text).some((t) => Object.hasOwn(NUMBER_WORDS, t) || /^\d+$/.test(t));
}

function splitSegments(text: string): string[] {
  return text
    .split(/,|;|\s+y\s+|\s+e\s+|\s+mas\s+|\s+más\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasAny(tokens: readonly string[], words: ReadonlySet<string>): boolean {
  return tokens.some((t) => words.has(t));
}

/**
 * Interpreta un mensaje en el contexto de armado del pedido.
 *
 * @param menu menú del vendedor activo.
 * @param awaitingConfirmation `true` si se está esperando un "sí"/"no".
 */
export function parseOrderCommand(
  text: string,
  menu: readonly MenuItem[],
  awaitingConfirmation = false,
): OrderCommand {
  const tokens = tokenize(text);
  const normalized = ` ${tokens.join(" ")} `;
  if (tokens.length === 0) return { kind: "none" };

  const items: ItemRequest[] = [];
  let ambiguous: MenuItem[] | null = null;
  for (const segment of splitSegments(text)) {
    const match = matchMenuItem(segment, menu);
    if (match?.kind === "item") {
      const previous = items.find((r) => r.item.id === match.item.id);
      // "jamón y queso" se parte en dos fragmentos que apuntan al mismo ítem:
      // solo sumamos de nuevo si el fragmento trae una cantidad explícita.
      if (previous && !hasQuantity(segment)) continue;
      if (previous) previous.quantity = Math.min(previous.quantity + parseQuantity(segment), MAX_QUANTITY);
      else items.push({ item: match.item, quantity: parseQuantity(segment) });
    } else if (match?.kind === "ambiguous" && !ambiguous) {
      ambiguous = match.options;
    }
  }

  if (awaitingConfirmation && items.length === 0 && !ambiguous) {
    if (hasAny(tokens, NO_WORDS)) return { kind: "no" };
    if (hasAny(tokens, YES_WORDS)) return { kind: "yes" };
  }

  if (hasAny(tokens, REMOVE_WORDS)) {
    if (items.length > 0) return { kind: "remove", items };
    if (ambiguous) return { kind: "ambiguousItem", options: ambiguous };
  }
  if (items.length > 0) return { kind: "add", items };
  if (ambiguous) return { kind: "ambiguousItem", options: ambiguous };

  if (
    hasAny(tokens, CONFIRM_WORDS) ||
    CONFIRM_PHRASES.some((phrase) => normalized.includes(` ${phrase} `))
  ) {
    return { kind: "confirm" };
  }
  if (hasAny(tokens, CART_WORDS)) return { kind: "showCart" };
  if (hasAny(tokens, MENU_WORDS)) return { kind: "showMenu" };
  // Un verbo de agregar sin ítem reconocible: mostramos el menú para elegir.
  if (hasAny(tokens, ADD_WORDS)) return { kind: "showMenu" };
  return { kind: "none" };
}
