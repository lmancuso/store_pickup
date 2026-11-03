const ARS_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto en pesos argentinos con convenciones es-AR:
 * separador de miles ".", decimales "," y símbolo "$".
 * Ej.: `formatARS(12500)` → `"$ 12.500"`, `formatARS(1234.5)` → `"$ 1.234,5"`.
 *
 * Nota: `Intl` separa el símbolo con un espacio duro (U+00A0).
 */
export function formatARS(amount: number): string {
  return ARS_FORMATTER.format(amount);
}
