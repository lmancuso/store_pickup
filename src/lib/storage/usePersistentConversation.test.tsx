import { act, render, renderHook, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import {
  CONVERSATION_STORAGE_KEY,
  loadConversation,
  saveConversation,
} from "./conversationStorage";
import { usePersistentConversation } from "./usePersistentConversation";

interface State {
  messages: string[];
}

type Action = { type: "add"; text: string } | { type: "noop" };

const initialState: State = { messages: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { messages: [...state.messages, action.text] };
    case "noop":
      return state;
  }
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("usePersistentConversation", () => {
  it("sin nada guardado arranca con initialState y queda hidratado", () => {
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    expect(result.current[0]).toEqual(initialState);
    expect(result.current[2].hydrated).toBe(true);
  });

  it("hidrata desde localStorage después de montar", () => {
    saveConversation<State>({ messages: ["hola"] });
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    expect(result.current[0]).toEqual({ messages: ["hola"] });
  });

  it("guarda en cada cambio y sobrevive a una 'recarga'", () => {
    const first = renderHook(() => usePersistentConversation(reducer, initialState));
    act(() => first.result.current[1]({ type: "add", text: "quiero pizza" }));
    expect(loadConversation<State>()).toEqual({ messages: ["quiero pizza"] });
    act(() => first.result.current[1]({ type: "add", text: "de muzza" }));
    expect(loadConversation<State>()).toEqual({ messages: ["quiero pizza", "de muzza"] });
    first.unmount();

    const second = renderHook(() => usePersistentConversation(reducer, initialState));
    expect(second.result.current[0]).toEqual({ messages: ["quiero pizza", "de muzza"] });
  });

  it("no pisa lo guardado con initialState antes de hidratar", () => {
    saveConversation<State>({ messages: ["previo"] });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderHook(() => usePersistentConversation(reducer, initialState));
    for (const [, value] of setItem.mock.calls) {
      expect(JSON.parse(value).state).toEqual({ messages: ["previo"] });
    }
    expect(loadConversation<State>()).toEqual({ messages: ["previo"] });
  });

  it("el render del servidor usa initialState (sin mismatch de hidratación)", () => {
    saveConversation<State>({ messages: ["guardado"] });

    function Chat() {
      const [state, , { hydrated }] = usePersistentConversation(reducer, initialState);
      return (
<p data-testid="out">{`${hydrated ? "h" : "s"}:${state.messages.join(",")}`}</p>
      );
    }

    const html = renderToString(<Chat />);
    expect(html).toContain("s:");
    expect(html).not.toContain("guardado");

    render(<Chat />);
    expect(screen.getByTestId("out")).toHaveTextContent("h:guardado");
  });

  it("descarta lo guardado si está corrupto", () => {
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, "{roto");
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    expect(result.current[0]).toEqual(initialState);
  });

  it("funciona en memoria si localStorage lanza", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    act(() => result.current[1]({ type: "add", text: "hola" }));
    expect(result.current[0]).toEqual({ messages: ["hola"] });
  });

  it("reset borra lo guardado y vuelve a initialState", () => {
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    act(() => result.current[1]({ type: "add", text: "hola" }));
    act(() => result.current[2].reset());
    expect(result.current[0]).toEqual(initialState);
    expect(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();

    act(() => result.current[1]({ type: "add", text: "de nuevo" }));
    expect(loadConversation<State>()).toEqual({ messages: ["de nuevo"] });
  });

  it("reset sin cambios previos no bloquea el siguiente guardado", () => {
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    act(() => result.current[2].reset());
    act(() => result.current[2].reset());
    act(() => result.current[1]({ type: "add", text: "hola" }));
    expect(loadConversation<State>()).toEqual({ messages: ["hola"] });
  });

  it("dispatch es estable entre renders", () => {
    const { result } = renderHook(() => usePersistentConversation(reducer, initialState));
    const dispatch = result.current[1];
    act(() => dispatch({ type: "add", text: "x" }));
    expect(result.current[1]).toBe(dispatch);
  });
});
