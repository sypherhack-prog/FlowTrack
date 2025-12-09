// app/api/track/heartbeat/route.ts
import { NextResponse } from 'next/server';
import { TrackingService } from '@/lib/services/tracking.service';
import { getCurrentUser } from '@/lib/middleware/auth';
import { notifyMemberInactivity } from '@/lib/realtime/managerNotifications';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json();
  const level = (body as { level?: string } | null)?.level;

  const normalizedLevel: 'active' | 'idle' | 'away' =
    level === 'active' || level === 'idle' || level === 'away' ? level : 'active';

  await TrackingService.heartbeat(user.id, normalizedLevel);

  if (normalizedLevel === 'idle' || normalizedLevel === 'away') {
    await notifyMemberInactivity(user.id, normalizedLevel);
  }

  return new NextResponse(null, { status: 204 });
}