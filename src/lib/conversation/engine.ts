import { DEFAULT_LOCATION, VENDORS } from "@/data";
import { findNearestVendor, findVendorsByCategory, type VendorWithDistance } from "@/lib/geo/nearest";
import { getIntentDetector, type IntentDetector, type IntentResult } from "@/lib/intent";
import {
  addItem,
  confirmOrder,
  createCart,
  CartVendorMismatchError,
  directionsUrl,
  generatePickupCode,
  isCartEmpty,
  removeItem,
  type Cart,
  type PickupCodeGenerator,
} from "@/lib/order";
import type { Category, LatLng, MenuItem, Vendor } from "@/types";

import * as say from "./messages";
import { parseOrderCommand, type ItemRequest } from "./parse";
import type {
  ConversationAction,
  ConversationMessage,
  ConversationState,
  MessageAttachment,
  PickupOrder,
  QuickAction,
  ResolvedConversationAction,
} from "./types";

/** Zona horaria usada para mostrar el horario de retiro. */
export const DEFAULT_TIME_ZONE = "America/Argentina/Buenos_Aires";

export interface ConversationDeps {
  /** Vendedores disponibles; por defecto los mock de `@/data`. */
  vendors?: readonly Vendor[];
  /** Reloj; inyectable para tests deterministas. */
  now?: () => Date;
  /** Generador del código de retiro; inyectable para tests deterministas. */
  generateCode?: PickupCodeGenerator;
  /** Zona horaria para formatear el horario de retiro. */
  timeZone?: string;
}

export interface ConversationEngineDeps extends ConversationDeps {
  /** Detector de intención; por defecto `getIntentDetector()`. */
  intentDetector?: IntentDetector;
}

// ---------- Action creators ----------

export const userMessage = (text: string): ConversationAction => ({ type: "userMessage", text });
export const quickAction = (action: QuickAction): ConversationAction => ({ type: "quickAction", action });
export const setLocation = (location: LatLng): ConversationAction => ({ type: "setLocation", location });

// ---------- Estado inicial ----------

export interface InitialStateOptions {
  location?: LatLng;
  now?: () => Date;
}

/** Estado inicial: el saludo del asistente, en fase `greeting`. */
export function createInitialState({
  location = DEFAULT_LOCATION,
  now = () => new Date(),
}: InitialStateOptions = {}): ConversationState {
  const state: ConversationState = {
    version: 1,
    phase: "greeting",
    messages: [],
    location: { ...location },
    category: null,
    candidates: [],
    vendor: null,
    cart: createCart(),
    order: null,
    nextMessageId: 1,
  };
  return appendMessage(state, "assistant", say.greeting(), now());
}

// ---------- Helpers ----------

function appendMessage(
  state: ConversationState,
  author: ConversationMessage["author"],
  text: string,
  at: Date,
  attachment?: MessageAttachment,
): ConversationState {
  const message: ConversationMessage = {
    id: `m${state.nextMessageId}`,
    author,
    text,
    timestamp: at.toISOString(),
    ...(author === "user" ? { status: "read" as const } : {}),
    ...(attachment ? { attachment } : {}),
  };
  return {
    ...state,
    messages: [...state.messages, message],
    nextMessageId: state.nextMessageId + 1,
  };
}

function addToCart(cart: Cart, vendorId: string, item: MenuItem, quantity: number): Cart {
  let next = cart;
  for (let i = 0; i < quantity; i++) {
    try {
      next = addItem(next, vendorId, item);
    } catch (error) {
      // Defensa: el carrito siempre se reinicia al cambiar de vendedor, pero si
      // llegara uno de otro vendedor (estado viejo restaurado) arrancamos de cero.
      if (!(error instanceof CartVendorMismatchError)) throw error;
      next = addItem(createCart(), vendorId, item);
    }
  }
  return next;
}

function removeFromCart(cart: Cart, itemId: string, quantity: number): Cart {
  let next = cart;
  for (let i = 0; i < quantity; i++) next = removeItem(next, itemId);
  return next;
}

/** Reducer del motor con sus dependencias resueltas. */
class Reducer {
  private readonly vendors: readonly Vendor[];
  private readonly now: () => Date;
  private readonly generateCode: PickupCodeGenerator;
  private readonly timeZone: string;

  constructor(deps: ConversationDeps) {
    this.vendors = deps.vendors ?? VENDORS;
    this.now = deps.now ?? (() => new Date());
    this.generateCode = deps.generateCode ?? generatePickupCode;
    this.timeZone = deps.timeZone ?? DEFAULT_TIME_ZONE;
  }

  private say(state: ConversationState, text: string, attachment?: MessageAttachment) {
    return appendMessage(state, "assistant", text, this.now(), attachment);
  }

  reduce(state: ConversationState, action: ResolvedConversationAction): ConversationState {
    switch (action.type) {
      case "userMessage":
        return this.onUserMessage(state, action.text, action.intent);
      case "quickAction":
        return this.onQuickAction(state, action.action);
      case "setLocation":
        return this.onSetLocation(state, action.location);
    }
  }

  // ----- Mensajes de texto -----

