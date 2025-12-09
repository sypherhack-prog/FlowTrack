'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { io } from 'socket.io-client';
import { UserGroupIcon } from '@heroicons/react/24/outline';

import { ActivityTracker } from '@/app/tracker/ActivityTracker';
import { ScreenshotWorker } from '@/app/tracker/ScreenshotWorker';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ToastCenter } from '@/components/ToastCenter';
import { HeaderNotificationBell } from '@/components/HeaderNotificationBell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [liveUsers, setLiveUsers] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const [planChecked, setPlanChecked] = useState(false);
  const [mustChoosePlan, setMustChoosePlan] = useState(false);
  const isManagerRef = useRef(false);
  const orgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    socket.on('live-users-update', (count: number) => {
      setLiveUsers(count);
    });

    socket.on('manager-notification' as any, (payload: any) => {
      try {
        if (!isManagerRef.current) return;
        const orgId = orgIdRef.current;
        if (payload?.orgId && orgId && payload.orgId !== orgId) return;

        if (typeof window === 'undefined') return;

        const type = payload?.type === 'blocked-site' ? 'warning' : 'info';
        const message =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : 'New activity notification';

        window.dispatchEvent(
          new CustomEvent('flowtrack:toast', {
            detail: {
              type,
              message,
            },
          }),
        );
      } catch {
        // ignore
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENFORCE_TRIAL !== 'true') {
      return;
    }

    let cancelled = false;

    const checkPlan = async () => {
      try {
        const res = await fetch('/api/dashboard/plan-status', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        const trialExpired = Boolean(data.trialExpired) && data.plan === 'trial';
        setPlanChecked(true);
        setMustChoosePlan(trialExpired);

        if (data.organizationId) {
          orgIdRef.current = String(data.organizationId);
        }
        const role = typeof data.currentRole === 'string' ? data.currentRole : 'member';
        isManagerRef.current = role === 'owner' || role === 'manager';

        if (
          trialExpired &&
          pathname &&
          !pathname.startsWith('/apps/dashboard/billing/choose-plan')
        ) {
          router.replace('/apps/dashboard/billing/choose-plan');
        }
      } catch {
        // silent fail, dashboard remains accessible
      }
    };

    checkPlan();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const sections = [
    {
      title: 'Overview',
      items: [
        { href: '/apps/dashboard/projects', label: 'Dashboard' },
        { href: '/apps/dashboard/tracker', label: 'Time tracker' },
      ],
    },
    {
      title: 'Timesheets',
      items: [{ href: '/apps/dashboard/timesheets/view-edit', label: 'View & edit' }],
    },
    {
      title: 'Activity',
      items: [
        { href: '/apps/dashboard/activity/screenshots', label: 'Screenshots' },
        { href: '/apps/dashboard/activity/urls', label: 'URLs' },
        { href: '/apps/dashboard/activity/apps', label: 'Apps' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { href: '/apps/dashboard/reports', label: 'Overview' },
        { href: '/apps/dashboard/reports/time-activity', label: 'Time & activity' },
      ],
    },
    {
      title: 'Communication',
      items: [{ href: '/apps/dashboard/messages', label: 'Messages' }],
    },
    {
      title: 'Settings',
      items: [{ href: '/apps/dashboard/settings/activity-tracking', label: 'Activity & tracking' }],
    },
  ];

  // Par défaut, seule la section "Overview" est ouverte pour éviter que toutes
  // les listes déroulantes remplissent la page dès l'arrivée sur le dashboard.
  const [openSections, setOpenSections] = useState<string[]>(() => ['Overview']);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));
  };

  const flatItems = sections.flatMap((section) => section.items);
  const activeItem = flatItems.find((item) => pathname?.startsWith(item.href));
  const title = activeItem?.label || 'Dashboard';

  return (
    <>
      <ActivityTracker />
      <ScreenshotWorker />
      <TimerDisplay />
      <ToastCenter />

      <div className="flex h-screen bg-slate-100">
        {/* Sidebar gauche */}
        <aside className="w-64 bg-slate-900 text-slate-100 shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950">
            <Image src="/logo-hubstaff-like.svg" alt="FlowTrack" width={120} height={32} className="h-8 w-auto" />
          </div>
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {sections.map((section) => {
              const isOpen = openSections.includes(section.title);
              return (
                <div key={section.title}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between px-2 py-1 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
                  >
                    <span>{section.title}</span>
                    <span className="text-[10px]">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-1 pl-1">
                      {section.items.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                                : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header avec live users + notifications */}
          <header className="bg-white/80 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>{liveUsers}</span>
                <span className="text-xs text-green-700/80">users online</span>
              </div>
              <HeaderNotificationBell />
              <UserGroupIcon className="h-6 w-6 text-slate-500" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
        </div>
      </div>
    </>
  );
}