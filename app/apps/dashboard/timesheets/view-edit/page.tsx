"use client";

import { useEffect, useMemo, useState } from "react";

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
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export default function TimesheetsViewEditPage() {
  const [data, setData] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/sessions");
        if (!res.ok) {
          throw new Error(`Erreur de chargement des feuilles de temps (HTTP ${res.status})`);
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json.items || []);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Impossible de charger les feuilles de temps";
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

  const grouped = useMemo(() => {
    const byDay: Record<string, SessionItem[]> = {};
    for (const item of data) {
      const key = toDateKey(item.startTime);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(item);
    }
    const entries = Object.entries(byDay).sort(([a], [b]) => (a < b ? 1 : -1));
    return entries;
  }, [data]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Timesheets – View & edit</h2>
      <p className="text-sm text-gray-600 mb-4">
        Chaque ligne ci-dessous provient de vos vraies sessions de tracking (web, desktop, extension). Vous pouvez les
        utiliser comme base pour vos feuilles de temps hebdomadaires.
      </p>

      {loading && <p className="text-sm text-gray-500">Chargement des feuilles de temps…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && grouped.length === 0 && (
        <p className="text-sm text-gray-500">Aucune heure suivie pour le moment. Lancez le tracker pour commencer.</p>
      )}

      <div className="space-y-6 mt-4">
        {grouped.map(([day, items]) => {
          const totalSeconds = items.reduce((sum, i) => sum + (i.seconds || 0), 0);
          return (
            <div key={day} className="border rounded-lg bg-white shadow-sm">
              <div className="px-4 py-2 border-b flex items-center justify-between text-sm">
                <span className="font-semibold">{day}</span>
                <span className="text-gray-500">Total: {formatDuration(totalSeconds)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2">Projet</th>
                      <th className="px-4 py-2">Tâche</th>
                      <th className="px-4 py-2">Début</th>
                      <th className="px-4 py-2">Fin</th>
                      <th className="px-4 py-2">Durée</th>
                      <th className="px-4 py-2">Activité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const start = new Date(item.startTime).toLocaleTimeString();
                      const end = item.endTime ? new Date(item.endTime).toLocaleTimeString() : "";
                      return (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2 align-top text-gray-900">{item.projectName}</td>
                          <td className="px-4 py-2 align-top text-gray-700">{item.task || ""}</td>
                          <td className="px-4 py-2 align-top text-gray-600">{start}</td>
                          <td className="px-4 py-2 align-top text-gray-600">{end}</td>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
