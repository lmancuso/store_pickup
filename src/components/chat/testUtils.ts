import type { ChatMessage } from "@/types";

let counter = 0;

export function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  counter += 1;
  return {
    id: `m${counter}`,
    author: "user",
    text: `mensaje ${counter}`,
    timestamp: new Date(2026, 10, 3, 14, 7).toISOString(),
    ...overrides,
  };
}
