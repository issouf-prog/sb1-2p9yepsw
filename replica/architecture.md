# Architecture : ton studio de films IA (reconstruction des fonctions de Flick)

Lit : `replica/recon.md`, `replica/features.csv`. Schéma : `replica/schema.sql`
(chargé et testé sur Postgres 16 le 2026-10-17).

Principe : **l'agent est le produit**. Chaque action de l'interface (générer,
ranger, monter) est aussi un *outil* de l'agent. On code l'outil une fois et
les deux (bouton et agent) l'appellent.

## Stack

| couche | choix | pourquoi |
| --- | --- | --- |
| web | **Next.js 15 (App Router) + TypeScript** | pages publiques rendues côté serveur pour le SEO (accueil, pages outils, galerie, page film : c'est l'acquisition de Flick) + app très interactive côté client + routes serveur (webhooks, API) dans un seul projet. Le prototype Vite actuel est petit : on reprend ses composants |
| UI | **Tailwind + shadcn/ui (Radix) + lucide-react** | menus, modales, popovers accessibles sans réinventer ; tokens de `/replica-design` |
| toile | **React Flow (@xyflow/react, MIT)** | nœuds, connexions en courbes, sélection multiple, zoom, minimap : 80 % de S07 déjà fait |
| document Histoire | **TipTap (ProseMirror)** | éditeur à blocs, JSON lisible par l'agent, bloc scénario personnalisé |
| éditeur vidéo | **timeline maison en React** + aperçu HTML5 `<video>` | une timeline 3 pistes n'a pas besoin d'un moteur ; le rendu final se fait côté serveur |
| rendu / export | **FFmpeg dans une tâche Trigger.dev** | rendu 720p/1080p/4K, filigrane, sous-titres incrustés, sans licence payante (Remotion est payant au-delà de 3 personnes) |
| plateau 3D | **react-three-fiber + drei** | Three.js en React, mannequin, caméras, gizmos ; enregistrement par `canvas.captureStream()` |
| base de données | **Postgres sur Supabase** | une seule base, RLS, fonctions SQL pour les crédits |
| auth | **Supabase Auth (Google + email magique)** | « Se connecter avec Google » comme Flick, en 10 lignes |
| fichiers | **Supabase Storage** au départ, **Cloudflare R2** pour les médias dès que la bande passante coûte | la vidéo coûte en sortie de données ; R2 n'en fait pas payer |
| temps réel | **Supabase Realtime** | statut des générations, messages de l'agent qui arrivent, notifications |
| agent | **API Claude (Anthropic SDK), appels d'outils**, `claude-sonnet-5-5` par défaut, `claude-opus-5-5` en option « Max », `claude-haiku-5-5` pour la modération et les titres | meilleur rapport qualité/coût pour planifier et appeler des outils en plusieurs étapes ; répond dans la langue de l'utilisateur |
| modèles image/vidéo | **fal.ai** (une clé : Kling, Veo, Seedance, Nano Banana, Flux, Wan, MiniMax…, file d'attente + webhooks) ; **Replicate** en secours | une seule intégration pour ~30 modèles ; Midjourney exclu (pas d'API officielle) |
| voix et musique | **ElevenLabs** (voix, dialogues, musique, SFX) | API officielle, multi-speakers |
| tâches longues | **Trigger.dev** | tours de l'agent (pas de timeout, survivent à la fermeture de l'onglet), rendus FFmpeg, crons |
| paiements | **Stripe Checkout + Billing + Customer Portal** ; **Stripe Connect Express** pour payer les créateurs (phase 4) | abonnements, recharges, factures, retraits légaux |
| email | **Resend** | invitations, reçus, notifications |
| collaboration temps réel | **Liveblocks (Yjs)** en phase 4 | curseurs et édition à plusieurs sur React Flow sans écrire un CRDT |
| langues | **next-intl**, français d'abord | 10 langues comme l'original, plus tard |
| suivi | **Sentry** (erreurs) + **PostHog** (produit) | savoir ce qui casse et ce qui convertit |
| hébergement | **Vercel** (web) + Supabase cloud + Trigger.dev cloud | tout managé, gratuit ou presque à zéro utilisateur |

