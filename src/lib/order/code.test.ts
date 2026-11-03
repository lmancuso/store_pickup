import {
  generatePickupCode,
  isValidPickupCode,
  PICKUP_CODE_ALPHABET,
  PICKUP_CODE_LENGTH,
  PICKUP_CODE_PATTERN,
} from "./code";

describe("código de retiro", () => {
  it("el alfabeto no tiene caracteres ambiguos", () => {
    for (const ch of ["0", "O", "1", "I"]) {
      expect(PICKUP_CODE_ALPHABET).not.toContain(ch);
    }
  });

  it("genera códigos de 6 caracteres alfanuméricos sin ambiguos", () => {
    for (let i = 0; i < 500; i++) {
      const code = generatePickupCode();
      expect(code).toHaveLength(PICKUP_CODE_LENGTH);
      expect(code).toMatch(PICKUP_CODE_PATTERN);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it("es determinista con una fuente de aleatoriedad inyectada", () => {
    expect(generatePickupCode(() => 0)).toBe("222222");
    expect(generatePickupCode(() => 0.999999)).toBe("ZZZZZZ");

    const values = [0, 0.25, 0.5, 0.75, 0.1, 0.9];
    let i = 0;
    const random = () => values[i++];
    expect(generatePickupCode(random)).toBe("2AJS5W");
  });

  it("isValidPickupCode valida el formato", () => {
    expect(isValidPickupCode("K7P2XR")).toBe(true);
    expect(isValidPickupCode("K7P2X")).toBe(false);
    expect(isValidPickupCode("K7P2XR9")).toBe(false);
    expect(isValidPickupCode("K0P2XR")).toBe(false);
    expect(isValidPickupCode("KIP2XR")).toBe(false);
    expect(isValidPickupCode("k7p2xr")).toBe(false);
  });
});
