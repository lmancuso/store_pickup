import { KeywordIntentDetector } from "./keyword-intent-detector";
import type { IntentDetector } from "./types";

export type { IntentDetector, IntentResult } from "./types";
export { KeywordIntentDetector } from "./keyword-intent-detector";
export { CATEGORY_KEYWORDS } from "./keywords";
export { normalizeText } from "./normalize";

let detector: IntentDetector | undefined;

/**
 * Devuelve el detector de intención que usa la app. La UI depende solo de la
 * interfaz `IntentDetector`, así que cambiar a otra implementación (por
 * ejemplo un LLM) se hace únicamente acá.
 */
export function getIntentDetector(): IntentDetector {
  detector ??= new KeywordIntentDetector();
  return detector;
}