Pas de microservices. Une base, une app Next.js, un projet Trigger.dev.

## Schéma

Tables : 32. Accès : **Row Level Security** Postgres (fonctions `is_member`,
`can_view_project`, `can_edit_project`). Tout ce qui touche à l'argent et aux
crédits s'écrit **côté serveur uniquement** (service role) : le client ne peut
ni modifier `credit_balance`/`plan`, ni insérer une `generation`.

Testé : inscription → workspace perso + 300 crédits ; crédit rejoué ignoré
(idempotence) ; débit refusé si solde insuffisant ; projet privé invisible pour
un autre compte ; modification du solde par le client refusée.

Points clés :
- `spend_credits()` verrouille la ligne du workspace (`for update`) : deux
  générations simultanées ne peuvent pas passer le solde sous zéro.
- Un lot de l'agent est **débité en une fois** (coût total) avant de lancer quoi
  que ce soit, puis remboursé ligne par ligne si une génération échoue — le
  contraire du « 1 sur 2 lancée » vu chez Flick.
- `credit_ledger.idempotency_key` et `webhook_events` : un webhook Stripe ou
  fal reçu deux fois ne crédite/termine qu'une fois.
- `agent_actions.error_user` / `error_internal` : le message technique n'est
  jamais montré à l'utilisateur.
- `timelines.version` : verrou optimiste, l'agent et l'humain ne s'écrasent pas.
- `model_prices` : le coût affiché sur le bouton Run vient de la base, pas du code.

## API

Routes serveur Next.js (`app/api/...`) et Server Actions. « Moi » = utilisateur
connecté ; les droits sont revérifiés côté serveur même quand la RLS les couvre.

