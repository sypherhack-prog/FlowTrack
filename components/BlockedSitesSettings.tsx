'use client';

import { useEffect, useState } from 'react';

interface BlockedSiteItem {
  id: string;
  pattern: string;
  label: string | null;
  createdAt?: string;
}

interface LoadResponse {
  items: BlockedSiteItem[];
  currentPlan?: string;
  canEdit?: boolean;
  defaultSites?: string[];
}

export function BlockedSitesSettings() {
  const [items, setItems] = useState<BlockedSiteItem[]>([]);
  const [defaultSites, setDefaultSites] = useState<string[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | undefined>(undefined);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pattern, setPattern] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/blocked-sites', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as LoadResponse;
        if (cancelled) return;
        setItems(data.items ?? []);
        setDefaultSites(data.defaultSites ?? []);
        setCurrentPlan(data.currentPlan);
        setCanEdit(Boolean(data.canEdit));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (type: 'success' | 'warning' | 'error', message: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('flowtrack:toast', {
        detail: { type, message },
      }),
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;
    if (!canEdit) {
      showToast('warning', "Votre plan actuel ne permet pas de modifier la liste des sites bloqués.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/blocked-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', data.error || 'Impossible d\'ajouter ce site.');
        return;
      }
      setItems((prev) => [...prev, data as BlockedSiteItem]);
      setPattern('');
      showToast('success', 'Site bloqué ajouté.');
    } catch {
      showToast('error', 'Erreur lors de l\'ajout du site.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      showToast('warning', "Votre plan actuel ne permet pas de modifier la liste des sites bloqués.");
      return;
    }

    try {
      const res = await fetch('/api/dashboard/blocked-sites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', data.error || 'Impossible de supprimer ce site.');
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
      showToast('success', 'Site bloqué supprimé.');
    } catch {
      showToast('error', 'Erreur lors de la suppression du site.');
    }
  };

  const effectiveList = items.length > 0 ? items.map((it) => it.pattern) : defaultSites;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">3. Sites bloqués</h3>
        <p className="text-sm text-gray-600">
          Définissez la liste des domaines considérés comme distrayants. L&apos;extension FlowTrack les détectera et
          remontera des alertes dans le dashboard.
        </p>
        {currentPlan && (
          <p className="mt-1 text-xs text-gray-500">
            Plan actuel&nbsp;: <span className="font-medium uppercase">{currentPlan}</span>{' '}
            {!canEdit && '· modification réservée aux plans payants.'}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Ex: youtube.com"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={!canEdit}
          />
          <button
            type="submit"
            disabled={!canEdit || saving}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </form>

        <div className="mt-3 text-xs text-gray-500">
          Utilisez uniquement le domaine (ex&nbsp;: <span className="font-mono">youtube.com</span>), sans protocole ni
          chemin.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-medium mb-2">Liste effective des sites bloqués</p>
        {loading && <p className="text-xs text-gray-400">Chargement…</p>}
        {!loading && effectiveList.length === 0 && (
          <p className="text-sm text-gray-500">Aucun site bloqué défini pour le moment.</p>
        )}
        {!loading && effectiveList.length > 0 && (
          <ul className="divide-y divide-gray-100 text-sm">
            {effectiveList.map((site) => {
              const item = items.find((it) => it.pattern === site) || null;
              return (
                <li key={site} className="flex items-center justify-between py-1.5">
                  <div>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{site}</span>
                    {item?.label && <span className="ml-2 text-xs text-gray-500">{item.label}</span>}
                  </div>
                  {item && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-500 hover:underline"
                      disabled={!canEdit}
                    >
                      Supprimer
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
