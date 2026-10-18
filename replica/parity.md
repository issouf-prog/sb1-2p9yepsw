# Parité : Studio face à Flick

Date : 2026-10-18 · Build : 7551904 · Outils : `parity.py`, `imgdiff.py` (mode mise en page, couleurs ignorées).

## Verdict : **pas encore livrable**

| mesure | valeur |
| --- | --- |
| Score global | **57,1 / 100** (avant : 54,5) |
| Fonctions | **63,4 / 100** (125 lignes comptées, indispensables : **43 sur 60**, avant : 38) |
| Mise en page | **31,9 / 100** sur 6 écrans (voir l'avertissement ci-dessous) |
| Bugs S1 ouverts | 0 (S2 : 0) |

Il manque 17 fonctions indispensables :
- **15 dépendent du backend** : vraie connexion, Stripe, factures, stockage des fichiers, file de générations,
  vrais modèles image/vidéo, vrai agent Claude, rendu serveur, modération des sorties, etc.
- **1 est du travail d'interface** : plusieurs scènes de référence (jusqu'à 5) pour les personnages ; le clone
  en accepte une.
- **1 est juridique** : faire relire les CGU et la politique de confidentialité.

Construit dans ce passage : connexions manuelles entre nœuds, note comme prompt, lot 1× à 4×, scène de
référence, résolution vidéo, visite guidée avec « Passer cette étape ». Suite e2e : 43 tests, 86/86 sur deux
passages.

## Mise en page, écran par écran

Captures à la même taille que celles de Flick (1840–1849 × 930–952), connecté, même onglet ouvert.
Les captures de Flick et les images de différence restent locales (`replica/screens/`, `replica/diffs/*.png`,
hors git) ; seuls les scores (`replica/diffs/*.json`) et nos captures (`replica/clone-screens/diff/`) sont versionnés.

