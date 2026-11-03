/**
 * Textos del asistente (es-AR). Funciones puras: reciben datos y devuelven
 * el texto del mensaje.
 */
import type { VendorWithDistance } from "@/lib/geo/nearest";
import { cartTotal, formatARS, type Cart } from "@/lib/order";
import { CATEGORIES, type Category, type MenuItem } from "@/types";

import type { ItemRequest } from "./parse";
import type { PickupOrder } from "./types";

const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  pizza: "pizza",
  empanadas: "empanadas",
  hamburguesas: "hamburguesas",
  sushi: "sushi",
  helado: "helado",
};

const KM_FORMATTER = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/** "a, b o c" */
function joinOr(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} o ${parts[parts.length - 1]}`;
}

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category];
}

/** Distancia legible: "450 m" o "1,2 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${KM_FORMATTER.format(km)} km`;
}

/** Hora "HH:mm" (24 h) en la zona horaria indicada. */
export function formatClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

const ALL_CATEGORIES = joinOr(CATEGORIES.map(categoryLabel));

export const greeting = (): string =>
  `¡Hola! Soy tu asistente de Store Pickup 👋 Contame qué tenés ganas de comer (${ALL_CATEGORIES}) y te busco el local abierto más cercano para que pases a retirar.`;

export const unknownCategory = (): string =>
  `Perdón, no entendí qué querés comer. Por ahora puedo ayudarte con ${ALL_CATEGORIES}. ¿Qué se te antoja?`;

export const clarify = (candidates: readonly Category[]): string =>
  `Mmm, no me quedó claro. ¿Qué preferís: ${joinOr(candidates.map(categoryLabel))}?`;

export const noOpenVendors = (category: Category, keepingVendor: string | null): string =>
  keepingVendor
    ? `Uy, en este momento no hay locales de ${categoryLabel(category)} abiertos cerca tuyo. Seguimos con tu pedido en ${keepingVendor}.`
    : `Uy, en este momento no hay locales de ${categoryLabel(category)} abiertos cerca tuyo. ¿Querés pedir otra cosa? Puedo buscarte ${ALL_CATEGORIES}.`;

export const switchedCategory = (category: Category): string =>
  `Dale, cambiamos a ${categoryLabel(category)}. Arranco un pedido nuevo y vacié el carrito anterior.`;

export const vendorProposal = (category: Category, vendor: VendorWithDistance): string =>
  `¡Genial! El local de ${categoryLabel(category)} abierto más cercano es ${vendor.name} (${vendor.address}), a ${formatDistance(vendor.distanceKm)}: unos ${vendor.walkingMinutes} min caminando. Tu pedido estaría listo para retirar en aprox. ${vendor.estimatedMinutes} min.`;

export const vendorRelocated = (vendor: VendorWithDistance): string =>
  `Con tu nueva ubicación, el local más cercano ahora es ${vendor.name} (${vendor.address}), a ${formatDistance(vendor.distanceKm)}.`;

function menuLine(item: MenuItem): string {
  return `• ${item.name} — ${formatARS(item.price)}`;
}

export const menu = (vendorName: string, items: readonly MenuItem[]): string =>
  [
    `Este es el menú de ${vendorName}:`,
    ...items.map(menuLine),
    "Decime qué querés agregar (por ejemplo «agregá una " +
      (items[0]?.name.toLowerCase() ?? "porción") +
      "») o usá los botones.",
  ].join("\n");

export function cartLines(cart: Cart): string[] {
  return cart.lines.map(
    (line) => `• ${line.quantity} × ${line.item.name} — ${formatARS(line.item.price * line.quantity)}`,
  );
}

function describeRequests(requests: readonly ItemRequest[]): string {
  return requests.map((r) => `${r.quantity} × ${r.item.name}`).join(", ");
}

export const itemsAdded = (requests: readonly ItemRequest[], cart: Cart): string =>
  `Listo, agregué ${describeRequests(requests)}. Total hasta ahora: ${formatARS(cartTotal(cart))}. ¿Algo más o confirmamos?`;

export const itemsRemoved = (requests: readonly ItemRequest[], cart: Cart): string =>
  cart.lines.length === 0
    ? `Saqué ${describeRequests(requests)}. Tu carrito quedó vacío.`
    : `Saqué ${describeRequests(requests)}. Total: ${formatARS(cartTotal(cart))}.`;

export const itemNotInCart = (itemName: string): string =>
  `No tenés ${itemName} en el pedido.`;

export const itemNotInMenu = (vendorName: string): string =>
  `Ese producto no está en el menú de ${vendorName}.`;

export const whichItem = (options: readonly MenuItem[]): string =>
  `¿Cuál querés? ${joinOr(options.map((o) => o.name))}.`;

export const cartSummary = (cart: Cart): string =>
  cart.lines.length === 0
    ? "Tu carrito está vacío. Decime qué querés agregar."
    : ["Tu pedido por ahora:", ...cartLines(cart), `Total: ${formatARS(cartTotal(cart))}`].join("\n");

export const emptyCartCannotConfirm = (): string =>
  "Todavía no agregaste nada al pedido. Decime qué querés y lo sumo.";

export const confirmPrompt = (vendorName: string, cart: Cart): string =>
  [
    `Tu pedido en ${vendorName}:`,
    ...cartLines(cart),
    `Total: ${formatARS(cartTotal(cart))}`,
    "¿Lo confirmo?",
  ].join("\n");

export const keepOrdering = (): string =>
  "Dale, seguimos. Podés agregar o sacar cosas y confirmar cuando quieras.";

export const orderingHelp = (): string =>
  "No te entendí 🙈 Podés decirme por ejemplo «agregá una …», «sacá …», «ver total» o «confirmar».";

export const orderConfirmed = (order: PickupOrder, timeZone: string): string =>
  [
    `¡Pedido confirmado! 🎉 Tu código de retiro es ${order.code}.`,
    `Retiralo en ${order.vendorName}, ${order.address}, a partir de las ${formatClock(order.pickupAt, timeZone)} hs.`,
    `Total a pagar en el local: ${formatARS(order.total)}.`,
    `Cómo llegar: ${order.directionsUrl}`,
  ].join("\n");

export const alreadyConfirmed = (order: PickupOrder): string =>
  `Tu pedido ya está confirmado (código ${order.code}). Si querés pedir otra cosa, decime qué tenés ganas de comer.`;

export const noVendorYet = (): string =>
  "Primero decime qué querés comer y te busco el local más cercano.";

export const backToVendor = (vendorName: string): string =>
  `Perfecto, seguimos con tu pedido en ${vendorName}.`;
