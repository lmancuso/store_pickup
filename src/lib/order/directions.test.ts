import { DEFAULT_LOCATION } from "@/data";

import { directionsUrl } from "./directions";

describe("directionsUrl", () => {
  const vendor = { location: { lat: -34.6042, lng: -58.3866 } };

  it("apunta a OpenStreetMap con origen y destino", () => {
    const url = directionsUrl(DEFAULT_LOCATION, vendor);

    expect(url.startsWith("https://www.openstreetmap.org/directions?")).toBe(true);
    expect(url).toContain("-34.603700,-58.381600");
    expect(url).toContain("-34.604200,-58.386600");
    expect(url).toContain("route=-34.603700,-58.381600;-34.604200,-58.386600");
  });

  it("es una URL válida sin API key", () => {
    const url = new URL(directionsUrl(DEFAULT_LOCATION, vendor));
    expect(url.hostname).toBe("www.openstreetmap.org");
    expect(url.searchParams.get("route")).toBe("-34.603700,-58.381600;-34.604200,-58.386600");
    expect(url.searchParams.has("key")).toBe(false);
  });
});
