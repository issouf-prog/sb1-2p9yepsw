import { test, expect, login, credits, startFromPrompt, askAgent, addFromPlus, projectUrl } from "./helpers";

test.describe("F03 personnage et F07 voix / musique", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Une boulangère livre du pain à l'aube");
  });

  test("F07-H1 musique et voix off par l'agent, placées dans le montage", async ({ page }) => {
    await askAgent(page, "Ajoute une musique douce au piano");
    await expect(page.getByText(/Voici la musique/)).toBeVisible();
    await askAgent(page, "Voix off : « Chaque matin, elle part avant le soleil. »");
    await expect(page.getByText(/Voici la voix off/)).toBeVisible();
    expect(await credits(page)).toBe(164 - 8 - 8);
    await page.goto(projectUrl(page) + "?view=editor");
    await expect(page.locator("button[title*='double-clic pour retirer']")).toHaveCount(2);
  });

  test("F07-H2 voix manuelle avec choix de la voix", async ({ page }) => {
    await addFromPlus(page, "Générer une voix");
    await page.locator("form select").nth(1).selectOption("victor");
    await page.getByRole("combobox", { name: /Réplique/ }).fill("Il y a toujours du pain.");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.getByLabel(/^Écouter /)).toHaveCount(1);
    await expect(page.locator(".react-flow")).toContainText("Victor");
  });

  test("F03-H1 fiche personnage puis personnage dans une scène (plan Créateur)", async ({ page }) => {
    await askAgent(page, "Crée la fiche de mon personnage principal : une boulangère, écharpe rouge");
    await expect(page.getByText("La fiche est prête")).toBeVisible();
    await page.getByRole("group", { name: /Fiche — / }).last().click();
    await page.getByRole("menuitem", { name: "Personnage de référence" }).click();
    await page.getByRole("button", { name: /Passer au plan supérieur/ }).click();
    await page.waitForURL(/\/pricing/);
    await page.getByRole("button", { name: "Choisir Créateur" }).click();
    await page.waitForURL(/\/p\//);
    await page.getByRole("group", { name: /^Personnage dans une scène/ }).last().click();
    await page.getByRole("combobox", { name: /Prompt du plan/ }).fill("Elle traverse le pont dans la brume");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("Elle traverse le pont dans la brume");
  });
});
