import { test, expect, expectAccessible, login, credits, startFromPrompt } from "./helpers";

test.describe("F11 partage, F13 crédits, projets", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("F11-H1 partage : e-mail invalide refusé, invitation, lien", async ({ page }) => {
    await startFromPrompt(page, "Projet à partager");
    await page.getByRole("button", { name: "Partager", exact: true }).click();
    await expectAccessible(page, "partage");
    await page.getByLabel("Inviter par e-mail").fill("pas-un-email");
    await page.getByRole("button", { name: "Inviter" }).click();
    await expect(page.getByRole("alert")).toHaveText("Adresse e-mail invalide.");
    await page.getByLabel("Inviter par e-mail").fill("awa@exemple.fr");
    await page.getByRole("button", { name: "Inviter" }).click();
    await expect(page.getByRole("list", { name: "Personnes invitées" }).getByRole("listitem")).toHaveCount(1);
    await page.getByLabel("Inviter par e-mail").fill("AWA@exemple.fr");
    await page.getByRole("button", { name: "Inviter" }).click();
    await expect(page.getByRole("alert")).toHaveText("Cette personne est déjà invitée.");
    await expect(page.getByRole("button", { name: /Copier le lien/ })).toBeDisabled();
    await page.getByLabel("Toute personne ayant le lien").selectOption("view");
    await expect(page.getByRole("button", { name: /Copier le lien/ })).toBeEnabled();
  });

  test("F13-H1 recharge simulée", async ({ page }) => {
    await page.locator("header").getByRole("button", { name: /crédits/ }).click();
    await expectAccessible(page, "recharge");
    await page.getByRole("button", { name: /Ajouter 500 crédits/ }).click();
    await expect.poll(() => credits(page)).toBe(800);
  });

  test("F13-H2 changer de plan depuis les tarifs", async ({ page }) => {
    await page.goto("/pricing");
    await expectAccessible(page, "tarifs");
    await page.getByRole("button", { name: "Choisir Pro" }).click();
    await page.goto("/pricing");
    await expect(page.getByText("Votre plan actuel")).toBeVisible();
  });

  test("PROJ-H1 renommer (60 caractères), rechercher, supprimer avec confirmation", async ({ page }) => {
    await startFromPrompt(page, "Projet à gérer");
    await page.goto("/projects?tab=all");
    await expectAccessible(page, "projets");
    await page.getByRole("button", { name: /Actions sur Projet à gérer/ }).click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    const long = "Un nom de projet vraiment très long pour tester la troncature";
    await page.getByLabel("Nom du projet").fill(long);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByTitle(long)).toBeVisible();
    await page.getByLabel("Rechercher un projet").fill("introuvable");
    await expect(page.getByText("Aucun projet ne correspond.")).toBeVisible();
    await page.getByLabel("Rechercher un projet").fill("");
    await page.getByRole("button", { name: /Actions sur Un nom de projet/ }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("Aucun projet pour l'instant.")).toBeVisible();
  });

  test("PROJ-N1 projet supprimé ou inconnu : message clair", async ({ page }) => {
    await page.goto("/p/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "Projet introuvable" })).toBeVisible();
  });
});
