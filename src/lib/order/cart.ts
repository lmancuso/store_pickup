import type { MenuItem, Vendor } from "@/types";

/** Una línea del carrito: un ítem de menú y su cantidad (siempre >= 1). */
export interface CartLine {
  item: MenuItem;
  quantity: number;
}

/**
 * Carrito ligado a un único vendedor.
 *
 * Es inmutable: todas las operaciones devuelven un carrito nuevo.
 * `vendorId` es `null` mientras el carrito está vacío; se fija con el primer
 * ítem agregado y se libera al vaciarse.
 */
export interface Cart {
  vendorId: Vendor["id"] | null;
  lines: CartLine[];
}

/**
 * Se lanza al intentar agregar un ítem de un vendedor distinto al del carrito.
 *
 * Decisión: el carrito NO se reinicia en silencio, porque perder el pedido sin
 * avisar sería sorpresivo. Quien llame (UI/conversación) decide si pregunta al
 * usuario y, si acepta, hace `clearCart()` y vuelve a agregar.
 */
export class CartVendorMismatchError extends Error {
  constructor(
    readonly cartVendorId: string,
    readonly itemVendorId: string,
  ) {
    super(
      `El carrito tiene ítems de "${cartVendorId}" y no se pueden mezclar con "${itemVendorId}".`,
    );
    this.name = "CartVendorMismatchError";
  }
}

/** Carrito vacío, sin vendedor. */
export function createCart(): Cart {
  return { vendorId: null, lines: [] };
}

/**
 * Agrega una unidad de `item` del vendedor `vendorId`.
 * Si el ítem ya está en el carrito, incrementa su cantidad.
 *
 * @throws {CartVendorMismatchError} si el carrito ya tiene ítems de otro vendedor.
 */
export function addItem(cart: Cart, vendorId: Vendor["id"], item: MenuItem): Cart {
  if (cart.vendorId !== null && cart.lines.length > 0 && cart.vendorId !== vendorId) {
    throw new CartVendorMismatchError(cart.vendorId, vendorId);
  }

  const exists = cart.lines.some((line) => line.item.id === item.id);
  const lines = exists
    ? cart.lines.map((line) =>
        line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
      )
    : [...cart.lines, { item, quantity: 1 }];

  return { vendorId, lines };
}

/**
 * Quita una unidad del ítem `itemId`. Si la cantidad llega a 0, la línea se
 * elimina; si el carrito queda vacío, se libera el vendedor.
 * Quitar un ítem que no está en el carrito no hace nada.
 */
export function removeItem(cart: Cart, itemId: MenuItem["id"]): Cart {
  if (!cart.lines.some((line) => line.item.id === itemId)) {
    return cart;
  }

  const lines = cart.lines
    .map((line) => (line.item.id === itemId ? { ...line, quantity: line.quantity - 1 } : line))
    .filter((line) => line.quantity > 0);

  return lines.length === 0 ? createCart() : { vendorId: cart.vendorId, lines };
}

/** Vacía el carrito y libera el vendedor. */
export function clearCart(): Cart {
  return createCart();
}

/** Total del carrito en ARS. */
export function cartTotal(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
}

/** Cantidad total de unidades en el carrito (suma de cantidades). */
export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** `true` si el carrito no tiene ítems. */
export function isCartEmpty(cart: Cart): boolean {
  return cart.lines.length === 0;
}
