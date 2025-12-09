import Link from 'next/link';

export default function ChoosePlanPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappBaseUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
  const whatsappText = encodeURIComponent(
    "Bonjour, je souhaite activer un plan payant FlowTrack pour mon équipe (Starter ou Pro).",
  );
  const whatsappLink = whatsappBaseUrl ? `${whatsappBaseUrl}?text=${whatsappText}` : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose your plan</h2>
        <p className="text-sm text-gray-600 max-w-2xl">
          Votre période d&apos;essai est terminée ou va bientôt se terminer. Choisissez un plan pour continuer à suivre
          l&apos;activité de votre équipe sans interruption. Vous pouvez démarrer simple puis évoluer vers un plan plus
          avancé plus tard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-1">Starter</h3>
          <p className="text-3xl font-black mb-1">$9</p>
          <p className="text-xs text-gray-500 mb-4">par utilisateur / mois</p>
          <p className="text-sm text-gray-600 mb-4 flex-1">
            Pour les petites équipes qui veulent centraliser le suivi du temps, les sites bloqués et les rapports
            essentiels.
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc list-inside">
            <li>Jusqu&apos;à 10 membres</li>
            <li>Suivi du temps &amp; activité</li>
            <li>Rapports de base</li>
            <li>Messagerie interne</li>
          </ul>
          <button
            type="button"
            className="mt-auto inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white opacity-60 cursor-not-allowed"
          >
            Bientôt disponible via Paddle
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-500 bg-indigo-50 shadow-md p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-1">Pro</h3>
          <p className="text-3xl font-black mb-1">$19</p>
          <p className="text-xs text-gray-500 mb-4">par utilisateur / mois</p>
          <p className="text-sm text-gray-600 mb-4 flex-1">
            Pour les équipes qui ont besoin de visibilité complète, de notifications avancées et d&apos;options
            d&apos;installation silencieuse.
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc list-inside">
            <li>Jusqu&apos;à 100 membres</li>
            <li>Toutes les fonctionnalités Starter</li>
            <li>Notifications en temps réel avancées</li>
            <li>Mode application silencieuse (agent desktop)</li>
          </ul>
          <button
            type="button"
            className="mt-auto inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white opacity-60 cursor-not-allowed"
          >
            Bientôt disponible via Paddle
          </button>
        </div>
      </div>

      <div className="max-w-2xl text-sm text-gray-600 space-y-2">
        <p className="font-medium">Activer un plan dès maintenant</p>
        <p>
          En attendant l&apos;activation complète du paiement self-service via Paddle, vous pouvez nous contacter pour
          activer un plan manuellement.
        </p>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Discuter sur WhatsApp
          </a>
        ) : (
          <p className="text-xs text-gray-500">
            Configurez NEXT_PUBLIC_WHATSAPP_NUMBER pour afficher ici un bouton de contact WhatsApp.
          </p>
        )}
        <p className="text-xs text-gray-500">
          Vous pourrez ensuite revenir au dashboard une fois que votre plan aura été activé côté support.
        </p>
        <p className="text-xs text-gray-500">
          Vous pouvez aussi revenir à l&apos;accueil marketing :
          <Link href="/marketing" className="ml-1 text-indigo-600 hover:underline">
            Voir les offres
          </Link>
        </p>
      </div>
    </div>
  );
}
