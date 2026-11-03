import { describe, expect, it } from "vitest";
import { boundsKey, boundsPoints, type MapVendor } from "./bounds";

const user = { lat: -34.6, lng: -58.38 };
const a: MapVendor = { id: "a", name: "A", location: { lat: -34.61, lng: -58.39 } };
const b: MapVendor = { id: "b", name: "B", location: { lat: -34.62, lng: -58.4 } };

describe("bounds", () => {
  it("boundsPoints incluye usuario y vendedores", () => {
    expect(boundsPoints(user, [a, b])).toEqual([
      [-34.6, -58.38],
      [-34.61, -58.39],
      [-34.62, -58.4],
    ]);
  });

  it("boundsKey es estable para el mismo contenido y cambia con vendedores o usuario", () => {
    expect(boundsKey({ ...user }, [{ ...a }])).toBe(boundsKey(user, [a]));
    expect(boundsKey(user, [a])).not.toBe(boundsKey(user, [b]));
    expect(boundsKey(user, [a])).not.toBe(boundsKey(user, [a, b]));
    expect(boundsKey(user, [a])).not.toBe(boundsKey({ lat: 0, lng: 0 }, [a]));
  });
});
