import type { ChatMessage } from "@/types";
import { formatTime } from "./formatTime";
import { Ticks } from "./Ticks";

export interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Burbuja de mensaje. Los mensajes del usuario (enviados) se alinean a la
 * derecha y muestran ticks de estado; los del asistente (recibidos), a la izquierda.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.author === "user";
  const time = formatTime(message.timestamp);

  return (
    <div
      data-testid="message-row"
      data-author={message.author}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        data-testid="message-bubble"
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
          isUser
            ? "message-sent rounded-br-sm bg-indigo-600 text-white"
            : "message-received rounded-bl-sm bg-white text-slate-900"
        }`}
      >
        <span className="sr-only">{isUser ? "Vos: " : "Store Pickup: "}</span>
        <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{message.text}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
            isUser ? "text-indigo-100" : "text-slate-500"
          }`}
        >
          <time dateTime={message.timestamp} suppressHydrationWarning>
            {time}
          </time>
          {isUser && <Ticks status={message.status ?? "sent"} />}
        </div>
      </div>
    </div>
  );
}
