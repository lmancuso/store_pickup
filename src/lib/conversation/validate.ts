import { CONVERSATION_PHASES, type ConversationState } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLatLng(value: unknown): boolean {
  return isObject(value) && typeof value.lat === "number" && typeof value.lng === "number";
}

/**
 * Validación liviana de un estado restaurado (por ejemplo desde
 * `localStorage`). Pensada para `loadConversation({ validate })`.
 */
export function isConversationState(value: unknown): value is ConversationState {
  if (!isObject(value)) return false;
  return (
    value.version === 1 &&
    typeof value.phase === "string" &&
    (CONVERSATION_PHASES as readonly string[]).includes(value.phase) &&
    Array.isArray(value.messages) &&
    value.messages.every(
      (m) => isObject(m) && typeof m.id === "string" && typeof m.text === "string",
    ) &&
    isLatLng(value.location) &&
    Array.isArray(value.candidates) &&
    isObject(value.cart) &&
    Array.isArray(value.cart.lines) &&
    (value.vendor === null || (isObject(value.vendor) && Array.isArray(value.vendor.menu))) &&
    typeof value.nextMessageId === "number"
  );
}
