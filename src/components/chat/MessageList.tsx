"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export interface MessageListProps<M extends ChatMessage = ChatMessage> {
  messages: M[];
  isTyping?: boolean;
  /**
   * Contenido extra a renderizar debajo de la burbuja de un mensaje (por
   * ejemplo el menú o el carrito adjunto). Opcional.
   */
  renderMessageExtra?: (message: M, index: number) => ReactNode;
}

/** Lista de mensajes con scroll automático al último mensaje. */
export function MessageList<M extends ChatMessage = ChatMessage>({
  messages,
  isTyping = false,
  renderMessageExtra,
}: MessageListProps<M>) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    const end = endRef.current;
    if (end && typeof end.scrollIntoView === "function") {
      end.scrollIntoView({ block: "end" });
    }
  }, [messages.length, lastId, isTyping]);

  return (
    <div
      role="log"
      aria-label="Mensajes"
      aria-live="polite"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 px-3 py-4"
    >
      <ol className="flex flex-col gap-2">
        {messages.map((message, index) => {
          const extra = renderMessageExtra?.(message, index);
          return (
            <li key={message.id}>
              <MessageBubble message={message} />
              {extra != null && extra !== false && <div className="mt-2 flex min-w-0 flex-col gap-2">{extra}</div>}
            </li>
          );
        })}
      </ol>
      {isTyping && (
        <div className="mt-2">
          <TypingIndicator />
        </div>
      )}
      <div ref={endRef} data-testid="messages-end" />
    </div>
  );
}
