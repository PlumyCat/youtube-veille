import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
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

export const config = {
  matcher: [
    // Match all paths except static files and api routes that need different handling
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
