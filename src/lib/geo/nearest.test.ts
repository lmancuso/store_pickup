import { VENDORS } from "@/data";
import type { Vendor } from "@/types";
import { findNearestVendor, findVendorsByCategory, walkingMinutesFor } from "./nearest";

const ORIGIN = { lat: -34.6037, lng: -58.3816 };

const vendor = (overrides: Partial<Vendor> & Pick<Vendor, "id">): Vendor => ({
  name: overrides.id,
  category: "pizza",
  address: "Calle Falsa 123",
  location: ORIGIN,
  isOpen: true,
  prepTimeMinutes: 15,
  menu: [],
  ...overrides,
});

const FIXTURE: Vendor[] = [
  vendor({ id: "lejos", location: { lat: -34.62, lng: -58.40 } }),
  vendor({ id: "cerca", location: { lat: -34.6045, lng: -58.3825 } }),
  vendor({ id: "cerrado-mas-cerca", location: ORIGIN, isOpen: false }),
  vendor({ id: "medio", location: { lat: -34.61, lng: -58.39 } }),
  vendor({ id: "sushi", category: "sushi", location: ORIGIN }),
];

describe("findVendorsByCategory", () => {
  it("excluye vendedores cerrados y de otras categorías", () => {
    const ids = findVendorsByCategory(FIXTURE, "pizza", ORIGIN).map((v) => v.id);
    expect(ids).not.toContain("cerrado-mas-cerca");
    expect(ids).not.toContain("sushi");
    expect(ids).toHaveLength(3);
  });

  it("ordena en forma ascendente por distancia", () => {
    const result = findVendorsByCategory(FIXTURE, "pizza", ORIGIN);
    expect(result.map((v) => v.id)).toEqual(["cerca", "medio", "lejos"]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanceKm).toBeGreaterThanOrEqual(result[i - 1].distanceKm);
    }
  });

  it("agrega distanceKm, walkingMinutes y estimatedMinutes = max(caminata, preparación)", () => {
    for (const v of findVendorsByCategory(FIXTURE, "pizza", ORIGIN)) {
      expect(v.distanceKm).toBeGreaterThan(0);
      expect(v.walkingMinutes).toBe(walkingMinutesFor(v.distanceKm));
      expect(v.estimatedMinutes).toBe(Math.max(v.walkingMinutes, v.prepTimeMinutes));
    }
  });

  it("devuelve distancia 0 y tiempo = preparación si el vendedor está en el origen", () => {
    const [v] = findVendorsByCategory(FIXTURE, "sushi", ORIGIN);
    expect(v.distanceKm).toBe(0);
    expect(v.walkingMinutes).toBe(0);
    expect(v.estimatedMinutes).toBe(15);
  });

  it("es pura: no muta el array de entrada", () => {
    const copy = structuredClone(FIXTURE);
    findVendorsByCategory(FIXTURE, "pizza", ORIGIN);
    expect(FIXTURE).toEqual(copy);
  });

  it("funciona con los datos mock: solo abiertos de la categoría", () => {
    const result = findVendorsByCategory(VENDORS, "pizza", ORIGIN);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((v) => v.isOpen && v.category === "pizza")).toBe(true);
  });
});

describe("walkingMinutesFor", () => {
  it("usa 5 km/h y redondea hacia arriba", () => {
    expect(walkingMinutesFor(0)).toBe(0);
    expect(walkingMinutesFor(1)).toBe(12);
    expect(walkingMinutesFor(1.01)).toBe(13);
  });
});

describe("findNearestVendor", () => {
  it("devuelve el vendedor abierto más cercano", () => {
    expect(findNearestVendor(FIXTURE, "pizza", ORIGIN)?.id).toBe("cerca");
  });

  it("devuelve null si no hay vendedores abiertos de la categoría", () => {
    const allClosed = FIXTURE.map((v) => ({ ...v, isOpen: false }));
    expect(findNearestVendor(allClosed, "pizza", ORIGIN)).toBeNull();
    expect(findNearestVendor(FIXTURE, "helado", ORIGIN)).toBeNull();
    expect(findNearestVendor([], "pizza", ORIGIN)).toBeNull();
  });
});
