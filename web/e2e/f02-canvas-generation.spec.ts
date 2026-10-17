import { test, expect, expectAccessible, login, credits, startFromPrompt, mediaNodes, addFromPlus, deselectAll } from "./helpers";

test.describe("F02 générer sur la toile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Un détective sous un réverbère");
  });

  test("F02-H1 image manuelle : Auto par défaut, coût affiché, débit", async ({ page }) => {
    const c = await credits(page);
    await addFromPlus(page, "Générer une image");
    await expect(page.locator("form select").first()).toHaveValue("auto");
    await expectAccessible(page, "panneau de génération");
    await page.getByRole("combobox", { name: /Prompt du plan/ }).fill("Gros plan sur le chapeau mouillé");
    await expect(page.getByRole("button", { name: /^Lancer/ })).toContainText("8");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("Gros plan sur le chapeau mouillé");
    await expect.poll(() => credits(page)).toBe(c - 8);
  });

  test("F02-N1 modèle réservé : cadenas et renvoi aux tarifs", async ({ page }) => {
    await addFromPlus(page, "Générer une image");
    await page.locator("form select").first().selectOption("img-pro");
    await page.getByRole("button", { name: /Passer au plan supérieur/ }).click();
    await page.waitForURL(/\/pricing/);
  });

  test("F02-N2 prompt interdit : nœud signalé, aucun débit", async ({ page }) => {
    const c = await credits(page);
    await addFromPlus(page, "Générer une image");
    await page.getByRole("combobox", { name: /Prompt du plan/ }).fill("un homme décapité");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("Demande refusée");
    expect(await credits(page)).toBe(c);
  });

  test("F02-N3 échec de génération : crédits rendus", async ({ page }) => {
    const c = await credits(page);
    await addFromPlus(page, "Générer une image");
    await page.getByRole("combobox", { name: /Prompt du plan/ }).fill("une image qui finit en échec");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("Vos crédits ont été rendus");
    await expect.poll(() => credits(page)).toBe(c);
  });

  test("F02-E1 @ propose les plans et relie la référence", async ({ page }) => {
    await addFromPlus(page, "Générer une image");
    const ta = page.getByRole("combobox", { name: /Prompt du plan/ });
    await ta.pressSequentially("même lumière que @Plan");
    await expect(page.getByRole("listbox", { name: "Plans à citer" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(ta).toHaveValue(/@Plan_large /);
    const edges = await page.locator(".react-flow__edge").count();
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect.poll(() => page.locator(".react-flow__edge").count()).toBeGreaterThan(edges);
  });

  test("F02-H2 modifier une image", async ({ page }) => {
    await page.getByRole("group", { name: /^Plan large/ }).first().click();
    await page.getByRole("menuitem", { name: "Modifier l'image" }).click();
    await page.getByRole("combobox", { name: /Modification/ }).fill("ajoute de la pluie");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("ajoute de la pluie");
  });

  test("F04-H1 animer une image en 10 s coûte le double", async ({ page }) => {
    await page.getByRole("group", { name: /^Plan rapproché/ }).first().click();
    await page.getByRole("menuitem", { name: "Animer cette image" }).click();
    await page.getByLabel("Durée").selectOption("10");
    await expect(page.getByRole("button", { name: /^Lancer/ })).toContainText("240");
    await deselectAll(page);
  });

  test("CANVAS-H1 copier-coller, section, archiver et restaurer", async ({ page }) => {
    const n = await mediaNodes(page).count();
    await page.getByRole("group", { name: /^Plan large/ }).first().click();
    await page.keyboard.press("Control+c");
    await page.keyboard.press("Control+v");
    await expect(mediaNodes(page)).toHaveCount(n + 1);
    await page.getByRole("group", { name: /Plan large \(copie\)/ }).click();
    await page.keyboard.press("s");
    await expect(page.locator(".react-flow__node-section")).toHaveCount(2);
    await page.getByRole("button", { name: "Archiver (retirer de la toile)" }).first().click();
    await expect(mediaNodes(page)).toHaveCount(n);
    await page.getByRole("button", { name: "Ressources", exact: true }).click();
    await expectAccessible(page, "panneau ressources");
    await page.getByRole("button", { name: /^Archivés 1/ }).click();
    await page.getByRole("button", { name: /^Restaurer/ }).click();
    await expect(mediaNodes(page)).toHaveCount(n + 1);
  });

  test("CANVAS-H2 importer une image et un son", async ({ page }) => {
    const { FIXTURES } = await import("./helpers");
    await page.setInputFiles("input[aria-label='Importer des fichiers']", [`${FIXTURES}/photo-plage.png`, `${FIXTURES}/ambiance.wav`]);
    await expect(page.getByText("2 fichiers importés.")).toBeVisible();
    await expect(page.getByRole("group", { name: /^photo-plage/ })).toBeVisible();
    await expect(page.getByRole("group", { name: /^ambiance/ })).toBeVisible();
  });

  test("CANVAS-N1 fichier non pris en charge refusé", async ({ page }) => {
    await page.setInputFiles("input[aria-label='Importer des fichiers']", { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("bonjour") });
    await expect(page.getByText(/format non pris en charge/)).toBeVisible();
  });

  test("STYLE-H1 changer de style sur la toile", async ({ page }) => {
    await page.getByRole("button", { name: /Aucun style : changer de style/ }).click();
    await expectAccessible(page, "styles");
    await page.getByRole("button", { name: /^Aquarelle/ }).click();
    await expect(page.getByRole("button", { name: /Aquarelle : changer de style/ })).toBeVisible();
  });
});