| méthode chemin | fait | qui | entrée | sortie | flux |
| --- | --- | --- | --- | --- | --- |
| GET /auth/callback | retour OAuth Google | public | code | session | S02 |
| POST /api/projects | crée un projet (+ document, timeline, plateau via trigger) | membre | name, aspect_ratio, style_id, prompt? | project | F01 F02 |
| POST /api/projects/from-prompt | crée le projet puis lance le 1er tour de l'agent | membre | prompt, style, ratio, pièces jointes | project_id, run_id | F00 F01 |
| POST /api/projects/from-script | idem avec un script importé | membre | fichier | project_id, run_id | F06 |
| PATCH /api/projects/:id | renomme, ratio, style, visibilité | éditeur | champs | project | S07 S18 |
| DELETE /api/projects/:id | supprime | créateur | — | 204 | S04 |
| POST /api/projects/:id/canvas | sauvegarde groupée nœuds/arêtes/sections (debounce) | éditeur | diff | version | S07 |
| POST /api/uploads | URL signée d'upload | éditeur | kind, taille, type | url, asset_id | S09 S13 |
| GET /api/models | modèles + coûts + verrou selon le plan | moi | kind | liste | S08 |
| POST /api/generations/quote | coût d'une ou plusieurs générations | éditeur | [{model, params}] | total, détail | S08 F00 |
| POST /api/generations | débite et envoie à fal/ElevenLabs | éditeur | node_id, model, params, n | generation_ids | F02–F04 F07 |
| POST /api/generations/:id/regenerate | relance avec les mêmes réglages | éditeur | — | generation_id | S09b |
| POST /api/agent/messages | message utilisateur → démarre un tour d'agent (Trigger.dev) | éditeur | conversation_id, texte, nœuds sélectionnés, pièces jointes, modèle | message_id, run_id | F00 |
| POST /api/agent/runs/:id/cancel | arrête le tour | éditeur | — | 204 | S10 |
| GET/POST /api/conversations | liste / nouvelle conversation | éditeur | project_id | conversations | S10 |
| PUT /api/chat-rules | règles et personnalisation | moi | rules, personalization | ok | S10 |
| PUT /api/projects/:id/document | sauvegarde Histoire | éditeur | JSON TipTap | ok | S11 |
| POST /api/script/import | parse .fountain/.fdx/.pdf/.docx/.txt (option « laisser l'IA lire ») | éditeur | fichier, mode | blocs + lignes incertaines | S12 |
| GET /api/script/export | PDF ou Word | lecteur | format, police | fichier | S11 |
| PUT /api/projects/:id/timeline | sauvegarde timeline | éditeur | tracks, version | version (409 si conflit) | S15 |
| POST /api/projects/:id/captions | génère les sous-titres | éditeur | clip_id | clips texte | S15 |
| POST /api/exports | lance le rendu FFmpeg | éditeur | résolution | export_id | S16 |
| GET /api/exports?project= | exports récents | lecteur | — | liste | S16 |
| PUT /api/projects/:id/stage | sauvegarde plateau 3D | éditeur | scenes | ok | S17 |
| POST /api/projects/:id/stage/takes | enregistre une prise (vidéo) sur la toile | éditeur | upload | asset, node | F10 |
| POST /api/styles | crée un style perso (1 à 5 images) ou depuis une image | membre | name, asset_ids | style | S06 S09b |
| POST /api/projects/:id/share | invitation email | éditeur | email, access | invite | S18 F11 |
| PATCH /api/projects/:id/link | accès par lien | créateur | none/view/edit | link | S18 |
| GET /p/:token | ouvre un projet partagé par lien | public connecté | — | redirection | F11 |
| POST /api/workspaces/:id/invites | invite un membre | owner | email | invite | S20 F12 |
| DELETE /api/workspaces/:id/members/:uid | retire un membre | owner (ou soi) | — | 204 | S20 |
| GET /api/workspaces/:id/usage | conso par membre | owner | période | lignes | S20 |
| POST /api/billing/checkout | session Stripe abonnement ou recharge | owner | plan/pack, interval | url | S21 S31 F13 |
| POST /api/billing/portal | portail client Stripe | owner | — | url | S22 |
| POST /api/films | publier un export | créateur | export_id, titre, share_workflow | film | F09 |
| GET /tv, /tv/:id, /u/:handle | galerie, page film, profil (SSR, SEO) | public | — | pages | S23–S25 |
| POST /api/films/:id/like | j'aime | moi | — | compteur | S24 |
| POST /api/films/:id/remix | copie le workflow dans un nouveau projet | moi | — | project_id | S24 |
| POST /api/films/:id/tips | pourboire en crédits | moi | montant, anonyme, note | tip | S26 F14 |
| POST /api/payouts | retrait (≥ 20 $) | créateur | — | payout | S27 |
| GET /api/notifications | liste + marquer lu | moi | — | liste | S30 |

**Webhooks entrants** : `POST /api/webhooks/stripe` (checkout.session.completed,
invoice.paid → crédits du mois, customer.subscription.updated/deleted,
account.updated pour Connect) ; `POST /api/webhooks/fal` et
`/api/webhooks/elevenlabs` (fin de génération → copie du fichier dans le
stockage, asset, nœud mis à jour, remboursement si échec). Tous signés,
dédoublonnés via `webhook_events`.

**Webhooks sortants** : aucun au lancement.

**Tâches Trigger.dev** :
- `agent-turn` (à la demande) : boucle Claude avec outils, écrit messages et
  actions en base au fil de l'eau (le client les reçoit par Realtime).
- `render-export` (à la demande) : télécharge les clips, FFmpeg, filigrane, upload.
- `poll-stuck-generations` (toutes les 5 min) : relance la vérification des jobs
  sans webhook depuis 10 min, rembourse après 30 min.
- `weekly-free-credits` (lundi 00:00 UTC) : +100 crédits aux comptes gratuits.
- `monthly-credits` : déclenchée par `invoice.paid`, pas par un cron.
- `cleanup` (quotidien) : uploads orphelins, exports de plus de 30 jours.

### Les outils de l'agent

Chaque outil = une fonction serveur, aussi utilisée par l'interface :

| outil | fait |
| --- | --- |
| read_canvas, read_document, read_timeline, look_at_media | lire l'état (vision pour regarder une image ou des images extraites d'une vidéo) |
| quote | coût d'un plan avant de lancer |
| generate_image, edit_image, character_reference, change_style, remove_background, upscale | images |
| generate_video (frame to video, omni reference), extract_frame | vidéo |
| generate_voice, character_dialogue, generate_music, generate_sfx | audio |
| create_section, rename, move_nodes, connect | ranger la toile |
| write_document | écrire Brief / Narration / Direction / Scénario |
| edit_timeline (ajouter, déplacer, couper, vitesse, volume, fondus, texte), generate_captions | monter |
| build_stage | poser personnages et caméras sur le plateau 3D |
| ask_user | poser une question / proposer des choix (puces de suggestion) |

