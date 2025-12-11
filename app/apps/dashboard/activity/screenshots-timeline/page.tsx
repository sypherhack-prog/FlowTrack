'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

interface TimelineItem {
  userId: string;
  userName: string;
  userEmail: string;
  url: string;
  capturedAt: string;
}

interface MemberOption {
  userId: string;
  userName: string;
  userEmail: string;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return d.toLocaleString();
}

export default function ScreenshotsTimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const membersRes = await fetch('/api/dashboard/members');
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (!cancelled) {
            setCurrentRole((membersData.currentRole as string | undefined) ?? null);
          }
        }

        const res = await fetch('/api/dashboard/screenshots-timeline');
        if (!res.ok) {
          throw new Error(`Erreur de chargement de la timeline (HTTP ${res.status})`);
        }
        const data = await res.json();
        const loaded = (data.items ?? []) as TimelineItem[];
        if (!cancelled) {
          setItems(loaded);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Impossible de charger la timeline de captures';
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

  const canSeeScreenshots = currentRole === 'owner' || currentRole === 'manager';

  const members: MemberOption[] = useMemo(() => {
    const byId = new Map<string, MemberOption>();
    for (const item of items) {
      if (!byId.has(item.userId)) {
        byId.set(item.userId, {
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const an = (a.userName || a.userEmail || '').toLowerCase();
      const bn = (b.userName || b.userEmail || '').toLowerCase();
      return an.localeCompare(bn);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedUserId === 'all') return items;
    return items.filter((item) => item.userId === selectedUserId);
  }, [items, selectedUserId]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Activity – Screenshots timeline</h2>
      <p className="text-sm text-gray-600 mb-4">
        Timeline détaillée de toutes les captures enregistrées, par membre, avec horodatage.
      </p>

      {!canSeeScreenshots && (
        <p className="text-sm text-gray-500 mb-4">
          Les timelines de captures sont visibles uniquement par les owners et managers.
        </p>
      )}

      {loading && <p className="text-sm text-gray-500">Chargement des captures…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && canSeeScreenshots && items.length === 0 && (
        <p className="text-sm text-gray-500">Aucune capture disponible pour le moment.</p>
      )}

      {canSeeScreenshots && members.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="memberFilter" className="text-sm text-gray-700">
            Filtrer par membre :
          </label>
          <select
            id="memberFilter"
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="all">Tous les membres</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userName || m.userEmail || 'Utilisateur inconnu'}
              </option>
            ))}
          </select>
        </div>
      )}

      {canSeeScreenshots && !loading && !error && filteredItems.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => (
            <div key={`${item.userId}-${idx}`} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/user-avatar.svg"
                  alt={item.userName || item.userEmail}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.userName || item.userEmail}</p>
                  <p className="text-xs text-gray-500 truncate" title={item.userEmail}>
                    {item.userEmail}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Capture prise le {formatDateTime(item.capturedAt)}</p>
                </div>
              </div>

              <button
                type="button"
                className="relative mt-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                onClick={() => setLightboxUrl(item.url)}
              >
                <Image
                  src={item.url}
                  alt="Capture d'écran"
                  width={640}
                  height={400}
                  className="w-full h-32 object-cover"
                />
              </button>
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
            <Image
              src={lightboxUrl}
              alt="Screenshot preview"
              width={1280}
              height={720}
              className="max-h-[85vh] h-auto w-auto rounded shadow-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
