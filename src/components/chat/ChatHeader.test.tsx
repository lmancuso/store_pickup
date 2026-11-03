import { render, screen } from "@testing-library/react";
import { ChatHeader } from "./ChatHeader";

describe("ChatHeader", () => {
  it("muestra avatar genérico, el nombre Store Pickup y estado 'en línea'", () => {
    render(<ChatHeader />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Store Pickup" })).toBeInTheDocument();
    expect(screen.getByTestId("chat-avatar")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("en línea");
  });

  it("muestra 'escribiendo…' cuando el asistente está escribiendo", () => {
    render(<ChatHeader isTyping />);
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("escribiendo…");
  });
});
