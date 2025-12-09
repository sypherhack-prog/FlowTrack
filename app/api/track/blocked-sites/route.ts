// app/api/track/blocked-sites/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import BlockedSiteRule from '@/lib/db/models/BlockedSiteRule';

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'netflix.com',
  'twitter.com',
  'x.com',
];

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      // Si l'extension n'est pas authentifiée, on retourne simplement la liste par défaut.
      return NextResponse.json({ sites: DEFAULT_BLOCKED_SITES });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc || !userDoc.organizationId) {
      return NextResponse.json({ sites: DEFAULT_BLOCKED_SITES });
    }

    const rules = await BlockedSiteRule.find({ organizationId: userDoc.organizationId }).sort({ createdAt: 1 });
    const sites = rules.length > 0 ? (rules.map((r: any) => r.pattern as string) as string[]) : DEFAULT_BLOCKED_SITES;

    return NextResponse.json({ sites });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/track/blocked-sites', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
