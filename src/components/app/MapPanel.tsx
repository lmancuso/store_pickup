"use client";

import { VendorMap, type MapVendor } from "@/components/map";
import type { VendorWithDistance } from "@/lib/geo/nearest";
import type { LatLng } from "@/types";

export interface MapPanelProps {
  id?: string;
  userLocation: LatLng;
  vendors: readonly MapVendor[];
  /** Vendedor propuesto (el más cercano), resaltado en el mapa. */
  nearest: VendorWithDistance | null;
  /** `true` si se está usando la ubicación por defecto. */
  usingDefaultLocation: boolean;
  /** Todavía se está esperando la respuesta de la geolocalización. */
  locating: boolean;
  /** Si está definido, tocar el mapa elige la ubicación del usuario. */
  onPickLocation?: (location: LatLng) => void;
  className?: string;
}

/** Panel del mapa: aviso de ubicación, vendedor resaltado y el mapa Leaflet. */
export function MapPanel({
  id,
  userLocation,
  vendors,
  nearest,
  usingDefaultLocation,
  locating,
  onPickLocation,
  className = "",
}: MapPanelProps) {
  return (
    <section
      id={id}
      aria-label="Mapa de locales"
      data-testid="map-panel"
      className={`flex min-h-0 min-w-0 flex-col bg-white ${className}`.trim()}
    >
      {usingDefaultLocation && (
        <p
          role="status"
          data-testid="default-location-notice"
          className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          {locating
            ? "Mientras obtenemos tu ubicación usamos una por defecto (Obelisco, CABA)."
            : "No pudimos obtener tu ubicación: usamos una por defecto (Obelisco, CABA)."}{" "}
          {onPickLocation && "Tocá el mapa para elegir dónde estás."}
        </p>
      )}
      {nearest ? (
        <p
          data-testid="map-nearest-vendor"
          data-vendor-id={nearest.id}
          className="shrink-0 truncate border-b border-slate-200 px-3 py-2 text-xs text-slate-700"
        >
          <span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600" />
          Más cercano: <strong className="text-slate-900">{nearest.name}</strong>
        </p>
      ) : (
        <p data-testid="map-placeholder" className="shrink-0 border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
          Contame qué querés comer y te muestro los locales cercanos.
        </p>
      )}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <VendorMap
            userLocation={userLocation}
            vendors={vendors}
            highlightedVendorId={nearest?.id ?? null}
            onPickLocation={onPickLocation}
          />
        </div>
      </div>
    </section>
  );
}
