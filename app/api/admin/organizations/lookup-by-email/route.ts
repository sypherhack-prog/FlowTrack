import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';

interface Body {
  email?: string;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || currentUser.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Body | null;
    const rawEmail = body?.email;
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationId = user.organizationId as any | undefined;

    let organization: {
      id: string;
      name: string;
      plan: string;
      billingPeriod: string;
      trialEndsAt: Date | null;
      planExpiresAt: Date | null;
    } | null = null;

    if (organizationId) {
      const orgDoc = await Organization.findById(organizationId);
      if (orgDoc) {
        organization = {
          id: orgDoc._id.toString(),
          name: orgDoc.name as string,
          plan: String(orgDoc.plan || 'trial'),
          billingPeriod: String(orgDoc.billingPeriod || 'monthly'),
          trialEndsAt: (orgDoc.trialEndsAt as Date | null) ?? null,
          planExpiresAt: (orgDoc as any).planExpiresAt ?? null,
        };
      }
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email as string,
        name: user.name as string,
      },
      organization,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/admin/organizations/lookup-by-email', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
