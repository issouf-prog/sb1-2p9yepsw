import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

export const FIXTURES = path.join(__dirname, "fixtures");

/**
 * Chaque test échoue s'il y a une erreur dans la console, une exception de page ou une réponse 5xx.
 * Les erreurs sont collectées puis vérifiées en fin de test (un throw dans un handler serait avalé).
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
      page.on("pageerror", (e) => problems.push(`exception: ${e.message}`));
      page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
      await use(problems);
      expect(problems, "erreurs console / exceptions / 5xx").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Contrôle axe (WCAG 2.1 A et AA) de l'écran courant. */
export async function expectAccessible(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = r.violations.map((v) => `${v.id} (${v.impact}) ×${v.nodes.length} : ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary, `accessibilité : ${label}`).toEqual([]);
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Continuer avec Google/ }).click();
  await page.waitForURL(/\/projects/);
  await expect(page.getByRole("heading", { name: /Quel film/ })).toBeVisible();
}

export async function credits(page: Page): Promise<number> {
  const t = await page.locator("header").getByRole("button", { name: /crédits/ }).first().innerText();
  return Number(t.replace(/\D/g, ""));
}

/** Lance un projet depuis l'accueil et attend la fin du premier tour de l'agent. */
export async function startFromPrompt(page: Page, prompt: string) {
  await page.getByLabel("Décrivez votre film").fill(prompt);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/p\//);
  await waitAgentIdle(page);
}

export async function waitAgentIdle(page: Page) {
  await expect(page.getByText("L'agent travaille")).toHaveCount(0, { timeout: 30_000 });
}

export async function askAgent(page: Page, text: string) {
  const agent = page.getByRole("complementary", { name: "Agent" });
  const replies = await agent.locator(".space-y-3").count();
  await page.getByLabel("Message à l'agent").fill(text);
  await page.keyboard.press("Enter");
  // Attend la nouvelle réponse (certains tours sont trop rapides pour voir « L'agent travaille »).
  await expect.poll(() => agent.locator(".space-y-3").count(), { timeout: 30_000 }).toBeGreaterThan(replies);
  await waitAgentIdle(page);
}

/** Bouton du nom de projet dans la barre du projet. */
export const projectNameButton = (page: Page) => page.locator("header").getByTitle(/\(renommer\)$/);

export const mediaNodes = (page: Page) => page.locator(".react-flow__node-media");
export const projectUrl = (page: Page) => page.url().split("?")[0];

export async function addFromPlus(page: Page, item: string) {
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

export async function deselectAll(page: Page) {
  await page.locator(".react-flow__node.selected").first().focus().catch(() => {});
  await page.keyboard.press("Escape");
}
