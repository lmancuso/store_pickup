"use client";

import { cartTotal, formatARS, isCartEmpty, type Cart } from "@/lib/order";
import type { MenuItem } from "@/types";

export interface CartSummaryProps {
  cart: Cart;
  /** Se llama con el id del ítem al tocar "+". */
  onIncrement: (itemId: MenuItem["id"]) => void;
  /** Se llama con el id del ítem al tocar "−". */
  onDecrement: (itemId: MenuItem["id"]) => void;
  /** Se llama al tocar "Confirmar pedido" (solo con carrito no vacío). */
  onConfirm: () => void;
  /** Deshabilita todos los controles (p. ej. mientras se confirma). */
  disabled?: boolean;
}

const STEP_BUTTON_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-white text-base font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400";

/**
 * Resumen del carrito: ítems, cantidades con +/−, total en ARS y botón
 * "Confirmar pedido" (deshabilitado con carrito vacío). Presentacional.
 */
export function CartSummary({ cart, onIncrement, onDecrement, onConfirm, disabled = false }: CartSummaryProps) {
  const empty = isCartEmpty(cart);
  const total = cartTotal(cart);

  return (
    <section
      aria-label="Tu pedido"
      data-testid="cart-summary"
      className="w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-sm"
    >
      <h3
        className="border-b border-slate-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900"
      >
        Tu pedido
      </h3>
      {empty ? (
        <p data-testid="cart-empty" className="px-3 py-3 text-sm text-slate-500">
          Tu carrito está vacío.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {cart.lines.map(({ item, quantity }) => (
            <li key={item.id} data-testid="cart-line" className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {formatARS(item.price)} c/u ·{" "}
                  <span data-testid="cart-line-subtotal">{formatARS(item.price * quantity)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDecrement(item.id)}
                  disabled={disabled}
                  aria-label={`Quitar uno de ${item.name}`}
                  className={STEP_BUTTON_CLASS}
                >
                  −
                </button>
                <span
                  data-testid="cart-line-quantity"
                  aria-label={`Cantidad de ${item.name}`}
                  className="min-w-6 text-center text-sm font-semibold tabular-nums"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(item.id)}
                  disabled={disabled}
                  aria-label={`Agregar uno de ${item.name}`}
                  className={STEP_BUTTON_CLASS}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-sm text-slate-700">
          Total: <strong data-testid="cart-total" className="text-slate-900">{formatARS(total)}</strong>
        </p>
        <button
          type="button"
          onClick={() => {
            if (!empty && !disabled) onConfirm();
          }}
          disabled={empty || disabled}
          className="shrink-0 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Confirmar pedido
        </button>
      </footer>
    </section>
  );
}
