"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

export interface ChatInputProps {
  /** Se llama con el texto (sin espacios al principio ni al final) al enviar. */
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Escribí un mensaje" }: ChatInputProps) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0;

  function send() {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Enviar mensaje"
      className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2"
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Mensaje"
        data-testid="chat-input"
        autoComplete="off"
        enterKeyHint="send"
        className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Enviar"
        data-testid="chat-send"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15 12 3.4 13.9z" />
        </svg>
      </button>
    </form>
  );
}
