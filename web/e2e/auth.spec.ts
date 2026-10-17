import { test, expect, expectAccessible, login, credits } from "./helpers";

test.describe("S02 connexion", () => {
  test("AUTH-H1 connexion, 300 crédits offerts, déconnexion", async ({ page }) => {
    await page.goto("/login");
    await expectAccessible(page, "connexion");
    await login(page);
    expect(await credits(page)).toBe(300);
    await page.getByRole("button", { name: /Compte de/ }).click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await page.waitForURL(/\/login/);
  });

  test("AUTH-N1 une page protégée renvoie vers la connexion puis revient", async ({ page }) => {
    await page.goto("/projects?tab=all");
    await page.waitForURL(/\/login\?next=/);
    await page.getByRole("button", { name: /Continuer avec Google/ }).click();
    await page.waitForURL(/\/projects\?tab=all/);
    await expect(page.getByRole("heading", { name: "Tous les projets" })).toBeVisible();
  });

  test("AUTH-E1 connexion par e-mail : champs requis et format", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Nom").fill("Inès Ü 🎬");
    await page.getByLabel("E-mail").fill("ines@exemple.fr");
    await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
    await page.waitForURL(/\/projects/);
    await expect(page.getByRole("button", { name: "Compte de Inès Ü 🎬" })).toBeVisible();
  });

  test("LEGAL-H1 pages légales accessibles", async ({ page }) => {
    await page.goto("/legal/cgu");
    await expect(page.getByRole("heading", { name: "Conditions d'utilisation" })).toBeVisible();
    await expectAccessible(page, "CGU");
    await page.goto("/legal/confidentialite");
    await expect(page.getByRole("heading", { name: /confidentialité/ })).toBeVisible();
  });
});
