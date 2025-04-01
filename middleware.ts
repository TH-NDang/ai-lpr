import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { auth } from './lib/auth';
import { getSessionCookie } from "better-auth/cookies";


type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
  const cookies = getSessionCookie(request);

  const isLoggedIn = !!cookies;
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");
  const isOnLicensePlate = request.nextUrl.pathname.startsWith("/license-plate");
  const isOnOverview = request.nextUrl.pathname.startsWith("/overview");
  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const testRoutes = ["/license-plate", "/overview"];
  const protectedRoutes = ["/dashboard", "/license-plate", "/overview"];

  if (isOnLogin || testRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/license-plate", request.url));
  }

  if (protectedRoutes.includes(request.nextUrl.pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login'],
}
