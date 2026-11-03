"use client";

import { formatARS } from "@/lib/order";
import type { MenuItem, Vendor } from "@/types";

export interface MenuCardProps {
  /** Vendedor cuyo menú se muestra. */
  vendor: Vendor;
  /** Distancia del usuario al vendedor, en kilómetros. */
  distanceKm: number;
  /** Tiempo estimado en minutos. Por defecto, `vendor.prepTimeMinutes`. */
  etaMinutes?: number;
  /** Se llama con el id del ítem al tocar "Agregar". */
  onAdd: (itemId: MenuItem["id"]) => void;
  /** Deshabilita los botones "Agregar" (p. ej. con el pedido ya confirmado). */
  disabled?: boolean;
}

const KM_FORMATTER = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formatea una distancia en km: menos de 1 km en metros redondeados a 10
 * (`"850 m"`), y desde 1 km con un decimal (`"1,2 km"`).
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.max(0, Math.round((distanceKm * 1000) / 10) * 10);
    return meters >= 1000 ? `${KM_FORMATTER.format(1)} km` : `${meters} m`;
  }
  return `${KM_FORMATTER.format(distanceKm)} km`;
}

/**
 * Tarjeta de menú dentro del chat: vendedor, distancia, tiempo estimado y
 * lista de ítems con precio y botón "Agregar". Presentacional.
 */
export function MenuCard({ vendor, distanceKm, etaMinutes, onAdd, disabled = false }: MenuCardProps) {
  const eta = etaMinutes ?? vendor.prepTimeMinutes;

  return (
    <section
      aria-label={`Menú de ${vendor.name}`}
      data-testid="menu-card"
      className="w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl rounded-bl-sm bg-white text-slate-900 shadow-sm"
    >
      <header className="border-b border-slate-200 bg-indigo-50 px-3 py-2">
        <h3 className="text-sm font-semibold leading-tight text-indigo-900 [overflow-wrap:anywhere]">
          {vendor.name}
        </h3>
        <p className="mt-0.5 text-xs text-slate-600">
          <span data-testid="menu-card-distance">a {formatDistance(distanceKm)}</span>
          <span aria-hidden="true"> · </span>
          <span data-testid="menu-card-eta">~{eta} min</span>
        </p>
      </header>
      <ul aria-label={`Ítems de ${vendor.name}`} className="divide-y divide-slate-100">
        {vendor.menu.map((item) => (
          <li key={item.id} data-testid="menu-item" className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.name}</p>
              {item.description && (
                <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">{item.description}</p>
              )}
              <p data-testid="menu-item-price" className="mt-0.5 text-sm font-semibold text-indigo-700">
                {formatARS(item.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(item.id)}
              disabled={disabled}
              aria-label={`Agregar ${item.name}`}
              data-testid="menu-item-add"
              className="shrink-0 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Agregar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
