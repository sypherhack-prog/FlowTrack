// lib/middleware/auth.ts
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface User {
  id: string;
  email: string;
  name: string;
}

type AuthTokenPayload = JwtPayload & {
  id: string;
  email: string;
  name: string;
};

function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] ?? null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const authCookie = cookies.find((c) => c.startsWith('authToken='));
  if (!authCookie) return null;

  const [, token] = authCookie.split('=');
  return token || null;
}

export async function getCurrentUser(request: Request): Promise<User | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}