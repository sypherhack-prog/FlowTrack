// app/api/billing/paddle/create-checkout/route.ts
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/middleware/auth';
import User from '@/lib/db/models/Users';
import Organization from '@/lib/db/models/Organization';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(currentUser.id);
    if (!userDoc || !userDoc.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const org = await Organization.findById(userDoc.organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          plan?: string;
          billingPeriod?: 'monthly' | 'yearly';
        }
      | null;

    if (!body?.plan) {
      return NextResponse.json({ error: 'plan is required' }, { status: 400 });
    }

    // TODO: Map body.plan / billingPeriod to Paddle product/pricing IDs and
    // create a Paddle checkout session via Paddle Billing API.
    // This endpoint currently acts as a placeholder until Paddle credentials
    // and product configuration are available.

    return NextResponse.json(
      {
        error:
          'Paddle integration is not configured yet. Once your Paddle account and products are ready, implement this endpoint to create a checkout session.',
      },
      { status: 501 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/billing/paddle/create-checkout', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
