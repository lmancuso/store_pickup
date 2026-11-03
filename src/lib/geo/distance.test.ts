import { haversineKm } from "./distance";

const OBELISCO = { lat: -34.6037, lng: -58.3816 };
const CASA_ROSADA = { lat: -34.6083, lng: -58.3712 };

describe("haversineKm", () => {
  it("calcula Obelisco–Casa Rosada (~1,082 km) con tolerancia de ±1 %", () => {
    // Referencia independiente: geodésica WGS84 (Vincenty) = 1,0818 km.
    const expected = 1.0818;
    const actual = haversineKm(OBELISCO, CASA_ROSADA);
    expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(0.01);
  });

  it("devuelve 0 para el mismo punto", () => {
    expect(haversineKm(OBELISCO, OBELISCO)).toBe(0);
    expect(haversineKm(OBELISCO, { ...OBELISCO })).toBe(0);
  });

  it("es simétrica", () => {
    expect(haversineKm(OBELISCO, CASA_ROSADA)).toBeCloseTo(haversineKm(CASA_ROSADA, OBELISCO), 10);
  });

  it("devuelve un valor finito para puntos antipodales", () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeCloseTo(Math.PI * 6371.0088, 3);
  });
});
