"use client";

import dynamic from "next/dynamic";
import type { VendorMapProps } from "./VendorMap";

/** `VendorMap` cargado sólo en cliente (Leaflet accede a `window`). */
export const VendorMap = dynamic<VendorMapProps>(() => import("./VendorMap"), {
  ssr: false,
  loading: () => (
    <div
      data-testid="vendor-map-loading"
      className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500"
    >
      Cargando mapa…
    </div>
  ),
});
