import { formatARS } from "./format";

/** Intl usa espacio duro (U+00A0) entre el símbolo y el número. */
const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatARS", () => {
  it("usa separador de miles '.' y símbolo $", () => {
    expect(normalize(formatARS(12500))).toBe("$ 12.500");
    expect(normalize(formatARS(1234567))).toBe("$ 1.234.567");
  });

  it("usa ',' como separador decimal", () => {
    expect(normalize(formatARS(1234.5))).toBe("$ 1.234,5");
    expect(normalize(formatARS(99.99))).toBe("$ 99,99");
  });

  it("formatea cero", () => {
    expect(normalize(formatARS(0))).toBe("$ 0");
  });

  it("coincide con Intl es-AR en ARS", () => {
    const expected = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(45600);
    expect(formatARS(45600)).toBe(expected);
  });
});
