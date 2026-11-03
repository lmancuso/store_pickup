import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "./TypingIndicator";

describe("TypingIndicator", () => {
  it("es visible y anuncia 'escribiendo…' cuando corresponde", () => {
    render(<TypingIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent("Store Pickup está escribiendo…");
  });

  it("no se renderiza cuando visible es false", () => {
    render(<TypingIndicator visible={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument();
  });
});
