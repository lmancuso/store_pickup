/**
 * Formatea un timestamp ISO 8601 como hora local `HH:mm` (24 h).
 * Devuelve cadena vacía si el timestamp no es válido.
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
