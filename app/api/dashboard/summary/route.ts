// app/api/dashboard/summary/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import TimeEntry from '@/lib/db/models/TimeEntry';
import Project from '@/lib/db/models/Project';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek() {
  // Derniers 7 jours en incluant aujourd'hui
  const today = startOfToday();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  return weekStart;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();

    const weekStart = startOfWeek();
    const todayStart = startOfToday();

    const entriesThisWeek = await TimeEntry.find({
      userId: user.id,
      startTime: { $gte: weekStart },
    }).populate({ path: 'projectId', model: Project });

    const entriesToday = entriesThisWeek.filter((entry: any) => entry.startTime >= todayStart);

    const workedThisWeekSeconds = entriesThisWeek.reduce(
      (acc: number, entry: any) => acc + (entry.seconds || 0),
      0,
    );

    const workedTodaySeconds = entriesToday.reduce(
      (acc: number, entry: any) => acc + (entry.seconds || 0),
      0,
    );

    let spentThisWeek = 0;
    for (const entry of entriesThisWeek as any[]) {
      const project = entry.projectId as any | undefined;
      const hourlyRate = project?.hourlyRate || 0;
      if (hourlyRate > 0 && entry.seconds) {
        spentThisWeek += (entry.seconds / 3600) * hourlyRate;
      }
    }

    return NextResponse.json({
      spentThisWeek,
      workedTodaySeconds,
      workedThisWeekSeconds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/summary', err);
    return NextResponse.json(
      {
        spentThisWeek: 0,
        workedTodaySeconds: 0,
        workedThisWeekSeconds: 0,
        error: message,
      },
      { status: 500 },
    );
  }
}
