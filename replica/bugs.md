# Bugs

Trouvés par la suite Playwright (`web/e2e/`) le 2026-10-17, build cfa80eb…544b3f3, Chromium 141.
Chaque correction est couverte par un test qui échouait avant et passe après.

Bilan : 5 bugs reproduits (S1 : 0, S2 : 1, S3 : 2, S4 : 2), **5 corrigés** dans 04812d8. Aucun S1 ouvert.

### BUG-001 : un rechargement pendant le travail de l'agent bloque les actions et garde les crédits

- Severity: S2
- Flow / case: F00 / F00-E5 (et toute génération manuelle)
- Screen: S10, S07
- Build: 544b3f3  Browser / device: Chromium 141, 1600px

Steps
1. Sur l'accueil, taper une idée et Entrée.
2. Pendant « Générer « Plan large » », recharger la page.

Expected: les actions interrompues sont marquées comme telles et les crédits non utilisés sont rendus.
Actual: la carte d'action tournait indéfiniment, les nœuds restaient « Génération en cours… » et les 136 crédits du lot restaient débités.
Evidence: test F00-E5 (`[role="status"]:has(.animate-spin)` : 1 au lieu de 0).
Suspected cause: le tour de l'agent vit dans l'onglet ; rien ne nettoyait un tour coupé.
Status: fixed in 04812d8 (battement de cœur + crédits en attente ; au prochain chargement, actions passées en échec avec message et crédits non consommés rendus ; un autre onglet encore actif n'est pas touché). Avec le backend, le tour tourne dans Trigger.dev et la tâche poll-stuck-generations fera le même nettoyage côté serveur.

### BUG-002 : contrôles interactifs imbriqués dans les nœuds de la toile (accessibilité)

- Severity: S3
- Flow / case: F00-H1, F02-H1 (axe `nested-interactive`, sérieux, ×4)
- Screen: S07
- Build: 544b3f3

Steps
1. Ouvrir un projet avec des plans.
2. Lancer axe sur la page.

Expected: aucune violation WCAG 2.1 AA.
Actual: les nœuds avaient le rôle « button » et contenaient des boutons (lecture, copier…), illisible pour un lecteur d'écran.
Evidence: tests F00-H1 et F02-H1, rapport axe.
Suspected cause: React Flow 12.3 donnait `role="button"` aux nœuds focusables.
Status: fixed in 04812d8 (React Flow 12.9.3 : rôle « group », qui peut contenir des contrôles).

### BUG-003 : aria-label interdit sur la toile (accessibilité)

- Severity: S3
- Flow / case: STYLE-H1 (axe `aria-prohibited-attr`, sérieux)
- Screen: S07
- Build: 544b3f3

Steps
1. Ouvrir un projet, lancer axe.

Expected: la toile est une zone nommée.
Actual: `aria-label` posé sur un `div` sans rôle : ignoré par les lecteurs d'écran.
Evidence: test STYLE-H1.
Status: fixed in 04812d8 (conteneur `role="region"` nommé « Toile du projet »).

### BUG-004 : un plan collé atterrit sur l'original

- Severity: S4
- Flow / case: CANVAS-H1
- Screen: S07
- Build: 544b3f3

Steps
1. Sélectionner un plan, Ctrl+C, Ctrl+V.
2. Cliquer la copie.

Expected: la copie apparaît dans un espace libre et se clique.
Actual: décalée de 60 px seulement, la légende de l'original recouvrait la copie ; clic impossible.
Evidence: test CANVAS-H1 (clic intercepté par le nœud d'origine).
Status: fixed in 04812d8 (les copies gardent leur disposition et vont dans la première zone libre).

### BUG-005 : la panne simulée ne se déclenchait jamais (chemin de remboursement non testé)

- Severity: S4
- Flow / case: F02-N3
- Screen: S08
- Build: 544b3f3

Steps
1. + > Générer une image, prompt « une image qui finit en échec », Lancer.

Expected: échec simulé, message, crédits rendus.
Actual: génération réussie : `\b` ne fonctionne pas devant un « é ».
Evidence: test F02-N3.
Status: fixed in 04812d8 (limite de mot Unicode).

## À vérifier (non reproduit, pas un bug confirmé)

- Quand on ajoute beaucoup de nœuds au même endroit très vite, deux nœuds peuvent encore se toucher.
- Export Safari / Firefox (MAN-7).
- Après la mise à jour de React Flow, vérifier à l'œil le déplacement de sections contenant beaucoup de plans.
