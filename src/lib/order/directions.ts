import type { LatLng, Vendor } from "@/types";

const COORD_DECIMALS = 6;

function formatCoord({ lat, lng }: LatLng): string {
  return `${lat.toFixed(COORD_DECIMALS)},${lng.toFixed(COORD_DECIMALS)}`;
}

/**
 * Link de navegación (a pie) en OpenStreetMap desde `origin` hasta el local
 * del vendedor. No requiere API key.
 *
 * Ej.: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=-34.603700,-58.381600;-34.604200,-58.386600`
 */
export function directionsUrl(origin: LatLng, vendor: Pick<Vendor, "location">): string {
  const route = `${formatCoord(origin)};${formatCoord(vendor.location)}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${route}`;
}
