"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Breakpoint `md` de Tailwind: a partir de acá chat y mapa van lado a lado. */
export const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(query);
}

/**
 * `true` si el media query coincide. En el servidor (y sin `matchMedia`)
 * devuelve `false`, así el primer render es el de mobile.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = getMediaQueryList(query);
      if (!list) return () => {};
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQueryList(query)?.matches ?? false, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
