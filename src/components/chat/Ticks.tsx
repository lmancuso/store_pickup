import type { ChatMessage } from "@/types";

type MessageStatus = NonNullable<ChatMessage["status"]>;

const LABELS: Record<MessageStatus, string> = {
  sent: "Enviado",
  read: "Leído",
};

export interface TicksProps {
  status: MessageStatus;
}

/** Ticks de estado de un mensaje del usuario: uno (enviado) o dos (leído). */
export function Ticks({ status }: TicksProps) {
  const read = status === "read";
  return (
    <span
      role="img"
      aria-label={LABELS[status]}
      data-status={status}
      className={read ? "inline-flex text-sky-300" : "inline-flex text-indigo-200"}
    >
      <svg viewBox="0 0 18 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 6.5 4.5 10 11 2" />
        {read && <path d="M7 10 7.5 10.5 14.5 2" />}
      </svg>
    </span>
  );
}
