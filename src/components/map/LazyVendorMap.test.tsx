import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./VendorMap", () => ({
  default: () => <div data-testid="vendor-map-client" />,
}));

import { VendorMap } from "./index";

describe("VendorMap (lazy)", () => {
  it("carga el mapa sólo en cliente", async () => {
    render(<VendorMap userLocation={{ lat: 0, lng: 0 }} vendors={[]} />);
    expect(await screen.findByTestId("vendor-map-client")).toBeInTheDocument();
  });
});
