// app/api/auth/register/route.ts
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/Users';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '@/lib/email/mailer';

const JWT_SECRET = process.env.JWT_SECRET!;
const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED === 'true';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });

    if (EMAIL_VERIFICATION_ENABLED) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationCode = code;
      user.emailVerificationExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
      user.emailVerified = false;
      await user.save();

      // Envoi du code de vérification par e-mail (ou log en dev si SMTP non configuré)
      await sendVerificationEmail(user.email, code);
    } else {
      user.emailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = new Response(
      JSON.stringify({ success: true, requiresVerification: EMAIL_VERIFICATION_ENABLED }),
      { status: 201 },
    );

    response.headers.set(
      'Set-Cookie',
      `authToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}