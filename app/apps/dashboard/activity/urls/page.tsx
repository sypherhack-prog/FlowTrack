"use client";

import { useEffect, useState } from "react";

interface BlockedEventItem {
  id: string;
  url: string;
  createdAt: string;
  userId?: string | null;
  userName?: string;
  userEmail?: string;
}

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return d.toLocaleString();
};

const getSiteMeta = (rawUrl: string) => {
  try {
    const u = new URL(rawUrl);
    const host = (u.hostname || "").replace(/^www\./, "");
    const faviconUrl = `${u.protocol}//${u.hostname}/favicon.ico`;
    return { host, faviconUrl };
  } catch {
    return { host: rawUrl, faviconUrl: null as string | null };
  }
};

export default function ActivityUrlsPage() {
  const [items, setItems] = useState<BlockedEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/blocked-events");
        if (!res.ok) {
          throw new Error(`Erreur de chargement des événements (HTTP ${res.status})`);
        }
        const data = await res.json();
        const loaded = (data.items ?? []) as BlockedEventItem[];
        if (!cancelled) setItems(loaded);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Impossible de charger les événements";
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

  const totalEvents = items.length;

  const sites = (() => {
    const byHost = new Map<
      string,
      {
        host: string;
        faviconUrl: string | null;
        count: number;
        lastAt: string;
      }
    >();

    items.forEach((item) => {
      const meta = getSiteMeta(item.url);
      const key = meta.host;
      const createdAt = item.createdAt;

      const existing = byHost.get(key);
      if (!existing) {
        byHost.set(key, {
          host: meta.host,
          faviconUrl: meta.faviconUrl,
          count: 1,
          lastAt: createdAt,
        });
      } else {
        existing.count += 1;
        if (new Date(createdAt).getTime() > new Date(existing.lastAt).getTime()) {
          existing.lastAt = createdAt;
        }
      }
    });

    return Array.from(byHost.values()).sort((a, b) => b.count - a.count);
  })();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Activity – URLs</h2>
      <p className="text-sm text-gray-600 mb-4">
        Répartition d&apos;utilisation des sites bloqués dans votre organisation. Chaque site affiche sa part relative
        parmi tous les événements de sites bloqués détectés.
      </p>

      {loading && <p className="text-sm text-gray-500">Chargement des événements…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && totalEvents === 0 && (
        <p className="text-sm text-gray-500">Aucun site bloqué détecté pour le moment.</p>
      )}

      {!loading && !error && totalEvents > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">
            Total des événements de sites bloqués sur la période chargée : {totalEvents}.
          </p>
          <ul className="space-y-3 text-sm">
            {sites.map((site) => {
              const percent = totalEvents > 0 ? Math.round((site.count / totalEvents) * 100) : 0;
              return (
                <li
                  key={site.host}
                  className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {site.faviconUrl && (
                      // On utilise un <img> simple pour les favicons externes
                      <img
                        src={site.faviconUrl}
                        alt={site.host}
                        className="h-7 w-7 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{site.host}</p>
                      <p className="text-xs text-gray-500">
                        Dernier événement : {formatDateTime(site.lastAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-xs font-semibold text-gray-800">
                    <span>{percent}%</span>
                    <span className="text-[11px] text-gray-500">{site.count} événements</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
