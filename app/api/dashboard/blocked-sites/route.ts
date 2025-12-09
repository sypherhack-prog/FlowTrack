// app/api/dashboard/blocked-sites/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';
import Membership from '@/lib/db/models/Membership';
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

async function getContext(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return { error: new NextResponse('Unauthorized', { status: 401 }) } as const;
  }

  await connectDB();

  const userDoc = await User.findById(currentUser.id);
  if (!userDoc || !userDoc.organizationId) {
    return { error: new NextResponse('Organization not found', { status: 400 }) } as const;
  }

  const organizationId = userDoc.organizationId;
  const org = await Organization.findById(organizationId);
  if (!org) {
    return { error: new NextResponse('Organization not found', { status: 404 }) } as const;
  }

  const membership = await Membership.findOne({ organizationId, userId: userDoc._id });
  const role = (membership?.role as string | undefined) ?? 'member';

  return { userDoc, organizationId, org, role } as const;
}

export async function GET(request: Request) {
  try {
    const ctx = await getContext(request);
    if ('error' in ctx) return ctx.error;

    const { organizationId, org, role } = ctx;

    const rules = await BlockedSiteRule.find({ organizationId }).sort({ createdAt: 1 });
    const items = rules.map((r: any) => ({
      id: r._id.toString(),
      pattern: r.pattern as string,
      label: (r.label as string | undefined) ?? null,
      createdAt: r.createdAt as Date,
    }));

    const canEdit = (role === 'owner' || role === 'manager') && org.plan !== 'trial';

    return NextResponse.json({
      items,
      currentPlan: org.plan,
      canEdit,
      defaultSites: DEFAULT_BLOCKED_SITES,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/blocked-sites', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getContext(request);
    if ('error' in ctx) return ctx.error;

    const { organizationId, org, role } = ctx;

    if (role !== 'owner' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (org.plan === 'trial') {
      return NextResponse.json({ error: 'Upgrade your plan to edit blocked sites.' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          pattern?: string;
          label?: string;
        }
      | null;

    const rawPattern = body?.pattern?.trim();
    if (!rawPattern) {
      return NextResponse.json({ error: 'pattern is required' }, { status: 400 });
    }

    const pattern = rawPattern.toLowerCase();

    const existing = await BlockedSiteRule.findOne({ organizationId, pattern });
    if (existing) {
      return NextResponse.json({ error: 'This site is already in the blocked list.' }, { status: 400 });
    }

    const doc = await BlockedSiteRule.create({
      organizationId,
      pattern,
      label: body?.label,
    });

    return NextResponse.json({
      id: doc._id.toString(),
      pattern: doc.pattern,
      label: doc.label ?? null,
      createdAt: doc.createdAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/dashboard/blocked-sites', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getContext(request);
    if ('error' in ctx) return ctx.error;

    const { organizationId, org, role } = ctx;

    if (role !== 'owner' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (org.plan === 'trial') {
      return NextResponse.json({ error: 'Upgrade your plan to edit blocked sites.' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as { id?: string } | null;
    const id = body?.id;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const res = await BlockedSiteRule.deleteOne({ _id: id, organizationId });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'Blocked site not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in DELETE /api/dashboard/blocked-sites', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
