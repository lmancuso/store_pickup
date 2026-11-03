import { CATEGORIES, type Category } from "@/types";
import { CATEGORY_KEYWORDS } from "./keywords";
import { normalizeText } from "./normalize";
import type { IntentDetector, IntentResult } from "./types";

type KeywordMap = Readonly<Record<Category, readonly string[]>>;

/**
 * Detector basado en reglas: busca palabras clave completas (no substrings)
 * de cada categoría en el mensaje. Si aparecen varias categorías devuelve
 * `ambiguous` con los candidatos en el orden en que aparecen en el texto.
 */
export class KeywordIntentDetector implements IntentDetector {
  private readonly keywords: ReadonlyArray<readonly [Category, readonly string[]]>;

  constructor(keywords: KeywordMap = CATEGORY_KEYWORDS) {
    this.keywords = CATEGORIES.map(
      (category) =>
        [category, keywords[category].map(normalizeText).filter(Boolean)] as const,
    );
  }

  async detect(text: string): Promise<IntentResult> {
    const padded = ` ${normalizeText(text)} `;
    const matches: { category: Category; position: number }[] = [];

    for (const [category, words] of this.keywords) {
      let position = -1;
      for (const word of words) {
        const index = padded.indexOf(` ${word} `);
        if (index !== -1 && (position === -1 || index < position)) {
          position = index;
        }
      }
      if (position !== -1) matches.push({ category, position });
    }

    if (matches.length === 0) return { kind: "unknown" };
    if (matches.length === 1) return { kind: "category", category: matches[0].category };

    matches.sort((a, b) => a.position - b.position);
    return { kind: "ambiguous", candidates: matches.map((m) => m.category) };
  }
}
