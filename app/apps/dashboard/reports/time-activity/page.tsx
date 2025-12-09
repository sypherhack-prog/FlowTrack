'use client';

import { useEffect, useState } from 'react';

interface SessionItem {
  id: string;
  projectName: string;
  task: string;
  startTime: string;
  endTime: string | null;
  seconds: number;
  activity: number;
}

interface ApiResponse {
  items: SessionItem[];
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ReportsTimeActivityPage() {
  const [data, setData] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/sessions');
        if (!res.ok) {
          throw new Error(`Erreur de chargement des sessions (HTTP ${res.status})`);
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json.items || []);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Impossible de charger les sessions';
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Reports – Time & activity</h2>
      <p className="text-sm text-gray-600 mb-4">
        Ce rapport affiche directement vos vraies sessions de temps, avec la durée et le niveau d&apos;activité calculé à
        partir des heartbeats.
      </p>

      {loading && <p className="text-sm text-gray-500">Chargement des sessions…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-gray-500">Aucune session trouvée. Lancez le tracker pour commencer à générer des données.</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Projet</th>
                <th className="px-4 py-2">Tâche</th>
                <th className="px-4 py-2">Durée</th>
                <th className="px-4 py-2">Activité</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const date = new Date(item.startTime).toLocaleDateString();
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2 align-top text-gray-600">{date}</td>
                    <td className="px-4 py-2 align-top text-gray-900">{item.projectName}</td>
                    <td className="px-4 py-2 align-top text-gray-700">{item.task || ''}</td>
                    <td className="px-4 py-2 align-top font-mono text-gray-800">{formatDuration(item.seconds)}</td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min(100, Math.max(0, item.activity))}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{item.activity}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
