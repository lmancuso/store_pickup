/**
 * Shell estático mientras se renderiza la app (el estado inicial usa la hora
 * actual, que no se puede prerenderizar con Cache Components).
 */
export function AppFallback() {
  return (
    <div data-testid="app-fallback" className="flex h-dvh w-full min-w-0 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center bg-indigo-900 px-3 py-2 text-white">
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">Store Pickup</h1>
      </header>
      <main className="flex flex-1 items-center justify-center bg-slate-100 p-6 text-sm text-slate-500">
        <p role="status">Cargando el chat…</p>
      </main>
    </div>
  );
}
