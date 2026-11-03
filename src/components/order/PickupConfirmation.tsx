import { directionsUrl, formatARS, type ConfirmedOrder } from "@/lib/order";
import type { LatLng } from "@/types";

/** Zona horaria por defecto: el MVP opera en Argentina. */
export const PICKUP_TIME_ZONE = "America/Argentina/Buenos_Aires";

/**
 * Formatea la hora estimada de retiro en es-AR (24 h, `HH:mm`).
 * Se fija la zona horaria para que el render sea igual en servidor y cliente.
 */
export function formatPickupTime(date: Date, timeZone: string = PICKUP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}

export interface PickupConfirmationProps {
  /** Pedido confirmado (resultado de `confirmOrder`). */
  order: ConfirmedOrder;
  /** Ubicación del usuario, origen de la ruta de "Cómo llegar". */
  origin: LatLng;
  /** Zona horaria para mostrar el horario de retiro (por defecto, Buenos Aires). */
  timeZone?: string;
}

/**
 * Tarjeta de confirmación de retiro (RF7): código destacado, local, dirección,
 * horario estimado, resumen y total del pedido y link "Cómo llegar".
 * Es presentacional: recibe la orden confirmada por props.
 */
export function PickupConfirmation({
  order,
  origin,
  timeZone = PICKUP_TIME_ZONE,
}: PickupConfirmationProps) {
  const { code, vendor, items, total, pickupAt } = order;
  const pickupTime = formatPickupTime(pickupAt, timeZone);
  const titleId = `pickup-confirmation-title-${code}`;

  return (
    <article
      aria-labelledby={titleId}
      data-testid="pickup-confirmation"
      className="w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
    >
      <header className="rounded-t-2xl bg-indigo-700 px-4 py-3 text-white">
        <h3 id={titleId} className="text-base font-semibold leading-tight">
          ¡Pedido confirmado!
        </h3>
        <p className="text-xs text-indigo-100">Mostrá este código al retirar.</p>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-xl bg-indigo-50 px-3 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
            Código de retiro
          </p>
          <p
            data-testid="pickup-code"
            className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-indigo-800 [overflow-wrap:anywhere]"
          >
            {code}
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Local</dt>
            <dd data-testid="pickup-vendor" className="font-medium [overflow-wrap:anywhere]">
              {vendor.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Dirección</dt>
            <dd data-testid="pickup-address" className="[overflow-wrap:anywhere]">
              {vendor.address}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Retiro estimado</dt>
            <dd data-testid="pickup-time">
              <time dateTime={pickupAt.toISOString()}>{pickupTime} h</time>
            </dd>
          </div>
        </dl>

        <section aria-label="Resumen del pedido" className="border-t border-slate-200 pt-3">
          <ul className="space-y-1 text-sm">
            {items.map(({ item, quantity }) => (
              <li key={item.id} data-testid="pickup-item" className="flex justify-between gap-3">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {quantity} × {item.name}
                </span>
                <span
                  data-testid="pickup-item-subtotal"
                  className="shrink-0 tabular-nums text-slate-700"
                >
                  {formatARS(item.price * quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span data-testid="pickup-total" className="tabular-nums">
              {formatARS(total)}
            </span>
          </p>
        </section>

        <a
          href={directionsUrl(origin, vendor)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="pickup-directions"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          Cómo llegar
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
    </article>
  );
}
