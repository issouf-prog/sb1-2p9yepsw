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

## 3e passe (2026-10-17)

| ID | état | fait | manque |
| --- | --- | --- | --- |
| S09 Menu + | fait | voix et musique activées | import de fichiers |
| S09b Nœud | partiel | « Personnage de référence », renommer par modale | archiver, dossiers, convertir en 3D |
| S13 Ressources | fait | panneau flottant, groupes par section, favoris, viseur de section | archives |
| S14 Voix | partiel | 4 voix, réplique avec indications | filtres, aperçu au survol |
| S15 Montage | partiel | piste Son (musique + voix, lecture synchronisée), texte par modale | transitions, effets, sous-titres auto |
| S16 Export | partiel | son mixé dans le WebM (VP9 + Opus) | 1080p/4K, MP4 côté serveur |
| S18 Partage | partiel | privé/partagé, invitations validées, accès par lien, copie | envoi d'e-mail et contrôle d'accès (backend) |

Agent simulé : musique (« ajoute une musique… »), voix off (« Voix off : « … » »), fiche personnage
(« crée la fiche de mon personnage… »), toutes avec vérification du coût avant lancement et placement
automatique du son dans le montage.

Plus dur que prévu : mixer le son dans l'export navigateur (AudioContext programmé + MediaRecorder
VP9/Opus) ; la validation native des champs e-mail masquait notre message d'erreur accessible.

Vérifié dans Chromium : séquence 300 → 164 crédits ; musique → 156 ; voix off → 148 ; fiche → 140 ;
personnage dans une scène → 128 ; voix manuelle ; ressources (8 éléments, viseur) ; renommage ; partage
(e-mail invalide refusé, invitation, lien) ; montage 4 clips + 2 sons (14 s) ; export 4 Mo avec pistes
V_VP9 et A_OPUS. Scénarios précédents rejoués sans régression. 0 erreur console.

Parité : 47,8 / 100, indispensables 28 sur 60.
