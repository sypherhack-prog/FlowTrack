// app/api/auth/verify-email/route.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/Users';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    if (user.emailVerified) {
      return new Response(JSON.stringify({ success: true, alreadyVerified: true }), { status: 200 });
    }

    if (!user.emailVerificationCode || typeof user.emailVerificationCode !== 'string') {
      return new Response(JSON.stringify({ error: 'No verification code set' }), { status: 400 });
    }

    const input = String(code).trim();
    const stored = String(user.emailVerificationCode).trim();

    if (input !== stored) {
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), { status: 400 });
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt instanceof Date &&
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      return new Response(JSON.stringify({ error: 'Verification code has expired' }), { status: 400 });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const response = new Response(JSON.stringify({ success: true }), { status: 200 });
    response.headers.set(
      'Set-Cookie',
      `authToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
