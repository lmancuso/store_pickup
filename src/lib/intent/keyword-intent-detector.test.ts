import { KeywordIntentDetector, getIntentDetector, normalizeText } from "@/lib/intent";

const detector = new KeywordIntentDetector();

describe("KeywordIntentDetector", () => {
  it("detecta pizza en 'quiero una pizza de muzzarella'", async () => {
    await expect(detector.detect("quiero una pizza de muzzarella")).resolves.toEqual({
      kind: "category",
      category: "pizza",
    });
  });

  it("detecta empanadas en mayúsculas", async () => {
    await expect(detector.detect("EMPANADAS de carne")).resolves.toEqual({
      kind: "category",
      category: "empanadas",
    });
  });

  it.each(["helado", "HELADO", "heládo", "Heladería", "un cucurucho de dulce de leche"])(
    "detecta helado en %j (sin importar tildes ni mayúsculas)",
    async (text) => {
      await expect(detector.detect(text)).resolves.toEqual({
        kind: "category",
        category: "helado",
      });
    },
  );

  it.each([
    ["una muzza grande", "pizza"],
    ["media fugazzeta", "pizza"],
    ["una empanada", "empanadas"],
    ["una burger doble", "hamburguesas"],
    ["Hamburguesa con cheddar", "hamburguesas"],
    ["12 rolls de salmón", "sushi"],
    ["Sushi!", "sushi"],
  ] as const)("detecta sinónimos: %j -> %s", async (text, category) => {
    await expect(detector.detect(text)).resolves.toEqual({ kind: "category", category });
  });

  it("devuelve ambiguous con los candidatos si hay varias categorías", async () => {
    await expect(detector.detect("pizza o sushi")).resolves.toEqual({
      kind: "ambiguous",
      candidates: ["pizza", "sushi"],
    });
  });

  it("ordena los candidatos según aparecen en el mensaje", async () => {
    await expect(detector.detect("helado o empanadas")).resolves.toEqual({
      kind: "ambiguous",
      candidates: ["helado", "empanadas"],
    });
  });

  it("no repite una categoría mencionada con varios sinónimos", async () => {
    await expect(detector.detect("pizza de muzza o fugazzeta")).resolves.toEqual({
      kind: "category",
      category: "pizza",
    });
  });

  it.each(["hola", "", "   ", "quiero comer algo rico"])(
    "devuelve unknown para %j",
    async (text) => {
      await expect(detector.detect(text)).resolves.toEqual({ kind: "unknown" });
    },
  );

  it("solo matchea palabras completas, no substrings", async () => {
    await expect(detector.detect("sushiman")).resolves.toEqual({ kind: "unknown" });
    await expect(detector.detect("enrollado")).resolves.toEqual({ kind: "unknown" });
  });

  it("acepta un diccionario de palabras clave propio", async () => {
    const custom = new KeywordIntentDetector({
      pizza: ["pizza"],
      empanadas: [],
      hamburguesas: [],
      sushi: [],
      helado: ["Gelato"],
    });
    await expect(custom.detect("un gelato")).resolves.toEqual({
      kind: "category",
      category: "helado",
    });
  });
});

describe("normalizeText", () => {
  it("pasa a minúsculas, quita tildes y signos", () => {
    expect(normalizeText("¡Quiero HELÁDO, ya!")).toBe("quiero helado ya");
  });
});

describe("getIntentDetector", () => {
  it("devuelve un IntentDetector reutilizable", async () => {
    const instance = getIntentDetector();
    expect(instance).toBe(getIntentDetector());
    await expect(instance.detect("pizza")).resolves.toEqual({
      kind: "category",
      category: "pizza",
    });
  });
});
