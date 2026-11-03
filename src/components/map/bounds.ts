import type { LatLng } from "@/types";

/** Par `[lat, lng]` tal como lo espera Leaflet. */
export type LatLngTuple = [number, number];

/** Vendedor mínimo que necesita el mapa (compatible con `Vendor` y `VendorWithDistance`). */
export interface MapVendor {
  id: string;
  name: string;
  location: LatLng;
}

/** Puntos a encuadrar: el usuario primero y luego cada vendedor. */
export function boundsPoints(
  userLocation: LatLng,
  vendors: readonly MapVendor[],
): LatLngTuple[] {
  return [
    [userLocation.lat, userLocation.lng],
    ...vendors.map((v): LatLngTuple => [v.location.lat, v.location.lng]),
  ];
}

/**
 * Clave estable de los puntos a encuadrar. Cambia sólo si cambia la
 * ubicación del usuario o el conjunto de vendedores (por ejemplo, al cambiar
 * de categoría), así no se re-encuadra en cada render.
 */
export function boundsKey(userLocation: LatLng, vendors: readonly MapVendor[]): string {
  return boundsPoints(userLocation, vendors)
    .map(([lat, lng]) => `${lat},${lng}`)
    .concat(vendors.map((v) => v.id))
    .join("|");
}
