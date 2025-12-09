// app/api/dashboard/messages/route.ts
import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/Users';
import Membership from '@/lib/db/models/Membership';
import Message from '@/lib/db/models/Message';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();

  const userDoc = await User.findById(currentUser.id);
  if (!userDoc || !userDoc.organizationId) {
    return NextResponse.json({ items: [] });
  }

  const organizationId = userDoc.organizationId;

  const messages = await Message.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId');

  const items = messages.map((m: any) => {
    const u = m.userId as any | undefined;
    return {
      id: m._id.toString(),
      content: m.content as string,
      createdAt: m.createdAt as Date,
      userId: u?._id?.toString() ?? null,
      userName: u?.name || u?.email || '',
      userEmail: u?.email || '',
    };
  });

  return NextResponse.json({ items, currentUserId: currentUser.id });
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

    const body = (await request.json().catch(() => null)) as { content?: string } | null;
    if (!body?.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc || !userDoc.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const organizationId = userDoc.organizationId;

    const membership = await Membership.findOne({ organizationId, userId: userDoc._id });
    if (!membership || (membership.role !== 'owner' && membership.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const content = body.content.trim().slice(0, 1000);

    const msg = await Message.create({
      organizationId,
      userId: userDoc._id,
      content,
    });

    return NextResponse.json({
      message: {
        id: msg._id.toString(),
        content: msg.content as string,
        createdAt: msg.createdAt as Date,
        userId: userDoc._id.toString(),
        userName: (userDoc.name as string | undefined) || (userDoc.email as string),
        userEmail: userDoc.email as string,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/dashboard/messages', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