Règles du système de l'agent : vérifier le coût total avec `quote` avant tout
lot ; ne jamais relancer une génération échouée sans le dire ; répondre dans
la langue de l'utilisateur ; citer les nœuds touchés (puces d'asset).

## Les parties qui mordent

- **Fuseaux horaires** : tout en UTC en base ; seule la date « Modifié le » est
  affichée en heure locale.
- **Idempotence** : Stripe et fal renvoient leurs webhooks ; `webhook_events`
  + `idempotency_key` sur le grand livre.
- **Courses** : deux générations en même temps → `spend_credits ... for update` ;
  agent et humain sur la même timeline → `version` (409 puis fusion).
- **Limites de débit** : fal et Claude ont des quotas ; file par workspace dans
  Trigger.dev (concurrence limitée par plan) et réessai avec backoff.
- **Taille des fichiers** : upload direct vers le stockage par URL signée
  (jamais par le serveur Next.js) ; limite 500 Mo vidéo, 25 Mo image.
- **Coût réel vs crédits** : `model_prices` doit garder une marge sur le prix
  fal ; un tableau de bord de marge par modèle dès le lancement.
- **Modération** : filtres du fournisseur + pré-contrôle des prompts par
  `claude-haiku-5-5` ; état `flagged` sans débit ; signalement sur la galerie.
- **Temps réel** : Realtime pour les statuts dès la phase 1 ; édition à
  plusieurs seulement en phase 4 (Liveblocks).
- **Recherche** : `ilike` + index trigram sur noms de projets et ressources ;
  pas de moteur de recherche au début.
- **Multi-tenant** : tout est rattaché à un workspace ; la RLS est la barrière,
  les routes serveur revérifient.
- **RGPD** : suppression de compte = cascade en base + purge du stockage par
  tâche ; export des données sur demande ; hébergement Supabase en UE.
- **Argent réel (retraits)** : Stripe Connect s'occupe du KYC ; ne pas lancer
  les retraits avant d'avoir validé le cadre légal.
- **Droits** : CGU à toi ; l'utilisateur possède ses sorties ; interdiction de
  générer la ressemblance de personnes réelles sans accord.

## Ordre de construction

1. **Tranche verticale** (moche mais complète) : se connecter avec Google →
   taper un prompt sur l'accueil → l'agent crée une section et génère 2 images
   puis 1 vidéo → voir les nœuds apparaître sur la toile → crédits débités.
   Écrans S02 S03 S07 S10. Tables profiles, workspaces, workspace_members,
   projects, sections, nodes, edges, assets, generations, credit_ledger,
   model_prices, conversations, chat_messages, agent_actions. Routes
   from-prompt, agent/messages, generations, webhooks/fal. Tâche agent-turn.
2. **Indispensables** (63 lignes « must » de `features.csv`), par zone :
   - toile et nœuds (S07 S08 S09 S09b S13) ;
   - images, référence de personnage, vidéo, styles (S05 S08) ;
   - agent complet : conversations, cartes d'action, puces d'asset, @, pièces
     jointes, dictée, quote avant lot, erreurs humaines (S10) ;
   - Histoire (S11) ;
   - éditeur vidéo + « laisser l'agent construire ma timeline » + export (S15 S16) ;
   - crédits, Stripe, recharge, filigrane (S21 S22 S31) ;
   - barre globale, accueil complet, projets récents (S03 S04 S04b), pages légales.
3. **Importantes**, puis **optionnelles** : audio, import de script, équipes et
   partage, visite guidée, notifications ; puis plateau 3D, galerie publique,
   pourboires, retraits, collaboration temps réel.
4. **Correctifs de `/replica-entrepreneur`** une fois lancé.
