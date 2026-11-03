import { fireEvent, render, screen } from "@testing-library/react";
import { addItem, createCart, formatARS, type Cart } from "@/lib/order";
import type { MenuItem } from "@/types";
import { CartSummary } from "./CartSummary";

const muzza: MenuItem = { id: "i1", name: "Muzzarella", description: "", price: 12500 };
const faina: MenuItem = { id: "i2", name: "Fainá", description: "", price: 1800 };

function cartWithItems(): Cart {
  let cart = createCart();
  cart = addItem(cart, "v1", muzza);
  cart = addItem(cart, "v1", muzza);
  cart = addItem(cart, "v1", faina);
  return cart;
}

function setup(cart: Cart, disabled = false) {
  const handlers = { onIncrement: vi.fn(), onDecrement: vi.fn(), onConfirm: vi.fn() };
  render(<CartSummary cart={cart} {...handlers} disabled={disabled} />);
  return handlers;
}

describe("CartSummary", () => {
  it("muestra ítems, cantidades y el total correcto en ARS", () => {
    setup(cartWithItems());
    expect(screen.getAllByTestId("cart-line")).toHaveLength(2);
    const quantities = screen.getAllByTestId("cart-line-quantity").map((el) => el.textContent);
    expect(quantities).toEqual(["2", "1"]);
    expect(screen.getByTestId("cart-total").textContent).toBe(formatARS(12500 * 2 + 1800));
    expect(screen.getByTestId("cart-total").textContent).toBe("$\u00a026.800");
  });

  it("+ y − llaman a los callbacks con el id del ítem", () => {
    const { onIncrement, onDecrement } = setup(cartWithItems());
    fireEvent.click(screen.getByRole("button", { name: "Agregar uno de Fainá" }));
    expect(onIncrement).toHaveBeenCalledWith("i2");
    fireEvent.click(screen.getByRole("button", { name: "Quitar uno de Muzzarella" }));
    expect(onDecrement).toHaveBeenCalledWith("i1");
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it("Confirmar pedido llama a onConfirm con carrito no vacío", () => {
    const { onConfirm } = setup(cartWithItems());
    const button = screen.getByRole("button", { name: "Confirmar pedido" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("con carrito vacío muestra total $0 y Confirmar deshabilitado", () => {
    const { onConfirm } = setup(createCart());
    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
    expect(screen.queryAllByTestId("cart-line")).toHaveLength(0);
    expect(screen.getByTestId("cart-total").textContent).toBe(formatARS(0));
    const button = screen.getByRole("button", { name: "Confirmar pedido" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disabled deshabilita todos los controles", () => {
    const { onConfirm } = setup(cartWithItems(), true);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
