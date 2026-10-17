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
| S07 Toile | 2026-10-17 | partiel | sections manuelles, copier-coller, connexions manuelles, panneaux flottants | synchroniser la sélection React Flow avec les données en temps réel |
| S08 Panneau de génération | 2026-10-17 | partiel | lot, durée/résolution vidéo, références | — |
| S09 Menu + | 2026-10-17 | partiel | import, voix, musique | — |
| S09b Nœud sélectionné | 2026-10-17 | partiel | archiver, ajouter au dossier/montage, convertir en 3D ; renommer passe par une boîte native | — |
| S10 Agent | 2026-10-17 | partiel | vrai LLM (Claude), @, pièces jointes, dictée | l'agent simulé couvre seulement « créer une séquence » et « animer l'image sélectionnée » |
| S11 Histoire | — | écran d'attente | tout | — |
| S15 Montage | — | écran d'attente | tout | — |
| S17 Plateau 3D | — | écran d'attente | tout | — |
| S21 Tarifs | 2026-10-17 | partiel | prix réels, Stripe | — |
| S23 Galerie | 2026-10-17 | partiel | publication, page film | — |
| S31 Recharge | 2026-10-17 | partiel | Stripe Checkout | — |

Captures pour replica-diff : `replica/clone-screens/` (S02, S03, S03-filled, S03-390, S04, S07, S07-390,
S08, S09b, S10-credits, S10-390).

Parité (`parity.py`) : 28,3 / 100, indispensables 17 sur 60.
