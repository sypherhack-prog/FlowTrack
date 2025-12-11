'use client';

import { useEffect, useState } from 'react';

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
    const host = (u.hostname || '').replace(/^www\./, '');

    let name = host;
    if (host.includes('youtube.com')) name = 'YouTube';
    else if (host.includes('facebook.com')) name = 'Facebook';
    else if (host.includes('instagram.com')) name = 'Instagram';
    else if (host.includes('tiktok.com')) name = 'TikTok';
    else if (host.includes('netflix.com')) name = 'Netflix';
    else if (host.includes('twitter.com') || host === 'x.com') name = 'Twitter / X';

    const faviconUrl = `${u.protocol}//${u.hostname}/favicon.ico`;
    return { name, host, faviconUrl };
  } catch {
    return { name: rawUrl, host: rawUrl, faviconUrl: null as string | null };
  }
};

export function BlockedEventsWidget() {
  const [items, setItems] = useState<BlockedEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/blocked-events');
        if (!res.ok) return;
        const data = await res.json();
        const loaded = (data.items ?? []) as BlockedEventItem[];
        setItems(loaded);

        if (typeof window !== 'undefined' && loaded.length > 0) {
          const latest = loaded[0];
          window.dispatchEvent(
            new CustomEvent('flowtrack:toast', {
              detail: {
                type: 'warning',
                message: `Blocked site opened: ${latest.url}`,
              },
            }),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalEvents = items.length;

  // Regroupement par couple (membre, site) pour voir clairement
  // "Facebook", "YouTube", "TikTok" pour chaque utilisateur.
  const topEntries = (() => {
    const byKey = new Map<
      string,
      {
        key: string;
        displayName: string;
        count: number;
        lastAt: string;
        host: string;
        name: string;
        faviconUrl: string | null;
      }
    >();

    items.forEach((item) => {
      const meta = getSiteMeta(item.url);
      const displayName = item.userName || item.userEmail || 'Unknown user';
      const userKey = String(item.userId || item.userEmail || 'unknown');
      const siteKey = `${userKey}::${meta.host || meta.name}`;
      const createdAt = item.createdAt;

      const existing = byKey.get(siteKey);
      if (!existing) {
        byKey.set(siteKey, {
          key: siteKey,
          displayName,
          count: 1,
          lastAt: createdAt,
          host: meta.host,
          name: meta.name,
          faviconUrl: meta.faviconUrl,
        });
      } else {
        existing.count += 1;
        if (new Date(createdAt).getTime() > new Date(existing.lastAt).getTime()) {
          existing.lastAt = createdAt;
          existing.host = meta.host;
          existing.name = meta.name;
          existing.faviconUrl = meta.faviconUrl;
        }
      }
    });

    return Array.from(byKey.values()).sort((a, b) => b.count - a.count);
  })();

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Blocked sites alerts</h3>
        {loading && <span className="text-xs text-gray-400">Loading…</span>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {totalEvents === 0 && !loading && (
          <p className="text-sm text-gray-500">No blocked sites detected yet.</p>
        )}
        <ul className="space-y-3 text-sm">
          {topEntries.map((group) => {
            const percent = totalEvents > 0 ? Math.round((group.count / totalEvents) * 100) : 0;
            return (
              <li
                key={group.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {group.faviconUrl && (
                    // On utilise un <img> simple pour les favicons externes
                    <img
                      src={group.faviconUrl}
                      alt={group.name}
                      className="h-6 w-6 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      par {group.displayName} · {group.count} alertes ({percent}%)
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={group.host}>
                      {group.host} · {formatDateTime(group.lastAt)}
                    </p>
                  </div>
                </div>
                <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  BLOCKED
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
