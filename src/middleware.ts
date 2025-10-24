/**
 * Authentication Middleware for Cookie-Based Auth
 *
 * This middleware handles:
 * 1. CSRF validation for state-changing requests
 * 2. Authentication checks based on route policies
 * 3. Automatic redirects based on auth state
 *
 * Cookie Architecture (all httpOnly, managed by backend):
 * - sess: Full session cookie (user is fully authenticated)
 * - temp_sess: Temporary JWT for intermediate auth flows (email verify, MFA, etc.)
 * - csrf: CSRF protection token (NOT httpOnly, readable by frontend)
 *
 * Backend Temp Token Purposes (from temp_sess JWT):
 * - EMAIL_VERIFICATION: /mfa/authenticate/authenticatormfa/authverifycode routes
 * - MFA_AUTH: /mfa/authenticate/* routes
 * - MFA_SETUP: /mfa/register/* routes
 *
 * Backend Middleware Logic (for reference):
 * - If sess cookie exists, temp_sess is ignored (session takes priority)
 * - If temp_sess exists without sess, backend validates purpose matches route
 * - Login/logout endpoints clear both sess and temp_sess cookies
 * - Middleware only checks cookie PRESENCE; backend validates CONTENTS
 */

import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { validateCSRF } from "./lib/auth/csrf";
import {
  isAuthRoute,
  getRoutePolicy,
  getLoginRedirect,
  getAuthStateRedirect,
  getAuthenticatedRedirect,
} from "./lib/auth/route-policies";

/**
 * Check if path is a static asset
 */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  );
}

/**
 * Check if user has session cookie (simple presence check)
 */
function hasSessionCookie(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("sess");
  return !!sessionCookie?.value;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Skip static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Validate CSRF for state-changing requests
  const csrfValid = validateCSRF(request);

  if (!csrfValid) {
    return new NextResponse(
      JSON.stringify({
        error: "CSRF validation failed",
        code: "CSRF_INVALID",
      }),
      {
        status: 419,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Check for session cookie presence (validation happens at backend)
  const hasSession = hasSessionCookie(request);
  const authState = request.cookies.get("auth_state")?.value;
  const policy = getRoutePolicy(pathname);

  // Debug logging
  console.log(`[Middleware] ${method} ${pathname}`, {
    hasSession,
    authState,
    policyAuth: policy.auth,
  });

  // Redirect fully authenticated users away from auth pages
  const isAuth = isAuthRoute(pathname);

  if (authState === "authenticated" && isAuth) {
    // Edge case: Check if this is a callback URL with auth codes (SSO flow)
    const searchParams = request.nextUrl.searchParams;
    const hasAuthCode = searchParams.has("code");
    const hasState = searchParams.has("state");

    // Don't redirect if this is an OAuth callback with codes
    if (pathname.includes("/callback") && (hasAuthCode || hasState)) {
      return NextResponse.next();
    }

    const redirectUrl = new URL(
      getAuthenticatedRedirect(pathname),
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Handle public routes
  if (policy.auth === "none") {
    return NextResponse.next();
  }

  // Handle protected routes requiring full session
  if (policy.auth === "session") {
    // PRIORITY 1: Check if user has incomplete auth flow (MFA pending, email verification, etc.)
    // This must be checked FIRST because temp_sess exists but sess doesn't yet
    if (authState && authState !== "authenticated") {
      // Try to get enrolled_methods from cookie for needs_mfa_auth case
      const enrolledMethodsCookie = request.cookies.get("enrolled_methods");
      const enrolledMethods = enrolledMethodsCookie?.value
        ? enrolledMethodsCookie.value.split(",")
        : undefined;

      const redirectPath = getAuthStateRedirect(authState, enrolledMethods);
      if (redirectPath) {
        console.log(
          `[Middleware] Incomplete auth flow detected: ${authState}, redirecting to ${redirectPath}`,
        );
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // PRIORITY 2: Check if no session at all (not logged in)
    if (!hasSession) {
      console.log(
        "[Middleware] No session cookie found, redirecting to login",
      );
      const loginUrl = new URL(getLoginRedirect(pathname), request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Session validation will happen at the backend level
    // If session is invalid, backend will return 401 and client will handle
    return NextResponse.next();
  }

  // Handle temp token routes (MFA, email verify, etc)
  if (policy.auth === "temp") {
    // Fully authenticated users shouldn't access temp routes (already handled above)
    // Users with temp_sess or in intermediate flows can access
    // Allow request to proceed - backend middleware will:
    // 1. Check for temp_sess cookie (httpOnly JWT)
    // 2. Validate JWT signature and expiry
    // 3. Verify token purpose matches route (EMAIL_VERIFICATION, MFA_AUTH, MFA_SETUP)
    // 4. Return 403 if purpose mismatch or 401 if invalid/expired
    return NextResponse.next();
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (hot module reload)
     * - favicon.ico, other static assets (.svg, .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
