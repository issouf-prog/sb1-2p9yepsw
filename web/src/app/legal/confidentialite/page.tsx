export const metadata = { title: "Confidentialité — Studio" };

export default function Privacy() {
  return (
    <>
      <h1 className="text-display">Politique de confidentialité</h1>
      <p>Dernière mise à jour : à compléter au lancement.</p>
      <h2>Ce que nous collectons</h2>
      <ul>
        <li>Compte : nom, adresse e-mail, photo de profil fournie par Google si vous l&apos;utilisez pour vous connecter.</li>
        <li>Contenus : vos projets, prompts, fichiers importés et résultats générés.</li>
        <li>Paiement : géré par notre prestataire de paiement ; nous ne stockons pas vos numéros de carte.</li>
        <li>Usage : journaux techniques et mesures d&apos;audience pour améliorer le service.</li>
      </ul>
      <h2>Pourquoi</h2>
      <p>Fournir le service, facturer, assurer la sécurité (dont la modération des contenus) et vous contacter au sujet de votre compte.</p>
      <h2>Avec qui</h2>
      <p>Nos sous-traitants techniques (hébergement, base de données, fournisseurs de modèles d&apos;IA, paiement, e-mail), dans la limite de ce dont ils ont besoin. Liste à compléter au lancement.</p>
      <h2>Combien de temps</h2>
      <p>Tant que votre compte est actif ; les exports sont supprimés après 30 jours. À la suppression du compte, vos données sont effacées, sauf obligation légale de conservation.</p>
      <h2>Vos droits</h2>
      <p>Accès, rectification, effacement, portabilité et opposition, auprès de l&apos;adresse de contact. Vous pouvez aussi saisir l&apos;autorité de protection des données de votre pays (en France, la CNIL).</p>
    </>
  );
}
