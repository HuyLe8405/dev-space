import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/workspaces', '/settings'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasSession = Boolean(accessToken || refreshToken);

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  // FR-010: Redirect unauthenticated requests to login, preserving destination
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // FR-011: Redirect authenticated users away from public auth pages
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/workspaces', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/workspaces',
    '/workspaces/:path*',
    '/settings',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
