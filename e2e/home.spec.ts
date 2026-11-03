import { expect, test } from "@playwright/test";

test("la home muestra el título Store Pickup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Store Pickup" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
});
