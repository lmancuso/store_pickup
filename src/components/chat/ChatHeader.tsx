export interface ChatHeaderProps {
  /** Nombre visible del contacto. */
  title?: string;
  /** Si es `true` muestra "escribiendo…" en lugar de "en línea". */
  isTyping?: boolean;
}

export function ChatHeader({ title = "Store Pickup", isTyping = false }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 bg-indigo-700 px-4 py-3 text-white shadow-sm">
      <div
        aria-hidden="true"
        data-testid="chat-avatar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-indigo-800"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
        </svg>
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold leading-tight">{title}</h2>
        <p data-testid="chat-presence" className="truncate text-xs text-indigo-100">
          {isTyping ? "escribiendo…" : "en línea"}
        </p>
      </div>
    </header>
  );
}
