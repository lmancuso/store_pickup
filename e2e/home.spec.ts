import { expect, test } from "@playwright/test";

test("la home muestra el título Store Pickup y el chat, sin scroll horizontal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Store Pickup" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.getByTestId("chat-input")).toBeEnabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
