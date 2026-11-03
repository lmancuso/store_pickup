"use client";

import type { ChatMessage } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  /** Si el asistente está escribiendo. */
  isTyping?: boolean;
  title?: string;
  /** Deshabilita el input (por ejemplo mientras se procesa). */
  inputDisabled?: boolean;
  className?: string;
}

/**
 * Ventana de chat presentacional: compone header, lista e input.
 * No contiene lógica de negocio; todo llega por props.
 */
export function ChatWindow({
  messages,
  onSend,
  isTyping = false,
  title = "Store Pickup",
  inputDisabled = false,
  className = "",
}: ChatWindowProps) {
  return (
    <section
      aria-label={`Chat con ${title}`}
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-100 ${className}`.trim()}
    >
      <ChatHeader title={title} isTyping={isTyping} />
      <MessageList messages={messages} isTyping={isTyping} />
      <ChatInput onSend={onSend} disabled={inputDisabled} />
    </section>
  );
}
