# Plan de test : Studio (clone des fonctions de Flick)

Build : 04812d8  Date : 2026-10-17  Env : local, build de production (`next build && next start`),
données et générations simulées. Navigateur : Chromium 141 (Playwright 1.56), 1600×950 et 390×844.

Lancer : `cd web && npm run test:e2e` (rapport : `npm run test:e2e:report`).
Chaque test échoue sur une erreur console, une exception de page ou une réponse 5xx ; un contrôle axe
WCAG 2.1 A/AA tourne sur chaque écran principal.

Résultat : **38 cas automatisés, 38 réussis** (76/76 sur deux passages consécutifs, 0 instable).

| cas | flux | type | étapes | attendu | auto | résultat |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-H1 | connexion | nominal | connexion simulée, déconnexion | 300 crédits, retour à /login | e2e | ok |
| AUTH-N1 | connexion | négatif : page protégée | ouvrir /projects?tab=all déconnecté | renvoi /login?next= puis retour à la page demandée | e2e | ok |
| AUTH-E1 | connexion | limite : accents et emoji | nom « Inès Ü 🎬 » | nom affiché tel quel | e2e | ok |
| LEGAL-H1 | légal | nominal | /legal/cgu, /legal/confidentialite | pages lisibles, accessibles | e2e | ok |
| F00-H1 | tout faire avec l'agent | nominal | prompt sur l'accueil | section + 2 images + 1 vidéo, histoire écrite, 136 crédits débités | e2e | ok |
| F00-E1 | | limite : crédits insuffisants | 3 lots d'affilée | 3e lot refusé, aucun débit, aucun plan créé, message chiffré | e2e | ok |
| F00-E2 | | limite : accents et emoji | « Élodie… crème brûlée 🍮 » | texte intact partout | e2e | ok |
| F00-E3 | | limite : prompt très long | 1 700 caractères | nom de projet ≤ 60 caractères avec « … » | e2e | ok |
| F00-E4 | | limite : double Entrée | Entrée deux fois | un seul projet | e2e | ok |
| F00-E5 | | limite : rechargement en plein travail | recharger pendant la génération | aucune action « en cours » bloquée, message d'interruption, crédits non utilisés rendus | e2e | ok (BUG-001 corrigé) |
| F00-E6 | | nominal | clic sur une référence de l'agent | plan sélectionné sur la toile | e2e | ok |
| F00-E7 | | limite : deux onglets | renommer dans l'onglet A | nom à jour dans l'onglet B | e2e | ok |
| F00-N1 | | négatif : demande interdite | « torture très gore » | refus expliqué, aucun débit | e2e | ok |
| F02-H1 | générer sur la toile | nominal | + > Générer une image | Auto par défaut, coût 8 affiché, débit 8 | e2e | ok |
| F02-N1 | | négatif : modèle réservé | choisir « Pro (4K) » en Gratuit | cadenas, renvoi aux tarifs | e2e | ok |
| F02-N2 | | négatif : prompt interdit | « un homme décapité » | nœud signalé, aucun débit | e2e | ok |
| F02-N3 | | négatif : panne fournisseur | prompt contenant « échec » | message, crédits rendus | e2e | ok (BUG-005 corrigé) |
| F02-E1 | | nominal : @ | taper « @Plan » | liste de plans, insertion, référence reliée | e2e | ok |
| F02-H2 | | nominal : retouche | Modifier l'image | image retouchée | e2e | ok |
| F04-H1 | animer une image | limite : durée | 10 s | coût 240 (×2) | e2e | ok |
| CANVAS-H1 | toile | nominal | copier-coller, S, archiver, restaurer | copie à côté (pas dessus), section, archive et restauration | e2e | ok (BUG-004 corrigé) |
| CANVAS-H2 | | nominal : import | PNG + WAV | 2 nœuds importés | e2e | ok |
| CANVAS-N1 | | négatif : mauvais format | .txt | refus explicite | e2e | ok |
| STYLE-H1 | styles | nominal | choisir Aquarelle sur la toile | style affiché | e2e | ok |
| F07-H1 | voix / musique | nominal | « musique douce », « Voix off : « … » » | 2 sons, 16 crédits, 2 clips sur la piste son | e2e | ok |
| F07-H2 | | nominal | + > voix, Victor | nœud audio Victor | e2e | ok |
| F03-H1 | personnage | négatif puis nominal | fiche → référence en Gratuit → plan Créateur → scène | verrou puis génération | e2e | ok |
| F05-H1 | Histoire | nominal | modifier, recharger | « Enregistré », modification conservée | e2e | ok |
| F08-H1 | montage | nominal | l'agent monte, lecture, coupe, export | 2 → 3 clips, WebM VP9 > 100 ko, nom ASCII | e2e | ok |
| F08-E1 | | nominal | « Monte le film » dans le chat | plans ajoutés | e2e | ok |
| F08-E2 | | nominal | 24 i/s, recharger | 24 conservé | e2e | ok |
| F11-H1 | partage | négatif + nominal | e-mail invalide, invitation, doublon (casse), lien | erreurs claires, 1 invité, copie active seulement si lien ouvert | e2e | ok |
| F13-H1 | crédits | nominal | recharge 500 | 800 crédits | e2e | ok |
| F13-H2 | | nominal | choisir Pro | « Votre plan actuel » | e2e | ok |
| PROJ-H1 | projets | nominal + limite | renommer (60 car.), rechercher, supprimer avec confirmation | titre complet en infobulle, état vide | e2e | ok |
| PROJ-N1 | | négatif : projet inconnu | /p/0000… | « Projet introuvable » | e2e | ok |
| MOB-H1 | mobile | limite : 390 px | accueil puis projet | pas de défilement horizontal, onglets Toile / Agent | e2e | ok |
| KEY-H1 | clavier | limite : clavier seul | Tab jusqu'au prompt, saisie, Entrée | projet créé | e2e | ok |

## Passage manuel (impossible à automatiser en simulation)

À faire quand le backend sera branché (`/replica-backend`) :

| cas | quoi | pourquoi manuel |
| --- | --- | --- |
| MAN-1 | Connexion Google réelle, session expirée | OAuth réel |
| MAN-2 | Paiement Stripe accepté, carte refusée `4000 0000 0000 0002`, résiliation, facture | paiement réel |
| MAN-3 | E-mail d'invitation reçu et lien qui donne le bon niveau d'accès | e-mail réel |
| MAN-4 | Données d'un 2e utilisateur invisibles | la séparation est en base (RLS) : testée sur Postgres dans la PR, à revérifier avec l'app branchée |
| MAN-5 | Rendu visuel des vraies images et vidéos fal.ai | médias réels |
| MAN-6 | Dictée avec un vrai micro | autorisation micro |
| MAN-7 | Export dans Safari et Firefox | MediaRecorder VP9/Opus non garanti hors Chromium |
| MAN-8 | Réseau lent / hors ligne pendant une génération | dépend des vrais appels réseau |
