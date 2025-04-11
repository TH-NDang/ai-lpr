import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const cookies = getSessionCookie(request);

  const isLoggedIn = !!cookies;
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");

  const protectedRoutes = ["/dashboard", "/license-plate", "/history"];

  // Redirect from auth pages to home if already logged in
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For protected routes, check authentication
  if (protectedRoutes.includes(request.nextUrl.pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // For all other routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/:id", "/api/:path*", "/login"],
};
