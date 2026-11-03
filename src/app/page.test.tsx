import { render, screen } from "@testing-library/react";
import Home from "./page";

vi.mock("@/components/map", () => ({
  VendorMap: () => <div data-testid="fake-map" />,
}));

describe("Home", () => {
  it("muestra el título Store Pickup y el chat", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Store Pickup" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Chat con Asistente" })).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });
});
