import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { VENDORS } from "@/data";

import { matchMenuItem, parseOrderCommand, parseQuantity } from "./parse";

const menuOf = (id: string) => VENDORS.find((v) => v.id === id)!.menu;
const horno = menuOf("pizza-la-esquina-del-horno");
const repulgue = menuOf("emp-el-repulgue");

describe("parseQuantity", () => {
  it.each([
    ["agregá una muzza", 1],
    ["dos fugazzetas", 2],
    ["3 napolitanas", 3],
    ["poneme doce", 12],
    ["fainá", 1],
    ["500 fainá", 20],
  ])("%s → %d", (text, expected) => {
    expect(parseQuantity(text)).toBe(expected);
  });
});

describe("matchMenuItem", () => {
  it("reconoce ítems por palabra, plural, prefijo y sin tildes", () => {
    expect(matchMenuItem("una muzzarella", horno)).toMatchObject({ kind: "item", item: { id: "pizza-horno-muzza" } });
    expect(matchMenuItem("muzza", horno)).toMatchObject({ kind: "item", item: { id: "pizza-horno-muzza" } });
    expect(matchMenuItem("dos fainas", horno)).toMatchObject({ kind: "item", item: { id: "pizza-horno-faina" } });
    expect(matchMenuItem("Fugazzeta", horno)).toMatchObject({ kind: "item", item: { id: "pizza-horno-fugazzeta" } });
    expect(matchMenuItem("una de humita", repulgue)).toMatchObject({ kind: "item", item: { id: "emp-repulgue-humita" } });
    expect(matchMenuItem("jamón y queso", repulgue)).toMatchObject({ kind: "item", item: { id: "emp-repulgue-jyq" } });
  });

  it("si dos ítems empatan, devuelve las opciones", () => {
    const menu = [
      { id: "a", name: "Roll de salmón", description: "", price: 1 },
      { id: "b", name: "Nigiri de salmón", description: "", price: 1 },
    ];
    expect(matchMenuItem("uno de salmón", menu)).toEqual({ kind: "ambiguous", options: menu });
    expect(parseOrderCommand("agregá salmón", menu)).toEqual({ kind: "ambiguousItem", options: menu });
  });

  it("una palabra genérica no elige un ítem", () => {
    expect(matchMenuItem("una pizza", horno)).toBeNull();
    expect(matchMenuItem("hola", horno)).toBeNull();
  });
});

describe("parseOrderCommand", () => {
  it("agregar varios ítems en un mensaje", () => {
    expect(parseOrderCommand("agregá 2 muzzarellas y una fainá", horno)).toEqual({
      kind: "add",
      items: [
        { item: expect.objectContaining({ id: "pizza-horno-muzza" }), quantity: 2 },
        { item: expect.objectContaining({ id: "pizza-horno-faina" }), quantity: 1 },
      ],
    });
  });

  it("no duplica un ítem cuyo nombre lleva 'y'", () => {
    expect(parseOrderCommand("agregá una de jamón y queso", repulgue)).toEqual({
      kind: "add",
      items: [{ item: expect.objectContaining({ id: "emp-repulgue-jyq" }), quantity: 1 }],
    });
  });

  it("quitar, confirmar, total, menú y ayuda", () => {
    expect(parseOrderCommand("sacá la napolitana", horno)).toMatchObject({ kind: "remove" });
    expect(parseOrderCommand("listo, eso es todo", horno)).toEqual({ kind: "confirm" });
    expect(parseOrderCommand("ver total", horno)).toEqual({ kind: "showCart" });
    expect(parseOrderCommand("mostrame el menú", horno)).toEqual({ kind: "showMenu" });
    expect(parseOrderCommand("qué lindo día", horno)).toEqual({ kind: "none" });
  });

  it("sí/no solo cuando se espera confirmación", () => {
    expect(parseOrderCommand("sí", horno, true)).toEqual({ kind: "yes" });
    expect(parseOrderCommand("no, esperá", horno, true)).toEqual({ kind: "no" });
    expect(parseOrderCommand("sí", horno, false)).toEqual({ kind: "none" });
  });
});

describe("src/lib/conversation", () => {
  it("es lógica pura: no importa React ni componentes de UI", () => {
    const dir = join(process.cwd(), "src/lib/conversation");
    const files = readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f));
    for (const file of files) {
      expect(file.endsWith(".tsx"), file).toBe(false);
      const source = readFileSync(join(dir, file), "utf8");
      expect(source, file).not.toMatch(/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/);
      expect(source, file).not.toMatch(/from\s+["']@\/(components|app)(\/[^"']*)?["']/);
    }
  });
});
