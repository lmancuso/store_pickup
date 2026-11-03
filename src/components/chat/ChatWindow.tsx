"use client";

import type { ReactNode } from "react";
import type { ChatMessage } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export interface ChatWindowProps<M extends ChatMessage = ChatMessage> {
  messages: M[];
  onSend: (text: string) => void;
  /** Si el asistente está escribiendo. */
  isTyping?: boolean;
  title?: string;
  /** Deshabilita el input (por ejemplo mientras se procesa). */
  inputDisabled?: boolean;
  className?: string;
  /** Contenido extra debajo de la burbuja de un mensaje (ver `MessageList`). */
  renderMessageExtra?: (message: M, index: number) => ReactNode;
}

/**
 * Ventana de chat presentacional: compone header, lista e input.
 * No contiene lógica de negocio; todo llega por props.
 */
export function ChatWindow<M extends ChatMessage = ChatMessage>({
  messages,
  onSend,
  isTyping = false,
  title = "Store Pickup",
  inputDisabled = false,
  className = "",
  renderMessageExtra,
}: ChatWindowProps<M>) {
  return (
    <section
      aria-label={`Chat con ${title}`}
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-100 ${className}`.trim()}
    >
      <ChatHeader title={title} isTyping={isTyping} />
      <MessageList messages={messages} isTyping={isTyping} renderMessageExtra={renderMessageExtra} />
      <ChatInput onSend={onSend} disabled={inputDisabled} />
    </section>
  );
}
