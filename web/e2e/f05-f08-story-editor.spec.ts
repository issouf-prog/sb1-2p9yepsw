import fs from "node:fs";
import { test, expect, expectAccessible, login, startFromPrompt, askAgent, projectUrl } from "./helpers";

test.describe("F05 Histoire et F08 montage", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await startFromPrompt(page, "Une course de vélos sous la pluie");
  });

  test("F05-H1 modifier l'Histoire, enregistré et conservé", async ({ page }) => {
    await page.goto(projectUrl(page) + "?view=story");
    await expect(page.locator(".story-prose h2")).toHaveCount(4);
    await expectAccessible(page, "histoire");
    await page.locator(".story-prose p").last().click();
    await page.keyboard.type(" Phrase ajoutée.");
    await expect(page.getByText("Enregistré")).toBeVisible();
    await page.reload();
    await expect(page.locator(".story-prose")).toContainText("Phrase ajoutée.");
  });

  test("F08-H1 l'agent monte, on coupe, on exporte un vrai fichier", async ({ page }) => {
    await page.goto(projectUrl(page) + "?view=editor");
    await expectAccessible(page, "montage vide");
    await page.getByRole("button", { name: /Laisser l'agent monter/ }).click();
    const clips = page.getByRole("list", { name: "Clips de la piste principale" }).getByRole("listitem");
    await expect(clips).toHaveCount(2);
    await expect(page.getByLabel("Position")).toContainText("00:08:00");
    await expectAccessible(page, "montage rempli");
    await page.getByRole("button", { name: /Lire/ }).click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /Pause/ }).click();
    await page.getByRole("button", { name: "Couper sous la tête de lecture" }).click();
    await expect(clips).toHaveCount(3);
    await page.getByRole("button", { name: "Exporter" }).first().click();
    const download = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("dialog").getByRole("button", { name: "Exporter" }).click();
    const d = await download;
    expect(d.suggestedFilename()).toMatch(/^une-course-de-velos.*\.webm$/);
    const buf = fs.readFileSync((await d.path())!);
    expect(buf.length).toBeGreaterThan(100_000);
    expect(buf.includes("V_VP9")).toBe(true);
  });

  test("F08-E1 « Monte le film » dans le chat ajoute les plans", async ({ page }) => {
    await askAgent(page, "Monte le film");
    await expect(page.getByText(/au montage, qui dure maintenant/)).toBeVisible();
  });

  test("F08-E2 images par seconde conservées", async ({ page }) => {
    await page.goto(projectUrl(page) + "?view=editor");
    await page.getByLabel("Images par seconde").selectOption("24");
    await page.reload();
    await expect(page.getByLabel("Images par seconde")).toHaveValue("24");
  });
});
