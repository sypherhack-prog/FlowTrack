// app/api/dashboard/plan-status/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';
import Membership from '@/lib/db/models/Membership';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    let organizationId = userDoc.organizationId as any;

    if (!organizationId) {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const org = await Organization.create({
        name: userDoc.name || userDoc.email || 'My organization',
        ownerId: userDoc._id,
        plan: 'trial',
        trialEndsAt,
        billingPeriod: 'monthly',
      });

      organizationId = org._id;
      userDoc.organizationId = org._id;
      userDoc.onboardingCompleted = true;
      await userDoc.save();

      await Membership.create({
        organizationId: org._id,
        userId: userDoc._id,
        role: 'owner',
      });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let trialExpired = false;
    if (org.plan === 'trial') {
      const now = new Date();
      if (!org.trialEndsAt) {
        org.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await org.save();
      }
      if (org.trialEndsAt && org.trialEndsAt.getTime() < now.getTime()) {
        trialExpired = true;
      }
    }

    const membership = await Membership.findOne({ organizationId, userId: userDoc._id });
    const currentRole = (membership?.role as string | undefined) ?? 'member';
    const organizationIdStr =
      (organizationId as any)?.toString?.() ?? (typeof organizationId === 'string' ? organizationId : '');

    return NextResponse.json({
      plan: org.plan,
      trialEndsAt: org.trialEndsAt,
      trialExpired,
      organizationId: organizationIdStr,
      currentRole,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/plan-status', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
