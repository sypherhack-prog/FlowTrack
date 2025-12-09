"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface MemberActivityItem {
  userId: string;
  name: string;
  email: string;
  activePct: number;
  idlePct: number;
  awayPct: number;
  totalSeconds: number;
  lastScreenshotUrl: string | null;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function ActivityScreenshotsPage() {
  const [items, setItems] = useState<MemberActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const membersRes = await fetch("/api/dashboard/members");
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (!cancelled) {
            setCurrentRole((membersData.currentRole as string | undefined) ?? null);
          }
        }

        const res = await fetch("/api/dashboard/members-activity");
        if (!res.ok) {
          throw new Error(`Erreur de chargement des activités (HTTP ${res.status})`);
        }
        const data = await res.json();
        const loaded = (data.items ?? []) as MemberActivityItem[];
        if (!cancelled) setItems(loaded);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Impossible de charger les activités";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSeeScreenshots = currentRole === "owner" || currentRole === "manager";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Activity – Screenshots</h2>
      <p className="text-sm text-gray-600 mb-4">
        Vue par membre des dernières captures disponibles. Lancez le tracker sur les postes des membres pour commencer à
        collecter des écrans.
      </p>

      {loading && <p className="text-sm text-gray-500">Chargement des captures…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-gray-500">Aucune capture disponible pour le moment.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.userId} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/user-avatar.svg"
                  alt={item.name || item.email}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.name || item.email}</p>
                  <p className="text-xs text-gray-500 truncate" title={item.email}>
                    {item.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Temps suivi : {formatDuration(item.totalSeconds)}</p>
                </div>
              </div>

              {canSeeScreenshots && item.lastScreenshotUrl ? (
                <button
                  type="button"
                  className="relative mt-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  onClick={() => setLightboxUrl(item.lastScreenshotUrl!)}
                >
                  <Image
                    src={item.lastScreenshotUrl}
                    alt="Dernière capture"
                    width={640}
                    height={400}
                    className="w-full h-32 object-cover"
                  />
                </button>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  {canSeeScreenshots
                    ? "Aucune capture encore disponible pour ce membre."
                    : "Les captures d’écran ne sont visibles que par les managers et owners."}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {canSeeScreenshots && lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
            >
              Close
            </button>
            {lightboxUrl && (
              <Image
                src={lightboxUrl}
                alt="Screenshot preview"
                width={1280}
                height={720}
                className="max-h-[85vh] h-auto w-auto rounded shadow-xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
