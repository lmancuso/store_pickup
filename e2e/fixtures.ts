import { test as base, expect, type Page } from "@playwright/test";

/**
 * Coordenadas fijas para la geolocalización mockeada: Almagro, a ~160 m de
 * "Pizzería Don Tano". Se eligieron lejos del Obelisco (ubicación por defecto)
 * para que el vendedor más cercano sea distinto en cada caso.
 */
export const FIXED_COORDS = { latitude: -34.61, longitude: -58.418 };

/** Vendedores esperados (calculados con haversine sobre `src/data/vendors.ts`). */
export const EXPECTED = {
  /** Desde FIXED_COORDS. */
  granted: {
    pizza: { id: "pizza-don-tano", name: "Pizzería Don Tano" }, // ~0,16 km
    empanadas: { id: "emp-la-saltenita", name: "La Salteñita del Barrio" }, // ~2,1 km
  },
  /** Desde DEFAULT_LOCATION (Obelisco). */
  denied: {
    pizza: { id: "pizza-la-esquina-del-horno", name: "La Esquina del Horno" }, // ~0,46 km
    empanadas: { id: "emp-el-repulgue", name: "El Repulgue" }, // ~1,1 km
  },
} as const;

/** PNG transparente de 1x1 para reemplazar los tiles de OpenStreetMap. */
const EMPTY_TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const OSM_TILE = /^https:\/\/([a-z]\.)?tile\.openstreetmap\.org\//;

type Fixtures = {
  /** URLs de tiles OSM interceptados (servidos localmente). */
  tileRequests: string[];
};

/**
 * `test` con la red aislada: los tiles de OSM se sirven con un PNG local y
 * cualquier otro request fuera de localhost se aborta, así los tests no
 * dependen de internet.
 */
export const test = base.extend<Fixtures>({
  tileRequests: [
    async ({ context }, use) => {
      const tiles: string[] = [];
      await context.route(
        (url) => url.hostname !== "localhost" && url.hostname !== "127.0.0.1",
        async (route) => {
          const url = route.request().url();
          if (OSM_TILE.test(url)) {
            tiles.push(url);
            await route.fulfill({ status: 200, contentType: "image/png", body: EMPTY_TILE });
          } else {
            await route.abort("blockedbyclient");
          }
        },
      );
      await use(tiles);
    },
    { auto: true },
  ],
});

export { expect };

/** Envía un mensaje por el chat y espera a que el asistente termine de "escribir". */
export async function sendMessage(page: Page, text: string) {
  await page.getByTestId("chat-input").fill(text);
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("message-bubble").filter({ hasText: text }).last()).toBeVisible();
  await expect(page.getByTestId("typing-indicator")).toBeHidden();
}

/** `true` en el proyecto mobile (viewport < breakpoint `md` de la app). */
export function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768;
}

/**
 * Deja el mapa visible: en mobile es un panel colapsable que se abre con
 * `map-toggle`; en desktop está siempre visible y el toggle oculto.
 */
export async function ensureMapVisible(page: Page) {
  const panel = page.getByTestId("map-panel");
  const toggle = page.getByTestId("map-toggle");
  if (isMobile(page)) {
    await expect(toggle).toBeVisible();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  } else {
    await expect(toggle).toBeHidden();
  }
  await expect(panel).toBeVisible();
}

/** Abre la app y espera a que el chat esté hidratado (input habilitado). */
export async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("chat-input")).toBeEnabled();
}
