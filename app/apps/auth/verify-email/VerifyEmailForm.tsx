'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface VerifyEmailFormProps {
  initialEmail?: string;
}

export default function VerifyEmailForm({ initialEmail = '' }: VerifyEmailFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verified successfully. Redirecting...');
      setTimeout(() => {
        router.push('/apps/onboarding');
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Verification code</label>
        <input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.4em] text-center text-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="123456"
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
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify email'}
      </button>
    </form>
  );
}
