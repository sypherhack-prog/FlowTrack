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

    const now = new Date();

    let trialExpired = false;
    if (org.plan === 'trial') {
      if (!org.trialEndsAt) {
        org.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await org.save();
      }
      if (org.trialEndsAt && org.trialEndsAt.getTime() < now.getTime()) {
        trialExpired = true;
      }
    }

    if (process.env.FORCE_TRIAL_EXPIRED === 'true' && org.plan === 'trial') {
      trialExpired = true;
    }

    let paidPlanExpired = false;
    if (org.plan !== 'trial') {
      if (org.planExpiresAt && org.planExpiresAt.getTime() < now.getTime()) {
        paidPlanExpired = true;
      }
    }

    const membership = await Membership.findOne({ organizationId, userId: userDoc._id });
    const currentRole = (membership?.role as string | undefined) ?? 'member';
    const organizationIdStr =
      (organizationId as any)?.toString?.() ?? (typeof organizationId === 'string' ? organizationId : '');

    const extensionChromeUrl = process.env.NEXT_PUBLIC_EXTENSION_CHROME_URL || '';
    const extensionEdgeUrl = process.env.NEXT_PUBLIC_EXTENSION_EDGE_URL || '';
    const extensionFirefoxUrl = process.env.NEXT_PUBLIC_EXTENSION_FIREFOX_URL || '';
    const desktopWinUrl = process.env.NEXT_PUBLIC_DESKTOP_WIN_URL || '';
    const desktopMacUrl = process.env.NEXT_PUBLIC_DESKTOP_MAC_URL || '';

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const isAdmin = typeof currentUser.email === 'string' && adminEmail && currentUser.email === adminEmail;

    return NextResponse.json({
      plan: org.plan,
      trialEndsAt: org.trialEndsAt,
      trialExpired,
      planExpiresAt: org.planExpiresAt,
      paidPlanExpired,
      organizationId: organizationIdStr,
      currentRole,
      timeTrackingMode: org.timeTrackingMode,
      extensionChromeUrl,
      extensionEdgeUrl,
      extensionFirefoxUrl,
      desktopWinUrl,
      desktopMacUrl,
      isAdmin,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/plan-status', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
