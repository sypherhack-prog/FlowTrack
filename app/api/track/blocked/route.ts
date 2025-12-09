// app/api/track/blocked/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import BlockedEvent from '@/lib/db/models/BlockedEvent';
import { notifyBlockedSite } from '@/lib/realtime/managerNotifications';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url ?? 'unknown';

  if (!user) {
    console.warn('Blocked site detected but user is not authenticated', { url });

    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  await BlockedEvent.create({ userId: user.id, url });

  console.log('Blocked site detected', { user: user.email, url });

  // Notification temps réel aux managers (plans payants uniquement)
  await notifyBlockedSite(user.id, url);

  return NextResponse.json({ success: true });
}