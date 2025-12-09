'use client';

import { useEffect, useState, FormEvent } from 'react';

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  userId: string | null;
  userName: string;
  userEmail: string;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const canSend = currentRole === 'owner' || currentRole === 'manager';

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

        const res = await fetch('/api/dashboard/messages');
        if (!res.ok) {
          throw new Error(`Erreur de chargement des messages (HTTP ${res.status})`);
        }
        const data = await res.json();
        const loaded = (data.items ?? []) as MessageItem[];
        if (!cancelled) {
          setMessages(loaded);
          setCurrentUserId((data.currentUserId as string | undefined) ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Impossible de charger les messages';
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

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/dashboard/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [data.message as MessageItem, ...prev]);
        setNewMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  const orderedMessages = [...messages].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return da - db;
  });

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-1">Messages</h2>
        <p className="text-xs text-gray-600">
          Fil de discussion interne de votre organisation. Les owners et managers peuvent envoyer des messages à tous
          les membres.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Chargement des messages…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && orderedMessages.length === 0 && (
        <p className="text-sm text-gray-500 mb-4">Aucun message pour le moment.</p>
      )}

      <div className="flex-1 min-h-0 rounded-xl bg-white shadow border border-gray-100 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {orderedMessages.map((msg) => {
            const isOwn = currentUserId && msg.userId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-line break-words ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-2 text-[11px] text-gray-400 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwn && <span className="font-medium text-gray-500">{msg.userName}</span>}
                    <span>{formatDateTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canSend ? (
          <form
            onSubmit={handleSend}
            className="border-t border-gray-200 px-3 py-2 flex items-center gap-2 bg-gray-50 rounded-b-xl"
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={1}
              className="flex-1 resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Écrire un message…"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        ) : (
          <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
            Seuls les owners et managers peuvent envoyer des messages. Vous pouvez lire ici les messages qu&apos;ils
            publient.
          </div>
        )}
      </div>
    </div>
  );
}
