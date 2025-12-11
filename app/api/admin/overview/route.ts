import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';
import TimeEntry from '@/lib/db/models/TimeEntry';
import BlockedEvent from '@/lib/db/models/BlockedEvent';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || currentUser.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [totalUsers, totalOrganizations, totalTimeEntries, totalBlockedEvents] = await Promise.all([
      User.countDocuments({}),
      Organization.countDocuments({}),
      TimeEntry.countDocuments({}),
      BlockedEvent.countDocuments({}),
    ]);

    const aggTime = await TimeEntry.aggregate<{
      _id: null;
      totalSeconds: number;
      totalScreenshots: number;
    }>([
      {
        $group: {
          _id: null,
          totalSeconds: { $sum: '$seconds' },
          totalScreenshots: { $sum: { $size: { $ifNull: ['$screenshotUrls', []] } } },
        },
      },
    ]);

    const totals = aggTime[0] || { totalSeconds: 0, totalScreenshots: 0 };

    const plansAgg = await Organization.aggregate<{
      _id: string | null;
      count: number;
    }>([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
        },
      },
    ]);

    const plans: Record<string, number> = {};
    for (const p of plansAgg) {
      const key = typeof p._id === 'string' && p._id.trim() ? p._id : 'unknown';
      plans[key] = p.count;
    }

    const trackingModesAgg = await Organization.aggregate<{
      _id: string | null;
      count: number;
    }>([
      {
        $group: {
          _id: '$timeTrackingMode',
          count: { $sum: 1 },
        },
      },
    ]);

    const trackingModes: Record<string, number> = {};
    for (const m of trackingModesAgg) {
      const key = typeof m._id === 'string' && m._id.trim() ? m._id : 'unknown';
      trackingModes[key] = m.count;
    }

    return NextResponse.json({
      totals: {
        users: totalUsers,
        organizations: totalOrganizations,
        timeEntries: totalTimeEntries,
        blockedEvents: totalBlockedEvents,
        timeSeconds: totals.totalSeconds || 0,
        screenshots: totals.totalScreenshots || 0,
      },
      plans,
      trackingModes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/admin/overview', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
