import type { VendorWithDistance } from "@/lib/geo/nearest";
import type { IntentResult } from "@/lib/intent";
import type { Cart, CartLine } from "@/lib/order";
import type { Category, ChatMessage, LatLng } from "@/types";

/**
 * Fases del flujo principal:
 *
 * `greeting` → `awaitingOrder` → (`clarifying`) → `ordering` → `confirming` → `confirmed`
 *
 * - `greeting`: recién abierto, solo está el saludo del asistente.
 * - `awaitingOrder`: esperando que el usuario diga qué quiere comer.
 * - `clarifying`: el mensaje fue ambiguo; se preguntó entre `candidates`.
 * - `ordering`: hay vendedor propuesto y se arma el carrito.
 * - `confirming`: se mostró el resumen y se espera la confirmación.
 * - `confirmed`: pedido confirmado con código de retiro.
 */
export type ConversationPhase =
  | "greeting"
  | "awaitingOrder"
  | "clarifying"
  | "ordering"
  | "confirming"
  | "confirmed";

export const CONVERSATION_PHASES: readonly ConversationPhase[] = [
  "greeting",
  "awaitingOrder",
  "clarifying",
  "ordering",
  "confirming",
  "confirmed",
] as const;

/** Datos estructurados que acompañan a un mensaje para que la UI los renderice. */
export type MessageAttachment =
  | { type: "vendor"; vendorId: string }
  | { type: "menu"; vendorId: string }
  | { type: "cart" }
  | { type: "order"; code: string };

/** Mensaje del chat con un adjunto opcional (menú, carrito, pedido…). */
export interface ConversationMessage extends ChatMessage {
  attachment?: MessageAttachment;
}

/**
 * Pedido confirmado en forma serializable (fechas como ISO 8601, sin `Date`).
 */
export interface PickupOrder {
  code: string;
  vendorId: string;
  vendorName: string;
  address: string;
  vendorLocation: LatLng;
  items: CartLine[];
  /** Total en ARS. */
  total: number;
  /** Horario estimado de retiro (ISO 8601). */
  pickupAt: string;
  /** Link "cómo llegar" desde la ubicación del usuario. */
  directionsUrl: string;
}

/**
 * Estado completo de la conversación. Es JSON puro: sobrevive
 * `JSON.parse(JSON.stringify(state))` sin pérdida, así se puede persistir.
 */
export interface ConversationState {
  version: 1;
  phase: ConversationPhase;
  messages: ConversationMessage[];
  /** Ubicación del usuario usada para buscar el vendedor más cercano. */
  location: LatLng;
  /** Categoría activa (la del vendedor propuesto). */
  category: Category | null;
  /** Categorías entre las que se le preguntó al usuario (fase `clarifying`). */
  candidates: Category[];
  /** Vendedor propuesto, con distancia y tiempos desde `location`. */
  vendor: VendorWithDistance | null;
  cart: Cart;
  /** Último pedido confirmado. */
  order: PickupOrder | null;
  /** Contador para generar ids de mensajes deterministas. */
  nextMessageId: number;
}

/** Acción de botón rápido de la UI. */
export type QuickAction =
  | { kind: "addItem"; itemId: string }
  | { kind: "removeItem"; itemId: string }
  | { kind: "confirm" };

/** Acciones que dispara la UI. */
export type ConversationAction =
  | { type: "userMessage"; text: string }
  | { type: "quickAction"; action: QuickAction }
  | { type: "setLocation"; location: LatLng };

/**
 * Acción lista para el reducer síncrono: los mensajes del usuario ya traen la
 * intención detectada (ver `resolveAction`).
 */
export type ResolvedConversationAction =
  | { type: "userMessage"; text: string; intent: IntentResult }
  | { type: "quickAction"; action: QuickAction }
  | { type: "setLocation"; location: LatLng };
