import { fireEvent, render, screen, within } from "@testing-library/react";
import { ChatWindow } from "./ChatWindow";
import { makeMessage } from "./testUtils";

describe("ChatWindow", () => {
  it("compone header, lista e input y delega el envío en onSend", () => {
    const onSend = vi.fn();
    const messages = [
      makeMessage({ author: "assistant", text: "¡Hola! ¿Qué te gustaría pedir?" }),
      makeMessage({ author: "user", text: "pizza", status: "read" }),
    ];
    render(<ChatWindow messages={messages} onSend={onSend} />);

    expect(screen.getByRole("region", { name: "Chat con Store Pickup" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Store Pickup" })).toBeInTheDocument();
    expect(within(screen.getByRole("log")).getAllByRole("listitem")).toHaveLength(2);

    const input = screen.getByRole("textbox", { name: "Mensaje" });
    fireEvent.change(input, { target: { value: "empanadas" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("empanadas");
  });

  it("refleja isTyping en el header y en la lista", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} isTyping />);
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("escribiendo…");
    expect(screen.getByRole("status")).toHaveTextContent("está escribiendo…");
  });

  it("sin isTyping muestra 'en línea' y no el indicador", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} />);
    expect(screen.getByTestId("chat-presence")).toHaveTextContent("en línea");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
