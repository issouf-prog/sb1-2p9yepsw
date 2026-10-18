// Pré-contrôle des prompts (simulé). En production : filtres du fournisseur + classification
// par un petit modèle côté serveur. Une demande signalée n'est jamais débitée.

const RULES: { re: RegExp; reason: string }[] = [
  { re: /\b(enfant|mineur|ado(lescent)?e?s?|child|minor|kid)s?\b[^.]{0,40}\b(nu|nue|nus|nues|sexe|sexuel|érotique|naked|nude|sexual)\b|\b(nu|nue|naked|nude|sexuel|sexual)\b[^.]{0,40}\b(enfant|mineur|child|minor|kid)s?\b/i, reason: "contenu sexuel impliquant des mineurs" },
  { re: /\b(décapit|démembr|torture|gore|behead|dismember)\w*/i, reason: "violence graphique" },
  { re: /\b(deepfake|faux discours de|fake speech of)\b/i, reason: "usurpation de l'identité d'une personne réelle" },
];

export type Moderation = { ok: true } | { ok: false; reason: string };

export function moderate(text: string): Moderation {
  for (const r of RULES) if (r.re.test(text)) return { ok: false, reason: r.reason };
  return { ok: true };
}

export const flaggedMessage = (reason: string) =>
  `Demande refusée (${reason}). Rien n'a été débité. Reformulez le prompt plutôt que de le renvoyer tel quel.`;
