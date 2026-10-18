import { test, expect, expectAccessible, login, credits, startFromPrompt, askAgent, mediaNodes, projectUrl, waitAgentIdle, projectNameButton } from "./helpers";

test.describe("F00 tout faire en parlant à l'agent", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("F00-H1 une idée → section, 2 images, 1 vidéo, histoire écrite, 136 crédits", async ({ page }) => {
    await expectAccessible(page, "accueil");
    await startFromPrompt(page, "Un renard traverse une ville sous la neige");
    await expect(page.getByText("J'ai créé la section")).toBeVisible();
    await expect(mediaNodes(page)).toHaveCount(3);
    await expect(page.locator(".react-flow__node-section")).toHaveCount(1);
    expect(await credits(page)).toBe(164);
    await expect(page.getByText("Écrire le brief et le scénario")).toBeVisible();
    await expectAccessible(page, "toile + agent");
    await page.goto(projectUrl(page) + "?view=story");
    await expect(page.locator(".story-prose")).toContainText("Un renard traverse une ville sous la neige");
  });

  test("F00-E1 lot trop cher : rien n'est lancé ni débité, message clair", async ({ page }) => {
    await startFromPrompt(page, "Première scène");
    await askAgent(page, "Deuxième scène sur les toits");
    expect(await credits(page)).toBe(28);
    const before = await mediaNodes(page).count();
    await askAgent(page, "Troisième scène au port");
    await expect(page.getByText(/Il manque 108 crédits pour ce lot/)).toBeVisible();
    expect(await credits(page)).toBe(28);
    await expect(mediaNodes(page)).toHaveCount(before);
  });

  test("F00-E2 accents et emoji dans le prompt", async ({ page }) => {
    await startFromPrompt(page, "Élodie mange une crème brûlée 🍮 à Noël");
    await expect(page.getByRole("button", { name: /Élodie mange une crème brûlée 🍮/ }).first()).toBeVisible();
    await expect(page.locator(".react-flow")).toContainText("🍮");
  });

  test("F00-E3 prompt très long : nom de projet tronqué proprement", async ({ page }) => {
    const long = "Une très longue description ".repeat(60).trim();
    await startFromPrompt(page, long);
    const name = (await projectNameButton(page).getAttribute("title"))!.replace(/ \(renommer\)$/, "");
    expect(name.length).toBeLessThanOrEqual(60);
    expect(name).toContain("…");
  });

  test("F00-E4 double Entrée sur l'accueil : un seul projet", async ({ page }) => {
    await page.getByLabel("Décrivez votre film").fill("Un seul projet svp");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/p\//);
    await waitAgentIdle(page);
    await page.goto("/projects?tab=all");
    await expect(page.getByRole("link", { name: /Un seul projet svp/ })).toHaveCount(1);
  });

  test("F00-E5 rechargement pendant le travail de l'agent : rien ne reste « en cours »", async ({ page }) => {
    await page.getByLabel("Décrivez votre film").fill("Interrompu en plein travail");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/p\//);
    await expect(page.getByText("Générer « Plan large »")).toBeVisible();
    await page.reload();
    await page.waitForTimeout(6000);
    await expect(page.getByText("L'agent travaille")).toHaveCount(0);
    // Aucune carte d'action ne doit rester bloquée en « en cours » après un rechargement.
    await expect(page.locator('[role="status"]:has(.animate-spin)')).toHaveCount(0);
    await expect(page.getByText(/Interrompu : la page a été fermée ou rechargée/).first()).toBeVisible();
    // Crédits : seul ce qui a été réellement généré reste débité (image 8, vidéo 120).
    const images = await page.locator(".react-flow__node-media img[alt]").count();
    const videos = await page.getByRole("button", { name: /^Lire / }).count();
    expect(await credits(page)).toBe(300 - 8 * (images - videos) - 120 * videos);
  });

  test("F00-N1 demande interdite refusée sans débit", async ({ page }) => {
    await startFromPrompt(page, "Une scène calme");
    const c = await credits(page);
    await askAgent(page, "Ajoute une scène de torture très gore");
    await expect(page.getByText(/Demande refusée \(violence graphique\)/)).toBeVisible();
    expect(await credits(page)).toBe(c);
  });

  test("F00-E6 cliquer une référence de l'agent sélectionne le plan", async ({ page }) => {
    await startFromPrompt(page, "Un phare dans la tempête");
    await page.getByRole("complementary", { name: "Agent" }).getByRole("button", { name: "Plan large", exact: true }).click();
    await expect(page.locator(".react-flow__node.selected")).toHaveCount(1);
  });

  test("F00-E7 deux onglets : un renommage se voit dans l'autre", async ({ page, context }) => {
    await startFromPrompt(page, "Projet partagé entre onglets");
    const other = await context.newPage();
    await other.goto(page.url());
    await expect(other.locator(".react-flow__node-media").first()).toBeVisible();
    await projectNameButton(page).click();
    await page.getByLabel("Nom du projet").fill("Nouveau nom commun");
    await page.keyboard.press("Enter");
    await expect(other.locator("header").getByTitle("Nouveau nom commun (renommer)")).toBeVisible();
  });
});
