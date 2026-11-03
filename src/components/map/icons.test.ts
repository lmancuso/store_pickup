import { describe, expect, it } from "vitest";
import {
  highlightedVendorIcon,
  iconForVendor,
  userIcon,
  vendorIcon,
} from "./icons";

describe("icons", () => {
  it("usa divIcon con SVG inline (sin rutas de imágenes de Leaflet)", () => {
    for (const icon of [userIcon, vendorIcon, highlightedVendorIcon]) {
      expect(icon.options.html).toContain("<svg");
      expect((icon.options as { iconUrl?: string }).iconUrl).toBeUndefined();
    }
  });

  it("el resaltado es más grande y de otro color", () => {
    const [w, h] = highlightedVendorIcon.options.iconSize as [number, number];
    const [vw, vh] = vendorIcon.options.iconSize as [number, number];
    expect(w).toBeGreaterThan(vw);
    expect(h).toBeGreaterThan(vh);
    expect(highlightedVendorIcon.options.html).not.toEqual(vendorIcon.options.html);
    expect(highlightedVendorIcon.options.className).not.toEqual(vendorIcon.options.className);
  });

  it("iconForVendor elige el ícono resaltado sólo para el id indicado", () => {
    expect(iconForVendor("a", "a")).toBe(highlightedVendorIcon);
    expect(iconForVendor("b", "a")).toBe(vendorIcon);
    expect(iconForVendor("b", null)).toBe(vendorIcon);
    expect(iconForVendor("b")).toBe(vendorIcon);
  });
});
