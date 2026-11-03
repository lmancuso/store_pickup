import type { Category } from "@/types";

/** Resultado de detectar la intención/categoría de un mensaje del usuario. */
export type IntentResult =
  | { kind: "category"; category: Category }
  | { kind: "ambiguous"; candidates: Category[] }
  | { kind: "unknown" };

/**
 * Contrato para detectar la categoría pedida por el usuario.
 * Es async para poder reemplazar la implementación por reglas por un LLM
 * sin cambiar a quienes la consumen.
 */
export interface IntentDetector {
  detect(text: string): Promise<IntentResult>;
}
