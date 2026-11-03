/**
 * Persistencia de la conversación en el navegador (RF8).
 *
 * El estado se guarda en `localStorage` dentro de un sobre versionado
 * (`{ version, state }`). Si lo guardado está corrupto, tiene otra versión o no
 * pasa la validación, se descarta y se devuelve `null`. Ninguna función lanza:
 * si `localStorage` no existe (SSR) o falla (modo privado, cuota excedida,
 * acceso bloqueado), se degrada a "sin persistencia".
 */

/** Clave de `localStorage` donde se guarda la conversación. */
export const CONVERSATION_STORAGE_KEY = "store-pickup:conversation";

/**
 * Versión del formato persistido. Subirla cuando cambie la forma del estado:
 * lo guardado con otra versión se descarta.
 */
export const CONVERSATION_STORAGE_VERSION = 1;

/** Subconjunto de la API de `Storage` que usa este módulo. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Sobre que se serializa en `localStorage`. */
export interface PersistedConversation<T> {
  version: number;
  state: T;
}

export interface StorageOptions {
  /** Storage a usar; por defecto `window.localStorage` si está disponible. */
  storage?: StorageLike | null;
  /** Clave a usar; por defecto {@link CONVERSATION_STORAGE_KEY}. */
  key?: string;
  /** Versión esperada; por defecto {@link CONVERSATION_STORAGE_VERSION}. */
  version?: number;
}

export interface LoadOptions<T> extends StorageOptions {
  /** Validación opcional del estado leído; si devuelve `false` se descarta. */
  validate?: (value: unknown) => value is T;
}

/**
 * Devuelve `window.localStorage` o `null` si no está disponible. Acceder a la
 * propiedad puede lanzar (por ejemplo `SecurityError` con cookies bloqueadas).
 */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function resolve(options: StorageOptions) {
  return {
    storage: options.storage === undefined ? getBrowserStorage() : options.storage,
    key: options.key ?? CONVERSATION_STORAGE_KEY,
    version: options.version ?? CONVERSATION_STORAGE_VERSION,
  };
}

function isEnvelope(value: unknown): value is PersistedConversation<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "state" in value &&
    typeof (value as { version: unknown }).version === "number"
  );
}

function safeRemove(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Sin persistencia disponible: no hay nada que limpiar.
  }
}

/**
 * Guarda el estado de la conversación. Devuelve `true` si se pudo guardar y
 * `false` si no hay storage o falló (cuota, acceso bloqueado, estado no
 * serializable).
 */
export function saveConversation<T>(state: T, options: StorageOptions = {}): boolean {
  const { storage, key, version } = resolve(options);
  if (!storage) return false;
  try {
    const envelope: PersistedConversation<T> = { version, state };
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee el estado guardado. Devuelve `null` si no hay nada, si no hay storage, si
 * el JSON está corrupto, si la versión no coincide o si no pasa `validate`. En
 * los casos de datos inválidos además borra la entrada para no reintentarla.
 */
export function loadConversation<T>(options: LoadOptions<T> = {}): T | null {
  const { storage, key, version } = resolve(options);
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(storage, key);
    return null;
  }

  if (!isEnvelope(parsed) || parsed.version !== version) {
    safeRemove(storage, key);
    return null;
  }

  if (options.validate && !options.validate(parsed.state)) {
    safeRemove(storage, key);
    return null;
  }

  return parsed.state as T;
}

/** Borra la conversación guardada. Nunca lanza. */
export function clearConversation(options: StorageOptions = {}): void {
  const { storage, key } = resolve(options);
  if (!storage) return;
  safeRemove(storage, key);
}
