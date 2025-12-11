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

  const memberships = await Membership.find({ userId: user.id });
  if (!memberships.length) {
    return NextResponse.json({ items: [] });
  }

  const organizationIds = memberships.map((m: any) => m.organizationId);
  const isManagerOrOwner = memberships.some(
    (m: any) => m.role === 'owner' || m.role === 'manager',
  );

  const orgMemberships = await Membership.find({ organizationId: { $in: organizationIds } }).select(
    'userId role',
  );

  const userIds = isManagerOrOwner
    ? orgMemberships.map((m: any) => m.userId)
    : [user.id];

  const users = await User.find({ _id: { $in: userIds } }).select('name email');
  const userMap = new Map<string, { name?: string; email?: string }>();
  users.forEach((u: any) => {
    userMap.set(u._id.toString(), {
      name: u.name as string | undefined,
      email: u.email as string | undefined,
    });
  });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const entries = await TimeEntry.find({
    userId: { $in: userIds },
    startTime: { $gte: since },
    screenshotUrls: { $exists: true, $not: { $size: 0 } },
  })
    .select('userId screenshotUrls startTime endTime')
    .sort({ endTime: -1 })
    .limit(200);

  type TimelineItem = {
    userId: string;
    userName: string;
    userEmail: string;
    url: string;
    capturedAt: Date;
  };

  const items: TimelineItem[] = [];

  entries.forEach((entry: any) => {
    const uid = entry.userId?.toString();
    if (!uid) return;

    const urls: string[] = Array.isArray(entry.screenshotUrls) ? entry.screenshotUrls : [];
    if (!urls.length) return;

    const baseTime: Date = (entry.endTime as Date) || (entry.startTime as Date);
    const info = userMap.get(uid);

    urls.forEach((url: string) => {
      items.push({
        userId: uid,
        userName: info?.name || info?.email || '',
        userEmail: info?.email || '',
        url,
        capturedAt: baseTime,
      });
    });
  });

  items.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

  return NextResponse.json({ items, isManagerOrOwner });
}
