import L from "leaflet";

/**
 * Íconos propios con `L.divIcon` + SVG inline: no dependen de las rutas de
 * imágenes por defecto de Leaflet (que se rompen con bundlers).
 */

export const USER_ICON_CLASS = "vendor-map-icon vendor-map-icon--user";
export const VENDOR_ICON_CLASS = "vendor-map-icon vendor-map-icon--vendor";
export const HIGHLIGHTED_ICON_CLASS = "vendor-map-icon vendor-map-icon--highlighted";

function pinSvg(fill: string, size: number, testId: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" data-testid="${testId}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path fill="${fill}" stroke="#ffffff" stroke-width="1.5" d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 13.5 7.5 13.5S19.5 14.6 19.5 9A7.5 7.5 0 0 0 12 1.5z"/>` +
    `<circle cx="12" cy="9" r="2.8" fill="#ffffff"/>` +
    `</svg>`
  );
}

const VENDOR_SIZE = 32;
const HIGHLIGHTED_SIZE = 46;
const USER_SIZE = 20;

export const userIcon: L.DivIcon = L.divIcon({
  className: USER_ICON_CLASS,
  html:
    `<svg xmlns="http://www.w3.org/2000/svg" data-testid="map-marker-user" width="${USER_SIZE}" height="${USER_SIZE}" viewBox="0 0 20 20" aria-hidden="true">` +
    `<circle cx="10" cy="10" r="8" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>` +
    `</svg>`,
  iconSize: [USER_SIZE, USER_SIZE],
  iconAnchor: [USER_SIZE / 2, USER_SIZE / 2],
  popupAnchor: [0, -USER_SIZE / 2],
});

export const vendorIcon: L.DivIcon = L.divIcon({
  className: VENDOR_ICON_CLASS,
  html: pinSvg("#64748b", VENDOR_SIZE, "map-marker-vendor"),
  iconSize: [VENDOR_SIZE, VENDOR_SIZE],
  iconAnchor: [VENDOR_SIZE / 2, VENDOR_SIZE],
  popupAnchor: [0, -VENDOR_SIZE],
});

/** Ícono del vendedor más cercano: más grande y de otro color. */
export const highlightedVendorIcon: L.DivIcon = L.divIcon({
  className: HIGHLIGHTED_ICON_CLASS,
  html: pinSvg("#dc2626", HIGHLIGHTED_SIZE, "map-marker-highlighted"),
  iconSize: [HIGHLIGHTED_SIZE, HIGHLIGHTED_SIZE],
  iconAnchor: [HIGHLIGHTED_SIZE / 2, HIGHLIGHTED_SIZE],
  popupAnchor: [0, -HIGHLIGHTED_SIZE],
});

export function iconForVendor(vendorId: string, highlightedVendorId?: string | null): L.DivIcon {
  return vendorId === highlightedVendorId ? highlightedVendorIcon : vendorIcon;
}
