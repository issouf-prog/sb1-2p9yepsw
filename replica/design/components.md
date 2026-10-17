# Composants

Tokens : `replica/design/tokens.json` → `npm run tokens` (dans `web/`) génère
`web/src/styles/tokens.css` (thème Tailwind v4). Les composants n'utilisent que
des classes de rôle (`bg-surface`, `text-text-muted`, `border-border`…), jamais
de hex. Vitrine : `web/src/app/design/page.tsx` → `/design`.

Langage visuel (mesuré sur les captures, reconstruit avec nos valeurs) : fond
presque blanc, texte brun-noir chaud, gris chauds, **angles quasi droits**
(radius 0 à 4 px), bordures fines, boutons principaux noirs, puces en pilule,
navigation en capitales espacées, sans-serif géométrique légère (Outfit, OFL).
Ce qui change avant le lancement (`/replica-brand`) : la couleur d'accent
(placeholder bleu), le nom, le logo. Icônes : lucide-react (ISC). Aucune image,
icône ou texte de l'original.

Règles communes : focus visible 2 px `focus` sur tout élément interactif ;
cibles ≥ 32 px (40 px par défaut) ; libellé accessible sur chaque bouton icône
(vérifié : 0 bouton sans nom sur `/design`) ; tout texte tronqué a son nom
complet en `title`.

```
Button                                             web/src/components/ui/button.tsx
  variants  primary (noir), secondary (bord fin), ghost, danger
  sizes     sm 32px, md 40px, lg 48px
  states    défaut, survol, actif, focus-visible, désactivé (45 %), loading (spinner,
            aria-busy, libellé conservé), cost (crédits à droite, « crédits » pour
            lecteurs d'écran), locked (cadenas + « Passer au plan supérieur »)
  tokens    bg primary / text on-primary, radius sm, text base
  a11y      vrai <button>, désactivé pendant le chargement
  used on   partout ; « Lancer · 30 » sur S08, « Créer » sur S04b

IconButton                                         icon-button.tsx
  tones     default (rond, survol sunken), solid (carré noir : + de la toile),
            round (rond noir 48px : micro / envoyer)
  states    active (aria-pressed), désactivé, infobulle avec raccourci (« Section (S) »)
  a11y      aria-label obligatoire = texte de l'infobulle
  used on   S03 S07 S09b S10 S17

Chip                                               chip.tsx
  sizes     md 56px (raccourcis de l'accueil), sm 32px (suggestions de l'agent)
  tokens    rounded-pill, border border, survol border-input
  used on   S03, S10

NavTabs                                            nav-tabs.tsx
  rendu     capitales, tracking 0.08em, point accent à droite de l'onglet actif
  a11y      <nav aria-label>, aria-current="page"
  used on   S04b (Accueil, Projets, Galerie, Références), S07/S11/S15/S17
            (Histoire, Toile, Plateau 3D, Montage)

Segmented                                          segmented.tsx
  a11y      radiogroup, flèches gauche/droite, tabindex itinérant
  used on   S17 (Scène/Caméras, 3D/2D)

CreditBadge, Avatar                                credit-badge.tsx
  states    normal (point accent), bas < 50 (point danger + « solde bas »)
  used on   S04b, barre projet

PromptBox                                          prompt-box.tsx
  parts     textarea 3 lignes, joindre, note, style (bord pointillé), format,
            micro → devient « Envoyer » dès qu'il y a du texte
  keys      Entrée envoie, Maj+Entrée nouvelle ligne
  states    vide, saisi, focus (bord border-input), envoi
  used on   S03 (et version compacte dans S10)

Menu (Radix DropdownMenu)                          menu.tsx
  parts     MenuItem (icône + libellé), MenuSub / SubTrigger (chevron), Separator
  a11y      flèches, Entrée, Échap, sous-menus au clavier
  used on   S09 (menu +), S09b (menu d'un nœud), cartes projet

Dialog (Radix Dialog)                              dialog.tsx
  parts     titre, description, fermer ; focus piégé, Échap ferme, overlay
  used on   S05 S06 S12 S14 S16 S18 S26 S31

ProjectCard, FilmCard, Thumb                       cards.tsx
  ProjectCard  vignette 16:9, titre tronqué + title, « Modifié le … », bord texte, survol ombre
  FilmCard     vignette + durée en badge, survol lecture, créateur, compteurs
               reprises / j'aime / crédits reçus (format « 2,8 k », libellés sr-only)
  Thumb        dégradé déterministe en attendant les vrais médias
  used on   S03 S04 S23 S25

ActionCard, AssetChip, UserMessage, AgentMessage   agent.tsx
  ActionCard   running (spinner), done (coche, gris), failed (fond danger-surface,
               message humain + action proposée ; jamais l'erreur technique)
               role="status" pour annoncer les changements
  AssetChip    image / vidéo / section, tronqué + title, clic = sélectionne le nœud
  used on   S10

VerticalToolbar, SectionHeader, MediaNode          canvas-bits.tsx
  VerticalToolbar  role=toolbar vertical, séparateurs, zoom en %
  SectionHeader    aria-expanded, chevron qui pivote
  MediaNode        barre flottante (favori, archiver, renommer, télécharger, plein
                   écran, dupliquer, désélectionner), média, dimensions, prompt
                   surligné highlight, copier, Voir tout / Voir moins
  used on   S07 S09b
```

À construire avec les écrans (mêmes règles) : Toast, onglets de panneau
(Ressources / SFX / Effets / Transitions), liste de ressources groupée,
timeline (pistes, tête de lecture, clips), éditeur à blocs (TipTap), nœud de
génération avec panneau de réglages, sélecteur de modèle, sélecteur de voix.
