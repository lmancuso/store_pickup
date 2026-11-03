"use client";

export interface QuickRepliesProps {
  /** Opciones a mostrar como chips. */
  options: readonly string[];
  /** Se llama con la opción elegida. */
  onSelect: (option: string) => void;
  disabled?: boolean;
  /** Nombre accesible del grupo. */
  label?: string;
}

/** Chips de respuestas rápidas debajo de un mensaje. Presentacional. */
export function QuickReplies({ options, onSelect, disabled = false, label = "Respuestas rápidas" }: QuickRepliesProps) {
  if (options.length === 0) return null;

  return (
    <div role="group" aria-label={label} data-testid="quick-replies" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="max-w-full rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition-colors [overflow-wrap:anywhere] hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
