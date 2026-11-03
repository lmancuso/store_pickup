"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPanel } from "@/components/app/MapPanel";
import { MessageExtras } from "@/components/app/MessageExtras";
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from "@/components/app/useMediaQuery";
import { ChatWindow } from "@/components/chat";
import { DEFAULT_LOCATION, VENDORS } from "@/data";
import {
  createConversationReducer,
  createInitialState,
  isConversationState,
  quickAction,
  resolveAction,
  userMessage,
  type ConversationAction,
  type ConversationEngineDeps,
  type ConversationMessage,
  type ResolvedConversationAction,
} from "@/lib/conversation";
import { findVendorsByCategory } from "@/lib/geo/nearest";
import { useGeolocation } from "@/lib/geo/useGeolocation";
import { getIntentDetector } from "@/lib/intent";
import { usePersistentConversation, type StorageOptions } from "@/lib/storage";
import type { LatLng } from "@/types";

/** Duración por defecto del indicador "escribiendo…" antes de cada respuesta. */
export const DEFAULT_TYPING_DELAY_MS = 650;

export interface StorePickupAppProps {
  /** Duración del "escribiendo…" en ms (0 en tests). */
  typingDelayMs?: number;
  /** Dependencias del motor (detector de intención, reloj, código…); para tests. */
  engineDeps?: ConversationEngineDeps;
  /** Opciones de persistencia (storage/clave); por defecto `localStorage`. */
  storageOptions?: StorageOptions;
}

const sameLocation = (a: LatLng, b: LatLng) => a.lat === b.lat && a.lng === b.lng;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Pantalla principal: chat + motor de conversación + persistencia +
 * geolocalización + mapa + menú/carrito/confirmación. Mobile: chat a pantalla
 * completa con el mapa como panel colapsable; desktop: chat y mapa lado a lado.
 */
