import type { LatLng } from "@/types";

/** Radio medio de la Tierra en kilómetros (IUGG). */
export const EARTH_RADIUS_KM = 6371.0088;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Distancia ortodrómica (fórmula de haversine) entre dos puntos, en km.
 * Asume una Tierra esférica: el error frente al elipsoide WGS84 es < 0,5 %,
 * más que suficiente para distancias urbanas. Función pura.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  // Math.min evita NaN por errores de redondeo cuando h supera levemente 1.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
