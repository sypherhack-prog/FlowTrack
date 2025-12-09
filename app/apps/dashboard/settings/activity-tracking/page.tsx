import { BlockedSitesSettings } from '@/components/BlockedSitesSettings';

export default function ActivityTrackingSettingsPage() {
  const chromeUrl = process.env.NEXT_PUBLIC_EXTENSION_CHROME_URL;
  const edgeUrl = process.env.NEXT_PUBLIC_EXTENSION_EDGE_URL;
  const firefoxUrl = process.env.NEXT_PUBLIC_EXTENSION_FIREFOX_URL;
  const desktopWinUrl = process.env.NEXT_PUBLIC_DESKTOP_WIN_URL;
  const desktopMacUrl = process.env.NEXT_PUBLIC_DESKTOP_MAC_URL;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Activity & tracking settings</h2>
        <p className="text-sm text-gray-600">
          Choisissez comment vos équipes installent FlowTrack&nbsp;: extension navigateur ou application desktop. Suivez
          les étapes ci-dessous après avoir sélectionné votre mode de suivi.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">1. Installer l&apos;extension navigateur FlowTrack</h3>
        <p className="text-sm text-gray-600">
          Recommandé pour démarrer rapidement. L&apos;extension envoie les heartbeats, les événements de sites bloqués et,
          si activé par votre plan, les captures d&apos;écran. Vous pouvez l&apos;installer manuellement à partir d&apos;une archive
          ZIP, même si elle n&apos;est pas encore publiée sur les stores.
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-white rounded-xl shadow p-4 border border-gray-100">
          <li>
            Téléchargez le fichier ZIP de l&apos;extension FlowTrack fourni par votre administrateur, puis extrayez-le dans
            un dossier (par exemple
            <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
              C:\\FlowTrack-extension
            </span>
            ) sur chaque poste que vous souhaitez suivre.
          </li>
          <li>
            Ouvrez votre navigateur (Chrome ou Edge) et accédez à la page de gestion des extensions&nbsp;:
            <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
              chrome://extensions
            </span>
            pour Chrome ou
            <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
              edge://extensions
            </span>
            pour Edge, puis activez le mode développeur.
            <div className="mt-2 flex flex-wrap gap-2">
              {chromeUrl && (
                <a
                  href={chromeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Ouvrir sur Chrome Web Store (optionnel)
                </a>
              )}
              {edgeUrl && (
                <a
                  href={edgeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                >
                  Ouvrir sur Edge Add-ons (optionnel)
                </a>
              )}
              {firefoxUrl && (
                <a
                  href={firefoxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                >
                  Ouvrir sur Firefox Add-ons (optionnel)
                </a>
              )}
              {!chromeUrl && !edgeUrl && !firefoxUrl && (
                <span className="text-xs text-gray-500">
                  Si vous publiez plus tard l&apos;extension sur les stores navigateurs, les liens directs apparaîtront ici.
                  En attendant, utilisez l&apos;installation manuelle décrite ci-dessus.
                </span>
              )}
            </div>
          </li>
          <li>
            Cliquez sur <span className="font-medium">Charger l&apos;extension non empaquetée</span> (ou
            <span className="ml-1 font-medium">Load unpacked</span>) puis sélectionnez le dossier extrait qui contient
            le fichier
            <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">manifest.json</span>
            de l&apos;extension FlowTrack.
          </li>
          <li>
            Une fois l&apos;extension installée, cliquez sur son icône dans la barre du navigateur puis ouvrez la page
            d&apos;options&nbsp;: renseignez l&apos;URL de votre serveur FlowTrack (par exemple
            <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
              https://app.flowtrack.io
            </span>
            ) et connectez-vous avec votre email et mot de passe FlowTrack.
          </li>
          <li>
            Vérifiez que le statut passe à <span className="font-medium">Online</span> dans l&apos;extension&nbsp;; vos
            données commenceront alors à remonter dans le dashboard.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">2. Installer l&apos;application desktop FlowTrack</h3>
        <p className="text-sm text-gray-600">
          L&apos;application desktop permet de suivre l&apos;activité même en dehors du navigateur, selon le mode de suivi que
          vous avez choisi.
        </p>

        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 space-y-3 text-sm text-gray-700">
          <p className="font-medium">Téléchargement</p>
          <div className="flex flex-wrap gap-2">
            {desktopWinUrl && (
              <a
                href={desktopWinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
              >
                Télécharger pour Windows
              </a>
            )}
            {desktopMacUrl && (
              <a
                href={desktopMacUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
              >
                Télécharger pour macOS
              </a>
            )}
            {!desktopWinUrl && !desktopMacUrl && (
              <span className="text-xs text-gray-500">
                Ajoutez les URLs de téléchargement de vos applications desktop dans les variables d&apos;environnement pour
                afficher ici les boutons de téléchargement.
              </span>
            )}
          </div>

          <ol className="list-decimal list-inside space-y-2 mt-2">
            <li>Téléchargez l&apos;installeur correspondant au système d&apos;exploitation de vos employés.</li>
            <li>Exécutez l&apos;installeur puis suivez les étapes d&apos;installation.</li>
            <li>
              Au premier lancement, connectez-vous avec les identifiants FlowTrack de l&apos;utilisateur. L&apos;application se
              mettra ensuite en arrière-plan et enverra automatiquement les données d&apos;activité.
            </li>
          </ol>
        </div>
      </section>

      <section className="space-y-3">
        <BlockedSitesSettings />
      </section>
    </div>
  );
}
