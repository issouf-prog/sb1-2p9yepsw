# Journal de construction

Données et générations **simulées** (localStorage + agent à règles + images SVG originales).
Contrats identiques aux vrais : `web/src/lib/data/layer.ts` (→ Supabase), `web/src/lib/gen/provider.ts`
(→ fal.ai), `web/src/lib/agent/run.ts` (→ boucle Claude côté serveur). Aucun écran ne change au branchement.

Vérifié de bout en bout dans Chromium (Playwright) le 2026-10-17 : connexion → prompt sur l'accueil →
projet créé → l'agent crée 1 section, 2 images, 1 vidéo → 136 crédits débités (300 → 164) → 2e lot →
3e lot refusé (28 crédits) sans débit, message clair → recharge simulée → image manuelle via + (8 crédits)
→ rechargement de page : 7 nœuds conservés. 0 erreur console. 390 px : pas de défilement horizontal.
Clavier : prompt de l'accueil atteint au Tab.

| ID | date | état | manque | plus dur que prévu |
| --- | --- | --- | --- | --- |
| S02 Connexion | 2026-10-17 | partiel | vraie auth Google (Supabase) | — |
| S03 Accueil | 2026-10-17 | fait | styles, pièces jointes, dictée, visite guidée | — |
| S04 Projets | 2026-10-17 | fait | dossiers, partage | — |
| S04b Barre globale | 2026-10-17 | fait | notifications | le bouton Créer restait visible sur mobile (conflit de classes) |
| S07 Toile | 2026-10-17 | partiel | connexions manuelles, panneaux flottants, couleur/verrou de section | synchroniser la sélection React Flow avec les données ; éviter les sections imbriquées |
| S08 Panneau de génération | 2026-10-17 | partiel | lot, durée/résolution vidéo, références | — |
| S09 Menu + | 2026-10-17 | partiel | import, voix, musique | — |
| S09b Nœud sélectionné | 2026-10-17 | partiel | archiver, ajouter au dossier, convertir en 3D ; renommer passe par une boîte native | — |
| S10 Agent | 2026-10-17 | partiel | vrai LLM (Claude), @, pièces jointes, dictée | l'agent simulé couvre seulement « créer une séquence » et « animer l'image sélectionnée » |
| S11 Histoire | 2026-10-17 | fait | types de ligne du scénario, import/export de fichiers | garder l'éditeur à jour quand l'agent écrit sans écraser la saisie en cours |
| S15 Montage | 2026-10-17 | partiel | piste musique, transitions, effets, sous-titres auto, plein écran ; ajout de texte par boîte native | rendre la timeline lisible avec l'aimant toujours actif |
| S16 Export | 2026-10-17 | partiel | 1080p/4K et MP4 (rendu serveur) | les navigateurs ignorent les noms de fichier accentués : nom converti en ASCII |
| S17 Plateau 3D | — | écran d'attente | tout | — |
| S21 Tarifs | 2026-10-17 | partiel | prix réels, Stripe | — |
| S23 Galerie | 2026-10-17 | partiel | publication, page film | — |
| S31 Recharge | 2026-10-17 | partiel | Stripe Checkout | — |

Captures pour replica-diff : `replica/clone-screens/` (S02, S03, S03-filled, S03-390, S04, S07, S07-390,
S08, S09b, S10-credits, S10-390).

## 2e passe (2026-10-17)

Vérifié dans Chromium : l'agent écrit le brief, la narration et le scénario au premier tour ; édition manuelle
sauvegardée et conservée au rechargement ; « Laisser l'agent monter le film » → 2 clips (8 s) ; lecture, coupe
sous la tête de lecture (3 clips) ; export 720p → fichier WebM réel de 2,3 Mo téléchargé ; Ctrl+C/Ctrl+V d'un plan ;
« Monte le film » dans le chat → plan ajouté (11 s). 0 erreur console ; 390 px sans débordement.

Parité (`parity.py`) : 39,6 / 100, indispensables 25 sur 60 (était 28,3 et 17).
