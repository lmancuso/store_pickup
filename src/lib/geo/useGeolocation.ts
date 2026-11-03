"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_LOCATION } from "@/data";
import type { LatLng } from "@/types";

/**
 * Estado de la geolocalización del navegador.
 * - `pending`: todavía no hay respuesta (también es el estado en SSR).
 * - `granted`: el navegador devolvió coordenadas.
 * - `denied`: el usuario denegó el permiso.
 * - `unavailable`: sin soporte, error de posición o timeout.
 */
export type GeolocationStatus = "pending" | "granted" | "denied" | "unavailable";

export interface UseGeolocationResult {
  /** Ubicación a usar: manual > navegador > `DEFAULT_LOCATION`. */
  location: LatLng;
  status: GeolocationStatus;
  /** `true` mientras `location` sea la ubicación por defecto. */
  isDefault: boolean;
  /** Fija una ubicación elegida por el usuario (p. ej. en el mapa). */
  setManualLocation: (location: LatLng) => void;
}

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

/** Código `PERMISSION_DENIED` de `GeolocationPositionError`. */
const PERMISSION_DENIED = 1;

type BrowserResult =
  | { status: "granted"; location: LatLng }
  | { status: "denied" | "unavailable" };

const subscribeNoop = () => () => {};
const getSupportSnapshot = () => typeof navigator !== "undefined" && navigator.geolocation != null;
/** En el servidor no se accede a `navigator`: se desconoce el soporte. */
const getServerSupportSnapshot = () => null;

/**
 * Obtiene la ubicación del usuario con `navigator.geolocation` (RF3).
 * Si no hay soporte, se deniega el permiso, hay error o timeout, usa
 * `DEFAULT_LOCATION` con `isDefault = true`. Seguro para SSR: solo accede a
 * `navigator` en el cliente.
 */
export function useGeolocation(): UseGeolocationResult {
  const supported = useSyncExternalStore(
    subscribeNoop,
    getSupportSnapshot,
    getServerSupportSnapshot,
  );
  const [browserResult, setBrowserResult] = useState<BrowserResult | null>(null);
  const [manualLocation, setManualLocationState] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (active) {
          setBrowserResult({
            status: "granted",
            location: { lat: coords.latitude, lng: coords.longitude },
          });
        }
      },
      (error) => {
        if (active) {
          setBrowserResult({
            status: error.code === PERMISSION_DENIED ? "denied" : "unavailable",
          });
        }
      },
      GEOLOCATION_OPTIONS,
    );
    return () => {
      active = false;
    };
  }, [supported]);

  const setManualLocation = useCallback((location: LatLng) => {
    setManualLocationState({ lat: location.lat, lng: location.lng });
  }, []);

  const status: GeolocationStatus =
    supported === false ? "unavailable" : (browserResult?.status ?? "pending");
  const browserLocation = browserResult?.status === "granted" ? browserResult.location : null;
  const location = manualLocation ?? browserLocation ?? DEFAULT_LOCATION;

  return {
    location,
    status,
    isDefault: manualLocation === null && browserLocation === null,
    setManualLocation,
  };
}
