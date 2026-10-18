import { test, expect, expectAccessible, login, credits, startFromPrompt, mediaNodes, addFromPlus, deselectAll } from "./helpers";
import type { Locator, Page } from "@playwright/test";

/** Glisse la poignée de sortie d'un nœud vers la poignée d'entrée d'un autre. */
async function connect(page: Page, from: Locator, to: Locator) {
  const src = from.locator(".react-flow__handle.source").first();
  const dst = to.locator(".react-flow__handle.target").first();
  const a = (await src.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  const b = (await dst.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
}

test.describe("Connexions, lots, résolution, visite", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Un détective sous un réverbère");
  });

  test("CONN-H1 une note reliée sert de prompt, le lien se supprime", async ({ page }) => {
    await addFromPlus(page, "Note");
    const note = page.locator(".react-flow__node-note").last();
    await note.getByLabel("Note").fill("Pluie battante, néons verts");
    await note.getByLabel("Note").blur();
    await deselectAll(page);
    await addFromPlus(page, "Générer une image");
    const gen = page.locator(".react-flow__node-media", { has: page.getByText("Nouvelle image", { exact: true }) }).last();
    const edges = await page.locator(".react-flow__edge").count();
    await deselectAll(page);
    await page.getByRole("button", { name: "Tout afficher" }).click();
    await page.waitForTimeout(400);
    await connect(page, page.locator(".react-flow__node-note").last(), gen);
    await expect(page.getByText(/Relié : note utilisée comme prompt/)).toBeVisible();
    await expect(page.locator(".react-flow__edge")).toHaveCount(edges + 1);
    // Le prompt vide suffit : la note fournit le texte.
    const c = await credits(page);
    await gen.click();
    await expect(page.getByText("Note reliée :")).toContainText("Pluie battante, néons verts");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(page.locator(".react-flow")).toContainText("Pluie battante, néons verts");
    await expect.poll(() => credits(page)).toBe(c - 8);
    // Supprimer le lien : sélection puis Suppr.
    const edge = page.locator('.react-flow__edge[aria-label="Note utilisée comme prompt"]').first();
    await edge.focus();
    await page.keyboard.press("Delete");
    await expect(page.locator('.react-flow__edge[aria-label="Note utilisée comme prompt"]')).toHaveCount(0);
  });

  test("BATCH-H1 lot de 3 images : 3 résultats, coût ×3", async ({ page }) => {
    const n = await mediaNodes(page).count();
    const c = await credits(page);
    await addFromPlus(page, "Générer une image");
    await page.getByRole("button", { name: "3×" }).click();
    await expect(page.getByRole("button", { name: "3×" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("combobox", { name: /Prompt du plan/ }).fill("Silhouette dans la ruelle");
    await expect(page.getByRole("button", { name: /^Lancer/ })).toContainText("24");
    await expectAccessible(page, "panneau avec lot");
    await page.getByRole("button", { name: /^Lancer/ }).click();
    await expect(mediaNodes(page)).toHaveCount(n + 3);
    await expect(page.getByRole("group", { name: /variante 3/ })).toBeVisible();
    await expect.poll(() => credits(page)).toBe(c - 24);
  });

  test("VIDEO-H1 la résolution change le coût (1080p = ×2,25)", async ({ page }) => {
    await page.getByRole("group", { name: /^Plan rapproché/ }).first().click();
    await page.getByRole("menuitem", { name: "Animer cette image" }).click();
    const run = page.getByRole("button", { name: /^Lancer/ });
    await expect(run).toContainText("120");
    await page.getByLabel("Résolution").selectOption("1080p");
    await expect(run).toContainText("270");
    await page.getByLabel("Résolution").selectOption("480p");
    await expect(run).toContainText("60");
    await deselectAll(page);
  });

  test("CHAR-H1 personnage avec scène de référence", async ({ page }) => {
    await page.getByRole("group", { name: /^Plan rapproché/ }).first().click();
    const item = page.getByRole("menuitem", { name: /Personnage/ });
    test.skip(!(await item.count()), "menu personnage absent");
    await item.click();
    const scene = page.getByLabel("Scène de référence (facultatif)");
    test.skip(!(await scene.count()), "plan gratuit : personnage verrouillé");
    await scene.selectOption({ label: (await scene.locator("option").nth(1).innerText()) });
    await expect(scene).not.toHaveValue("");
    await deselectAll(page);
  });
});

test("TOUR-H1 Découvrir lance la visite, Passer cette étape change de vue", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Découvrir" }).click();
  await page.waitForURL(/\/p\/.*tour=1/);
  const tour = page.getByRole("dialog", { name: "L'agent fait le travail" });
  await expect(tour).toBeVisible();
  await expectAccessible(page, "visite guidée");
  await tour.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByRole("dialog", { name: /Ajouter un plan/ })).toBeVisible();
  await page.getByRole("button", { name: "Passer cette étape" }).click();
  await page.waitForURL(/view=story/);
  await expect(page.getByRole("dialog", { name: "Le document du film" })).toBeVisible();
  await page.getByRole("button", { name: "Vue suivante" }).click();
  await page.waitForURL(/view=editor/);
  await expect(page.getByRole("dialog", { name: "Monter le film" })).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page.getByRole("dialog", { name: /Exporter/ })).toHaveCount(0);
  // Terminée : ne revient pas au rechargement.
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Monter le film" })).toHaveCount(0);
});
