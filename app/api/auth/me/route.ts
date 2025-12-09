// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  return NextResponse.json(user);
}
