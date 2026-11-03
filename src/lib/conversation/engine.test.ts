import { DEFAULT_LOCATION, VENDORS } from "@/data";
import { KeywordIntentDetector, type IntentDetector } from "@/lib/intent";
import { cartItemCount, cartTotal, isValidPickupCode } from "@/lib/order";
import type { Vendor } from "@/types";

import {
  createConversationEngine,
  createConversationReducer,
  isConversationState,
  quickAction,
  resolveAction,
  setLocation,
  userMessage,
  type ConversationAction,
  type ConversationState,
} from "./index";

const NOW = new Date("2026-11-03T23:00:00.000Z"); // 20:00 en Buenos Aires

function makeEngine(overrides: Parameters<typeof createConversationEngine>[0] = {}) {
  return createConversationEngine({
    intentDetector: new KeywordIntentDetector(),
    now: () => NOW,
    generateCode: () => "K7P2XR",
    ...overrides,
  });
}

async function run(
  engine: ReturnType<typeof makeEngine>,
  actions: ConversationAction[],
  state = engine.initialState(),
): Promise<ConversationState> {
  let s = state;
  for (const action of actions) s = await engine.dispatch(s, action);
  return s;
}

const lastText = (s: ConversationState) => s.messages[s.messages.length - 1].text;
const assistantTexts = (s: ConversationState) =>
  s.messages.filter((m) => m.author === "assistant").map((m) => m.text);

