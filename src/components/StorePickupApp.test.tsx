import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VendorMapProps } from "@/components/map";
import { DEFAULT_LOCATION, VENDORS } from "@/data";
import { findNearestVendor, findVendorsByCategory } from "@/lib/geo/nearest";
import { CONVERSATION_STORAGE_KEY } from "@/lib/storage";
import { StorePickupApp, type StorePickupAppProps } from "./StorePickupApp";

// Leaflet no corre en jsdom: un mapa falso que expone marcadores y el click.
vi.mock("@/components/map", () => ({
  VendorMap: ({ userLocation, vendors, highlightedVendorId, onPickLocation }: VendorMapProps) => (
    <div data-testid="fake-map" data-user={`${userLocation.lat},${userLocation.lng}`}>
      {vendors.map((v) => (
        <span
          key={v.id}
          data-vendor-id={v.id}
          data-testid={v.id === highlightedVendorId ? "map-marker-highlighted" : "map-marker-vendor"}
        />
      ))}
      {onPickLocation && (
        <button type="button" onClick={() => onPickLocation({ lat: -34.5889, lng: -58.4306 })}>
          elegir en el mapa
        </button>
      )}
    </div>
  ),
}));

const CODE = "K7P2QX";

function renderApp(props: StorePickupAppProps = {}) {
  return render(
    <StorePickupApp typingDelayMs={0} engineDeps={{ generateCode: () => CODE }} {...props} />,
  );
}

function send(text: string) {
  fireEvent.change(screen.getByTestId("chat-input"), { target: { value: text } });
  fireEvent.click(screen.getByTestId("chat-send"));
}

/** Espera a que el asistente termine de "escribir". */
async function settled() {
  await waitFor(() => expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument());
}

const nearestPizza = findNearestVendor(VENDORS, "pizza", DEFAULT_LOCATION)!;
const nearestEmpanadas = findNearestVendor(VENDORS, "empanadas", DEFAULT_LOCATION)!;

beforeEach(() => {
  localStorage.clear();
});

