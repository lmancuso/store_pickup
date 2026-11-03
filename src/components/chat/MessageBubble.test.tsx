import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";
import { makeMessage } from "./testUtils";

describe("MessageBubble", () => {
  it("alinea la burbuja enviada a la derecha y la recibida a la izquierda, con clases distintas", () => {
    const { rerender } = render(<MessageBubble message={makeMessage({ author: "user" })} />);
    const sentRow = screen.getByTestId("message-row");
    const sentBubble = screen.getByTestId("message-bubble");
    expect(sentRow).toHaveAttribute("data-author", "user");
    expect(sentRow).toHaveClass("justify-end");
    expect(sentBubble).toHaveClass("message-sent");
    const sentClass = sentBubble.className;

    rerender(<MessageBubble message={makeMessage({ author: "assistant" })} />);
    const receivedRow = screen.getByTestId("message-row");
    const receivedBubble = screen.getByTestId("message-bubble");
    expect(receivedRow).toHaveAttribute("data-author", "assistant");
    expect(receivedRow).toHaveClass("justify-start");
    expect(receivedRow).not.toHaveClass("justify-end");
    expect(receivedBubble).toHaveClass("message-received");
    expect(receivedBubble.className).not.toBe(sentClass);
  });

  it("muestra el texto y la hora en formato HH:mm", () => {
    const timestamp = new Date(2026, 10, 3, 8, 4).toISOString();
    render(<MessageBubble message={makeMessage({ text: "quiero una pizza", timestamp })} />);
    expect(screen.getByText("quiero una pizza")).toBeInTheDocument();
    const time = screen.getByText("08:04");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", timestamp);
  });

  it("muestra un tick de enviado en mensajes del usuario", () => {
    render(<MessageBubble message={makeMessage({ author: "user", status: "sent" })} />);
    expect(screen.getByRole("img", { name: "Enviado" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Leído" })).not.toBeInTheDocument();
  });

  it("muestra ticks de leído en mensajes del usuario leídos", () => {
    render(<MessageBubble message={makeMessage({ author: "user", status: "read" })} />);
    expect(screen.getByRole("img", { name: "Leído" })).toBeInTheDocument();
  });

  it("usa 'enviado' por defecto si el mensaje del usuario no tiene status", () => {
    render(<MessageBubble message={makeMessage({ author: "user", status: undefined })} />);
    expect(screen.getByRole("img", { name: "Enviado" })).toBeInTheDocument();
  });

  it("no muestra ticks en mensajes del asistente", () => {
    render(<MessageBubble message={makeMessage({ author: "assistant", status: "read" })} />);
    expect(screen.queryByRole("img", { name: /enviado|leído/i })).not.toBeInTheDocument();
  });
});
