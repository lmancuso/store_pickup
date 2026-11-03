import { CATEGORIES } from "@/types";
import { DEFAULT_LOCATION, VENDORS } from "@/data";

describe("datos mock de vendedores", () => {
  it("tiene ids de vendedores únicos", () => {
    const ids = VENDORS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tiene ids de ítems de menú únicos en todo el dataset", () => {
    const ids = VENDORS.flatMap((v) => v.menu.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa solo categorías válidas", () => {
    for (const vendor of VENDORS) {
      expect(CATEGORIES).toContain(vendor.category);
    }
  });

  it("cada vendedor tiene menú no vacío (4+ ítems) con precios > 0", () => {
    for (const vendor of VENDORS) {
      expect(vendor.menu.length).toBeGreaterThanOrEqual(4);
      for (const item of vendor.menu) {
        expect(item.price).toBeGreaterThan(0);
      }
    }
  });

  it("tiene al menos un vendedor cerrado", () => {
    expect(VENDORS.some((v) => !v.isOpen)).toBe(true);
  });

  it("tiene al menos 3 vendedores por categoría", () => {
    for (const category of CATEGORIES) {
      expect(VENDORS.filter((v) => v.category === category).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("ubica a todos los vendedores dentro de CABA (aprox.)", () => {
    for (const { location } of VENDORS) {
      expect(location.lat).toBeGreaterThan(-34.71);
      expect(location.lat).toBeLessThan(-34.52);
      expect(location.lng).toBeGreaterThan(-58.54);
      expect(location.lng).toBeLessThan(-58.33);
    }
  });

  it("exporta DEFAULT_LOCATION en el Obelisco", () => {
    expect(DEFAULT_LOCATION).toEqual({ lat: -34.6037, lng: -58.3816 });
  });
});
