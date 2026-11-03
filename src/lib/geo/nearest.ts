import type { Category, LatLng, Vendor } from "@/types";
import { haversineKm } from "./distance";

/** Velocidad promedio de caminata usada para estimar el tiempo de llegada. */
export const WALKING_SPEED_KMH = 5;

/** Vendedor enriquecido con la distancia y los tiempos estimados desde el origen. */
export interface VendorWithDistance extends Vendor {
  /** Distancia en línea recta (haversine) desde el origen, en km. */
  distanceKm: number;
  /** Minutos caminando a {@link WALKING_SPEED_KMH}, redondeado hacia arriba. */
  walkingMinutes: number;
  /**
   * Minutos estimados hasta poder retirar el pedido.
   *
   * Criterio: el usuario sale hacia el local mientras el pedido se prepara,
   * así que el retiro es posible cuando terminan ambas cosas:
   * `max(walkingMinutes, prepTimeMinutes)`.
   */
  estimatedMinutes: number;
}

/** Minutos caminando para una distancia dada (redondeado hacia arriba). */
export function walkingMinutesFor(distanceKm: number): number {
  return Math.ceil((distanceKm / WALKING_SPEED_KMH) * 60);
}

/**
 * Vendedores abiertos de la categoría, ordenados por distancia ascendente
 * desde `origin` (desempate estable por id). Función pura: no muta `vendors`.
 */
export function findVendorsByCategory(
  vendors: readonly Vendor[],
  category: Category,
  origin: LatLng,
): VendorWithDistance[] {
  return vendors
    .filter((vendor) => vendor.isOpen && vendor.category === category)
    .map((vendor): VendorWithDistance => {
      const distanceKm = haversineKm(origin, vendor.location);
      const walkingMinutes = walkingMinutesFor(distanceKm);
      return {
        ...vendor,
        distanceKm,
        walkingMinutes,
        estimatedMinutes: Math.max(walkingMinutes, vendor.prepTimeMinutes),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
}

/** Vendedor abierto más cercano de la categoría, o `null` si no hay ninguno. */
export function findNearestVendor(
  vendors: readonly Vendor[],
  category: Category,
  origin: LatLng,
): VendorWithDistance | null {
  return findVendorsByCategory(vendors, category, origin)[0] ?? null;
}
