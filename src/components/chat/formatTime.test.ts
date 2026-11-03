import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it("formatea la hora local como HH:mm con ceros a la izquierda", () => {
    expect(formatTime(new Date(2026, 10, 3, 9, 5).toISOString())).toBe("09:05");
    expect(formatTime(new Date(2026, 10, 3, 21, 30).toISOString())).toBe("21:30");
  });

  it("devuelve cadena vacía si el timestamp es inválido", () => {
    expect(formatTime("no-es-fecha")).toBe("");
  });
});
