"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
}

/** Lista de mensajes con scroll automático al último mensaje. */
export function MessageList({ messages, isTyping = false }: MessageListProps) {
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
        {messages.map((message) => (
          <li key={message.id}>
            <MessageBubble message={message} />
          </li>
        ))}
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
