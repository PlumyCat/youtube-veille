import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function verifyToken(token: string, secret: string): boolean {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(payloadB64, 'base64url').toString());
    const expectedSig = hmac.digest('base64url');

    if (signature !== expectedSig) return false;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://i.ytimg.com https://yt3.ggpht.com data:; connect-src 'self'; frame-src https://www.youtube.com;"
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page, auth API routes, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const secret = process.env.AUTH_SECRET || 'default-secret';

  if (!sessionCookie || !verifyToken(sessionCookie, secret)) {
    const loginUrl = new URL('/login', request.url);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
