import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/auth/callback'];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Check for auth token in cookie or header
  // Note: In a real app, you might want to verify the token server-side
  const token = request.cookies.get('token-538')?.value;

  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    // Check localStorage is not available in middleware, so we'll handle
    // client-side redirect in the page components instead
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

