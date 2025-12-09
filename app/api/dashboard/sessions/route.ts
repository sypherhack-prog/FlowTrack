// app/api/dashboard/sessions/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import TimeEntry from '@/lib/db/models/TimeEntry';
import Project from '@/lib/db/models/Project';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    await connectDB();

    const entries = await TimeEntry.find({ userId: user.id })
      .populate({ path: 'projectId', model: Project })
      .sort({ startTime: -1 })
      .limit(50);

    const items = entries.map((entry: any) => {
      const project = entry.projectId as any | undefined;
      const seconds: number = entry.seconds || 0;
      const hourlyRate = project?.hourlyRate || 0;
      const spent = hourlyRate > 0 ? (seconds / 3600) * hourlyRate : 0;
      const screenshotUrls: string[] = Array.isArray(entry.screenshotUrls) ? entry.screenshotUrls : [];

      const log: { level?: string }[] = Array.isArray(entry.activityLog) ? entry.activityLog : [];
      const totalEvents = log.length;
      let activity = 0;
      if (totalEvents > 0) {
        const activeEvents = log.filter((e) => e.level === 'active').length;
        activity = Math.round((activeEvents / totalEvents) * 100);
      }

      return {
        id: entry._id.toString(),
        projectName: project?.name || 'No project',
        task: entry.task || '',
        startTime: entry.startTime,
        endTime: entry.endTime,
        seconds,
        spent,
        screenshotUrls,
        activity,
      };
    });

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/sessions', err);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
