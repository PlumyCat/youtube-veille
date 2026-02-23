import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function signToken(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET || 'default-secret';

  if (!username || !password || username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const payload = JSON.stringify({ user: username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const token = signToken(payload, secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
