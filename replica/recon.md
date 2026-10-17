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
| 23 | ton propre compte (captures) | https://flick.art/projects?tab=home | 13 captures du 2026-10-17 dans `replica/screens/` (locales, hors git) : accueil, galerie, toile + agent, menu +, éditeur vidéo, plateau 3D, histoire, nœud sélectionné + menu, panneaux flottants |

## Boucle principale

**Dire à l'agent ce qu'on veut**, et il fait tout : il écrit, découpe en plans,
génère les images avec des personnages cohérents, les anime en vidéo, range la
toile et monte le film. L'utilisateur dirige ; le canvas est l'endroit où il
voit et retouche le travail de l'agent. Tout part d'une seule boîte de prompt
(accueil) ou du chat (dans le projet).

## Écrans

| ID | écran | route / accès | rôle | composants clés | états vus |
| --- | --- | --- | --- | --- | --- |
| S01 | Accueil marketing | `/` | convertir | hero, galerie de films, tarifs, CTA Get Started | rempli |
| S02 | Connexion / inscription | `/auth` | compte | email, Google (supposé), 300 crédits offerts | vide, erreur |
| S03 | Accueil (onglet ACCUEIL) | `/projects?tab=home` | démarrer un projet en parlant à l'agent | bandeau d'annonce en haut (festival, bouton EN SAVOIR PLUS) ; titre « Quelle histoire veux-tu créer aujourd'hui ? » + sous-titre « Demandez à l'agent… » ; grande boîte de prompt avec placeholder d'exemple, trombone, icône note, PAS DE STYLE, ratio 16:9, bouton micro rond (voix/envoi) ; 6 puces de démarrage : Du script au film, Du prompt au film, Créer des personnages, Partir d'un style, Toile vierge, Visite guidée ; « Projets récents » (cartes : vignette, titre tronqué, « Modifié <date> ») + lien Tous les projets → ; « Créé avec Flick » (grille 3 colonnes de films) + lien Flick TV → | vide, rempli — **vu** |
| S04 | Espace de travail (onglet ESPACE DE TRAVAIL) | barre du haut | tous ses projets | cartes projet + menu (privé/partagé, renommer, supprimer), switcher de workspace | contenu exact à confirmer (capture manquante) |
| S04b | Barre globale | toutes les pages connectées | navigation | logo ; onglets ACCUEIL (point rouge = actif), ESPACE DE TRAVAIL, FLICK TV, FLICKPÉDIA ; cloche de notifications ; bouton noir + CRÉER ; badge crédits (point rouge + solde, ex. 125) ; avatar rond | — **vu** |
| S05 | Explore Styles (modale) | S03 ou barre du canvas → « No style » | choisir un style | grille de 900+ styles, recherche, Create My Style | rempli |
| S06 | Create My Style (modale) | S05 | style perso | upload de 1 à 5 images de référence | vide, upload, erreur |
| S07 | Toile (canvas) | onglet TOILE d'un projet | voir et retoucher le travail de l'agent | barre projet : logo, nom du projet tronqué, Flickpedia, onglets HISTOIRE / TOILE / PLATEAU 3D / ÉDITEUR VIDÉO, cloche, Partager, crédits, avatar ; barre d'outils verticale flottante à gauche : poignée, + (noir), sélection, section, texte T, grille, assets, script, monteur, réglages, zoom en % (43 %) ; sections à fond bleu clair avec en-tête repliable (chevron + nom) ; nœuds titrés en ligne reliés par des traits fins ; nœud vidéo avec bouton lecture ; placeholder pointillé « Image vers vidéo · Prêt à générer vidéo » | vide, rempli, génération en cours, placeholder — **vu** |
| S08 | Panneau d'un nœud (sous le nœud) | sélectionner un nœud | régler une génération | dropdown modèle (cadenas si hors plan), prompt avec @, 1x lot, engrenage, Run + coût | par défaut, verrouillé (« Upgrade »), en cours, signalé (flagged), échec |
| S09 | Menu + de la toile | bouton + de la barre gauche | ajouter un nœud | Téléverser, Note textuelle, Générer une image, Générer une vidéo › (sous-menu), Générer une voix, Générer de la musique | — **vu** |
| S09b | Nœud sélectionné : barre + carte + menu | clic sur un nœud (plusieurs à la fois possible, chacun garde sa barre et son menu) | agir sur un média | **barre flottante au-dessus** : cœur (favori), archiver, titre + crayon (renommer), télécharger, plein écran, dupliquer, fermer ; **carte** : média (vidéo avec lecture, curseur, son), dimensions « 864 × 1536px » (+ « 15.1s » pour une vidéo), prompt surligné en jaune tronqué + copier le prompt + « Voir plus ⌄ » ; **menu à droite** : Régénérer │ Image ›, Vidéo ›, Audio ›, Enregistrer comme style (image) │ Ajouter au dossier ›, Ajouter à la timeline, Convertir en 3D (image) | image, vidéo — **vu** ; sous-menus Image/Vidéo/Audio = Edit Image, Change Style, Remove background, Character Reference, Generate Video, Generate Voice, Extract Frame (doc) |
| S10 | Agent (panneau de droite, pleine hauteur) | toujours ouvert dans un projet, repliable (») | **le cœur du produit : l'agent fait tout** | en-tête : replier », icône de l'agent, titre de la conversation + liste déroulante (plusieurs conversations par projet), vignette du nœud sélectionné, nouvelle note, + nouvelle conversation ; puces de suggestion (ex. « Revoir le raccord d'abord ») ; message utilisateur en bloc encadré aligné à droite ; **carte d'action** (nom de l'action + statut, ex. « Lancer la génération · Échoué » en rouge avec le détail) ; réponse de l'agent en texte riche avec **puces d'asset inline** (vignette + nom, cliquables vers le nœud) et **boutons inline** (ex. « recharger les crédits ») ; lien Besoin d'aide ; saisie « Brainstorme ou crée n'importe quoi avec le chat · @ pour référencer une ressource », trombone, @, sélecteur de modèle « Auto ^ », bouton micro rond | vide, en réflexion, actions en cours, action échouée, crédits épuisés (ouvre la fenêtre de recharge) — **vu** |
| S11 | Histoire | onglet HISTOIRE | le document de projet que l'agent lit et remplit | **éditeur à blocs** (poignées + et T au survol d'un bloc), pleine largeur ; modèle pré-rempli : note en italique « Ceci est un modèle… demandez à l'agent de l'écrire », puis 4 sections titrées avec une ligne d'aide : **Brief** (ce qu'est le film, pour qui), **Narration** (ce qui se passe, dans l'ordre), **Direction créative** (esthétique, ton, références), **Scénario** (bloc au format scénario sur fond gris : INT./EXT., action, dialogue) ; mini-plan des sections à gauche (traits) ; réglages en haut à droite (curseurs) ; bouton « Passer cette étape » en bas à gauche (visite guidée) | modèle, rempli par l'agent — **vu** ; l'éditeur de scénario décrit par la doc (rail des scènes, puces de type) vit dans le bloc Scénario |
| S12 | Import de script (modale) | S11 → Upload | importer .fountain/.txt/.fdx/.pdf/.docx | Import as-is / Let AI read it / Open chat | analyse, lignes incertaines, PDF scanné |
| S13 | Ressources (panneau flottant) | bouton images de la barre gauche (bouton actif = rond gris) | médiathèque du projet sans quitter la toile | même panneau que l'éditeur vidéo : Tout / Favoris / Archivé │ Enregistré, filtrer, trier, chercher, replier tout, +, liste/grille ; groupes par section avec **viseur (centrer la toile sur la section)**, crayon, compteur ; Non groupés ; ligne sélectionnée = nœud sélectionné | rempli — **vu** |
| S11b | Histoire (panneau flottant) | bouton document de la barre gauche | lire le brief en travaillant sur la toile | le document Histoire en panneau central par-dessus la toile, à côté des Ressources | — **vu** |
| S14 | Sélecteur de voix (modale) | nœud Generate Voice → Select voice | choisir une voix | onglet Explore, recherche, filtres langue/âge/genre/usage, aperçu au survol, Use | rempli |
| S15 | Éditeur vidéo | onglet ÉDITEUR VIDÉO | monter le film (ou le laisser monter par l'agent) | **3 colonnes + timeline**. Gauche : onglets RESSOURCES / SFX / EFFETS / TRANSITIONS ; 3 boutons d'affichage des panneaux ; filtres Tout / Favoris / Archivé │ Enregistré avec compteurs ; outils filtrer, trier, chercher, +, vue liste / grille ; ressources **groupées par section de la toile** (nom, crayon, compteur) puis « Non groupés » ; ligne : vignette, titre, + pour ajouter, durée (15s). Centre : aperçu ; état vide « Transformez vos plans en vidéo » + bouton noir **« Laisser l'agent construire ma timeline »** + « ou glissez un plan depuis le panneau Ressources ». Droite : propriétés (« Sélectionnez un clip pour afficher ses propriétés »). Barre de timeline : aide ?, zoom −/+, ratio (9:16), 30 fps, lecture + timecode 00:00:00 / 00:00:00, plein écran, sélection, ciseaux, rogner gauche / couper / rogner droite (grisés sans clip), aimant, magnétisme, sous-titres CC, texte T, **Exporter**. Règle avec tête de lecture en pastille rouge ; piste « Principal » avec haut-parleur et curseur de volume ; barre de défilement horizontale | vide — **vu** ; rempli, sous-titres en cours |
| S16 | Export (modale) | S15 → Export | sortir le film | 720p/1080p/4K, filigrane (forcé en Free/Casual), Rendering, Download again, Recent exports, Publier sur la galerie | rendu, terminé, échec |
| S17 | Plateau 3D | onglet PLATEAU 3D | mise en scène 3D | barre : + et onglet « Scène 1 », **Répéter** (lecture), **Enregistrer** (point rouge), bascule Scène / Caméras, bascule 3D / 2D ; viewport sombre avec grille, axes colorés, sphère d'orientation en haut à droite, mannequin humanoïde étiqueté « Humain 1 », pyramide de caméra en filaire ; mini-barre gauche : +, lasso, image, aide ; panneau droit : onglets Ajouter un composant / Mes composants, recherche, liste (Caméra 1, Humain 1) ; timeline en bas : aimant, bouton **Tutoriel** (pastille rouge), règle en secondes, une piste par objet (Caméra 1) avec des **blocs d'action** (ex. « Orbite ») et « Ajouter une action + », + pour ajouter une piste, « Passer cette étape » | scène par défaut (1 caméra + 1 humain) — **vu** ; enregistrement |
| S18 | Partage (modale) | Share en haut à droite | collaborer | invitation email (can edit / can view), lien (no access / view / edit), Copy link | privé, partagé |
| S19 | Flickpedia (panneau) | bouton à côté du nom du projet | références de plans | recherche, grille de plans, Add to Canvas | rempli |
| S20 | People / workspace | switcher en haut à gauche → People | gérer l'équipe | inviter, relancer/révoquer, retirer, conso par membre | solo, équipe |
| S21 | Tarifs | `/pricing` | vendre | 5 plans, mensuel/annuel −20 %, recharge de crédits | — |
| S22 | Facturation / crédits | compte | payer | solde, plan, factures, annulation, Earn Credits (parrainage, Discord) | — |
| S23 | Galerie publique (Flick TV) | `/tv`, et section « Créé avec Flick » de l'accueil | regarder, inspirer | carte film : vignette 16:9 avec durée en badge (bas droite) et titre en surimpression, puis titre, avatar + nom du créateur, compteurs (copies du workflow, j'aime, pourboires en k) | rempli — **vu** |
| S32 | Visite guidée | puce « Visite guidée » de l'accueil, puis bouton « Passer cette étape » sur Histoire, Toile, Plateau 3D, Éditeur | apprendre le produit pas à pas | étapes par onglet, bouton Passer cette étape, Tutoriel | — **vu** (présence du bouton) |
| S30 | Notifications | cloche de la barre du haut | suivre générations, invitations, pourboires | liste (supposée) | à confirmer |
| S31 | Fenêtre de recharge / upgrade | crédits épuisés, Run verrouillé, bouton inline de l'agent | vendre | plans, packs de crédits (supposé) | à confirmer |
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

F00 Tout faire en parlant à l'agent (le flux principal)
    S03 prompt (ou puce « Du prompt au film ») -> projet créé -> S10 l'agent planifie,
    crée une section, génère les images, puis les vidéos (cartes d'action) -> S07 se remplit
    -> l'agent monte le film dans S15 -> S16 export
    clics : 2 pour démarrer, puis des validations dans le chat
    outils de l'agent vus dans les cartes d'action : Lancer la génération, Lire la timeline,
    Regarder le média, Modifier la timeline (+ boutons inline « Watch the timeline »)
    cas limites : crédits épuisés en plein lot (vu : 1 génération sur 2 lancée, l'agent
    s'arrête et propose la recharge), action échouée, l'agent modifie ce qu'on n'a pas
    demandé, référence ambiguë (« la seconde ») -> l'agent renvoie des puces d'asset

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
    raccourci vu : S15 vide -> « Laisser l'agent construire ma timeline » -> l'agent lit la
    timeline, regarde les médias, ajoute les clips (0:00–0:15.07) et dit ce qui manque
    à la main : S15 glisser les clips sur Main -> trim/split -> musique -> texte -> captions -> S16 Export -> Download
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
| Connexion entre nœuds | courbe de Bézier grise fine ; entrée prompt, start frame, end frame, référence | — | S07 |
| Barre flottante de nœud | image, vidéo | — | S09b |
| Carte média | image (dimensions), vidéo (lecteur + durée) ; prompt surligné, Voir plus | repliée, dépliée | S09b |
| Section | — | nommée, colorée, verrouillée, repliée | S07 |
| Barre d'outils verticale | canvas, 3D | outil actif | S07, S17 |
| Contrôle de zoom | — | 50 %, 100 %, 200 %, ajuster | S07 |
| Modale | style, voix, import, partage, export, tip | ouverte, chargement, erreur | S05, S06, S12, S14, S16, S18, S26 |
| Grille de cartes | style, projet, film, plan Flickpedia | vide, chargement, remplie | S04, S05, S19, S23 |
| Lecteur vidéo | aperçu du monteur, page de film | lecture, pause, plein écran | S15, S24 |
| Piste de timeline | Main (aimant), Music, Text, 3D | clip sélectionné, rognage, aimantation | S15, S17 |
| Panneau de propriétés | clip, objet 3D | — | S15, S17 |
| Puce de type de ligne | Scene, Action, Character, Dialogue, Shot, Parenthetical, Transition, Act | — | S11 |
| Carte d'action de l'agent | en cours, réussie (coche grise, ex. « Lire la timeline »), échouée (rouge), avec chevron pour voir le détail | repliée, dépliée | S10 |
| Éditeur à blocs | titre, paragraphe, note italique, bloc scénario | survol (poignées + T), focus | S11 |
| Liste de ressources groupée | groupe = section de la toile, Non groupés | replié, déplié, survol (+) | S15 |
| Bascule segmentée | Scène/Caméras, 3D/2D | actif, inactif | S17 |
| Bloc d'action de timeline 3D | ex. Orbite | sélectionné, redimensionné | S17 |
| Bouton « Passer cette étape » | — | — | S11, S17 |
| Puce d'asset inline | image (vignette), vidéo (▷), section | survol, clic = sélectionne le nœud | S10 |
| Puce de suggestion / démarrage | pilule à bord fin | défaut, survol | S03, S10 |
| Sélecteur de conversation | liste déroulante | — | S10 |
| Carte projet | vignette + titre + date de modif | survol, menu | S03, S04 |
| Carte film | vignette + durée + créateur + compteurs | survol (lecture) | S03, S23 |
| Bandeau d'annonce | image de fond + texte + bouton | fermable (supposé) | barre du haut |
| Bouton micro rond | noir | repos, enregistrement | S03, S10 |
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
Conversation  id, project_id, user_id, title, created_at
              preuve : liste déroulante + bouton « + » dans S10 ; confiance : élevée
ChatMessage   id, conversation_id, user_id, role, content (texte riche avec
              références d'assets), attachments, model (auto | …)
AgentAction   id, message_id, tool (generate_image | generate_video | create_section |
              edit_timeline | …), input (json), status (running | done | failed),
              error, generation_ids
              preuve : carte « Lancer la génération · Échoué » ; confiance : élevée
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
1-n Node, Edge, Section, Asset, Generation, ChatMessage ; Project 1-n Conversation 1-n ChatMessage 1-n AgentAction ; Project 1-1 Script,
Timeline, Stage3D ; Workspace 1-n CreditLedger ; Project 1-n Film ; Film 1-n
Tip, Comment.

## Matrice des fonctions

Voir `features.csv`. Must : 63, should : 48, could : 18, skip : 6.

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

Écrans 36, flux 15, entités 27. Parties difficiles :
1. **L'agent qui fait tout** : un LLM avec appels d'outils sur le canvas, le
   script, les générations et la timeline ; planification multi-étapes,
   cartes d'action, reprise propre quand une étape échoue ou que les crédits
   manquent. C'est le cœur du produit, pas un bonus.
2. **Canvas à nœuds performant** avec collaboration temps réel (CRDT type Yjs).
3. **Orchestration des générations** : files de jobs asynchrones sur ~10
   fournisseurs, webhooks, reprise sur échec, modération, coût en crédits
   calculé avant le Run et débité de façon atomique.
4. **Monteur vidéo dans le navigateur + rendu serveur** (FFmpeg ou Remotion),
   captions, export 4K.
5. 3D Stage (Three.js) avec enregistrement de caméra.
6. Économie de crédits : abonnements, recharges, pool d'équipe, pourboires,
   retraits en argent réel (obligations légales de paiement aux créateurs).

Taille : **XL** — à redécouper. Plan proposé en phases livrables :
- **Phase 1 (M)** : comptes, accueil avec la boîte de prompt, **agent avec
  appels d'outils**, canvas, nœuds texte/image/vidéo, styles, référence de
  personnage, crédits + Stripe. Déjà vendable.
- **Phase 2 (M)** : monteur + export, voix et dialogue, assets.
- **Phase 3 (M)** : script + import, agent sur le script et la timeline, partage et équipes.
- **Phase 4 (L)** : collaboration temps réel, 3D Stage, galerie publique,
  pourboires et retraits.

## Trous à combler (avec ton propre compte)

Accueil, galerie, toile, agent, menu +, histoire, éditeur vidéo et plateau
3D : **vus** (captures dans `replica/screens/`, locales et hors git, jamais
livrées). Il manque encore : ESPACE DE TRAVAIL, une carte projet avec son menu
ouvert, le panneau de réglages d'un nœud de génération (modèle, Run + coût), l'éditeur avec des clips
sur la timeline, la fenêtre de recharge, les notifications.

Note : l'exemple de scénario pré-rempli dans Histoire vient d'un court métrage
de Flick (« SLOP »). Le clone aura son propre modèle d'exemple.

## À faire mieux que l'original (vu sur les captures)

- L'erreur d'action affiche le message technique brut destiné au modèle
  (« triggered 1 placeholder action(s)… Don't retry generation — tell the
  user… »). Le clone montre un message humain et un bouton d'action.
- Crédits épuisés en plein lot : une génération part, l'autre non. Le clone
  vérifie le coût total du lot avant de lancer quoi que ce soit.
- Les titres de nœuds se chevauchent dans une section serrée. Le clone les tronque proprement.
- L'agent répond en anglais (« Added the completed first sequence… ») alors que
  l'interface et l'utilisateur sont en français. Le clone répond toujours dans
  la langue de l'utilisateur.
- Le prompt complet est caché derrière « Voir plus » et coupé en 3 lignes ; le
  clone permet de le modifier en place et de relancer (Régénérer avec ce prompt).
- Les ressources de l'éditeur ont des noms coupés (« Voiture Télécommandée - Sé… »)
  sans infobulle. Le clone affiche le nom complet au survol.
