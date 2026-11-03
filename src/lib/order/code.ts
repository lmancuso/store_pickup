/**
 * Alfabeto del código de retiro: dígitos y mayúsculas sin los caracteres
 * ambiguos 0/O y 1/I (32 símbolos).
 */
export const PICKUP_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const PICKUP_CODE_LENGTH = 6;

/** Formato válido de un código de retiro. */
export const PICKUP_CODE_PATTERN = new RegExp(
  `^[${PICKUP_CODE_ALPHABET}]{${PICKUP_CODE_LENGTH}}$`,
);

/** Fuente de aleatoriedad: devuelve un número en [0, 1). */
export type RandomSource = () => number;

/** Genera un código de retiro; inyectable para tests deterministas. */
export type PickupCodeGenerator = () => string;

function defaultRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 2 ** 32;
  }
  return Math.random();
}

/**
 * Genera un código de retiro corto y legible, p. ej. `"K7P2XR"`.
 *
 * @param random fuente de aleatoriedad en [0, 1); por defecto usa
 *   `crypto.getRandomValues` (con `Math.random` como respaldo).
 */
export function generatePickupCode(random: RandomSource = defaultRandom): string {
  let code = "";
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) {
    const index = Math.min(
      Math.floor(random() * PICKUP_CODE_ALPHABET.length),
      PICKUP_CODE_ALPHABET.length - 1,
    );
    code += PICKUP_CODE_ALPHABET[Math.max(0, index)];
  }
  return code;
}

/** `true` si `code` tiene el formato de un código de retiro. */
export function isValidPickupCode(code: string): boolean {
  return PICKUP_CODE_PATTERN.test(code);
}
