import { render, screen, within } from "@testing-library/react";

import { formatARS, type ConfirmedOrder } from "@/lib/order";
import type { LatLng, Vendor } from "@/types";

import { formatPickupTime, PickupConfirmation } from "./PickupConfirmation";

const vendor: Vendor = {
  id: "pizzeria-test",
  name: "Pizzería Don Test",
  category: "pizza",
  address: "Av. Corrientes 1234, CABA",
  location: { lat: -34.6042, lng: -58.3866 },
  isOpen: true,
  prepTimeMinutes: 20,
  menu: [
    { id: "muzza", name: "Muzzarella", description: "Clásica", price: 12500 },
    { id: "faina", name: "Fainá", description: "Porción", price: 1800.5 },
  ],
};

const origin: LatLng = { lat: -34.6037, lng: -58.3816 };

const order: ConfirmedOrder = {
  code: "K7P2QX",
  vendor,
  items: [
    { item: vendor.menu[0], quantity: 2 },
    { item: vendor.menu[1], quantity: 1 },
  ],
  total: 26800.5,
  // 16:45 UTC = 13:45 en Buenos Aires (UTC-3).
  pickupAt: new Date("2026-11-03T16:45:00Z"),
};

describe("PickupConfirmation", () => {
  it("muestra el código de retiro destacado", () => {
    render(<PickupConfirmation order={order} origin={origin} />);
    expect(screen.getByRole("article", { name: "¡Pedido confirmado!" })).toBeInTheDocument();
    expect(screen.getByTestId("pickup-code")).toHaveTextContent("K7P2QX");
  });

  it("muestra nombre y dirección del local", () => {
    render(<PickupConfirmation order={order} origin={origin} />);
    expect(screen.getByTestId("pickup-vendor")).toHaveTextContent("Pizzería Don Test");
    expect(screen.getByTestId("pickup-address")).toHaveTextContent("Av. Corrientes 1234, CABA");
  });

  it("muestra el horario estimado en formato es-AR (24 h, hora de Buenos Aires)", () => {
    render(<PickupConfirmation order={order} origin={origin} />);
    const time = within(screen.getByTestId("pickup-time")).getByText("13:45 h");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-11-03T16:45:00.000Z");
  });

  it("respeta la zona horaria recibida por props", () => {
    render(<PickupConfirmation order={order} origin={origin} timeZone="UTC" />);
    expect(screen.getByTestId("pickup-time")).toHaveTextContent("16:45 h");
  });

  it("muestra el resumen de ítems y el total con formato ARS", () => {
    render(<PickupConfirmation order={order} origin={origin} />);
    const items = screen.getAllByTestId("pickup-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("2 × Muzzarella");
    expect(items[1]).toHaveTextContent("1 × Fainá");
    const subtotals = screen.getAllByTestId("pickup-item-subtotal").map((el) => el.textContent);
    expect(subtotals).toEqual([formatARS(25000), formatARS(1800.5)]);
    expect(screen.getByTestId("pickup-total").textContent).toBe(formatARS(26800.5));
    expect(screen.getByTestId("pickup-total").textContent).toBe("$\u00a026.800,5");
  });

  it("el link 'Cómo llegar' abre la navegación en una pestaña nueva", () => {
    render(<PickupConfirmation order={order} origin={origin} />);
    const link = screen.getByRole("link", { name: /cómo llegar/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=-34.603700,-58.381600;-34.604200,-58.386600",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")?.split(" ")).toContain("noopener");
  });
});

describe("formatPickupTime", () => {
  it("formatea en 24 h con dos dígitos", () => {
    expect(formatPickupTime(new Date("2026-11-03T12:05:00Z"))).toBe("09:05");
    expect(formatPickupTime(new Date("2026-11-03T23:30:00Z"), "UTC")).toBe("23:30");
  });
});
