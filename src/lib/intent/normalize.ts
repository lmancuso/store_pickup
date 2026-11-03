/**
 * Normaliza un texto para comparar palabras clave: minúsculas, sin tildes ni
 * diéresis, y con todo lo que no sea letra o número convertido en espacios.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
