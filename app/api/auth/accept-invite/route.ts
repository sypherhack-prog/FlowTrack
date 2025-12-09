// app/api/auth/accept-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { connectDB } from '@/lib/db/mongodb';
import Invitation from '@/lib/db/models/Invitation';
import User from '@/lib/db/models/Users';
import Membership from '@/lib/db/models/Membership';
import Organization from '@/lib/db/models/Organization';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await Invitation.findOne({ token }).populate('organizationId');
    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
    }

    if (invitation.expiresAt && invitation.expiresAt instanceof Date && invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    const org = invitation.organizationId as any | undefined;

    return NextResponse.json({
      email: invitation.email as string,
      role: invitation.role as string,
      organizationName: org?.name ?? 'Your organization',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = (await req.json().catch(() => null)) as
      | {
          token?: string;
          name?: string;
          password?: string;
        }
      | null;

    if (!body?.token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await Invitation.findOne({ token: body.token });
    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
    }

    if (invitation.expiresAt && invitation.expiresAt instanceof Date && invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    let user = await User.findOne({ email: invitation.email.toLowerCase() });

    if (!user) {
      if (!body.name || !body.password) {
        return NextResponse.json(
          { error: 'Name and password are required to create your account' },
          { status: 400 },
        );
      }

      user = await User.create({
        name: body.name,
        email: invitation.email.toLowerCase(),
        password: body.password,
        emailVerified: true,
        organizationId: invitation.organizationId,
        onboardingCompleted: true,
      });
    } else {
      let changed = false;
      if (!user.organizationId) {
        user.organizationId = invitation.organizationId;
        changed = true;
      }
      if (!user.emailVerified) {
        // L’utilisateur a validé l’accès via le lien d’invitation
        (user as any).emailVerified = true;
        changed = true;
      }
      if (!user.onboardingCompleted) {
        (user as any).onboardingCompleted = true;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    const existingMembership = await Membership.findOne({
      organizationId: invitation.organizationId,
      userId: user._id,
    });

    if (!existingMembership) {
      await Membership.create({
        organizationId: invitation.organizationId,
        userId: user._id,
        role: invitation.role === 'manager' ? 'manager' : 'member',
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      `authToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
