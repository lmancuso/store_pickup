export type Category = "pizza" | "empanadas" | "hamburguesas" | "sushi" | "helado";

export const CATEGORIES: readonly Category[] = [
  "pizza",
  "empanadas",
  "hamburguesas",
  "sushi",
  "helado",
] as const;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** Precio en pesos argentinos (ARS). */
  price: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: Category;
  address: string;
  location: LatLng;
  isOpen: boolean;
  prepTimeMinutes: number;
  menu: MenuItem[];
}

export interface ChatMessage {
  id: string;
  author: "user" | "assistant";
  text: string;
  /** Fecha/hora en formato ISO 8601. */
  timestamp: string;
  status?: "sent" | "read";
}
