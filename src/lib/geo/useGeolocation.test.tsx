import { act, renderHook, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DEFAULT_LOCATION } from "@/data";
import { GEOLOCATION_OPTIONS, useGeolocation } from "./useGeolocation";

const USER = { lat: -34.5889, lng: -58.4306 };

type SuccessCb = PositionCallback;
type ErrorCb = PositionErrorCallback;

function mockGeolocation(impl: (success: SuccessCb, error: ErrorCb) => void) {
  const getCurrentPosition = vi.fn((success: SuccessCb, error?: ErrorCb | null) =>
    impl(success, error ?? (() => {})),
  );
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition, watchPosition: vi.fn(), clearWatch: vi.fn() },
  });
  return getCurrentPosition;
}

const positionAt = ({ lat, lng }: typeof USER) =>
  ({ coords: { latitude: lat, longitude: lng }, timestamp: Date.now() }) as GeolocationPosition;

const errorWith = (code: number) =>
  ({ code, message: "error", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;

afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
});

describe("useGeolocation", () => {
  it("arranca en pending con la ubicación por defecto", () => {
    mockGeolocation(() => {});
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("pending");
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.isDefault).toBe(true);
  });

  it("éxito: status granted y coordenadas del navegador", async () => {
    const getCurrentPosition = mockGeolocation((success) => success(positionAt(USER)));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(result.current.location).toEqual(USER);
    expect(result.current.isDefault).toBe(false);
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      GEOLOCATION_OPTIONS,
    );
  });

  it("permiso denegado: status denied y ubicación por defecto", async () => {
    mockGeolocation((_, error) => error(errorWith(1)));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.isDefault).toBe(true);
  });

  it.each([
    ["posición no disponible", 2],
    ["timeout", 3],
  ])("%s: status unavailable y ubicación por defecto", async (_, code) => {
    mockGeolocation((__, error) => error(errorWith(code)));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.isDefault).toBe(true);
  });

  it("sin soporte: status unavailable y ubicación por defecto", () => {
    expect("geolocation" in navigator).toBe(false);
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("unavailable");
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.isDefault).toBe(true);
  });

  it("setManualLocation actualiza location e isDefault = false", async () => {
    mockGeolocation((_, error) => error(errorWith(1)));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("denied"));

    act(() => result.current.setManualLocation(USER));
    expect(result.current.location).toEqual(USER);
    expect(result.current.isDefault).toBe(false);
    expect(result.current.status).toBe("denied");
  });

  it("la ubicación manual tiene prioridad sobre una respuesta tardía del navegador", () => {
    let respond: SuccessCb = () => {};
    mockGeolocation((success) => {
      respond = success;
    });
    const { result } = renderHook(() => useGeolocation());
    const manual = { lat: -34.6, lng: -58.37 };

    act(() => result.current.setManualLocation(manual));
    act(() => respond(positionAt(USER)));
    expect(result.current.status).toBe("granted");
    expect(result.current.location).toEqual(manual);
    expect(result.current.isDefault).toBe(false);
  });

  it("ignora respuestas que llegan después de desmontar", () => {
    let respond: SuccessCb = () => {};
    mockGeolocation((success) => {
      respond = success;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useGeolocation());
    unmount();
    expect(() => act(() => respond(positionAt(USER)))).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("SSR: renderiza sin acceder a navigator.geolocation", () => {
    const getter = vi.fn(() => undefined);
    Object.defineProperty(navigator, "geolocation", { configurable: true, get: getter });

    function Probe() {
      const { status, isDefault, location } = useGeolocation();
      return <span>{`${status}|${isDefault}|${location.lat},${location.lng}`}</span>;
    }

    const html = renderToString(<Probe />);
    expect(html).toContain(`pending|true|${DEFAULT_LOCATION.lat},${DEFAULT_LOCATION.lng}`);
    expect(getter).not.toHaveBeenCalled();
  });
});
