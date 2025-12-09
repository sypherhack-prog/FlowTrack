// app/api/onboarding/complete/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';
import Membership from '@/lib/db/models/Membership';
import Invitation from '@/lib/db/models/Invitation';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email/mailer';

interface InviteInput {
  email: string;
  role: 'manager' | 'member';
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        size?: string;
        timeTrackingMode?: string;
        goals?: string[];
        plan?: string;
        billingPeriod?: 'monthly' | 'yearly';
        invites?: InviteInput[];
      }
    | null;

  if (!body || !body.name) {
    return new NextResponse('Missing organization name', { status: 400 });
  }

  await connectDB();

  const userDoc = await User.findById(currentUser.id);
  if (!userDoc) {
    return new NextResponse('User not found', { status: 404 });
  }

  let org = null;
  if (userDoc.organizationId) {
    org = await Organization.findById(userDoc.organizationId);
  }

  if (!org) {
    const initialPlan = body.plan ?? 'trial';
    const now = new Date();
    const trialEndsAt = initialPlan === 'trial' ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null;

    org = await Organization.create({
      name: body.name,
      ownerId: userDoc._id,
      size: body.size,
      timeTrackingMode: body.timeTrackingMode ?? 'web_app',
      goals: body.goals ?? [],
      plan: initialPlan,
      trialEndsAt,
      billingPeriod: body.billingPeriod ?? 'monthly',
    });

    await Membership.create({
      organizationId: org._id,
      userId: userDoc._id,
      role: 'owner',
    });
  } else {
    org.name = body.name;
    if (body.size) org.size = body.size;
    if (body.timeTrackingMode) org.timeTrackingMode = body.timeTrackingMode;
    if (body.goals) org.goals = body.goals;
    if (body.plan) {
      org.plan = body.plan;
      if (body.plan !== 'trial') {
        org.trialEndsAt = null;
      }
    }
    if (body.billingPeriod) org.billingPeriod = body.billingPeriod;
    await org.save();
  }

  userDoc.organizationId = org._id;
  userDoc.onboardingCompleted = true;
  await userDoc.save();

  const invites = Array.isArray(body.invites) ? body.invites : [];
  for (const inv of invites) {
    if (!inv.email) continue;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      organizationId: org._id,
      email: inv.email.toLowerCase(),
      role: inv.role,
      token,
      expiresAt,
    });

    await sendInvitationEmail(invitation.email, org.name, token);
  }

  return NextResponse.json({ success: true, organizationId: org._id.toString() });
}
