// app/api/track/start/route.ts
import { NextResponse } from 'next/server';
import { TrackingService } from '@/lib/services/tracking.service';
import { getCurrentUser } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json();
  const { projectId, task } = body;

  if (!projectId) {
    return new NextResponse('projectId is required', { status: 400 });
  }

  await TrackingService.start(user.id, projectId, task);

  return NextResponse.json({ success: true });
}