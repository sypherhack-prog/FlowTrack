'use client';

import { useEffect, useState, FormEvent } from 'react';

interface AdminOverviewResponse {
  totals: {
    users: number;
    organizations: number;
    timeEntries: number;
    blockedEvents: number;
    timeSeconds: number;
    screenshots: number;
  };
  plans: Record<string, number>;
  trackingModes: Record<string, number>;
  error?: string;
}

interface AdminLookupOrganization {
  id: string;
  name: string;
  plan: string;
  billingPeriod: string;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
}

interface AdminLookupResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: AdminLookupOrganization | null;
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (!isFinite(hours)) return '0 h';
  return `${hours.toFixed(1)} h`;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<AdminLookupResult | null>(null);

  const [planUpdating, setPlanUpdating] = useState(false);
  const [planUpdateMessage, setPlanUpdateMessage] = useState<string | null>(null);
  const [planValue, setPlanValue] = useState('starter');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [monthsOverride, setMonthsOverride] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/overview', { cache: 'no-store' });
        const json = (await res.json()) as AdminOverviewResponse;
        if (cancelled) return;
        if (!res.ok || json.error) {
          setError(json.error || 'Erreur de chargement');
          setData(null);
        } else {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur réseau');
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

  const handleLookupSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const email = lookupEmail.trim();
    if (!email) {
      setLookupError('Veuillez entrer un email.');
      setLookupResult(null);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    setPlanUpdateMessage(null);

    try {
      const res = await fetch('/api/admin/organizations/lookup-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const json = (await res.json().catch(() => null)) as AdminLookupResult & { error?: string } | null;

      if (!res.ok || !json || json.error) {
        setLookupError(json?.error || 'Erreur lors de la recherche.');
        setLookupResult(null);
        return;
      }

      setLookupResult(json);
      const org = json.organization;
      if (org) {
        setPlanValue(org.plan || 'starter');
        const currentPeriod = (org.billingPeriod as 'monthly' | 'yearly') || 'monthly';
        setBillingPeriod(currentPeriod);
      }
    } catch {
      setLookupError('Erreur réseau lors de la recherche.');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePlanUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!lookupResult || !lookupResult.organization) {
      setPlanUpdateMessage("Aucune organisation sélectionnée.");
      return;
    }

    const orgId = lookupResult.organization.id;

    const payload: {
      plan: string;
      billingPeriod: 'monthly' | 'yearly';
      months?: number;
    } = {
      plan: planValue,
      billingPeriod,
    };

    const trimmedMonths = monthsOverride.trim();
    if (trimmedMonths) {
      const n = parseInt(trimmedMonths, 10);
      if (!Number.isNaN(n) && n > 0) {
        payload.months = n;
      }
    }

    setPlanUpdating(true);
    setPlanUpdateMessage(null);

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; plan?: string; billingPeriod?: 'monthly' | 'yearly'; planExpiresAt?: string }
        | null;

      if (!res.ok || !json || json.error || !json.success) {
        setPlanUpdateMessage(json?.error || 'Erreur lors de la mise à jour du plan.');
        return;
      }

      setPlanUpdateMessage('Plan mis à jour avec succès.');

      setLookupResult((prev) => {
        if (!prev || !prev.organization) return prev;
        return {
          ...prev,
          organization: {
            ...prev.organization,
            plan: json.plan || prev.organization.plan,
            billingPeriod: json.billingPeriod || prev.organization.billingPeriod,
            planExpiresAt: json.planExpiresAt ?? prev.organization.planExpiresAt,
          },
        };
      });
    } catch {
      setPlanUpdateMessage('Erreur réseau lors de la mise à jour du plan.');
    } finally {
      setPlanUpdating(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Chargement des statistiques globales…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500">Aucune donnée à afficher.</p>;
  }

  const { totals, plans, trackingModes } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin overview</h2>
        <p className="text-sm text-gray-600">
          Vue globale de l&apos;activité FlowTrack (toutes organisations confondues). Réservé au fondateur/admin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Organisations</p>
          <p className="mt-2 text-2xl font-semibold">{totals.organizations}</p>
        </div>
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Utilisateurs</p>
          <p className="mt-2 text-2xl font-semibold">{totals.users}</p>
        </div>
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Temps total tracké</p>
          <p className="mt-2 text-2xl font-semibold">{formatHours(totals.timeSeconds)}</p>
          <p className="text-xs text-gray-500 mt-1">(toutes entrées de temps cumulées)</p>
        </div>
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Entrées de temps</p>
          <p className="mt-2 text-2xl font-semibold">{totals.timeEntries}</p>
        </div>
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Captures d&apos;écran</p>
          <p className="mt-2 text-2xl font-semibold">{totals.screenshots}</p>
        </div>
        <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase">Événements sites bloqués</p>
          <p className="mt-2 text-2xl font-semibold">{totals.blockedEvents}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">Répartition des organisations par plan</p>
        {Object.keys(plans).length === 0 && (
          <p className="text-sm text-gray-500">Aucune organisation pour le moment.</p>
        )}
        {Object.keys(plans).length > 0 && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-1 pr-4">Plan</th>
                <th className="py-1 pr-4">Organisations</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(plans).map(([plan, count]) => (
                <tr key={plan} className="border-b last:border-b-0">
                  <td className="py-1 pr-4 font-medium text-gray-800">{plan}</td>
                  <td className="py-1 pr-4 text-gray-700">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl bg-white shadow p-4 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">
          Gestion manuelle de plan (admin)
        </p>

        <form onSubmit={handleLookupSubmit} className="space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email client</label>
              <input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="client@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {lookupLoading ? 'Recherche…' : 'Rechercher'}
            </button>
          </div>
          {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}
        </form>

        {lookupResult && (
          <div className="space-y-4 border-t border-gray-200 pt-4 mt-2">
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold">Résultat</p>
              <p>
                <span className="font-medium">Utilisateur :</span> {lookupResult.user.name} ({lookupResult.user.email})
              </p>
              {lookupResult.organization ? (
                <>
                  <p>
                    <span className="font-medium">Organisation :</span> {lookupResult.organization.name}
                  </p>
                  <p>
                    <span className="font-medium">Plan actuel :</span> {lookupResult.organization.plan} (
                    {lookupResult.organization.billingPeriod})
                  </p>
                  <p className="text-xs text-gray-500">
                    Trial jusqu&apos;au :{' '}
                    {lookupResult.organization.trialEndsAt
                      ? new Date(lookupResult.organization.trialEndsAt).toLocaleString()
                      : 'n/a'}
                    {' · '}Expiration plan payant :{' '}
                    {lookupResult.organization.planExpiresAt
                      ? new Date(lookupResult.organization.planExpiresAt).toLocaleString()
                      : 'n/a'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500">Aucune organisation associée pour cet utilisateur.</p>
              )}
            </div>

            {lookupResult.organization && (
              <form onSubmit={handlePlanUpdate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau plan</label>
                    <select
                      value={planValue}
                      onChange={(e) => setPlanValue(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="trial">trial</option>
                      <option value="starter">starter</option>
                      <option value="team">team</option>
                      <option value="pro">pro</option>
                      <option value="enterprise">enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Période de facturation</label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setBillingPeriod('monthly')}
                        className={`flex-1 rounded-full border px-3 py-2 ${
                          billingPeriod === 'monthly'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Mensuel
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingPeriod('yearly')}
                        className={`flex-1 rounded-full border px-3 py-2 ${
                          billingPeriod === 'yearly'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Annuel
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Durée (mois, optionnel)</label>
                    <input
                      type="number"
                      min={1}
                      value={monthsOverride}
                      onChange={(e) => setMonthsOverride(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={billingPeriod === 'yearly' ? '12 (par défaut)' : '1 (par défaut)'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={planUpdating}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {planUpdating ? 'Mise à jour…' : 'Appliquer la mise à jour'}
                  </button>
                  {planUpdateMessage && <p className="text-xs text-gray-600">{planUpdateMessage}</p>}
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
