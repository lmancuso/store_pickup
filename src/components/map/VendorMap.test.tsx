import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DivIcon } from "leaflet";
import { VENDORS } from "@/data";
import { findVendorsByCategory } from "@/lib/geo/nearest";
import type { LatLng } from "@/types";
import { HIGHLIGHTED_ICON_CLASS, USER_ICON_CLASS, VENDOR_ICON_CLASS } from "./icons";

type ClickHandler = (event: { latlng: LatLng }) => void;

const mapMock = vi.hoisted(() => ({
  fitBounds: vi.fn(),
  setView: vi.fn(),
  handlers: {} as { click?: ClickHandler },
}));

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  Marker: ({
    children,
    icon,
    position,
  }: {
    children: ReactNode;
    icon: DivIcon;
    position: [number, number];
  }) => (
    <div
      data-testid="marker"
      data-icon-class={icon.options.className}
      data-position={position.join(",")}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => mapMock,
  useMapEvents: (handlers: { click?: ClickHandler }) => {
    mapMock.handlers = handlers;
    return mapMock;
  },
}));

const { VendorMapClient, OSM_TILE_URL } = await import("./VendorMap");

const user: LatLng = { lat: -34.6037, lng: -58.3816 };
const pizzas = findVendorsByCategory(VENDORS, "pizza", user);
const empanadas = findVendorsByCategory(VENDORS, "empanadas", user);

function markers() {
  return screen.getAllByTestId("marker");
}

describe("VendorMapClient", () => {
  beforeEach(() => {
    mapMock.fitBounds.mockClear();
    mapMock.setView.mockClear();
    mapMock.handlers = {};
  });

  it("usa tiles de OpenStreetMap con atribución", () => {
    render(<VendorMapClient userLocation={user} vendors={pizzas} />);
    const tiles = screen.getByTestId("tile-layer");
    expect(tiles).toHaveAttribute("data-url", OSM_TILE_URL);
    expect(tiles.getAttribute("data-attribution")).toContain("OpenStreetMap");
  });

  it("renderiza el marcador del usuario y uno por vendedor, con popup de nombre", () => {
    expect(pizzas.length).toBeGreaterThan(1);
    render(<VendorMapClient userLocation={user} vendors={pizzas} />);

    const all = markers();
    expect(all).toHaveLength(pizzas.length + 1);
    expect(all.filter((m) => m.dataset.iconClass === USER_ICON_CLASS)).toHaveLength(1);
    for (const vendor of pizzas) {
      expect(screen.getByText(vendor.name)).toBeInTheDocument();
    }
  });

  it("el vendedor resaltado usa un ícono distinto", () => {
    const nearest = pizzas[0];
    render(
      <VendorMapClient userLocation={user} vendors={pizzas} highlightedVendorId={nearest.id} />,
    );

    const highlighted = markers().filter((m) => m.dataset.iconClass === HIGHLIGHTED_ICON_CLASS);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveTextContent(nearest.name);
    expect(highlighted[0]).toHaveAttribute(
      "data-position",
      `${nearest.location.lat},${nearest.location.lng}`,
    );
    expect(markers().filter((m) => m.dataset.iconClass === VENDOR_ICON_CLASS)).toHaveLength(
      pizzas.length - 1,
    );
  });

  it("encuadra usuario + vendedores y re-encuadra al cambiar los vendedores", () => {
    const { rerender } = render(<VendorMapClient userLocation={user} vendors={pizzas} />);
    expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    expect(mapMock.fitBounds.mock.calls[0][0]).toEqual([
      [user.lat, user.lng],
      ...pizzas.map((v) => [v.location.lat, v.location.lng]),
    ]);

    // Mismo contenido en un array nuevo: no re-encuadra.
    rerender(<VendorMapClient userLocation={{ ...user }} vendors={[...pizzas]} />);
    expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);

    rerender(<VendorMapClient userLocation={user} vendors={empanadas} />);
    expect(mapMock.fitBounds).toHaveBeenCalledTimes(2);
    expect(mapMock.fitBounds.mock.calls[1][0]).toEqual([
      [user.lat, user.lng],
      ...empanadas.map((v) => [v.location.lat, v.location.lng]),
    ]);
  });

  it("sin vendedores centra en el usuario", () => {
    render(<VendorMapClient userLocation={user} vendors={[]} />);
    expect(mapMock.fitBounds).not.toHaveBeenCalled();
    expect(mapMock.setView).toHaveBeenCalledWith([user.lat, user.lng], expect.any(Number));
  });

  it("click en el mapa llama a onPickLocation con la coordenada", () => {
    const onPickLocation = vi.fn();
    render(<VendorMapClient userLocation={user} vendors={pizzas} onPickLocation={onPickLocation} />);
    act(() => {
      mapMock.handlers.click?.({ latlng: { lat: -34.6, lng: -58.4 } });
    });
    expect(onPickLocation).toHaveBeenCalledWith({ lat: -34.6, lng: -58.4 });
  });

  it("click sin onPickLocation no falla", () => {
    render(<VendorMapClient userLocation={user} vendors={pizzas} />);
    expect(() => mapMock.handlers.click?.({ latlng: { lat: 0, lng: 0 } })).not.toThrow();
  });
});
