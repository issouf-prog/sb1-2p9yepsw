import { test, expect, login, startFromPrompt } from "./helpers";

test.describe("Largeur mobile et clavier", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("MOB-H1 390 px : pas de défilement horizontal, onglets Toile / Agent", async ({ page }) => {
    await login(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await startFromPrompt(page, "Une petite fille apprend à voler");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole("tab", { name: "Agent" }).click();
    await expect(page.getByText("J'ai créé la section")).toBeVisible();
  });

  test("KEY-H1 clavier seul : du champ de prompt jusqu'au projet", async ({ page }) => {
    await login(page);
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.id === "prompt");
    }
    expect(reached).toBe(true);
    await page.keyboard.type("Au clavier seulement");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/p\//);
  });
});
