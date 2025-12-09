// app/api/track/stop/route.ts
import { NextResponse } from 'next/server';
import { TrackingService } from '@/lib/services/tracking.service';
import { getCurrentUser } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const session = await TrackingService.stop(user.id);

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error('Error in /api/track/stop', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}