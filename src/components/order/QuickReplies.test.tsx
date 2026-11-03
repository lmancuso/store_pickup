import { fireEvent, render, screen } from "@testing-library/react";
import { QuickReplies } from "./QuickReplies";

const options = ["Ver menú", "Confirmar pedido", "Cancelar"];

describe("QuickReplies", () => {
  it("muestra un chip por opción", () => {
    render(<QuickReplies options={options} onSelect={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Respuestas rápidas" })).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(options);
  });

  it("llama al callback con la opción elegida", () => {
    const onSelect = vi.fn();
    render(<QuickReplies options={options} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Confirmar pedido");
  });

  it("no llama al callback si está deshabilitado", () => {
    const onSelect = vi.fn();
    render(<QuickReplies options={options} onSelect={onSelect} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("no renderiza nada sin opciones", () => {
    const { container } = render(<QuickReplies options={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
