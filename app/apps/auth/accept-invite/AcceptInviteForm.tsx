'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptInviteFormProps {
  token: string;
}

interface InviteInfo {
  email: string;
  role: string;
  organizationName: string;
}

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Missing invitation token');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/accept-invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Invalid or expired invitation');
        }

        setInvite({
          email: data.email,
          role: data.role,
          organizationName: data.organizationName,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invite) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not accept invitation');
      }

      setSuccess('Invitation accepted. Redirecting to your dashboard...');
      setTimeout(() => {
        router.push('/apps/dashboard/projects');
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading invitation…</p>;
  }

  if (error && !invite) {
    return <p className="text-sm text-red-600 text-center">{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {invite && (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            You have been invited to join <span className="font-semibold">{invite.organizationName}</span>{' '}
            as a <span className="font-semibold">{invite.role}</span>.
          </p>
          <p className="mt-1 text-xs text-gray-500">Invitation sent to {invite.email}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Full name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Minimum 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm password</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Repeat your password"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center">{success}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {submitting ? 'Creating your account…' : 'Accept invitation'}
      </button>
    </form>
  );
}
