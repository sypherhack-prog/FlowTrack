// app/api/dashboard/members/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Membership from '@/lib/db/models/Membership';
import Invitation from '@/lib/db/models/Invitation';
import Organization from '@/lib/db/models/Organization';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email/mailer';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized', members: [], invites: [] }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found', members: [], invites: [] }, { status: 401 });
    }

    // Si l'utilisateur n'a pas encore d'organisation, on en crée une vraie
    // automatiquement pour lui, avec un membership owner. Plus rien de fictif.
    let organizationId = userDoc.organizationId;
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

    const memberships = await Membership.find({ organizationId }).populate('userId');
    const invites = await Invitation.find({ organizationId }).sort({ createdAt: -1 });

    const members = memberships.map((membership: any) => {
      const u = membership.userId as any | undefined;
      return {
        id: membership._id.toString(),
        userId: u?._id?.toString() ?? null,
        name: u?.name || u?.email || '',
        email: u?.email || '',
        role: membership.role as string,
        joinedAt: membership.createdAt as Date,
      };
    });

    const inviteItems = invites.map((inv: any) => ({
      id: inv._id.toString(),
      email: inv.email as string,
      role: inv.role as string,
      status: inv.status as string,
      createdAt: inv.createdAt as Date,
    }));

    const myMembership = await Membership.findOne({ organizationId, userId: userDoc._id });
    const currentRole = (myMembership?.role as string | undefined) ?? 'member';

    return NextResponse.json({ members, invites: inviteItems, currentRole });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in GET /api/dashboard/members', err);
    return NextResponse.json({ error: message, members: [], invites: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          email?: string;
          role?: 'manager' | 'member';
        }
      | null;

    if (!body?.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!userDoc.organizationId) {
      return NextResponse.json({ error: 'Organization not found. Complete onboarding first.' }, {
        status: 400,
      });
    }

    const organizationId = userDoc.organizationId;
    const membership = await Membership.findOne({ organizationId, userId: userDoc._id });
    if (!membership || (membership.role !== 'owner' && membership.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await Organization.findById(organizationId);

    const planKey = (org?.plan as string | undefined) ?? 'trial';
    const memberLimits: Record<string, number> = {
      trial: 3,
      starter: 10,
      team: 30,
      pro: 100,
      enterprise: 1000,
    };
    const maxMembers = memberLimits[planKey] ?? 3;
    const currentMembersCount = await Membership.countDocuments({ organizationId });

    if (currentMembersCount >= maxMembers) {
      return NextResponse.json({ error: 'Member limit reached for your current plan.' }, { status: 403 });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await Invitation.create({
      organizationId,
      email: body.email.toLowerCase(),
      role: body.role ?? 'member',
      token,
      expiresAt,
    });

    await sendInvitationEmail(invite.email, org?.name || 'Your organization', token);

    return NextResponse.json({
      success: true,
      invite: {
        id: invite._id.toString(),
        email: invite.email,
        role: invite.role,
        status: invite.status,
        createdAt: invite.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/dashboard/members', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