describe("motor de conversación", () => {
  it("arranca con un saludo en es-AR", () => {
    const s = makeEngine().initialState();
    expect(s.phase).toBe("greeting");
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0]).toMatchObject({ author: "assistant", id: "m1", timestamp: NOW.toISOString() });
    expect(s.messages[0].text).toMatch(/Contame qué tenés ganas de comer/);
    expect(s.location).toEqual(DEFAULT_LOCATION);
  });

  it("flujo completo: pizza → menú → 2 ítems → confirmar → código", async () => {
    const engine = makeEngine();
    let s = await run(engine, [userMessage("Hola, quiero pizza")]);

    expect(s.phase).toBe("ordering");
    expect(s.category).toBe("pizza");
    expect(s.vendor?.id).toBe("pizza-la-esquina-del-horno");
    const texts = assistantTexts(s);
    expect(texts.some((t) => /La Esquina del Horno/.test(t) && /min caminando/.test(t) && / (m|km):/.test(t))).toBe(true);
    expect(s.messages.some((m) => m.attachment?.type === "menu")).toBe(true);
    expect(texts.join("\n")).toMatch(/Pizza de muzzarella — \$\s12\.500/);
    expect(s.messages.find((m) => m.author === "user")?.status).toBe("read");

    s = await run(
      engine,
      [quickAction({ kind: "addItem", itemId: "pizza-horno-muzza" }), userMessage("sumá dos fainá")],
      s,
    );
    expect(cartItemCount(s.cart)).toBe(3);
    expect(cartTotal(s.cart)).toBe(12500 + 2 * 1800);
    expect(lastText(s)).toMatch(/Total hasta ahora: \$\s16\.100/);

    s = await engine.dispatch(s, quickAction({ kind: "confirm" }));
    expect(s.phase).toBe("confirming");
    expect(lastText(s)).toMatch(/¿Lo confirmo\?/);

    s = await engine.dispatch(s, userMessage("sí, dale"));
    expect(s.phase).toBe("confirmed");
    expect(s.order).toMatchObject({
      code: "K7P2XR",
      vendorName: "La Esquina del Horno",
      address: "Av. Corrientes 1350, San Nicolás",
      total: 16100,
      pickupAt: "2026-11-03T23:20:00.000Z",
    });
    expect(isValidPickupCode(s.order!.code)).toBe(true);
    expect(s.order!.directionsUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\/directions\?/);
    expect(lastText(s)).toMatch(/código de retiro es K7P2XR/);
    expect(lastText(s)).toMatch(/a partir de las 20:20 hs/);
    expect(lastText(s)).toMatch(/Cómo llegar: https:\/\/www\.openstreetmap\.org/);
    expect(s.messages[s.messages.length - 1].attachment).toEqual({ type: "order", code: "K7P2XR" });
    expect(s.cart.lines).toHaveLength(0);
  });

  it("confirma también por texto ('listo' y luego 'confirmo')", async () => {
    const engine = makeEngine();
    const s = await run(engine, [
      userMessage("quiero pizza"),
      userMessage("agregá una napolitana"),
      userMessage("listo"),
      userMessage("confirmo"),
    ]);
    expect(s.phase).toBe("confirmed");
    expect(s.order?.total).toBe(14200);
  });

  it("un mensaje ambiguo produce una pregunta y espera la respuesta", async () => {
    const engine = makeEngine();
    let s = await run(engine, [userMessage("no sé si pizza o empanadas")]);
    expect(s.phase).toBe("clarifying");
    expect(s.candidates).toEqual(["pizza", "empanadas"]);
    expect(lastText(s)).toBe("Mmm, no me quedó claro. ¿Qué preferís: pizza o empanadas?");
    expect(s.vendor).toBeNull();

    s = await engine.dispatch(s, userMessage("mmm no sé"));
    expect(s.phase).toBe("clarifying");
    expect(lastText(s)).toMatch(/¿Qué preferís/);

    s = await engine.dispatch(s, userMessage("empanadas"));
    expect(s.phase).toBe("ordering");
    expect(s.category).toBe("empanadas");
  });

  it("un mensaje sin categoría pide que repita", async () => {
    const s = await run(makeEngine(), [userMessage("hola!")]);
    expect(s.phase).toBe("awaitingOrder");
    expect(lastText(s)).toMatch(/no entendí qué querés comer/);
  });

  it("pedir empanadas en medio del pedido cambia de vendedor y vacía el carrito", async () => {
    const engine = makeEngine();
    let s = await run(engine, [userMessage("quiero pizza"), userMessage("agregá una muzzarella")]);
    expect(cartItemCount(s.cart)).toBe(1);
    const pizzaVendor = s.vendor!.id;

    s = await engine.dispatch(s, userMessage("ahora quiero empanadas"));
    expect(s.category).toBe("empanadas");
    expect(s.vendor?.category).toBe("empanadas");
    expect(s.vendor?.id).not.toBe(pizzaVendor);
    expect(s.cart.lines).toHaveLength(0);
    expect(s.phase).toBe("ordering");
    expect(assistantTexts(s).some((t) => /vacié el carrito anterior/.test(t))).toBe(true);

    // El carrito nuevo acepta ítems del vendedor nuevo (sin CartVendorMismatchError).
    s = await engine.dispatch(s, userMessage("agregá dos de humita"));
    expect(s.cart.vendorId).toBe(s.vendor!.id);
    expect(cartItemCount(s.cart)).toBe(2);
  });

  it("categoría sin vendedores abiertos: mensaje explicativo", async () => {
    const vendors: Vendor[] = VENDORS.map((v) => (v.category === "sushi" ? { ...v, isOpen: false } : v));
    const engine = makeEngine({ vendors });

    let s = await run(engine, [userMessage("quiero sushi")]);
    expect(s.phase).toBe("awaitingOrder");
    expect(s.vendor).toBeNull();
    expect(lastText(s)).toMatch(/no hay locales de sushi abiertos/);

    // Con un pedido en curso, se mantiene el vendedor y el carrito.
    s = await run(engine, [userMessage("quiero pizza"), userMessage("agregá una muzza"), userMessage("mejor sushi")], s);
    expect(s.category).toBe("pizza");
    expect(cartItemCount(s.cart)).toBe(1);
    expect(lastText(s)).toMatch(/no hay locales de sushi abiertos.*Seguimos con tu pedido en La Esquina del Horno/);
  });

  it("agrega un ítem por texto ('agregá una muzzarella')", async () => {
    const engine = makeEngine();
    const s = await run(engine, [userMessage("quiero pizza"), userMessage("agregá una muzzarella")]);
    expect(s.cart.lines).toEqual([
      { item: expect.objectContaining({ id: "pizza-horno-muzza" }), quantity: 1 },
    ]);
    expect(lastText(s)).toMatch(/agregué 1 × Pizza de muzzarella/);
  });

  it("si el primer mensaje ya nombra un ítem, lo agrega", async () => {
    const s = await run(makeEngine(), [userMessage("quiero pizza, dos fugazzetas")]);
    expect(s.vendor?.id).toBe("pizza-la-esquina-del-horno");
    expect(s.cart.lines).toEqual([
      { item: expect.objectContaining({ id: "pizza-horno-fugazzeta" }), quantity: 2 },
    ]);
  });

  it("quita ítems por texto y por botón, y muestra el total", async () => {
    const engine = makeEngine();
    let s = await run(engine, [
      userMessage("quiero pizza"),
      userMessage("agregá 2 muzzarellas y una napolitana"),
    ]);
    expect(cartItemCount(s.cart)).toBe(3);

    s = await engine.dispatch(s, userMessage("sacá una muzzarella"));
    expect(cartItemCount(s.cart)).toBe(2);
    s = await engine.dispatch(s, quickAction({ kind: "removeItem", itemId: "pizza-horno-napo" }));
    expect(cartItemCount(s.cart)).toBe(1);

    s = await engine.dispatch(s, userMessage("¿cuánto es el total?"));
    expect(lastText(s)).toMatch(/Total: \$\s12\.500/);

    s = await engine.dispatch(s, userMessage("sacá la fainá"));
    expect(lastText(s)).toBe("No tenés Fainá en el pedido.");
  });

  it("sin ítem concreto muestra el menú y no confirma un carrito vacío", async () => {
    const engine = makeEngine();
    let s = await run(engine, [userMessage("quiero pizza"), userMessage("agregá una pizza")]);
    expect(lastText(s)).toMatch(/^Este es el menú de La Esquina del Horno/);
    expect(s.cart.lines).toHaveLength(0);

    s = await engine.dispatch(s, quickAction({ kind: "confirm" }));
    expect(s.phase).toBe("ordering");
    expect(lastText(s)).toMatch(/Todavía no agregaste nada/);
  });

  it("botones rápidos antes de elegir vendedor no rompen", async () => {
    const engine = makeEngine();
    const s = await engine.dispatch(engine.initialState(), quickAction({ kind: "addItem", itemId: "x" }));
    expect(lastText(s)).toMatch(/Primero decime qué querés comer/);
  });

  it("después de confirmar, pedir otra categoría arranca un pedido nuevo", async () => {
    const engine = makeEngine();
    let s = await run(engine, [
      userMessage("quiero pizza"),
      userMessage("agregá una muzzarella"),
      quickAction({ kind: "confirm" }),
      quickAction({ kind: "confirm" }),
    ]);
    expect(s.phase).toBe("confirmed");
    s = await engine.dispatch(s, userMessage("gracias!"));
    expect(lastText(s)).toMatch(/ya está confirmado \(código K7P2XR\)/);

    s = await engine.dispatch(s, userMessage("quiero helado"));
    expect(s.phase).toBe("ordering");
    expect(s.category).toBe("helado");
    expect(s.order).toBeNull();
  });

  it("setLocation recalcula el vendedor más cercano si el carrito está vacío", async () => {
    const engine = makeEngine();
    let s = await run(engine, [userMessage("quiero pizza")]);
    expect(s.vendor?.id).toBe("pizza-la-esquina-del-horno");

    // Al lado de Pizzería Don Tano (Almagro).
    s = await engine.dispatch(s, setLocation({ lat: -34.6107, lng: -58.4196 }));
    expect(s.location).toEqual({ lat: -34.6107, lng: -58.4196 });
    expect(s.vendor?.id).toBe("pizza-don-tano");
    expect(lastText(s)).toMatch(/Pizzería Don Tano/);

    // Con ítems en el carrito no cambia de vendedor, solo actualiza distancias.
    s = await engine.dispatch(s, userMessage("agregá una calabresa"));
    const before = s.vendor!.distanceKm;
    s = await engine.dispatch(s, setLocation(DEFAULT_LOCATION));
    expect(s.vendor?.id).toBe("pizza-don-tano");
    expect(s.vendor!.distanceKm).toBeGreaterThan(before);
  });

  it("el estado sobrevive JSON.stringify/parse y se puede seguir usando", async () => {
    const engine = makeEngine();
    const s = await run(engine, [userMessage("quiero pizza"), userMessage("agregá una muzzarella")]);
    const restored: unknown = JSON.parse(JSON.stringify(s));
    expect(restored).toEqual(s);
    expect(isConversationState(restored)).toBe(true);

    let r = restored as ConversationState;
    r = await run(engine, [userMessage("y una fainá"), quickAction({ kind: "confirm" }), userMessage("si")], r);
    expect(r.phase).toBe("confirmed");
    expect(r.order?.total).toBe(12500 + 1800);

    const final: unknown = JSON.parse(JSON.stringify(r));
    expect(final).toEqual(r);
    expect(isConversationState(final)).toBe(true);
    expect(isConversationState({ version: 2 })).toBe(false);
    expect(isConversationState(null)).toBe(false);
  });

  it("usa el IntentDetector inyectado y degrada si falla", async () => {
    const detect = vi.fn<IntentDetector["detect"]>().mockResolvedValue({ kind: "category", category: "sushi" });
    const engine = makeEngine({ intentDetector: { detect } });
    const s = await engine.dispatch(engine.initialState(), userMessage("algo rico"));
    expect(detect).toHaveBeenCalledWith("algo rico");
    expect(s.category).toBe("sushi");

    const failing: IntentDetector = { detect: () => Promise.reject(new Error("boom")) };
    const resolved = await resolveAction(userMessage("pizza"), failing);
    expect(resolved).toEqual({ type: "userMessage", text: "pizza", intent: { kind: "unknown" } });
  });

  it("el reducer síncrono es puro: no muta el estado recibido", () => {
    const reduce = createConversationReducer({ now: () => NOW, generateCode: () => "K7P2XR" });
    const engine = makeEngine();
    const s0 = engine.initialState();
    const snapshot = JSON.stringify(s0);
    const s1 = reduce(s0, {
      type: "userMessage",
      text: "quiero pizza",
      intent: { kind: "category", category: "pizza" },
    });
    expect(JSON.stringify(s0)).toBe(snapshot);
    expect(s1).not.toBe(s0);
    expect(s1.phase).toBe("ordering");
    // Mensajes vacíos se ignoran.
    expect(reduce(s1, { type: "userMessage", text: "   ", intent: { kind: "unknown" } })).toBe(s1);
  });
});
