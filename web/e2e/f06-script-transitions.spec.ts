import { test, expect, expectAccessible, login, credits, startFromPrompt, askAgent, projectUrl, FIXTURES } from "./helpers";
import path from "node:path";
import fs from "node:fs";
import type { Page } from "@playwright/test";

const story = (page: Page) => page.getByRole("textbox", { name: "Document Histoire" });
const importScript = async (page: Page, file: string) => {
  await page.getByLabel("Fichier de scénario").setInputFiles(path.join(FIXTURES, file));
};

test.describe("F06 scénario : import, export, script to film", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Une nuit de pluie en ville");
    await page.goto(projectUrl(page) + "?view=story");
    await expect(story(page)).toBeVisible();
  });

  test("SCRIPT-H1 import Fountain : scènes reconnues, notes retirées, annulable", async ({ page }) => {
    await importScript(page, "court.fountain");
    await expect(page.getByRole("status").filter({ hasText: "Scénario importé" })).toContainText("2 scènes");
    await expect(story(page)).toContainText("EXT. ARRÊT DE TRAM - NUIT");
    await expect(story(page)).toContainText("Je serai là dans dix minutes.");
    await expect(story(page)).not.toContainText("garder le néon vert");
    await expect(story(page)).not.toContainText("Brouillon");
    await expect(story(page)).toContainText("Brief"); // le reste du document est conservé
    await expectAccessible(page, "Histoire après import");
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(story(page)).not.toContainText("ARRÊT DE TRAM");
  });

  test("SCRIPT-H2 import Final Draft, export Word puis réimport (aller-retour)", async ({ page }) => {
    await importScript(page, "court.fdx");
    await expect(story(page)).toContainText("INT. ATELIER - JOUR");
    await expect(story(page)).toContainText("MARC");
    await page.getByRole("button", { name: "Exporter le scénario" }).click();
    const dl = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Word (.docx)" }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toMatch(/\.docx$/);
    const out = await file.path();
    const buf = fs.readFileSync(out);
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    expect(buf.toString("utf8")).toContain("Encore une planche");
    // Réimport du fichier exporté : même scène.
    const copy = path.join(path.dirname(out), "retour.docx");
    fs.copyFileSync(out, copy);
    await importScript(page, "court.fountain");
    await page.getByLabel("Fichier de scénario").setInputFiles(copy);
    await expect(story(page)).toContainText("INT. ATELIER - JOUR");
    await expect(story(page)).not.toContainText("ARRÊT DE TRAM");
  });

  test("SCRIPT-H3 export Fountain, Final Draft et PDF", async ({ page }) => {
    await importScript(page, "court.fountain");
    await page.getByRole("button", { name: "Exporter le scénario" }).click();
    let dl = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Fountain (.fountain)" }).click();
    expect(fs.readFileSync(await (await dl).path(), "utf8")).toMatch(/^Title: .+\n\nEXT\. ARRÊT DE TRAM/);
    await page.getByRole("button", { name: "Exporter le scénario" }).click();
    dl = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Final Draft (.fdx)" }).click();
    const fdx = fs.readFileSync(await (await dl).path(), "utf8");
    expect(fdx).toContain('<Paragraph Type="Character"><Text>LÉA</Text></Paragraph>');
    expect(fdx).toContain('<Paragraph Type="Parenthetical"><Text>(au téléphone)</Text></Paragraph>');
    expect(fdx).toContain('<Paragraph Type="Transition"><Text>FONDU AU NOIR.</Text></Paragraph>');
    await page.getByRole("button", { name: "Exporter le scénario" }).click();
    await page.getByRole("menuitem", { name: "PDF (impression)" }).click();
    await expect(page.frameLocator("#script-print").locator("body")).toContainText("INT. TRAM - CONTINU");
  });

  test("SCRIPT-N1 PDF et fichier vide refusés avec un message clair", async ({ page }) => {
    await importScript(page, "scenario.pdf");
    await expect(page.getByRole("alert").filter({ hasText: "PDF" })).toContainText("Le PDF n'est pas encore pris en charge");
    await importScript(page, "vide.txt");
    await expect(page.getByRole("alert").filter({ hasText: "texte" })).toContainText("Aucun texte trouvé");
    await expect(story(page)).toContainText("Brief");
  });

  test("SCRIPT-H4 l'agent tire un plan par scène du scénario", async ({ page }) => {
    await importScript(page, "court.fountain");
    await expect(page.getByText("Enregistré")).toBeVisible();
    const c = await credits(page);
    await askAgent(page, "Fais les plans à partir du scénario");
    await expect(page.getByText(/J'ai tiré 2 plans des 2 scènes/)).toBeVisible();
    await expect.poll(() => credits(page)).toBe(c - 16);
    await page.goto(projectUrl(page) + "?view=canvas");
    await expect(page.getByRole("group", { name: /^Scène 2/ })).toBeVisible();
  });
});

