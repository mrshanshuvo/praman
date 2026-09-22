import { type NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'praman_auth_token';

// Protected routes requiring authentication
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/jobs'];

// Public auth routes that redirect to /profile if already logged in
const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 1. Correlation ID tracking (Enterprise BFF standard)
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  // 2. Server-Side Route Protection: Block unauthenticated access to protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Guest-Only Route Gating: Redirect authenticated users away from /login & /register
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // 4. Downstream forwarding with correlation and security headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Enterprise Security Headers
  response.headers.set('x-correlation-id', correlationId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)).*)',
  ],
};
