// app/api/billing/paddle/webhook/route.ts
import { NextResponse } from 'next/server';

// Placeholder Paddle webhook endpoint. When you configure Paddle Billing,
// you will need to:
// - verify the webhook signature
// - parse the event type and subscription/customer identifiers
// - update Organization.plan, trialEndsAt and billing status accordingly

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    console.log('Received Paddle webhook (placeholder):', rawBody.slice(0, 500));

    // For now we simply acknowledge the webhook so Paddle considers it delivered.
    return new NextResponse('OK', { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error in POST /api/billing/paddle/webhook', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
