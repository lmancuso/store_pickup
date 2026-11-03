import type { ChatMessage } from "@/types";

import {
  clearConversation,
  CONVERSATION_STORAGE_KEY,
  CONVERSATION_STORAGE_VERSION,
  getBrowserStorage,
  loadConversation,
  saveConversation,
  type StorageLike,
} from "./conversationStorage";

interface ConversationState {
  messages: ChatMessage[];
  category: string | null;
}

const state: ConversationState = {
  messages: [
    {
      id: "m1",
      author: "user",
      text: "quiero una pizza de muzzarella",
      timestamp: "2026-11-03T12:00:00.000Z",
      status: "read",
    },
    {
      id: "m2",
      author: "assistant",
      text: "¡Dale! Busco la pizzería más cercana.",
      timestamp: "2026-11-03T12:00:01.000Z",
    },
  ],
  category: "pizza",
};

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("saveConversation / loadConversation", () => {
  it("guardar y recargar devuelve el mismo estado", () => {
    expect(saveConversation(state)).toBe(true);
    expect(loadConversation<ConversationState>()).toEqual(state);
  });

  it("guarda bajo una clave versionada", () => {
    saveConversation(state);
    const raw = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    expect(JSON.parse(raw!)).toEqual({ version: CONVERSATION_STORAGE_VERSION, state });
  });

  it("devuelve null si no hay nada guardado", () => {
    expect(loadConversation()).toBeNull();
  });

  it("JSON corrupto devuelve null sin excepción y descarta la entrada", () => {
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, "{not json");
    expect(() => loadConversation()).not.toThrow();
    expect(loadConversation()).toBeNull();
    expect(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
  });

  it("un sobre sin forma válida devuelve null", () => {
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadConversation()).toBeNull();
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, "null");
    expect(loadConversation()).toBeNull();
  });

  it("versión distinta devuelve null y descarta la entrada", () => {
    window.localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify({ version: CONVERSATION_STORAGE_VERSION + 1, state }),
    );
    expect(loadConversation()).toBeNull();
    expect(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
  });

  it("respeta una versión explícita", () => {
    saveConversation(state, { version: 7 });
    expect(loadConversation()).toBeNull();
    saveConversation(state, { version: 7 });
    expect(loadConversation({ version: 7 })).toEqual(state);
  });

  it("descarta el estado que no pasa validate", () => {
    saveConversation({ foo: 1 });
    const isState = (v: unknown): v is ConversationState =>
      typeof v === "object" && v !== null && Array.isArray((v as ConversationState).messages);
    expect(loadConversation({ validate: isState })).toBeNull();
    expect(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();

    saveConversation(state);
    expect(loadConversation({ validate: isState })).toEqual(state);
  });

  it("acepta un storage inyectado y una clave propia", () => {
    const map = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
    };
    saveConversation(state, { storage, key: "otra" });
    expect(map.has("otra")).toBe(true);
    expect(window.localStorage.length).toBe(0);
    expect(loadConversation({ storage, key: "otra" })).toEqual(state);
  });
});

describe("storage no disponible", () => {
  it("localStorage que lanza no rompe", () => {
    expect(() => saveConversation(state, { storage: throwingStorage })).not.toThrow();
    expect(saveConversation(state, { storage: throwingStorage })).toBe(false);
    expect(loadConversation({ storage: throwingStorage })).toBeNull();
    expect(() => clearConversation({ storage: throwingStorage })).not.toThrow();
  });

  it("si leer window.localStorage lanza, se degrada a sin persistencia", () => {
    const getter = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    try {
      expect(getBrowserStorage()).toBeNull();
      expect(saveConversation(state)).toBe(false);
      expect(loadConversation()).toBeNull();
      expect(() => clearConversation()).not.toThrow();
    } finally {
      getter.mockRestore();
    }
  });

  it("los métodos de window.localStorage que lanzan no rompen", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(saveConversation(state)).toBe(false);
    expect(loadConversation()).toBeNull();
  });

  it("estado no serializable devuelve false sin lanzar", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(saveConversation(circular)).toBe(false);
  });

  it("storage null explícito no persiste", () => {
    expect(saveConversation(state, { storage: null })).toBe(false);
    expect(loadConversation({ storage: null })).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});

describe("clearConversation", () => {
  it("clear borra lo guardado", () => {
    saveConversation(state);
    clearConversation();
    expect(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
    expect(loadConversation()).toBeNull();
  });

  it("no toca otras claves", () => {
    window.localStorage.setItem("otra-clave", "x");
    saveConversation(state);
    clearConversation();
    expect(window.localStorage.getItem("otra-clave")).toBe("x");
  });
});
