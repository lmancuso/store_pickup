export interface TypingIndicatorProps {
  /** Si es `false` no se renderiza nada. */
  visible?: boolean;
  /** Nombre de quien escribe, usado en el texto accesible. */
  name?: string;
}

/** Burbuja recibida con tres puntos animados: "escribiendo…". */
export function TypingIndicator({ visible = true, name = "Store Pickup" }: TypingIndicatorProps) {
  if (!visible) return null;
  return (
    <div className="flex w-full justify-start" data-testid="typing-indicator">
      <div role="status" aria-live="polite" className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-3 shadow-sm">
        <span className="sr-only">{`${name} está escribiendo…`}</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="h-2 w-2 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
