"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/types";
import { boundsKey, boundsPoints, type MapVendor } from "./bounds";
import { iconForVendor, userIcon } from "./icons";

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const DEFAULT_ZOOM = 14;
const FIT_PADDING: [number, number] = [32, 32];
const FIT_MAX_ZOOM = 16;

export interface VendorMapProps {
  /** Ubicación del usuario (real o la elegida/por defecto). */
  userLocation: LatLng;
  /** Vendedores de la categoría a mostrar. */
  vendors: readonly MapVendor[];
  /** Id del vendedor resaltado (el más cercano). */
  highlightedVendorId?: string | null;
  /** Click en el mapa: permite elegir ubicación si se denegó la geolocalización. */
  onPickLocation?: (location: LatLng) => void;
  className?: string;
}

/** Encuadra usuario + vendedores cada vez que cambian los puntos. */
function FitBounds({ userLocation, vendors }: Pick<VendorMapProps, "userLocation" | "vendors">) {
  const map = useMap();
  const key = boundsKey(userLocation, vendors);

  useEffect(() => {
    const points = boundsPoints(userLocation, vendors);
    if (points.length === 1) {
      map.setView(points[0], DEFAULT_ZOOM);
    } else {
      map.fitBounds(points, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM });
    }
    // `key` resume userLocation + vendors; evita re-encuadrar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

function PickLocation({ onPickLocation }: { onPickLocation?: (location: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPickLocation?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

/**
 * Mapa Leaflet + OpenStreetMap. Usa `window`, así que se debe cargar sólo en
 * cliente: importá `VendorMap` desde `@/components/map` (envuelto con
 * `next/dynamic` y `ssr: false`).
 */
export function VendorMapClient({
  userLocation,
  vendors,
  highlightedVendorId,
  onPickLocation,
  className = "h-full w-full",
}: VendorMapProps) {
  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className={className}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>Tu ubicación</Popup>
      </Marker>
      {vendors.map((vendor) => (
        <Marker
          key={vendor.id}
          position={[vendor.location.lat, vendor.location.lng]}
          icon={iconForVendor(vendor.id, highlightedVendorId)}
          zIndexOffset={vendor.id === highlightedVendorId ? 1000 : 0}
        >
          <Popup>{vendor.name}</Popup>
        </Marker>
      ))}
      <FitBounds userLocation={userLocation} vendors={vendors} />
      <PickLocation onPickLocation={onPickLocation} />
    </MapContainer>
  );
}

export default VendorMapClient;
