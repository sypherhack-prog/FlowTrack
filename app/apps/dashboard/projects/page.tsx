'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import { Line } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import LiveUsersChart from '@/components/LiveUsersChart';
import { BlockedEventsWidget } from '@/components/BlockedEventsWidget';

interface DashboardSession {
  id: string;
  projectName: string;
  seconds: number;
  activity: number;
  screenshotUrls: string[];
}

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt?: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface MemberActivityItem {
  userId: string;
  name: string;
  email: string;
  activePct: number;
  idlePct: number;
  awayPct: number;
  totalSeconds: number;
  lastScreenshotUrl: string | null;
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function HubstaffDashboard() {
  const [spentThisWeek, setSpentThisWeek] = useState(0);
  const [workedTodaySeconds, setWorkedTodaySeconds] = useState(0);
  const [workedThisWeekSeconds, setWorkedThisWeekSeconds] = useState(0);
  const [memberActivity, setMemberActivity] = useState<MemberActivityItem[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'manager'>('member');
  const [savingMember, setSavingMember] = useState(false);
  const [currentOrgRole, setCurrentOrgRole] = useState<string | null>(null);

  const workedTodayHours = workedTodaySeconds / 3600;
  const workedThisWeekHours = workedThisWeekSeconds / 3600;

  const canManageMembers = currentOrgRole === 'owner' || currentOrgRole === 'manager';
  const canSeeScreenshots = currentOrgRole === 'owner' || currentOrgRole === 'manager';

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const spentChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Spent',
        data: [
          spentThisWeek * 0.2,
          spentThisWeek * 0.4,
          spentThisWeek * 0.6,
          spentThisWeek * 0.8,
          spentThisWeek,
        ],
        borderColor: 'rgb(34 197 94)', // Vert comme l'image
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const todayChartData = {
    labels: ['9h', '10h', '11h', '12h', '13h'],
    datasets: [
      {
        label: 'Worked Today (h)',
        data: [
          workedTodayHours * 0.2,
          workedTodayHours * 0.4,
          workedTodayHours * 0.6,
          workedTodayHours * 0.8,
          workedTodayHours,
        ],
        borderColor: 'rgb(59 130 246)', // Bleu comme l'image
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const weekChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Worked This Week (h)',
        data: [
          workedThisWeekHours * 0.2,
          workedThisWeekHours * 0.4,
          workedThisWeekHours * 0.6,
          workedThisWeekHours * 0.8,
          workedThisWeekHours,
        ],
        borderColor: 'rgb(34 197 94)', // Vert comme l'image
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
  };

  const recentActivity = memberActivity.map((item) => ({
    userId: item.userId,
    name: item.name || item.email || 'Unknown',
    email: item.email,
    activePct: item.activePct,
    idlePct: item.idlePct,
    awayPct: item.awayPct,
    time: formatDuration(item.totalSeconds),
    screenshot: item.lastScreenshotUrl,
  }));

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) return;
        const data = await res.json();
        setSpentThisWeek(data.spentThisWeek ?? 0);
        setWorkedTodaySeconds(data.workedTodaySeconds ?? 0);
        setWorkedThisWeekSeconds(data.workedThisWeekSeconds ?? 0);
      } catch {
        // on garde les valeurs par défaut si l'API échoue
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await fetch('/api/dashboard/members-activity');
        if (!res.ok) return;
        const data = await res.json();
        const items = (data.items ?? []) as MemberActivityItem[];
        setMemberActivity(items);
      } catch {
        // on garde la liste vide si l'API échoue
      }
    };

    loadActivity();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetch('/api/dashboard/members');
        if (!res.ok) return;
        const data = await res.json();
        const allInvites = (data.invites ?? []) as InviteItem[];
        setMembers((data.members ?? []) as MemberItem[]);
        setInvites(allInvites.filter((inv) => inv.status === 'pending'));
        setCurrentOrgRole((data.currentRole as string | undefined) ?? null);
      } catch {
        // on garde les listes vides si l'API échoue
      }
    };

    loadMembers();
  }, []);

  const handleAddMember = async (event: any) => {
    event.preventDefault();
    if (!canManageMembers) return;
    const email = newMemberEmail.trim();
    if (!email || savingMember) return;

    setSavingMember(true);
    try {
      const res = await fetch('/api/dashboard/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newMemberRole }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.invite) {
        setInvites((prev) => [data.invite as InviteItem, ...prev]);
        setNewMemberEmail('');
      }
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Métriques centrales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Spent this week</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">${spentThisWeek.toFixed(1)}</p>
          <p className="text-green-600 text-sm font-medium">+ $21.00</p>
          <Line data={spentChartData} options={chartOptions} height={100} />
        </div>

        <div className="bg-white rounded-xl shadow p-6 transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Worked today</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{formatDuration(workedTodaySeconds)}</p>
          <p className="text-red-600 text-sm font-medium">- 1:52:02</p>
          <Line data={todayChartData} options={chartOptions} height={100} />
        </div>

        <div className="bg-white rounded-xl shadow p-6 transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Worked this week</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{formatDuration(workedThisWeekSeconds)}</p>
          <p className="text-green-600 text-sm font-medium">+ 1:22:02</p>
          <Line data={weekChartData} options={chartOptions} height={100} />
        </div>
      </div>

      {/* Live users + blocked sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <LiveUsersChart />
        </div>
        <BlockedEventsWidget />
      </div>

      {/* Recent Activity + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 transition-shadow duration-150 hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((act) => (
              <div key={act.userId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Image
                  src="/user-avatar.svg"
                  alt={act.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />

                <div className="flex-1">
                  <p className="font-semibold">{act.name}</p>
                  <p className="text-sm text-gray-500">{act.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-green-800 font-medium">
                    Active {act.activePct}%
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Idle {act.idlePct}% · Distracted {act.awayPct}%
                  </span>
                </div>
                {canSeeScreenshots && act.screenshot && (
                  <div className="flex gap-1">
                    <Image
                      src={act.screenshot}
                      alt="Last screenshot"
                      width={160}
                      height={120}
                      className="w-12 h-9 rounded object-cover cursor-pointer border border-gray-200"
                      onClick={() => setLightboxUrl(act.screenshot!)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 transition-shadow duration-150 hover:shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Members</h3>
          </div>

          {members.length === 0 && invites.length === 0 && canManageMembers && (
            <p className="text-sm text-gray-500 mb-3">
              No team members yet. Add a member below.
            </p>
          )}
          {members.length === 0 && invites.length === 0 && !canManageMembers && (
            <p className="text-sm text-gray-500 mb-3">No other team members yet.</p>
          )}

          <div className="space-y-3 mb-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded">
                <Image
                  src="/user-avatar.svg"
                  alt={member.name || member.email}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.name || member.email}</p>
                  <p className="text-sm text-gray-500 truncate" title={member.email}>
                    {member.email}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                  {member.role}
                </span>
              </div>
            ))}

            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded">
                <Image
                  src="/user-avatar.svg"
                  alt={inv.email}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover opacity-70"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{inv.email}</p>
                  <p className="text-sm text-gray-500">Invitation · {inv.role}</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                  {inv.status}
                </span>
              </div>
            ))}
          </div>

          {canManageMembers && (
            <form onSubmit={handleAddMember} className="mt-2 flex flex-col gap-2 border-t border-gray-200 pt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'member' | 'manager')}
                  className="w-32 rounded border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={savingMember}
                className="self-end rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingMember ? 'Adding…' : 'Add member'}
              </button>
            </form>
          )}
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
            >
              Close
            </button>
            {lightboxUrl && (
              <Image
                src={lightboxUrl}
                alt="Screenshot preview"
                width={1280}
                height={720}
                className="max-h-[85vh] h-auto w-auto rounded shadow-xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}