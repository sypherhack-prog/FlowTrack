// app/api/dashboard/blocked-events/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/db/mongodb';
import BlockedEvent from '@/lib/db/models/BlockedEvent';
import Membership from '@/lib/db/models/Membership';
import User from '@/lib/db/models/Users';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();

  // On récupère les organisations du user courant
  const memberships = await Membership.find({ userId: user.id });
  if (!memberships.length) {
    return NextResponse.json({ items: [] });
  }

  const organizationIds = memberships.map((m: any) => m.organizationId);

  const isManagerOrOwner = memberships.some(
    (m: any) => m.role === 'owner' || m.role === 'manager',
  );

  // Tous les membres de ces organisations
  const orgMemberships = await Membership.find({ organizationId: { $in: organizationIds } }).select(
    'userId role',
  );

  const userIds = isManagerOrOwner
    ? orgMemberships.map((m: any) => m.userId)
    : [user.id];

  const users = await User.find({ _id: { $in: userIds } }).select('name email');
  const userMap = new Map<string, { name?: string; email?: string }>();
  users.forEach((u: any) => {
    userMap.set(u._id.toString(), { name: u.name as string | undefined, email: u.email as string | undefined });
  });

  const events = await BlockedEvent.find({ userId: { $in: userIds } })
    .sort({ createdAt: -1 })
    .limit(200)
    .select('userId url createdAt');

  const items = events.map((event: any) => ({
    id: event._id.toString(),
    url: event.url as string,
    createdAt: event.createdAt as Date,
    userId: event.userId?.toString() ?? null,
    userName:
      (event.userId && userMap.get(event.userId.toString())?.name) ||
      (event.userId && userMap.get(event.userId.toString())?.email) ||
      'Unknown',
    userEmail: (event.userId && userMap.get(event.userId.toString())?.email) || '',
  }));

  return NextResponse.json({ items });
}
