import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import Organization from '@/lib/db/models/Organization';

type BillingPeriod = 'monthly' | 'yearly';

interface Body {
  plan?: string;
  billingPeriod?: BillingPeriod;
  months?: number;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(request: Request, context: { params: { id: string } }) {
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
    if (!body || !body.plan) {
      return NextResponse.json({ error: 'plan is required' }, { status: 400 });
    }

    await connectDB();

    const orgId = context.params.id;
    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();
    const billingPeriod: BillingPeriod = body.billingPeriod ?? (org.billingPeriod as BillingPeriod) ?? 'monthly';

    let months = typeof body.months === 'number' && body.months > 0 ? Math.floor(body.months) : undefined;
    if (!months) {
      months = billingPeriod === 'yearly' ? 12 : 1;
    }

    org.plan = body.plan;
    org.billingPeriod = billingPeriod;
    org.trialEndsAt = null;

    const base = now;
    const expiresAt = addMonths(base, months);
    (org as any).planExpiresAt = expiresAt;

    await org.save();

    return NextResponse.json({
      success: true,
      organizationId: org._id.toString(),
      plan: org.plan,
      billingPeriod: org.billingPeriod,
      planExpiresAt: org.planExpiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/admin/organizations/[id]/plan', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