| écran | score | lecture à l'œil |
| --- | --- | --- |
| S03 Accueil | 24,7 | même ordre : titre, grande boîte de prompt, 6 pilules, projets récents. Flick a en plus un bandeau d'annonce de 62 px qui décale toute la page vers le bas. |
| S07 Toile + agent | 30,0 (en 9:16) | mêmes zones : barre projet, barre d'outils flottante à gauche, section au centre, agent à droite (≈ 540 px). Nous avons en plus la barre format + style épinglée en haut de la toile. |
| S09 Menu + | 36,7 | même menu au même endroit ; nos libellés et entrées diffèrent un peu. |
| S11 Histoire | 39,5 | même document à blocs, mêmes 4 sections ; notre contenu est celui écrit par l'agent, celui de Flick est son modèle. |
| S15 Montage | 31,4 | même découpage : ressources à gauche, aperçu au centre, propriétés à droite, timeline en bas. |
| S17 Plateau 3D | 29,3 | **non construit** chez nous (écran d'attente) : l'écart est réel. |

**Avertissement sur ces chiffres.** Calibrage fait sur les mêmes captures :
- Clone contre clone, même état : **93,4** (correspond).
- Clone contre clone, même écran mais contenu différent (16:9 contre 9:16) : **60,0**.
- Flick contre Flick, la toile seule puis la même toile avec le menu + ouvert : **46,5**.

L'outil réagit donc beaucoup au contenu : images, zoom, texte du chat. Nos 25 à 40 face à Flick se lisent comme
« structure proche, contenu et état différents ». Ce n'est pas une parité visuelle, et ce n'est pas le but :
l'apparence exacte de Flick est son habillage commercial, et `/replica-brand` va de toute façon tout changer.

## Fonctions par zone, de la plus faible à la plus forte
- infra                          0.0  (1 features)
- équipes                        0.0  (2 features)
- 3d                             0.0  (6 features)
- croissance                     0.0  (3 features)
- galerie                        8.3  (6 features)
- script                        30.8  (6 features)
- facturation                   37.5  (4 features)
- audio                         43.8  (8 features)
- comptes                       45.0  (4 features)
- sécurité                      50.0  (1 features)
- légal                         50.0  (1 features)
- images                        52.5  (8 features)
- partage                       55.6  (5 features)
- vidéo                         56.2  (6 features)
- monteur                       66.2  (15 features)
- styles                        71.4  (3 features)
- assets                        75.0  (6 features)
- agent                         76.7  (11 features)
- crédits                       84.4  (6 features)
- canvas                        91.7  (15 features)
- projets                      100.0  (7 features)
- onboarding                   100.0  (1 features)

## Comportements : ce que les scores ne voient pas

| flux | Flick fait | le clone fait | décision |
| --- | --- | --- | --- |
| F00 démarrer un film | prompt + Entrée (2 actions), puis l'agent travaille | idem (2 actions) | garder |
| F00 crédits insuffisants en plein lot | lance 1 génération sur 2 puis échoue, et affiche à l'utilisateur le message technique destiné au modèle | vérifie le coût total avant tout, ne lance rien, ne débite rien, explique le manque exact et propose la recharge | **garder : mieux que l'original** |
| F00 langue de l'agent | a répondu en anglais à un utilisateur français (capture) | répond en français | garder (le vrai agent Claude devra suivre la règle) |
| F00 page fermée en plein travail | côté serveur : le travail continue (supposé) | simulation : actions marquées « interrompu », crédits non utilisés rendus | avec le backend : faire comme Flick (Trigger.dev) **et** garder le message + le remboursement |
| F02 demande interdite | signalée (doc) ; débit non documenté | signalée, **jamais débitée**, message qui dit de reformuler | garder |
| F03 personnage de référence | réservé au plan Standard et plus | réservé au plan Créateur (équivalent) | garder |
| F05 Histoire | modèle tiré d'un de ses films | modèle écrit pour nous + **rempli par l'agent dès le premier message** | garder |
| F08 montage | bouton « l'agent construit ma timeline » | idem, plus « Monte le film » dans le chat | garder |
| F08 export | 720p / 1080p / 4K, rendu serveur | 720p WebM rendu dans le navigateur (son inclus) | à faire : rendu serveur FFmpeg (backend) |
| Noms tronqués | sans infobulle | nom complet au survol partout | garder |
| Mémoire entre visites | compte en ligne, tous appareils | simulation : ce navigateur seulement | à faire : Supabase (backend) |
| E-mails | invitations par e-mail (doc) | enregistrées, aucun e-mail | à faire : Resend (backend) |
| Plateau 3D | complet | absent | plus tard (phase 4, « could ») |

## Les cinq prochaines choses à construire

1. **`/replica-backend`** : 15 des 17 indispensables manquants. Il faut tes clés Supabase, Anthropic, fal.ai,
   ElevenLabs et Stripe : vraie connexion Google, données en ligne, stockage des fichiers, file de générations,
   vrais modèles, vrai agent Claude, paiements, factures, rendu serveur.
2. **Relecture juridique** des CGU et de la politique de confidentialité.
3. **Jusqu'à 5 scènes de référence** pour les personnages.
4. **Import et export de scénario** (Histoire).
5. **Transitions et sous-titres** dans le montage.

Juste après viennent les équipes et le pool de crédits.

## Fonctions manquantes, dans l'ordre de construction
- [must] facturation: Factures et annulation, no  (S22)
- [must] infra: File de jobs asynchrone multi-fournisseurs, no  (via API officielles ou fal.ai/Replicate)
- [must] agent: Agent : outils lire et modifier la timeline regarder un média, partial  (cartes d'action vues | clone: lire + monter ; regarder un média à venir)
- [must] agent: Agent IA qui fait tout via appels d'outils (génère organise monte), partial  (S10 F00 cœur du produit | clone: agent simulé : Histoire, séquence, animation, montage, musique, voix off, fiche personnage ; Claude à brancher)
- [must] assets: Upload d'images et de vidéos, partial  (S13 | clone: images, vidéos, sons ≤ 4 Mo (stockage local) ; glisser-déposer)
- [must] canvas: Nœud : lecteur vidéo inline, partial  (S09b | clone: aperçu simulé)
- [must] comptes: Inscription et connexion email + Google, partial  (S02 | clone: simulée ; Supabase Auth à brancher)
- [must] crédits: Solde de crédits et grand livre, partial  (CreditLedger | clone: solde + clés d'idempotence (simulé))
- [must] facturation: Fenêtre de recharge et upgrade, partial  (S31 | clone: recharge simulée)
- [must] facturation: Plans d'abonnement Stripe mensuel et annuel, partial  (S21 | clone: choix du plan simulé ; Stripe à brancher)
- [must] facturation: Recharge ponctuelle de crédits, partial  (F13 | clone: simulée ; Stripe à brancher)
- [must] images: Character Reference (≤5 perso ≤5 scène), partial  (F03 | clone: 1 à 5 images perso + 1 scène de référence ; plan Créateur ; plusieurs scènes à venir)
- [must] légal: Pages légales (CGU confidentialité), partial  (à toi pas copiées | clone: modèles de travail à faire relire par un juriste)
- [must] monteur: Export 720p 1080p 4K avec rendu serveur, partial  (S16 | clone: 720p WebM avec son (VP9 + Opus) rendu dans le navigateur ; serveur à brancher)
- [must] sécurité: Modération des prompts et sorties (flagged), partial  (obligatoire avant vente | clone: pré-contrôle des prompts, état signalé sans débit ; sorties à contrôler côté serveur)
- [must] vidéo: End frame optionnel, partial  (selon modèle | clone: choix de l'image de fin ; non exploité par la simulation)
- [must] vidéo: Generate Video depuis une image (start frame), partial  (F04 | clone: simulée : aperçu animé de l'image)
- [should] agent: Agent : Chat rules et Personalize, no
- [should] agent: Agent : sélecteur de modèle Auto, no
- [should] assets: Dossiers dans les assets, no
- [should] audio: Character Dialogue (lipsync), no
- [should] audio: Effets sonores (SFX), no
- [should] audio: Import audio, no
- [should] audio: Plusieurs speakers, no
- [should] comptes: Langues de l'interface (10), no  (FR en premier)
- [should] comptes: Notifications, no  (S30)
- [should] images: Camera Control, no
- [should] images: Change Style (transfert de style), no
- [should] images: Remove background, no
- [should] images: Upscale image et vidéo, no
- [should] monteur: Monteur : aimant et magnétisme, no
- [should] monteur: Monteur : propriétés (échelle position volume vitesse fondus), no
- [should] monteur: Monteur : sous-titres générés, no
- [should] monteur: Monteur : transitions et effets, no
- [should] monteur: Éditeur : volume par piste, no  (piste Principal)
- [should] script: Export du script PDF et Word, no
- [should] script: Import de script (.fountain .fdx .pdf .docx .txt), no  (S12)
- [should] script: Script to Film, no  (F06)
- [should] script: Éditeur de script (lignes typées rail des scènes), no  (S11)
- [should] styles: Nœud : Enregistrer comme style, no  (S09b)
- [should] vidéo: Extract Frame depuis une vidéo, no
- [should] vidéo: Omni Reference (image vidéo audio), no  (Standard+)
- [should] équipes: Pool de crédits d'équipe et conso par membre, no
- [should] équipes: Workspaces et rôles owner member guest, no  (S20)
- [should] audio: Sélecteur de voix avec filtres, partial  (S14 | clone: 4 voix dans une liste ; filtres à venir)
- [should] canvas: Panneaux flottants Ressources et Histoire sur la toile, partial  (S11b S13 | clone: Ressources ; Histoire ouvre l'onglet)
- [should] canvas: Sections (nom couleur verrou repli), partial  (S07 | clone: créer (S), grouper, replier, retirer ; couleur et verrou à venir)
- [should] monteur: Éditeur : filtres Tout Favoris Archivé Enregistré, partial  (S15 | clone: Tout + Favoris)
- [should] partage: Lien de partage (none / view / edit), partial  (clone: réglage + copie ; contrôle d'accès avec le backend)
- [should] partage: Partage par email (can view / can edit), partial  (S18 | clone: enregistré ; envoi d'e-mail avec le backend)
- [should] script: Histoire : bloc scénario au format INT. EXT. dialogue, partial  (S11 | clone: bloc scénario en police machine ; pas encore de types de ligne)
- [could] 3d: 3D Stage (composants caméras gizmo), no  (S17)
- [could] 3d: 3D Stage : Rehearse et Record vers le canvas, no  (F10)
- [could] 3d: Nœud : Convertir en 3D, no  (S09b image vers plateau 3D)
- [could] 3d: Plateau 3D : bascule 3D / 2D et Scène / Caméras, no  (S17)
- [could] 3d: Plateau 3D : blocs d'action sur la timeline (Orbite), no  (S17)
- [could] 3d: Plateau 3D : scène par défaut 1 caméra + 1 humain, no  (S17)
- [could] croissance: Bandeau d'annonce fermable, no
- [could] croissance: Pages outils SEO, no  (S28 avec tes propres textes)
- [could] croissance: Parrainage et Earn Credits, no
- [could] crédits: Crédits gratuits hebdomadaires, no  (100 par semaine chez Flick)
- [could] galerie: Page film (Like Share Workflow), no  (S24)
- [could] galerie: Pourboires en crédits, no  (S26)
- [could] galerie: Profil créateur, no  (S25)
- [could] galerie: Publier avec le workflow, no  (F09)
- [could] galerie: Retraits en argent (cash-out), no  (S27 obligations légales de paiement)
- [could] partage: Collaboration temps réel sur le canvas, no  (CRDT)
- [could] partage: Commentaires, no
- [could] galerie: Galerie publique de films, partial  (S23 | clone: démonstration statique)

## Left out on purpose (not scored)
- Bibliothèque Flickpedia de plans de films: contenu sous droits ; possible avec ta propre bibliothèque
- Les 900+ styles de Flick: reconstruire le système avec tes presets
- Modèle maison Flick: propriété de FlickArt
- Midjourney: pas d'API publique officielle
- Entraînement de modèles sur mesure (Enterprise): hors de portée au lancement
- Communauté (films Discord festival résidence): le réseau ne se clone pas

## Yours, not in the original (not scored)
- Agent : vérifier le coût total avant un lot
- Agent : messages d'erreur humains avec bouton d'action
- Agent : répond toujours dans la langue de l'utilisateur
- Nœud : modifier le prompt en place et relancer

## Screens
- replica/clone-screens/diff/S03.png        24.7
- replica/clone-screens/diff/S17.png        29.3
- replica/clone-screens/diff/S07-916.png    30.0
- replica/clone-screens/diff/S15.png        31.4
- replica/clone-screens/diff/S09.png        36.7
- replica/clone-screens/diff/S11.png        39.5
