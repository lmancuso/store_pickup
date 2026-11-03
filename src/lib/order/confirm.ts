import type { Vendor } from "@/types";

import { cartTotal, type Cart, type CartLine } from "./cart";
import { generatePickupCode, type PickupCodeGenerator } from "./code";

/** Pedido confirmado, listo para retirar en el local. */
export interface ConfirmedOrder {
  /** Código de retiro (ver `PICKUP_CODE_PATTERN`). */
  code: string;
  vendor: Vendor;
  items: CartLine[];
  /** Total en ARS. */
  total: number;
  /** Horario estimado de retiro (`now` + tiempo de preparación del vendedor). */
  pickupAt: Date;
}

export interface ConfirmOrderOptions {
  /** Generador del código de retiro; inyectable para tests deterministas. */
  generateCode?: PickupCodeGenerator;
}

/** Se lanza al intentar confirmar un carrito sin ítems. */
export class EmptyCartError extends Error {
  constructor() {
    super("No se puede confirmar un pedido con el carrito vacío.");
    this.name = "EmptyCartError";
  }
}

/** Se lanza si el carrito pertenece a otro vendedor que el indicado. */
export class OrderVendorMismatchError extends Error {
  constructor(
    readonly cartVendorId: string | null,
    readonly vendorId: string,
  ) {
    super(`El carrito es de "${cartVendorId}" y no de "${vendorId}".`);
    this.name = "OrderVendorMismatchError";
  }
}

const MS_PER_MINUTE = 60_000;

/**
 * Confirma el pedido del carrito con el vendedor.
 *
 * @throws {EmptyCartError} si el carrito está vacío.
 * @throws {OrderVendorMismatchError} si el carrito es de otro vendedor.
 */
export function confirmOrder(
  cart: Cart,
  vendor: Vendor,
  now: Date = new Date(),
  { generateCode = generatePickupCode }: ConfirmOrderOptions = {},
): ConfirmedOrder {
  if (cart.lines.length === 0) {
    throw new EmptyCartError();
  }
  if (cart.vendorId !== vendor.id) {
    throw new OrderVendorMismatchError(cart.vendorId, vendor.id);
  }

  return {
    code: generateCode(),
    vendor,
    items: cart.lines.map((line) => ({ ...line })),
    total: cartTotal(cart),
    pickupAt: new Date(now.getTime() + vendor.prepTimeMinutes * MS_PER_MINUTE),
  };
}
