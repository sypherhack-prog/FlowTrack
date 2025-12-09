'use client';

import { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface InviteItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface NotificationItem {
  id: string;
  message: string;
  createdAt?: string;
}

export function HeaderNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/members');
        if (!res.ok) return;
        const data = await res.json();
        const allInvites = (data.invites ?? []) as InviteItem[];
        const accepted = allInvites.filter((inv) => inv.status === 'accepted');

        const mapped: NotificationItem[] = accepted.map((inv) => ({
          id: inv.id,
          message: `${inv.email} a accepté l'invitation (${inv.role})`,
          createdAt: inv.createdAt,
        }));
        setNotifications(mapped);

        if (typeof window !== 'undefined') {
          accepted.forEach((inv) => {
            window.dispatchEvent(
              new CustomEvent('flowtrack:toast', {
                detail: {
                  type: 'success',
                  message: `${inv.email} a accepté l'invitation (${inv.role})`,
                },
              }),
            );
          });
        }
      } catch {
        // on garde la liste vide en cas d'erreur
      }
    };

    load();
  }, []);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasNotifications && setOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && hasNotifications && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-black/5">
          <p className="mb-2 font-semibold">Notifications</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {notifications.map((notif) => (
              <div key={notif.id} className="rounded-md bg-gray-50 px-3 py-2">
                <p className="text-gray-800">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