test.describe("F08 montage : transitions et sous-titres", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Une nuit de pluie en ville");
    await askAgent(page, "Monte le film");
  });

  test("EDIT-H1 transition sur un raccord : appliquée, visible, réglable", async ({ page }) => {
    await page.goto(projectUrl(page) + "?view=editor");
    const clips = page.getByRole("list", { name: "Clips de la piste principale" }).getByRole("button");
    await clips.nth(1).click();
    await page.getByRole("tab", { name: "Transitions" }).click();
    await expectAccessible(page, "onglet Transitions");
    await page.getByRole("button", { name: /^Fondu enchaîné Le plan suivant/ }).click();
    await expect(page.getByRole("button", { name: /^Fondu enchaîné Le plan suivant/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Transition d'entrée")).toHaveValue("dissolve");
    await expect(page.locator('[data-transition="dissolve"]')).toBeVisible();
    await expect(page.getByLabel("Transition : Fondu enchaîné")).toBeVisible();
    await page.getByLabel("Transition d'entrée").selectOption("wipe");
    await expect(page.locator('[data-transition="wipe"]')).toBeVisible();
    // Premier clip : pas de transition possible.
    await clips.nth(0).click();
    await page.getByRole("button", { name: /^Volet/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "premier clip" })).toBeVisible();
    // Conservé au rechargement.
    await page.reload();
    await expect(page.getByLabel("Transition : Volet")).toBeVisible();
  });

  test("EDIT-H2 sous-titres auto depuis la voix off, et refus sans voix", async ({ page }) => {
    await page.goto(projectUrl(page) + "?view=editor");
    await page.getByRole("button", { name: /Sous-titres automatiques/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "Aucune voix off" })).toBeVisible();
    await page.goto(projectUrl(page) + "?view=canvas");
    await askAgent(page, "Voix off : « Chaque nuit, la ville respire sous la pluie. Personne ne dort vraiment. »");
    await page.goto(projectUrl(page) + "?view=editor");
    await page.getByRole("button", { name: /Sous-titres automatiques/ }).click();
    await expect(page.getByRole("status").filter({ hasText: /sous-titres générés/ })).toBeVisible();
    await expect(page.getByLabel(/^Sous-titre : Chaque nuit/)).toBeVisible();
    // Regénérer remplace au lieu d'empiler.
    const n = await page.getByLabel(/^Sous-titre :/).count();
    await page.getByRole("button", { name: /Sous-titres automatiques/ }).click();
    await expect(page.getByLabel(/^Sous-titre :/)).toHaveCount(n);
  });

  test("EDIT-H3 l'agent ajoute transitions et sous-titres", async ({ page }) => {
    await askAgent(page, "Voix off : « La pluie lave tout. »");
    await askAgent(page, "Ajoute des fondus et des sous-titres");
    await expect(page.getByText(/C'est fait : un fondu enchaîné sur \d+ raccords? et \d+ sous-titres/)).toBeVisible();
    await page.goto(projectUrl(page) + "?view=editor");
    await expect(page.getByLabel("Transition : Fondu enchaîné").first()).toBeVisible();
    await expect(page.getByLabel(/^Sous-titre : La pluie lave tout/)).toBeVisible();
  });
});
