import type { MenuItem } from "@/types";

import {
  addItem,
  cartItemCount,
  cartTotal,
  CartVendorMismatchError,
  clearCart,
  createCart,
  isCartEmpty,
  removeItem,
} from "./cart";

const muzza: MenuItem = { id: "muzza", name: "Muzzarella", description: "", price: 12500 };
const napo: MenuItem = { id: "napo", name: "Napolitana", description: "", price: 14200 };
const faina: MenuItem = { id: "faina", name: "Fainá", description: "", price: 2300 };

describe("carrito", () => {
  it("empieza vacío y sin vendedor", () => {
    const cart = createCart();
    expect(isCartEmpty(cart)).toBe(true);
    expect(cart.vendorId).toBeNull();
    expect(cartTotal(cart)).toBe(0);
    expect(cartItemCount(cart)).toBe(0);
  });

  it("agregar actualiza cantidades y total", () => {
    let cart = addItem(createCart(), "v1", muzza);
    expect(cart.vendorId).toBe("v1");
    expect(cartItemCount(cart)).toBe(1);
    expect(cartTotal(cart)).toBe(12500);

    cart = addItem(cart, "v1", muzza);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(2);
    expect(cartItemCount(cart)).toBe(2);
    expect(cartTotal(cart)).toBe(25000);
  });

  it("calcula el total con varios ítems", () => {
    let cart = createCart();
    cart = addItem(cart, "v1", muzza);
    cart = addItem(cart, "v1", napo);
    cart = addItem(cart, "v1", faina);
    cart = addItem(cart, "v1", faina);
    cart = addItem(cart, "v1", faina);

    expect(cart.lines).toHaveLength(3);
    expect(cartItemCount(cart)).toBe(5);
    expect(cartTotal(cart)).toBe(12500 + 14200 + 3 * 2300);
  });

  it("quitar decrementa la cantidad y actualiza el total", () => {
    let cart = addItem(addItem(addItem(createCart(), "v1", muzza), "v1", muzza), "v1", napo);
    cart = removeItem(cart, "muzza");

    expect(cart.lines.find((l) => l.item.id === "muzza")?.quantity).toBe(1);
    expect(cartItemCount(cart)).toBe(2);
    expect(cartTotal(cart)).toBe(12500 + 14200);
  });

  it("quitar elimina la línea al llegar a 0", () => {
    let cart = addItem(addItem(createCart(), "v1", muzza), "v1", napo);
    cart = removeItem(cart, "muzza");

    expect(cart.lines.map((l) => l.item.id)).toEqual(["napo"]);
    expect(cart.vendorId).toBe("v1");
    expect(cartTotal(cart)).toBe(14200);
  });

  it("al quitar el último ítem el carrito queda vacío y sin vendedor", () => {
    const cart = removeItem(addItem(createCart(), "v1", muzza), "muzza");
    expect(isCartEmpty(cart)).toBe(true);
    expect(cart.vendorId).toBeNull();
  });

  it("quitar un ítem que no está no cambia nada", () => {
    const cart = addItem(createCart(), "v1", muzza);
    expect(removeItem(cart, "inexistente")).toBe(cart);
  });

  it("no muta el carrito original", () => {
    const original = addItem(createCart(), "v1", muzza);
    addItem(original, "v1", muzza);
    removeItem(original, "muzza");
    expect(original.lines).toEqual([{ item: muzza, quantity: 1 }]);
  });

  it("agregar un ítem de otro vendedor lanza CartVendorMismatchError", () => {
    const cart = addItem(createCart(), "v1", muzza);
    expect(() => addItem(cart, "v2", napo)).toThrow(CartVendorMismatchError);
  });

  it("después de vaciar se puede agregar de otro vendedor", () => {
    const cart = addItem(clearCart(), "v2", napo);
    expect(cart.vendorId).toBe("v2");
    expect(cartTotal(cart)).toBe(14200);
  });

  it("clearCart devuelve un carrito vacío", () => {
    const cart = clearCart();
    expect(isCartEmpty(cart)).toBe(true);
    expect(cart.vendorId).toBeNull();
  });
});
