import type { Vendor } from "@/types";

import { addItem, createCart } from "./cart";
import { PICKUP_CODE_PATTERN } from "./code";
import { confirmOrder, EmptyCartError, OrderVendorMismatchError } from "./confirm";

const vendor: Vendor = {
  id: "pizza-test",
  name: "Pizzería Test",
  category: "pizza",
  address: "Av. Corrientes 1000",
  location: { lat: -34.6042, lng: -58.3866 },
  isOpen: true,
  prepTimeMinutes: 25,
  menu: [
    { id: "muzza", name: "Muzzarella", description: "", price: 12500 },
    { id: "faina", name: "Fainá", description: "", price: 2300 },
  ],
};

const [muzza, faina] = vendor.menu;
const now = new Date("2026-11-03T20:00:00.000Z");

function fullCart() {
  let cart = createCart();
  cart = addItem(cart, vendor.id, muzza);
  cart = addItem(cart, vendor.id, faina);
  cart = addItem(cart, vendor.id, faina);
  return cart;
}

describe("confirmOrder", () => {
  it("confirmar un carrito vacío falla", () => {
    expect(() => confirmOrder(createCart(), vendor, now)).toThrow(EmptyCartError);
  });

  it("falla si el carrito es de otro vendedor", () => {
    const cart = addItem(createCart(), "otro", muzza);
    expect(() => confirmOrder(cart, vendor, now)).toThrow(OrderVendorMismatchError);
  });

  it("devuelve código, vendedor, ítems y total", () => {
    const order = confirmOrder(fullCart(), vendor, now, { generateCode: () => "K7P2XR" });

    expect(order.code).toBe("K7P2XR");
    expect(order.vendor).toBe(vendor);
    expect(order.items).toEqual([
      { item: muzza, quantity: 1 },
      { item: faina, quantity: 2 },
    ]);
    expect(order.total).toBe(12500 + 2 * 2300);
  });

  it("pickupAt = now + tiempo de preparación del vendedor", () => {
    const order = confirmOrder(fullCart(), vendor, now);
    expect(order.pickupAt.toISOString()).toBe("2026-11-03T20:25:00.000Z");
    expect(order.pickupAt.getTime() - now.getTime()).toBe(25 * 60_000);
  });

  it("por defecto genera un código con el formato válido", () => {
    const order = confirmOrder(fullCart(), vendor, now);
    expect(order.code).toMatch(PICKUP_CODE_PATTERN);
  });

  it("los ítems del pedido no comparten referencias con el carrito", () => {
    const cart = fullCart();
    const order = confirmOrder(cart, vendor, now);
    expect(order.items[0]).not.toBe(cart.lines[0]);
  });
});
