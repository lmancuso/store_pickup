import { useCallback, useEffect, useReducer, useRef, type Dispatch, type Reducer } from "react";

import {
  clearConversation,
  loadConversation,
  saveConversation,
  type LoadOptions,
} from "./conversationStorage";

export type UsePersistentConversationOptions<S> = LoadOptions<S>;

export interface PersistentConversationControls {
  /**
   * `true` una vez que se intentó leer el estado guardado en el cliente. Antes
   * de eso el estado es `initialState` (igual que en el render del servidor).
   */
  hydrated: boolean;
  /** Borra lo guardado y vuelve a `initialState`. */
  reset: () => void;
}

interface Internal<S> {
  state: S;
  hydrated: boolean;
}

type InternalAction<S, A> =
  | { kind: "action"; action: A }
  | { kind: "hydrate"; state: S | null }
  | { kind: "reset"; state: S };

/**
 * `useReducer` con persistencia en `localStorage` (RF8).
 *
 * - El primer render (servidor y cliente) usa `initialState`, así no hay
 *   mismatch de hidratación; el estado guardado se aplica en un efecto tras
 *   montar.
 * - Cada cambio de estado posterior a la hidratación se guarda.
 * - Si no hay storage o lo guardado es inválido, sigue funcionando en memoria.
 */
export function usePersistentConversation<S, A>(
  reducer: Reducer<S, A>,
  initialState: S,
  options: UsePersistentConversationOptions<S> = {},
): [S, Dispatch<A>, PersistentConversationControls] {
  const internalReducer = useCallback(
    (current: Internal<S>, action: InternalAction<S, A>): Internal<S> => {
      switch (action.kind) {
        case "action": {
          const next = reducer(current.state, action.action);
          return next === current.state ? current : { ...current, state: next };
        }
        case "hydrate":
          return { state: action.state ?? current.state, hydrated: true };
        case "reset":
          return { state: action.state, hydrated: true };
      }
    },
    [reducer],
  );

  const [internal, internalDispatch] = useReducer(internalReducer, {
    state: initialState,
    hydrated: false,
  });

  // Las opciones se leen en efectos; se guardan en un ref para no re-ejecutarlos.
  const optionsRef = useRef(options);
  const initialStateRef = useRef(initialState);
  useEffect(() => {
    optionsRef.current = options;
    initialStateRef.current = initialState;
  });

  // Tras un reset no se vuelve a guardar `initialState` (lo guardado ya se
  // borró) hasta que el estado cambie de nuevo.
  const clearedState = useRef<{ state: S } | null>(null);

  useEffect(() => {
    internalDispatch({ kind: "hydrate", state: loadConversation<S>(optionsRef.current) });
  }, []);

  useEffect(() => {
    if (!internal.hydrated) return;
    if (clearedState.current) {
      if (clearedState.current.state === internal.state) return;
      clearedState.current = null;
    }
    saveConversation(internal.state, optionsRef.current);
  }, [internal.hydrated, internal.state]);

  const dispatch = useCallback<Dispatch<A>>(
    (action) => internalDispatch({ kind: "action", action }),
    [],
  );

  const reset = useCallback(() => {
    clearConversation(optionsRef.current);
    clearedState.current = { state: initialStateRef.current };
    internalDispatch({ kind: "reset", state: initialStateRef.current });
  }, []);

  return [internal.state, dispatch, { hydrated: internal.hydrated, reset }];
}
