// app/api/dashboard/members-activity/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import Membership from '@/lib/db/models/Membership';
import User from '@/lib/db/models/Users';
import TimeEntry from '@/lib/db/models/TimeEntry';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();

  // Organisations du user courant (owner / manager / member)
  const memberships = await Membership.find({ userId: user.id });
  if (!memberships.length) {
    return NextResponse.json({ items: [] });
  }

  const organizationIds = memberships.map((m: any) => m.organizationId);
  const isManagerOrOwner = memberships.some(
    (m: any) => m.role === 'owner' || m.role === 'manager',
  );

  // Tous les membres de ces organisations
  const orgMemberships = await Membership.find({ organizationId: { $in: organizationIds } }).select(
    'userId role',
  );

  const userIds = isManagerOrOwner
    ? orgMemberships.map((m: any) => m.userId)
    : [user.id];

  const users = await User.find({ _id: { $in: userIds } }).select('name email');
  const userMap = new Map<string, { name?: string; email?: string }>();
  users.forEach((u: any) => {
    userMap.set(u._id.toString(), { name: u.name as string | undefined, email: u.email as string | undefined });
  });

  // On regarde la dernière journée d'activité pour le widget
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const entries = await TimeEntry.find({
    userId: { $in: userIds },
    startTime: { $gte: since },
  }).select('userId seconds activityLog startTime endTime screenshotUrls');

  type Stat = {
    active: number;
    idle: number;
    away: number;
    total: number;
    seconds: number;
    lastScreenshotUrl: string | null;
    lastScreenshotTime?: Date;
  };

  const stats = new Map<string, Stat>();

  entries.forEach((entry: any) => {
    const uid = entry.userId?.toString();
    if (!uid) return;

    let s = stats.get(uid);
    if (!s) {
      s = {
        active: 0,
        idle: 0,
        away: 0,
        total: 0,
        seconds: 0,
        lastScreenshotUrl: null,
      };
      stats.set(uid, s);
    }

    const log: { level?: string }[] = Array.isArray(entry.activityLog) ? entry.activityLog : [];
    for (const e of log) {
      s.total += 1;
      if (e.level === 'active') s.active += 1;
      else if (e.level === 'idle') s.idle += 1;
      else if (e.level === 'away') s.away += 1;
    }

    s.seconds += entry.seconds || 0;

    const screenshots: string[] = Array.isArray(entry.screenshotUrls) ? entry.screenshotUrls : [];
    if (screenshots.length > 0) {
      const shotUrl = screenshots[screenshots.length - 1] as string;
      const shotTime: Date = (entry.endTime as Date) || (entry.startTime as Date);
      if (!s.lastScreenshotTime || shotTime > s.lastScreenshotTime) {
        s.lastScreenshotTime = shotTime;
        s.lastScreenshotUrl = shotUrl;
      }
    }
  });

  const membershipsForItems = isManagerOrOwner
    ? orgMemberships
    : orgMemberships.filter((membership: any) => membership.userId?.toString() === user.id);

  const items = membershipsForItems
    .map((membership: any) => {
      const uid = membership.userId?.toString();
      if (!uid) return null;

      const info = userMap.get(uid);
      const s = stats.get(uid);
      const total = s?.total ?? 0;

      let activePct = 0;
      let idlePct = 0;
      let awayPct = 0;
      if (total > 0 && s) {
        activePct = Math.round((s.active / total) * 100);
        idlePct = Math.round((s.idle / total) * 100);
        awayPct = Math.max(0, 100 - activePct - idlePct);
      }

      const lastScreenshotUrl = isManagerOrOwner ? s?.lastScreenshotUrl ?? null : null;

      return {
        userId: uid,
        name: info?.name || info?.email || '',
        email: info?.email || '',
        activePct,
        idlePct,
        awayPct,
        totalSeconds: s?.seconds ?? 0,
        lastScreenshotUrl,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}