export function StorePickupApp({
  typingDelayMs = DEFAULT_TYPING_DELAY_MS,
  engineDeps,
  storageOptions,
}: StorePickupAppProps) {
  // El motor y el estado inicial se crean una sola vez.
  const [engine] = useState(() => {
    const { intentDetector = getIntentDetector(), ...deps } = engineDeps ?? {};
    return { reducer: createConversationReducer(deps), intentDetector, now: deps.now };
  });
  const [initialState] = useState(() => createInitialState({ now: engine.now }));
  const [state, dispatch, { hydrated, reset }] = usePersistentConversation(
    engine.reducer,
    initialState,
    { ...storageOptions, validate: isConversationState },
  );

  const geo = useGeolocation();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  // ----- Cola de acciones con "escribiendo…" -----
  // Las acciones se procesan en orden; cada respuesta espera `typingDelayMs`.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const epoch = useRef(0);
  const pendingId = useRef(0);
  const [pending, setPending] = useState<ConversationMessage[]>([]);
  const [busy, setBusy] = useState(0);

  useEffect(() => {
    const current = epoch;
    return () => {
      // Al desmontar, las acciones en vuelo ya no despachan.
      current.current += 1;
    };
  }, []);

  const enqueue = useCallback(
    (action: ConversationAction) => {
      const myEpoch = epoch.current;
      let optimistic: ConversationMessage | null = null;
      if (action.type === "userMessage") {
        pendingId.current += 1;
        optimistic = {
          id: `pending-${pendingId.current}`,
          author: "user",
          text: action.text,
          timestamp: new Date().toISOString(),
          status: "sent",
        };
        const message = optimistic;
        setPending((list) => [...list, message]);
      }
      setBusy((n) => n + 1);
      queue.current = queue.current.then(async () => {
        let resolved: ResolvedConversationAction | null = null;
        try {
          [resolved] = await Promise.all([resolveAction(action, engine.intentDetector), wait(typingDelayMs)]);
        } finally {
          // Tras un reinicio (o al desmontar) la acción se descarta.
          if (epoch.current === myEpoch) {
            if (resolved) dispatch(resolved);
            if (optimistic) {
              const done = optimistic.id;
              setPending((list) => list.filter((m) => m.id !== done));
            }
            setBusy((n) => n - 1);
          }
        }
      }).catch(() => {});
    },
    [dispatch, engine.intentDetector, typingDelayMs],
  );

  // ----- Ubicación -----
  const { lat, lng } = geo.location;
  const stateLocation = useRef(state.location);
  useEffect(() => {
    stateLocation.current = state.location;
  });
  useEffect(() => {
    if (!hydrated || geo.isDefault) return;
    const location = { lat, lng };
    if (sameLocation(location, stateLocation.current)) return;
    dispatch({ type: "setLocation", location } satisfies ResolvedConversationAction);
  }, [hydrated, geo.isDefault, lat, lng, dispatch]);

  const usingDefaultLocation = geo.isDefault && sameLocation(state.location, DEFAULT_LOCATION);
  const canPickLocation = geo.status !== "granted";

  // ----- Reinicio -----
  const handleReset = useCallback(() => {
    epoch.current += 1;
    queue.current = Promise.resolve();
    setPending([]);
    setBusy(0);
    reset();
    if (!geo.isDefault) dispatch({ type: "setLocation", location: { lat, lng } });
  }, [dispatch, geo.isDefault, lat, lng, reset]);

  // ----- Mapa -----
  const vendors = useMemo(
    () => (state.category ? findVendorsByCategory(VENDORS, state.category, state.location) : []),
    [state.category, state.location],
  );
  const nearest = state.vendor && state.vendor.category === state.category ? state.vendor : null;

  // En mobile el panel se abre solo cuando se detecta (o cambia) la categoría.
  const [mapOpen, setMapOpen] = useState(false);
  const [seenCategory, setSeenCategory] = useState(state.category);
  if (seenCategory !== state.category) {
    setSeenCategory(state.category);
    if (state.category) setMapOpen(true);
  }
  const showMap = isDesktop || mapOpen;

  // ----- Chat -----
  const messages = useMemo(() => [...state.messages, ...pending], [state.messages, pending]);
  const lastCartIndex = state.messages.findLastIndex((m) => m.attachment?.type === "cart");
  const isBusy = busy > 0;

  const renderMessageExtra = (message: ConversationMessage, index: number) => (
    <MessageExtras
      message={message}
      state={state}
      index={index}
      isLast={index === messages.length - 1}
      lastCartIndex={lastCartIndex}
      busy={isBusy}
      onAddItem={(itemId) => enqueue(quickAction({ kind: "addItem", itemId }))}
      onRemoveItem={(itemId) => enqueue(quickAction({ kind: "removeItem", itemId }))}
      onConfirm={() => enqueue(quickAction({ kind: "confirm" }))}
      onQuickReply={(text) => enqueue(userMessage(text))}
    />
  );

  return (
    <div data-testid="store-pickup-app" className="flex h-dvh w-full min-w-0 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 bg-indigo-900 px-3 py-2 text-white">
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">Store Pickup</h1>
        <button
          type="button"
          data-testid="map-toggle"
          aria-controls="map-panel"
          aria-expanded={showMap}
          onClick={() => setMapOpen((open) => !open)}
          className="shrink-0 rounded-full border border-indigo-300 px-3 py-1 text-sm font-medium hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:hidden"
        >
          {mapOpen ? "Ocultar mapa" : "Ver mapa"}
        </button>
        <button
          type="button"
          data-testid="reset-conversation"
          onClick={handleReset}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          Reiniciar
          <span className="sr-only"> conversación</span>
        </button>
      </header>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col md:order-1 md:max-w-md md:border-r md:border-slate-200 lg:max-w-lg">
          <ChatWindow<ConversationMessage>
            title="Asistente"
            messages={messages}
            onSend={(text) => enqueue(userMessage(text))}
            isTyping={isBusy}
            inputDisabled={!hydrated}
            renderMessageExtra={renderMessageExtra}
          />
        </div>
        {showMap && (
          <MapPanel
            id="map-panel"
            className="order-1 h-[40dvh] shrink-0 border-b border-slate-200 md:order-2 md:h-auto md:flex-1 md:border-b-0"
            userLocation={state.location}
            vendors={vendors}
            nearest={nearest}
            usingDefaultLocation={usingDefaultLocation}
            locating={geo.status === "pending"}
            onPickLocation={canPickLocation ? geo.setManualLocation : undefined}
          />
        )}
      </main>
    </div>
  );
}

export default StorePickupApp;
