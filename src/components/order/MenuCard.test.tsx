import { fireEvent, render, screen, within } from "@testing-library/react";
import { formatARS } from "@/lib/order";
import type { Vendor } from "@/types";
import { formatDistance, MenuCard } from "./MenuCard";

const vendor: Vendor = {
  id: "v1",
  name: "Pizzería de Prueba",
  category: "pizza",
  address: "Calle Falsa 123",
  location: { lat: -34.6, lng: -58.4 },
  isOpen: true,
  prepTimeMinutes: 20,
  menu: [
    { id: "i1", name: "Muzzarella", description: "Grande", price: 12500 },
    { id: "i2", name: "Napolitana", description: "Con tomate", price: 14200 },
    { id: "i3", name: "Fainá", description: "", price: 1800 },
  ],
};

describe("MenuCard", () => {
  it("muestra nombre del vendedor, distancia y tiempo estimado", () => {
    render(<MenuCard vendor={vendor} distanceKm={1.234} onAdd={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Pizzería de Prueba" })).toBeInTheDocument();
    expect(screen.getByTestId("menu-card-distance")).toHaveTextContent("a 1,2 km");
    expect(screen.getByTestId("menu-card-eta")).toHaveTextContent("~20 min");
  });

  it("usa etaMinutes si se pasa", () => {
    render(<MenuCard vendor={vendor} distanceKm={0.5} etaMinutes={35} onAdd={vi.fn()} />);
    expect(screen.getByTestId("menu-card-eta")).toHaveTextContent("~35 min");
  });

  it("lista todos los ítems con su precio formateado en ARS", () => {
    render(<MenuCard vendor={vendor} distanceKm={1} onAdd={vi.fn()} />);
    const items = screen.getAllByTestId("menu-item");
    expect(items).toHaveLength(vendor.menu.length);
    vendor.menu.forEach((menuItem, index) => {
      const row = within(items[index]);
      expect(row.getByText(menuItem.name)).toBeInTheDocument();
      expect(row.getByTestId("menu-item-price").textContent).toBe(formatARS(menuItem.price));
    });
    expect(within(items[0]).getByTestId("menu-item-price").textContent).toBe("$\u00a012.500");
  });

  it("'Agregar' llama al callback con el id del ítem", () => {
    const onAdd = vi.fn();
    render(<MenuCard vendor={vendor} distanceKm={1} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Napolitana" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("i2");
    expect(screen.getAllByRole("button", { name: /^Agregar / })).toHaveLength(3);
  });

  it("no llama al callback si está deshabilitado", () => {
    const onAdd = vi.fn();
    render(<MenuCard vendor={vendor} distanceKm={1} onAdd={onAdd} disabled />);
    const button = screen.getByRole("button", { name: "Agregar Muzzarella" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe("formatDistance", () => {
  it("formatea metros por debajo de 1 km y km con un decimal", () => {
    expect(formatDistance(0.853)).toBe("850 m");
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(0.998)).toBe("1,0 km");
    expect(formatDistance(1)).toBe("1,0 km");
    expect(formatDistance(12.36)).toBe("12,4 km");
  });
});
