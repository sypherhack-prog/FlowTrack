// app/api/track/screenshot/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { TrackingService } from '@/lib/services/tracking.service';
import { uploadScreenshotToS3 } from '@/lib/storage/s3';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const formData = await request.formData();
  const file = formData.get('screenshot');

  if (!(file instanceof File)) {
    return new NextResponse('No file', { status: 400 });
  }

  try {
    const keyPrefix = `screenshots/${user.id}`;
    const url = await uploadScreenshotToS3(file, keyPrefix);

    TrackingService.addScreenshot(user.id, url);

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Failed to upload screenshot to S3', error);

    const messageFromError =
      (typeof error?.message === 'string' && error.message.trim()) ||
      (typeof error === 'string' && error.trim()) ||
      String(error || '').trim() ||
      'Failed to upload screenshot';

    return NextResponse.json(
      { success: false, error: messageFromError },
      { status: 500 },
    );
  }
}