  private onUserMessage(
    state: ConversationState,
    rawText: string,
    intent: IntentResult,
  ): ConversationState {
    const text = rawText.trim();
    if (!text) return state;
    let s = appendMessage(state, "user", text, this.now());

    // Pedir otra categoría (o una nueva tras confirmar) cambia de vendedor.
    if (
      intent.kind === "category" &&
      (intent.category !== s.category || s.phase === "confirmed" || !s.vendor)
    ) {
      return this.selectCategory(s, intent.category, text);
    }

    if (intent.kind === "ambiguous") {
      return this.say({ ...s, phase: "clarifying", candidates: intent.candidates }, say.clarify(intent.candidates));
    }

    switch (s.phase) {
      case "greeting":
      case "awaitingOrder":
        return this.say({ ...s, phase: "awaitingOrder" }, say.unknownCategory());
      case "clarifying":
        if (s.vendor) {
          // Eligió la categoría que ya tenía, o siguió armando el pedido.
          s = { ...s, phase: "ordering", candidates: [] };
          if (intent.kind === "category") return this.say(s, say.backToVendor(s.vendor!.name));
          return this.onOrderingText(s, text);
        }
        return this.say(s, say.clarify(s.candidates));
      case "ordering":
      case "confirming":
        return this.onOrderingText(s, text);
      case "confirmed":
        return this.say(s, s.order ? say.alreadyConfirmed(s.order) : say.noVendorYet());
    }
  }

  private onOrderingText(s: ConversationState, text: string): ConversationState {
    const vendor = s.vendor;
    if (!vendor) return this.say(s, say.noVendorYet());

    const command = parseOrderCommand(text, vendor.menu, s.phase === "confirming");
    switch (command.kind) {
      case "add":
        return this.addItems(s, command.items);
      case "remove":
        return this.removeItems(s, command.items);
      case "ambiguousItem":
        return this.say(s, say.whichItem(command.options));
      case "confirm":
      case "yes":
        return s.phase === "confirming" ? this.finalize(s) : this.askConfirmation(s);
      case "no":
        return this.say({ ...s, phase: "ordering" }, say.keepOrdering());
      case "showCart":
        return this.say(s, say.cartSummary(s.cart), { type: "cart" });
      case "showMenu":
        return this.say(s, say.menu(vendor.name, vendor.menu), { type: "menu", vendorId: vendor.id });
      case "none":
        return this.say(s, say.orderingHelp());
    }
  }

  private selectCategory(s: ConversationState, category: Category, text: string): ConversationState {
    const nearest = findNearestVendor(this.vendors, category, s.location);
    const activeOrder = s.vendor !== null && (s.phase === "ordering" || s.phase === "confirming" || s.phase === "clarifying");

    if (!nearest) {
      if (activeOrder) {
        return this.say({ ...s, phase: "ordering", candidates: [] }, say.noOpenVendors(category, s.vendor!.name));
      }
      return this.say(
        { ...s, phase: "awaitingOrder", candidates: [], category: null, vendor: null, cart: createCart() },
        say.noOpenVendors(category, null),
      );
    }

    const discardedCart = activeOrder && !isCartEmpty(s.cart);
    let next: ConversationState = {
      ...s,
      phase: "ordering",
      category,
      candidates: [],
      vendor: nearest,
      cart: createCart(),
      order: null,
    };
    if (discardedCart) next = this.say(next, say.switchedCategory(category));
    next = this.say(next, say.vendorProposal(category, nearest), { type: "vendor", vendorId: nearest.id });
    next = this.say(next, say.menu(nearest.name, nearest.menu), { type: "menu", vendorId: nearest.id });

    // "quiero dos fugazzetas": si el mensaje ya nombra ítems concretos, los sumamos.
    const command = parseOrderCommand(text, nearest.menu);
    if (command.kind === "add") next = this.addItems(next, command.items);
    return next;
  }

  private addItems(s: ConversationState, requests: readonly ItemRequest[]): ConversationState {
    const vendor = s.vendor!;
    let cart = s.cart;
    for (const { item, quantity } of requests) cart = addToCart(cart, vendor.id, item, quantity);
    return this.say({ ...s, phase: "ordering", cart }, say.itemsAdded(requests, cart), { type: "cart" });
  }

  private removeItems(s: ConversationState, requests: readonly ItemRequest[]): ConversationState {
    const present = requests.filter((r) => s.cart.lines.some((l) => l.item.id === r.item.id));
    if (present.length === 0) return this.say(s, say.itemNotInCart(requests[0].item.name));
    let cart = s.cart;
    for (const { item, quantity } of present) cart = removeFromCart(cart, item.id, quantity);
    return this.say({ ...s, phase: "ordering", cart }, say.itemsRemoved(present, cart), { type: "cart" });
  }

  private askConfirmation(s: ConversationState): ConversationState {
    if (isCartEmpty(s.cart)) return this.say({ ...s, phase: "ordering" }, say.emptyCartCannotConfirm());
    return this.say({ ...s, phase: "confirming" }, say.confirmPrompt(s.vendor!.name, s.cart), { type: "cart" });
  }

