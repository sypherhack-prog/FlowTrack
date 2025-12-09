'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOAL_OPTIONS = [
  { id: 'monitor_employees', label: 'Surveiller nos employés' },
  { id: 'manage_schedules', label: 'Gérer les horaires' },
  { id: 'track_productivity', label: 'Suivre la productivité' },
  { id: 'payroll', label: 'Rémunérer le personnel' },
  { id: 'projects_costs', label: 'Suivre projets, coûts et budgets' },
];

const TIME_MODES = [
  { id: 'web_app', label: 'Application web FlowTrack' },
  { id: 'all_platforms', label: 'Toutes les plateformes (web + desktop)' },
  { id: 'silent_app', label: 'Application silencieuse' },
];

const COMPANY_SIZES = [
  '1-5',
  '6-10',
  '11-50',
  '51-100',
  '101+',
];

const PLANS = [
  { id: 'starter', label: 'Starter – $9 / utilisateur / mois' },
  { id: 'team', label: 'Team – $19 / utilisateur / mois' },
  { id: 'enterprise', label: 'Enterprise – sur devis' },
];

interface InviteRow {
  email: string;
  role: 'manager' | 'member';
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [orgName, setOrgName] = useState('');
  const [companySize, setCompanySize] = useState<string>('1-5');
  const [timeMode, setTimeMode] = useState<string>('web_app');
  const [goals, setGoals] = useState<string[]>([]);
  const [plan, setPlan] = useState<string>('starter');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'member' }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const updateInvite = (index: number, patch: Partial<InviteRow>) => {
    setInvites((prev) => prev.map((inv, i) => (i === index ? { ...inv, ...patch } : inv)));
  };

  const addInviteRow = () => {
    setInvites((prev) => [...prev, { email: '', role: 'member' }]);
  };

  const removeInviteRow = (index: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!orgName.trim()) {
      setError('Veuillez renseigner le nom de votre organisation.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName.trim(),
          size: companySize,
          timeTrackingMode: timeMode,
          goals,
          plan,
          billingPeriod,
          invites: invites
            .filter((i) => i.email.trim())
            .map((i) => ({ email: i.email.trim(), role: i.role })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Onboarding failed');
      }

      router.push('/apps/dashboard/projects');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-indigo-600 mb-1">Configuration FlowTrack</p>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue, configurons votre espace</h1>
          <p className="mt-2 text-sm text-gray-500">
            Quelques étapes rapides pour créer votre organisation et inviter votre équipe.
          </p>
        </div>

        <div className="flex items-center mb-8 gap-2 text-xs text-gray-500">
          <span className={step >= 1 ? 'font-semibold text-indigo-600' : ''}>1. Organisation</span>
          <span>·</span>
          <span className={step >= 2 ? 'font-semibold text-indigo-600' : ''}>2. Temps & objectifs</span>
          <span>·</span>
          <span className={step >= 3 ? 'font-semibold text-indigo-600' : ''}>3. Équipe</span>
          <span>·</span>
          <span className={step >= 4 ? 'font-semibold text-indigo-600' : ''}>4. Plan</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;organisation</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Ma société"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taille de la compagnie</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} employés
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Comment souhaitez-vous que votre équipe gère le temps ?
              </p>
              <div className="space-y-2">
                {TIME_MODES.map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center gap-3 rounded border px-3 py-2 text-sm cursor-pointer ${
                      timeMode === mode.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeMode"
                      value={mode.id}
                      checked={timeMode === mode.id}
                      onChange={() => setTimeMode(mode.id)}
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Quels sont vos objectifs principaux ?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((g) => {
                  const active = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`rounded border px-3 py-2 text-left text-sm ${
                        active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="block text-sm font-medium text-gray-700 mb-2">Invitez votre équipe (optionnel)</p>
            <div className="space-y-3">
              {invites.map((inv, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="email"
                    value={inv.email}
                    onChange={(e) => updateInvite(index, { email: e.target.value })}
                    placeholder="email@entreprise.com"
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={inv.role}
                    onChange={(e) => updateInvite(index, { role: e.target.value as InviteRow['role'] })}
                    className="w-32 rounded border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="member">Membre</option>
                    <option value="manager">Manager</option>
                  </select>
                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInviteRow(index)}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      Suppr.
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInviteRow}
              className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Ajouter un membre
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Choisissez un plan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLANS.map((p) => {
                  const active = plan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`rounded border px-4 py-3 text-left text-sm ${
                        active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{p.label}</div>
                      {p.id === 'starter' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Idéal pour démarrer avec un petit nombre d&apos;utilisateurs et un abonnement mensuel simple.
                        </p>
                      )}
                      {p.id === 'team' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Pensé pour les équipes en croissance qui ont besoin de visibilité et de contrôle au quotidien.
                        </p>
                      )}
                      {p.id === 'enterprise' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Pour les organisations avec des besoins avancés (sécurité, onboarding dédié, intégrations).
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Facturation</p>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`rounded-full px-4 py-1 border ${
                    billingPeriod === 'monthly'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`rounded-full px-4 py-1 border ${
                    billingPeriod === 'yearly'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Annuel
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Vous pourrez toujours changer de plan ou ajuster les membres de votre équipe plus tard.
            </p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || submitting}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
          >
            Précédent
          </button>

          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Continuer
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? 'Finalisation…' : "Terminer et ouvrir le dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