describe("StorePickupApp", () => {
  it("muestra el título, el saludo, el input y las categorías sugeridas", async () => {
    renderApp();
    expect(screen.getByRole("heading", { level: 1, name: "Store Pickup" })).toBeInTheDocument();
    expect(await screen.findByTestId("chat-input")).toBeEnabled();
    expect(screen.getAllByTestId("message-row")).toHaveLength(1);
    const replies = screen.getByTestId("quick-replies");
    expect(within(replies).getByRole("button", { name: "Pizza" })).toBeInTheDocument();
    // En mobile el mapa arranca colapsado hasta que haya categoría.
    expect(screen.queryByTestId("map-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("map-toggle")).toHaveAttribute("aria-expanded", "false");
  });

  it("muestra 'escribiendo…' brevemente antes de responder", async () => {
    renderApp({ typingDelayMs: 40 });
    send("hola");
    // El mensaje del usuario aparece enseguida, la respuesta todavía no.
    expect(screen.getAllByTestId("message-row")).toHaveLength(2);
    expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("escribiendo…");
    await settled();
    expect(screen.getAllByTestId("message-row")).toHaveLength(3);
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("en línea");
  });

  it("'quiero una pizza' muestra el menú y la pizzería más cercana resaltada; 'empanadas' cambia de vendedores", async () => {
    renderApp();
    send("quiero una pizza");
    await settled();

    const menu = screen.getByTestId("menu-card");
    expect(within(menu).getByRole("heading", { name: nearestPizza.name })).toBeInTheDocument();
    expect(screen.getByTestId("map-panel")).toBeInTheDocument();
    expect(screen.getByTestId("map-toggle")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("map-marker-highlighted")).toHaveAttribute("data-vendor-id", nearestPizza.id);
    const pizzaIds = findVendorsByCategory(VENDORS, "pizza", DEFAULT_LOCATION).map((v) => v.id);
    expect(screen.getAllByTestId(/^map-marker-/).map((m) => m.dataset.vendorId).sort()).toEqual([...pizzaIds].sort());
    expect(screen.getByTestId("map-nearest-vendor")).toHaveTextContent(nearestPizza.name);

    send("empanadas");
    await settled();
    expect(screen.getByTestId("map-marker-highlighted")).toHaveAttribute("data-vendor-id", nearestEmpanadas.id);
    const empanadaIds = findVendorsByCategory(VENDORS, "empanadas", DEFAULT_LOCATION).map((v) => v.id);
    expect(screen.getAllByTestId(/^map-marker-/).map((m) => m.dataset.vendorId).sort()).toEqual(
      [...empanadaIds].sort(),
    );
    const menus = screen.getAllByTestId("menu-card");
    const latest = menus.at(-1)!;
    expect(within(latest).getByRole("heading", { name: nearestEmpanadas.name })).toBeInTheDocument();
    // El menú anterior queda deshabilitado.
    expect(within(menus[0]).getAllByTestId("menu-item-add")[0]).toBeDisabled();
    expect(within(latest).getAllByTestId("menu-item-add")[0]).toBeEnabled();
  });

  it("completa un pedido con botones, muestra el código y persiste al recargar", async () => {
    const { unmount } = renderApp();
    send("quiero una pizza");
    await settled();

    fireEvent.click(within(screen.getByTestId("menu-card")).getAllByTestId("menu-item-add")[0]);
    await settled();
    const cart = screen.getByTestId("cart-summary");
    expect(within(cart).getAllByTestId("cart-line")).toHaveLength(1);
    expect(screen.getAllByTestId("cart-summary")).toHaveLength(1);

    fireEvent.click(screen.getByTestId("cart-confirm"));
    await settled();
    // Se pide confirmación; los chips ofrecen "Sí, confirmar".
    fireEvent.click(within(screen.getByTestId("quick-replies")).getByRole("button", { name: "Sí, confirmar" }));
    await settled();

    expect(screen.getByTestId("pickup-code")).toHaveTextContent(CODE);
    expect(screen.getByTestId("pickup-vendor")).toHaveTextContent(nearestPizza.name);
    expect(screen.getByTestId("pickup-directions")).toHaveAttribute(
      "href",
      expect.stringContaining("openstreetmap.org/directions"),
    );
    expect(screen.queryByTestId("cart-summary")).not.toBeInTheDocument();
    expect(localStorage.getItem(CONVERSATION_STORAGE_KEY)).toContain(CODE);

    const before = screen.getAllByTestId("message-row").length;
    unmount();
    renderApp();
    await waitFor(() => expect(screen.getAllByTestId("message-row")).toHaveLength(before));
    expect(screen.getByTestId("pickup-code")).toHaveTextContent(CODE);
    expect(screen.getByTestId("map-marker-highlighted")).toHaveAttribute("data-vendor-id", nearestPizza.id);
  });

  it("confirma un pedido escribiendo y quita ítems con el carrito", async () => {
    renderApp();
    send("quiero una pizza");
    await settled();
    send("agregá dos fainá");
    await settled();
    expect(screen.getByTestId("cart-line-quantity")).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: /^Quitar uno de/ }));
    await settled();
    expect(screen.getByTestId("cart-line-quantity")).toHaveTextContent("1");
    send("confirmar");
    await settled();
    send("sí");
    await settled();
    expect(screen.getByTestId("pickup-code")).toHaveTextContent(CODE);
  });

  it("el botón reiniciar vuelve al saludo y borra lo guardado", async () => {
    renderApp();
    send("quiero una pizza");
    await settled();
    expect(screen.getAllByTestId("message-row").length).toBeGreaterThan(1);

    fireEvent.click(screen.getByTestId("reset-conversation"));
    expect(screen.getAllByTestId("message-row")).toHaveLength(1);
    expect(screen.queryByTestId("menu-card")).not.toBeInTheDocument();
    expect(localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
  });

  it("reiniciar descarta una respuesta en vuelo", async () => {
    renderApp({ typingDelayMs: 30 });
    send("quiero una pizza");
    fireEvent.click(screen.getByTestId("reset-conversation"));
    await act(() => new Promise((r) => setTimeout(r, 60)));
    expect(screen.getAllByTestId("message-row")).toHaveLength(1);
    expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument();
  });

  it("avisa que usa la ubicación por defecto y permite elegirla en el mapa", async () => {
    renderApp();
    fireEvent.click(screen.getByTestId("map-toggle"));
    expect(screen.getByTestId("default-location-notice")).toHaveTextContent("ubicación");
    expect(screen.getByTestId("default-location-notice")).toHaveTextContent("Tocá el mapa");

    fireEvent.click(screen.getByRole("button", { name: "elegir en el mapa" }));
    await waitFor(() => expect(screen.queryByTestId("default-location-notice")).not.toBeInTheDocument());
    expect(screen.getByTestId("fake-map")).toHaveAttribute("data-user", "-34.5889,-58.4306");

    // El vendedor se busca desde la ubicación elegida.
    send("quiero una pizza");
    await settled();
    const expected = findNearestVendor(VENDORS, "pizza", { lat: -34.5889, lng: -58.4306 })!;
    expect(screen.getByTestId("map-marker-highlighted")).toHaveAttribute("data-vendor-id", expected.id);
  });
});