  private finalize(s: ConversationState): ConversationState {
    const vendor = s.vendor!;
    if (isCartEmpty(s.cart)) return this.say({ ...s, phase: "ordering" }, say.emptyCartCannotConfirm());
    const confirmed = confirmOrder(s.cart, vendor, this.now(), { generateCode: this.generateCode });
    const order: PickupOrder = {
      code: confirmed.code,
      vendorId: vendor.id,
      vendorName: vendor.name,
      address: vendor.address,
      vendorLocation: { ...vendor.location },
      items: confirmed.items,
      total: confirmed.total,
      pickupAt: confirmed.pickupAt.toISOString(),
      directionsUrl: directionsUrl(s.location, vendor),
    };
    return this.say(
      { ...s, phase: "confirmed", order, cart: createCart() },
      say.orderConfirmed(order, this.timeZone),
      { type: "order", code: order.code },
    );
  }

  // ----- Botones rápidos -----

  private onQuickAction(s: ConversationState, action: QuickAction): ConversationState {
    const vendor = s.vendor;
    const canOrder = vendor !== null && (s.phase === "ordering" || s.phase === "confirming" || s.phase === "clarifying");
    if (!canOrder) {
      return this.say(s, s.phase === "confirmed" && s.order ? say.alreadyConfirmed(s.order) : say.noVendorYet());
    }
    const base = { ...s, candidates: [] };

    switch (action.kind) {
      case "addItem":
      case "removeItem": {
        const item = vendor.menu.find((m) => m.id === action.itemId);
        if (!item) return this.say(base, say.itemNotInMenu(vendor.name));
        const request = [{ item, quantity: 1 }];
        return action.kind === "addItem" ? this.addItems(base, request) : this.removeItems(base, request);
      }
      case "confirm":
        return s.phase === "confirming" ? this.finalize(base) : this.askConfirmation(base);
    }
  }

  // ----- Ubicación -----

  private onSetLocation(s: ConversationState, location: LatLng): ConversationState {
    let next: ConversationState = { ...s, location: { ...location } };
    if (next.order) {
      next = { ...next, order: { ...next.order, directionsUrl: directionsUrl(location, { location: next.order.vendorLocation }) } };
    }
    if (!next.vendor || !next.category) return next;

    // Con el carrito vacío podemos proponer otro local si ahora hay uno más cerca.
    if (next.phase === "ordering" && isCartEmpty(next.cart)) {
      const nearest = findNearestVendor(this.vendors, next.category, location);
      if (nearest && nearest.id !== next.vendor.id) {
        next = { ...next, vendor: nearest };
        next = this.say(next, say.vendorRelocated(nearest), { type: "vendor", vendorId: nearest.id });
        return this.say(next, say.menu(nearest.name, nearest.menu), { type: "menu", vendorId: nearest.id });
      }
    }

    // Si no, solo actualizamos distancia y tiempos del local elegido.
    const current: VendorWithDistance | undefined = findVendorsByCategory(
      this.vendors,
      next.category,
      location,
    ).find((v) => v.id === next.vendor!.id);
    return current ? { ...next, vendor: current } : next;
  }
}

/**
 * Reducer síncrono y puro (dadas sus dependencias): `(state, action) => state`.
 * Los mensajes de texto deben llegar con la intención ya detectada; usá
 * `resolveAction` (o `createConversationEngine`) para obtenerla.
 * Compatible con `useReducer`/`usePersistentConversation`.
 */
export function createConversationReducer(deps: ConversationDeps = {}) {
  const reducer = new Reducer(deps);
  return (state: ConversationState, action: ResolvedConversationAction): ConversationState =>
    reducer.reduce(state, action);
}

/**
 * Resuelve la parte asíncrona de una acción: para `userMessage` detecta la
 * intención con el `IntentDetector` inyectado. Si el detector falla, se trata
 * como intención desconocida.
 */
export async function resolveAction(
  action: ConversationAction,
  detector: IntentDetector = getIntentDetector(),
): Promise<ResolvedConversationAction> {
  if (action.type !== "userMessage") return action;
  let intent: IntentResult;
  try {
    intent = await detector.detect(action.text);
  } catch {
    intent = { kind: "unknown" };
  }
  return { ...action, intent };
}

export interface ConversationEngine {
  initialState(location?: LatLng): ConversationState;
  /** Detecta la intención (si hace falta) y aplica la acción. */
  dispatch(state: ConversationState, action: ConversationAction): Promise<ConversationState>;
  /** Reducer síncrono para acciones ya resueltas. */
  reduce(state: ConversationState, action: ResolvedConversationAction): ConversationState;
}

/** Motor de conversación con todas sus dependencias inyectables. */
export function createConversationEngine(deps: ConversationEngineDeps = {}): ConversationEngine {
  const { intentDetector = getIntentDetector(), ...rest } = deps;
  const reduce = createConversationReducer(rest);
  return {
    initialState: (location) => createInitialState({ location, now: rest.now }),
    reduce,
    dispatch: async (state, action) => reduce(state, await resolveAction(action, intentDetector)),
  };
}
