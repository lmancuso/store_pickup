import { EXPECTED, FIXED_COORDS, ensureMapVisible, expect, openApp, sendMessage, test } from "./fixtures";
import type { Page, PlaywrightTestOptions } from "@playwright/test";

/**
 * Flujo principal (SCRUM-14): pedir por chat, ver el vendedor más cercano en
 * el mapa, cambiar de categoría, confirmar el pedido y verificar que el
 * historial persiste al recargar. Corre en los proyectos `mobile` y `desktop`,
 * con la geolocalización concedida (coords fijas) y denegada (ubicación por
 * defecto: Obelisco).
 */

type GeoCase = {
  title: string;
  use: Partial<PlaywrightTestOptions>;
  expected: (typeof EXPECTED)[keyof typeof EXPECTED];
  /** Origen esperado en el link "Cómo llegar" (`lat,lng` con 6 decimales). */
  origin: string;
};

const GEO_CASES: GeoCase[] = [
  {
    title: "geolocalización concedida",
    use: { geolocation: FIXED_COORDS, permissions: ["geolocation"] },
    expected: EXPECTED.granted,
    origin: "-34.610000,-58.418000",
  },
  {
    title: "geolocalización denegada (ubicación por defecto)",
    use: { permissions: [] },
    expected: EXPECTED.denied,
    origin: "-34.603700,-58.381600",
  },
];

/** Menú del vendedor dentro del chat (puede haber menús viejos en el historial). */
const menuOf = (page: Page, vendorName: string) => page.getByRole("region", { name: `Menú de ${vendorName}` }).last();

for (const geo of GEO_CASES) {
  test.describe(geo.title, () => {
    test.use(geo.use);

    test.beforeEach(async ({ page }) => {
      await openApp(page);
      await ensureMapVisible(page);
      await expect(page.getByTestId("map-marker-user")).toBeVisible();
      const notice = page.getByTestId("default-location-notice");
      if (geo.expected === EXPECTED.granted) {
        // Con permiso concedido el aviso de ubicación por defecto desaparece.
        await expect(notice).toHaveCount(0);
      } else {
        await expect(notice).toContainText("No pudimos obtener tu ubicación");
        await expect(notice).toContainText("Obelisco");
      }
    });

    test("escenario 1: pizza de muzzarella muestra el menú y resalta la pizzería más cercana", async ({
      page,
      tileRequests,
    }) => {
      const { pizza } = geo.expected;
      await sendMessage(page, "quiero una pizza de muzzarella");

      await expect(menuOf(page, pizza.name)).toBeVisible();
      await expect(menuOf(page, pizza.name).getByTestId("menu-item-add").first()).toBeEnabled();

      await expect(page.getByTestId("map-panel")).toBeVisible();
      const nearest = page.getByTestId("map-nearest-vendor");
      await expect(nearest).toHaveAttribute("data-vendor-id", pizza.id);
      await expect(nearest).toContainText(pizza.name);
      await expect(page.getByTestId("map-marker-highlighted")).toHaveCount(1);
      await expect(page.getByTestId("map-marker-highlighted")).toBeVisible();
      // Las otras pizzerías abiertas (1: "Masa Madre Palermo" está cerrada).
      await expect(page.getByTestId("map-marker-vendor")).toHaveCount(1);

      // Los tiles de OSM se interceptaron y se sirvieron localmente.
      await expect.poll(() => tileRequests.length).toBeGreaterThan(0);
    });

    test("escenario 2: escribir empanadas cambia a un vendedor de empanadas", async ({ page }) => {
      const { pizza, empanadas } = geo.expected;
      await sendMessage(page, "quiero una pizza de muzzarella");
      await expect(page.getByTestId("map-nearest-vendor")).toHaveAttribute("data-vendor-id", pizza.id);

      await sendMessage(page, "empanadas");

      await expect(menuOf(page, empanadas.name)).toBeVisible();
      await expect(menuOf(page, empanadas.name).getByTestId("menu-item-add").first()).toBeEnabled();
      // El menú anterior queda en el historial pero ya no se puede usar.
      await expect(menuOf(page, pizza.name).getByTestId("menu-item-add").first()).toBeDisabled();

      await expect(page.getByTestId("map-panel")).toBeVisible();
      const nearest = page.getByTestId("map-nearest-vendor");
      await expect(nearest).toHaveAttribute("data-vendor-id", empanadas.id);
      await expect(nearest).toContainText(empanadas.name);
      await expect(page.getByTestId("map-marker-highlighted")).toHaveCount(1);
      // Las 3 casas de empanadas están abiertas: 1 resaltada + 2 comunes.
      await expect(page.getByTestId("map-marker-vendor")).toHaveCount(2);
    });

    test("escenario 3: armar pedido, confirmar, ver código y Cómo llegar; el historial persiste al recargar", async ({
      page,
    }) => {
      const { pizza } = geo.expected;
      await sendMessage(page, "quiero una pizza de muzzarella");
      const menu = menuOf(page, pizza.name);
      await expect(menu).toBeVisible();

      // Armar el pedido desde el menú.
      await menu.getByRole("button", { name: "Agregar Pizza de muzzarella" }).click();
      const cart = page.getByTestId("cart-summary").last();
      await expect(cart).toBeVisible();
      await expect(cart.getByTestId("cart-line").filter({ hasText: "Pizza de muzzarella" })).toBeVisible();
      await expect(page.getByTestId("typing-indicator")).toBeHidden();

      // Confirmar: el primer toque pide confirmación, el segundo la cierra.
      await page.getByTestId("cart-confirm").last().click();
      await expect(page.getByRole("button", { name: "Sí, confirmar" })).toBeVisible();
      await page.getByRole("button", { name: "Sí, confirmar" }).click();

      const code = page.getByTestId("pickup-code");
      await expect(code).toBeVisible();
      await expect(code).toHaveText(/^[2-9A-HJ-NP-Z]{6}$/);
      const pickupCode = (await code.textContent())!.trim();
      await expect(page.getByTestId("pickup-vendor")).toHaveText(pizza.name);

      const directions = page.getByTestId("pickup-directions");
      await expect(directions).toBeVisible();
      await expect(directions).toContainText("Cómo llegar");
      await expect(directions).toHaveAttribute("target", "_blank");
      const href = await directions.getAttribute("href");
      expect(href).toMatch(/^https:\/\/www\.openstreetmap\.org\/directions\?/);
      expect(new URL(href!).searchParams.get("route")).toMatch(new RegExp(`^${geo.origin};`));

      // Recargar: el historial y la confirmación siguen ahí.
      await page.reload();
      await expect(page.getByTestId("chat-input")).toBeEnabled();
      await expect(page.getByTestId("message-bubble").filter({ hasText: "quiero una pizza de muzzarella" })).toBeVisible();
      await expect(menuOf(page, pizza.name)).toBeVisible();
      await expect(page.getByTestId("pickup-code")).toHaveText(pickupCode);
      await expect(page.getByTestId("pickup-directions")).toBeVisible();
    });
  });
}
