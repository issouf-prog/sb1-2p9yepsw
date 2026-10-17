# Carte de recon : Flick (flick.art, web)

Périmètre : tout Flick — page Projets, canvas à nœuds, script, agent IA, images,
vidéo, audio, monteur vidéo, 3D Stage, workspaces/équipes, crédits et
abonnements, galerie publique (Flick TV), bibliothèque de références (Flickpedia).
Pour : un produit SaaS à vendre, sous une marque à toi (concurrent de Flick).
Date : 2026-10-17

Règle : on reconstruit **ce que Flick fait** (fonctions, flux, UX), pas ce que
Flick possède (code, logo, nom, textes, visuels, films de la communauté, base
Flickpedia). Sources : pages publiques uniquement. Les CGU de Flick
(https://flick.art/terms) n'ont pas de clause anti-concurrence ni anti-reverse
engineering ; la section 7.1 réserve le logiciel et les modèles à FlickArt —
on n'en prend rien.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | site marketing | https://flick.art/ | positionnement, boucle principale, tarifs résumés |
| 2 | tarifs | https://flick.art/pricing | plans, crédits, fonctions réservées par plan, équipes |
| 3 | index de la doc | https://flick.art/docs | ~80 articles, la meilleure liste de fonctions |
| 4 | créer un projet | https://flick.art/docs/create-your-first-project | page Projets, prompt, styles, ratio, premier canvas |
| 5 | navigation | https://flick.art/docs/navigation | barre d'outils, souris, raccourcis, zoom |
| 6 | Generate Image | https://flick.art/docs/generate-image | nœud image, modèles, lot, Run + coût, états |
| 7 | Generate Video | https://flick.art/docs/video | Frame to Video, start/end frame, durée, résolution |
| 8 | agent | https://flick.art/docs/talking-to-the-agent | chat, @références, actions, limites |
| 9 | script | https://flick.art/docs/script-view-basics | éditeur de scénario, import/export, onglets |
| 10 | monteur | https://flick.art/docs/timeline-basics | timeline, pistes, outils, propriétés |
| 11 | export | https://flick.art/docs/export-your-film | 720p/1080p/4K, filigrane, exports récents |
| 12 | partage | https://flick.art/docs/collaborationandshare | privé/partagé, invitations, liens, temps réel |
| 13 | workspaces | https://flick.art/docs/workspaces | rôles, pool de crédits, page People |
| 14 | sections et dossiers | https://flick.art/docs/sections-and-folders | groupes canvas, verrou, repli, dossiers d'assets |
| 15 | référence personnage | https://flick.art/docs/character-reference | planche 3 vues, slots Character / Reference Scene |
| 16 | voix | https://flick.art/docs/text-to-voice | Generate Voice, speakers, Seed Audio |
| 17 | 3D Stage | https://flick.art/docs/3D-stage-basic | scènes, composants, caméras, Rehearse/Record |
| 18 | coûts des modèles | https://flick.art/docs/model-credit-cost | ~70 modèles et leur coût en crédits |
| 19 | Flick TV / pourboires | https://flick.art/docs/tips | galerie, pourboires, retrait 250 crédits = 1 $ |
| 20 | outil storyboard | https://flick.art/tools/ai-storyboard-generator | page SEO d'outil, FAQ, liste des autres outils |
| 21 | CGU | https://flick.art/terms | propriété des sorties à l'utilisateur (5.2b) |
| 22 | fiche YC | https://www.ycombinator.com/companies/flick | positionnement |
| 23 | ton propre compte | https://flick.art/projects?tab=home | **à faire** : captures de tes écrans (voir « Trous ») |

## Boucle principale

Écrire une idée → générer des plans (images) cohérents avec ses personnages →
les animer en clips vidéo → les monter en film, le tout sur un seul canvas.

## Écrans

| ID | écran | route / accès | rôle | composants clés | états vus |
| --- | --- | --- | --- | --- | --- |
| S01 | Accueil marketing | `/` | convertir | hero, galerie de films, tarifs, CTA Get Started | rempli |
| S02 | Connexion / inscription | `/auth` | compte | email, Google (supposé), 300 crédits offerts | vide, erreur |
| S03 | Projets — Home | `/projects?tab=home` | démarrer un projet | boîte de prompt, sélecteur de style, ratio, bouton Blank canvas, entrée Script to Film, liste des projets récents (supposée) | vide (nouveau compte), rempli |
| S04 | Projets — autres onglets | `/projects?tab=…` | parcourir ses projets | cartes projet + menu (privé/partagé, renommer, supprimer), switcher de workspace | vide, rempli — **onglets exacts à confirmer** |
| S05 | Explore Styles (modale) | S03 ou barre du canvas → « No style » | choisir un style | grille de 900+ styles, recherche, Create My Style | rempli |
| S06 | Create My Style (modale) | S05 | style perso | upload de 1 à 5 images de référence | vide, upload, erreur |
| S07 | Canvas | onglet Canvas d'un projet | cœur du produit | canvas infini, nœuds, connexions, barre d'outils gauche, ratio + style épinglés en haut, Share, Flickpedia, chat à droite/en bas, zoom | vide, rempli, génération en cours, hors écran |
| S08 | Panneau d'un nœud (sous le nœud) | sélectionner un nœud | régler une génération | dropdown modèle (cadenas si hors plan), prompt avec @, 1x lot, engrenage, Run + coût | par défaut, verrouillé (« Upgrade »), en cours, signalé (flagged), échec |
| S09 | Menu contextuel d'un nœud | clic droit / menus Image, Video, Audio | enchaîner une action | Edit Image, Change Style, Remove background, Character Reference, Generate Video, Generate Voice, Extract Frame | — |
| S10 | Chat de l'agent | panneau du canvas, du script, de la 3D | piloter par la langue | vignettes des nœuds sélectionnés, trombone, voix, @asset, Chat rules, Personalize, rapport d'actions | vide, réponse, actions proposées, erreur |
| S11 | Script | onglet Script | écrire le scénario | rail des scènes (actes), page de scénario avec puces de type de ligne, police, Upload, Download | exemple pré-rempli, vide (« Nothing to download yet »), import incertain |
| S12 | Import de script (modale) | S11 → Upload | importer .fountain/.txt/.fdx/.pdf/.docx | Import as-is / Let AI read it / Open chat | analyse, lignes incertaines, PDF scanné |
| S13 | Assets | barre d'outils → Assets | médiathèque du projet | dossiers, Ungrouped, Add to folder, uploads | vide, rempli |
| S14 | Sélecteur de voix (modale) | nœud Generate Voice → Select voice | choisir une voix | onglet Explore, recherche, filtres langue/âge/genre/usage, aperçu au survol, Use | rempli |
| S15 | Monteur vidéo | onglet Video Editor (ou panneau flottant Player + timeline) | monter le film | panneau Assets (ASSETS/SFX/EFFECTS/TRANSITIONS), aperçu, Properties (PROPERTIES/COLOR/EFFECTS), timeline Main/Music/Text, barre d'outils | vide, rempli, captions en cours (timeline verrouillée) |
| S16 | Export (modale) | S15 → Export | sortir le film | 720p/1080p/4K, filigrane (forcé en Free/Casual), Rendering, Download again, Recent exports, Publier sur la galerie | rendu, terminé, échec |
| S17 | 3D Stage | onglet 3D Stage | mise en scène 3D | onglets de scènes, bibliothèque de composants (Human, Camera, Target, primitives, animaux), Properties, gizmo W/E/R, timeline par piste, Rehearse, Record, moniteurs caméra, chat | scène vide, remplie, enregistrement |
| S18 | Partage (modale) | Share en haut à droite | collaborer | invitation email (can edit / can view), lien (no access / view / edit), Copy link | privé, partagé |
| S19 | Flickpedia (panneau) | bouton à côté du nom du projet | références de plans | recherche, grille de plans, Add to Canvas | rempli |
| S20 | People / workspace | switcher en haut à gauche → People | gérer l'équipe | inviter, relancer/révoquer, retirer, conso par membre | solo, équipe |
| S21 | Tarifs | `/pricing` | vendre | 5 plans, mensuel/annuel −20 %, recharge de crédits | — |
| S22 | Facturation / crédits | compte | payer | solde, plan, factures, annulation, Earn Credits (parrainage, Discord) | — |
| S23 | Galerie publique (Flick TV) | `/tv` | regarder, inspirer | cartes de films, compteur de pourboires | rempli |
| S24 | Page d'un film | `/tv/…` | regarder | lecteur, Like, Share, Tip, Workflow (ouvre le canvas du film), commentaires | — |
| S25 | Profil créateur | depuis S24 | vitrine | films, pourboires | — |
| S26 | Pourboire (modale) | S24 → Tip | soutenir | 50/200/1000 ou montant libre ≥ 5, anonyme, note 200 car. | — |
| S27 | Retrait (cash-out) | compte | payer les créateurs | solde retirable, seuil 20 $, 250 crédits = 1 $ | sous le seuil, éligible |
| S28 | Pages outils SEO | `/tools/*` | acquisition | prompt d'exemple, galerie, FAQ, CTA | — |
| S29 | Docs | `/docs/*` | aide | sommaire latéral, articles | — |

## Flux

```
F01 Nouveau projet depuis un prompt
    S03 (prompt + style + ratio) -> S07 canvas avec l'agent qui commence
    clics du chemin nominal : 2 (taper, Entrée)
    cas limites : prompt vide, crédits à 0, prompt signalé

F02 Canvas vide -> première image
    S03 Blank canvas -> S07 -> + Generate Image -> S08 (modèle, prompt) -> Run
    clics : 4
    cas limites : modèle verrouillé (Run devient « Upgrade »), résultat hors écran, flagged

F03 Personnage cohérent sur plusieurs plans
    S10 « décris le personnage » -> planche 3 vues -> section nommée + verrouillée
    -> image sélectionnée -> S09 Image > Character Reference -> S08 (Character ≤5, Reference Scene ≤5, prompt) -> Run
    clics : ~6
    cas limites : dérive du personnage, plus de 5 images, fonction réservée au plan Standard+

F04 Image -> clip vidéo
    sélectionner l'image -> S09 Video > Generate Video -> S08 (modèle ou Auto, durée, résolution, end frame optionnel) -> Run
    clics : 4
    cas limites : ratio imposé par le modèle (avis orange), mouvement non conforme, échec, coût élevé

F05 Écrire ou importer un scénario puis générer les plans
    S11 écrire (Entrée devine le type de ligne) ou S12 importer -> S10 « construis les plans de la scène 3 » -> nœuds sur S07
    cas limites : lignes au type incertain, PDF scanné, collaborateur non propriétaire (non sauvegardé)

F06 Script to Film
    S03 Script to Film -> coller/importer le script -> projet créé avec scènes et plans
    (détail à confirmer avec ton compte)

F07 Voix et dialogue
    + Generate Voice (ou image perso > Audio > Generate Voice) -> S14 choisir une voix -> réplique avec [indications] -> Run
    -> Character Dialogue (image + audio -> lipsync)
    cas limites : plusieurs speakers (un seul modèle les gère), référence vidéo sans piste audio

F08 Monter et exporter le film
    S15 glisser les clips sur Main -> trim/split -> musique -> texte -> captions -> S16 Export -> Download
    clics : ~8 pour un montage minimal
    cas limites : trou au début de la timeline, captions qui verrouillent la timeline, rendu en échec, filigrane

F09 Publier sur la galerie
    S16 -> Publier (workflow partagé par défaut, désactivable) -> S24
    cas limites : assets qui ne t'appartiennent pas, modération

F10 Mise en scène 3D -> plan de référence
    S17 + Add component (Human, Camera) -> placer -> Rehearse -> Record -> clip envoyé sur S07 comme référence de mouvement

F11 Partager un projet
    S18 inviter par email (can view) ou lien -> l'invité ouvre S07
    cas limites : projet encore Private, lien sur « no access »

F12 Inviter l'équipe et partager les crédits
    S20 inviter par email -> le membre accepte (avec ou sans compte) -> projets Shared visibles, pool de crédits commun
    cas limites : pool à 0 bloque tout le monde, le membre ne peut pas payer

F13 S'abonner / recharger
    S21 choisir un plan -> paiement -> crédits crédités ; recharge ponctuelle à tout moment

F14 Donner un pourboire et retirer
    S24 Tip -> S26 -> crédits transférés ; créateur : S27 dès 20 $ cumulés
```

## Composants

| composant | variantes | états | utilisé sur |
| --- | --- | --- | --- |
| Bouton | primaire, secondaire, fantôme, danger, Run (avec coût) | défaut, survol, focus, désactivé, en cours, verrouillé (« Upgrade ») | partout |
| Boîte de prompt | accueil (grande), panneau de nœud, chat | vide, rempli, @ ouvert, envoi | S03, S08, S10 |
| Sélecteur @asset | nœuds, sections, assets | liste, recherche, aucun résultat | S08, S10 |
| Dropdown de modèle | image, vidéo, audio, édition | disponible, verrouillé, plage de coût | S08 |
| Compteur de lot « 1x » | 1 à 4 | — | S08 |
| Nœud canvas | texte, image, vidéo, audio, génération (placeholder), 3D | inactif, sélectionné, en cours, terminé, échec, signalé | S07 |
| Connexion entre nœuds | entrée prompt, start frame, end frame, référence | — | S07 |
| Section | — | nommée, colorée, verrouillée, repliée | S07 |
| Barre d'outils verticale | canvas, 3D | outil actif | S07, S17 |
| Contrôle de zoom | — | 50 %, 100 %, 200 %, ajuster | S07 |
| Modale | style, voix, import, partage, export, tip | ouverte, chargement, erreur | S05, S06, S12, S14, S16, S18, S26 |
| Grille de cartes | style, projet, film, plan Flickpedia | vide, chargement, remplie | S04, S05, S19, S23 |
| Lecteur vidéo | aperçu du monteur, page de film | lecture, pause, plein écran | S15, S24 |
| Piste de timeline | Main (aimant), Music, Text, 3D | clip sélectionné, rognage, aimantation | S15, S17 |
| Panneau de propriétés | clip, objet 3D | — | S15, S17 |
| Puce de type de ligne | Scene, Action, Character, Dialogue, Shot, Parenthetical, Transition, Act | — | S11 |
| Toast / avis | info, avertissement orange (ratio), erreur, signalé | — | partout |
| Badge de crédits | solde, coût | bas, zéro | barre du haut, S08 |
| Switcher de workspace | perso, équipe | — | barre du haut |

## Modèle de données déduit

```
User          id, email, name, avatar, locale, created_at
              preuve : S02, sélecteur de langue ; confiance : élevée
Workspace     id, name, owner_id, plan, credit_balance, personal (bool)
              preuve : docs Workspaces ; confiance : élevée
Membership    workspace_id, user_id, role (owner | member), joined_at
Invite        id, workspace_id | project_id, email, role, status (pending | accepted | revoked)
              preuve : page People, partage par email ; confiance : élevée
Project       id, workspace_id, creator_id, name, aspect_ratio, style_id,
              visibility (private | shared), link_access (none | view | edit),
              thumbnail, updated_at
              preuve : S03, S07, S18 ; confiance : élevée
ProjectGuest  project_id, email/user_id, access (view | edit)
Node          id, project_id, type (text | image | video | audio | generator | 3d),
              x, y, w, h, name, color, section_id, data (json : prompt, model,
              settings, asset_id, status)
              preuve : S07, S08 ; confiance : moyenne (le schéma exact est supposé)
Edge          id, project_id, from_node, to_node, role (prompt | start_frame | end_frame |
              character_ref | scene_ref | omni_ref)
              confiance : moyenne
Section       id, project_id, name, color, locked, collapsed, x, y, w, h
Generation    id, project_id, node_id, user_id, kind (image | video | audio | edit | upscale),
              model, params (json), cost_credits, status (queued | running | done |
              failed | flagged), provider_job_id, output_asset_ids, created_at
              preuve : bouton Run + coût, « Where is my generation », « flagged » ; confiance : élevée
Asset         id, project_id, folder_id, kind (image | video | audio | doc), url,
              width, height, duration, source (generated | uploaded), created_at
Folder        id, project_id, name
Style         id, name, preview_url, prompt_suffix, owner_id (null = catalogue),
              reference_asset_ids (≤5)
Script        project_id, content (json : lignes typées), font
ScriptScene   id, project_id, order, act, heading, characters[]  (dérivé du contenu)
Timeline      id, project_id, aspect_ratio, tracks (json : Main | Music | Text, clips
              avec asset_id, start, in, out, speed, volume, fades, transitions, effects)
              confiance : moyenne
Export        id, project_id, resolution (720p | 1080p | 4k), watermark, status, url, created_at
Stage3D       id, project_id, scenes (json : objets, caméras, pistes d'animation)
              confiance : supposée
ChatMessage   id, project_id, user_id, role, content, attachments, actions (json)
ChatRules     user_id, rules, personalization
CreditLedger  id, workspace_id, user_id, delta, reason (plan | topup | generation |
              refund | tip_in | tip_out | referral | weekly_free), generation_id, created_at
              preuve : « How credits work », conso par membre ; confiance : élevée
Subscription  workspace_id, plan (free | casual | standard | pro | studio | enterprise),
              interval (month | year), stripe_ids, renews_at
Film          id, project_id, creator_id, title, video_url, share_workflow (bool),
              likes, tips_total, published_at
Tip           id, film_id, from_user, to_user, amount, anonymous, note (≤200), created_at
Comment       id, film_id, user_id, body, tip_id
Payout        id, user_id, credits, usd, status
Referral      referrer_id, referred_id, rewarded
```

Relations : User n-n Workspace (Membership) ; Workspace 1-n Project ; Project
1-n Node, Edge, Section, Asset, Generation, ChatMessage ; Project 1-1 Script,
Timeline, Stage3D ; Workspace 1-n CreditLedger ; Project 1-n Film ; Film 1-n
Tip, Comment.

## Matrice des fonctions

Voir `features.csv`. Must : 42, should : 34, could : 13, skip : 6.

## Hors périmètre (impossible ou interdit à cloner)

- **La marque Flick** : nom, logo, textes, « We Handle AI. You Direct Films »,
  noms Flick TV / Flickpedia → ta propre marque via `/replica-brand`.
- **Les modèles IA eux-mêmes** (Kling, Veo, Seedance, Nano Banana, Midjourney,
  ElevenLabs…) : on les loue via leurs API officielles ou un agrégateur
  (fal.ai, Replicate). Midjourney n'a pas d'API publique officielle → à exclure.
- **Le modèle maison « Flick »** et l'entraînement de modèles sur mesure.
- **La base Flickpedia** (1M+ plans de films classiques) : contenu sous droits.
  On peut construire la fonction, mais avec une bibliothèque à toi.
- **Les 900+ styles** : on reconstruit le système de styles, avec tes propres presets.
- **La communauté** : films, créateurs, Discord, festival, résidence, partenaires.

## Taille

Écrans 29, flux 14, entités 25. Parties difficiles :
1. **Canvas à nœuds performant** avec collaboration temps réel (CRDT type Yjs).
2. **Orchestration des générations** : files de jobs asynchrones sur ~10
   fournisseurs, webhooks, reprise sur échec, modération, coût en crédits
   calculé avant le Run et débité de façon atomique.
3. **Monteur vidéo dans le navigateur + rendu serveur** (FFmpeg ou Remotion),
   captions, export 4K.
4. Agent IA qui lit et modifie le canvas, le script et la timeline par appels d'outils.
5. 3D Stage (Three.js) avec enregistrement de caméra.
6. Économie de crédits : abonnements, recharges, pool d'équipe, pourboires,
   retraits en argent réel (obligations légales de paiement aux créateurs).

Taille : **XL** — à redécouper. Plan proposé en phases livrables :
- **Phase 1 (M)** : comptes, page Projets, canvas, nœuds texte/image/vidéo,
  styles, référence de personnage, crédits + Stripe. Déjà vendable.
- **Phase 2 (M)** : monteur + export, voix et dialogue, assets.
- **Phase 3 (M)** : script + import, agent IA, partage et équipes.
- **Phase 4 (L)** : collaboration temps réel, 3D Stage, galerie publique,
  pourboires et retraits.

## Trous à combler (avec ton propre compte)

La page `/projects?tab=home` est derrière connexion et n'est décrite nulle part
dans la doc. Pour la reproduire fidèlement (mise en page, onglets, cartes),
envoie des captures de **ton** compte : Home, les autres onglets, une carte de
projet avec son menu, le canvas vide, un nœud sélectionné et le monteur. Elles
iront dans `replica/screens/` comme référence (jamais livrées dans le clone).
