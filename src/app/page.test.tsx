import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("muestra el título Store Pickup", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Store Pickup" })).toBeInTheDocument();
  });
});
