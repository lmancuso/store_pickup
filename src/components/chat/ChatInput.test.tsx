import { fireEvent, render, screen } from "@testing-library/react";
import { ChatInput } from "./ChatInput";

function setup() {
  const onSend = vi.fn();
  render(<ChatInput onSend={onSend} />);
  const input = screen.getByRole("textbox", { name: "Mensaje" }) as HTMLInputElement;
  const button = screen.getByRole("button", { name: "Enviar" });
  return { onSend, input, button };
}

describe("ChatInput", () => {
  it("llama onSend con el texto al hacer click en enviar y limpia el input", () => {
    const { onSend, input, button } = setup();
    fireEvent.change(input, { target: { value: "quiero empanadas" } });
    fireEvent.click(button);
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("quiero empanadas");
    expect(input.value).toBe("");
  });

  it("envía con Enter y limpia el input", () => {
    const { onSend, input } = setup();
    fireEvent.change(input, { target: { value: "  una muzza  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("una muzza");
    expect(input.value).toBe("");
  });

  it("no llama onSend con texto vacío", () => {
    const { onSend, input, button } = setup();
    expect(button).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.submit(button.closest("form")!);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("no llama onSend con texto de solo espacios", () => {
    const { onSend, input, button } = setup();
    fireEvent.change(input, { target: { value: "    " } });
    expect(button).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.submit(button.closest("form")!);
    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("    ");
  });

  it("no envía si está deshabilitado", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled />);
    const input = screen.getByRole("textbox", { name: "Mensaje" });
    fireEvent.change(input, { target: { value: "hola" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });
});
