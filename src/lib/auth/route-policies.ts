/**
 * Route policy configuration for Next.js-native authentication
 */

import type { RoutePolicy } from "./types";

// Auth state redirect mappings
export const AUTH_STATE_REDIRECTS = {
  needs_mfa_auth: {
    totp: "/mfa/authenticate/authenticatormfa/authverifycode",
    phone_otp: "/mfa/authenticate/smsmfa/codecheck",
    email_otp: "/mfa/authenticate/emailmfa",
  },
  needs_mfa_setup: "/mfa/register",
  needs_email_verify: "/mfa/authenticate/authenticatormfa/authverifycode",
  authenticated: null, // No redirect needed
} as const;

// Default routes
export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";
export const DEFAULT_LOGIN_ROUTE = "/login";

// Route policy map - defines access control for all application routes
export const ROUTE_POLICIES: Record<string, RoutePolicy> = {
  // Root redirects to login
  "/": {
    auth: "none",
    redirectTo: DEFAULT_LOGIN_ROUTE,
  },

  // Login page - redirect to dashboard if already logged in
  "/login": {
    auth: "none",
    redirectTo: DEFAULT_AUTHENTICATED_ROUTE,
  },

  "/health": { auth: "none" },
  "/healthcheck": { auth: "none" },

  // Legacy auth route - redirect to login page
  "/auth/login": {
    auth: "none",
    redirectTo: DEFAULT_LOGIN_ROUTE,
  },
  "/auth/sso/entra/callback": { auth: "none" },

  // MFA Setup routes - require temp token with 2fa_setup purpose OR session
  "/mfa/register": {
    auth: "temp",
    purpose: "2fa_setup",
    redirectTo: DEFAULT_AUTHENTICATED_ROUTE,
  },
  "/mfa/register/authenticatormfa": { auth: "temp", purpose: "2fa_setup" },
  "/mfa/register/authenticatormfa/qrcode": {
    auth: "temp",
    purpose: "2fa_setup",
  },
  "/mfa/register/authenticatormfa/authverifycode": {
    auth: "temp",
    purpose: "2fa_setup",
  },
  "/mfa/register/emailmfa": { auth: "temp", purpose: "2fa_setup" },
  "/mfa/register/smsmfa": { auth: "temp", purpose: "2fa_setup" },
  "/mfa/register/smsmfa/codecheck": { auth: "temp", purpose: "2fa_setup" },

  // MFA Authentication routes - require temp token with 2fa_auth or email_verify purpose OR session
  "/mfa/authenticate/authenticatormfa/authverifycode": {
    auth: "temp",
    purpose: ["2fa_auth", "email_verify"],
  },
  "/mfa/authenticate/emailmfa": { auth: "temp", purpose: "2fa_auth" },
  "/mfa/authenticate/smsmfa/codecheck": { auth: "temp", purpose: "2fa_auth" },

  // Magic link - require temp token with magic_link purpose
  "/auth/magic-link": { auth: "temp", purpose: "magic_link" },
  "/auth/magic-link/verify": { auth: "temp", purpose: "magic_link" },

  // Password reset - require temp token with password_reset purpose
  "/auth/reset-password": { auth: "temp", purpose: "password_reset" },
  "/reset-password": { auth: "temp", purpose: "password_reset" },
  "/forgot-password": { auth: "none" },

  // Protected routes - require valid session
  "/dashboard": { auth: "session" },
  "/profile": { auth: "session" },
  "/settings": { auth: "session" },

  // Admin routes - require session + admin role
  "/admin": {
    auth: "session",
    roles: ["admin"],
  },
  "/admin/users": {
    auth: "session",
    roles: ["admin", "user_manager"],
  },

  // Unauthorized page - accessible to all
  "/unauthorized": { auth: "none" },

  // Default fallback for unmatched routes
  "*": { auth: "session" as const },
};

/**
 * Get route policy for a given pathname
 * Handles both with and without trailing slashes
 */
export function getRoutePolicy(pathname: string): RoutePolicy {
  // Remove trailing slash for consistent comparison (except root)
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  // Check exact match first
  if (ROUTE_POLICIES[normalizedPath]) {
    return ROUTE_POLICIES[normalizedPath];
  }

  // Check for pattern matches (most specific first)
  const patterns = Object.keys(ROUTE_POLICIES)
    .filter((pattern) => pattern.includes("*") || (pattern !== "/" && normalizedPath.startsWith(pattern)))
    .sort((a, b) => b.length - a.length); // Most specific first

  for (const pattern of patterns) {
    if (pattern === "*" || normalizedPath.startsWith(pattern.replace("*", ""))) {
      return ROUTE_POLICIES[pattern];
    }
  }

  // Default to requiring session for unknown routes
  return ROUTE_POLICIES["*"];
}

/**
 * Check if route is in the auth/login stack
 * Handles both with and without trailing slashes
 */
export function isAuthRoute(pathname: string): boolean {
  // Remove trailing slash for consistent comparison
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  const authRoutes = [
    "/login",
    "/auth/login",
    "/auth/sso",
    "/mfa/register",
    "/mfa/authenticate",
    "/auth/magic-link",
    "/auth/reset-password",
    "/forgot-password",
  ];

  // Check auth routes with startsWith for sub-paths
  return authRoutes.some((route) => normalizedPath.startsWith(route));
}

/**
 * Get redirect URL for authenticated users hitting auth routes
 */
export function getAuthenticatedRedirect(pathname: string): string {
  const policy = getRoutePolicy(pathname);
  return policy.redirectTo || DEFAULT_AUTHENTICATED_ROUTE;
}

/**
 * Get login redirect URL with next parameter
 */
export function getLoginRedirect(pathname: string, reason?: string): string {
  const params = new URLSearchParams();

  if (pathname !== "/" && pathname !== DEFAULT_LOGIN_ROUTE) {
    params.set("next", pathname);
  }

  if (reason) {
    params.set("reason", reason);
  }

  const query = params.toString();
  return `${DEFAULT_LOGIN_ROUTE}${query ? `?${query}` : ""}`;
}

/**
 * Get unauthorized redirect URL with context
 */
export function getUnauthorizedRedirect(
  pathname: string,
  reason:
    | "insufficient_permissions"
    | "role_required"
    | "expired_session" = "insufficient_permissions",
): string {
  const params = new URLSearchParams();
  params.set("reason", reason);
  params.set("attempted", pathname);

  return `/unauthorized?${params.toString()}`;
}

/**
 * Get redirect URL based on auth_state cookie
 * @param authState - The value from auth_state cookie
 * @param enrolledMethods - Optional array of enrolled MFA methods (for needs_mfa_auth)
 * @returns Redirect URL or null if no redirect needed
 */
export function getAuthStateRedirect(
  authState: string | undefined,
  enrolledMethods?: string[]
): string | null {
  if (!authState || authState === "authenticated") {
    return null;
  }

  switch (authState) {
    case "needs_mfa_auth": {
      // Pick first enrolled method for redirect
      const firstMethod = enrolledMethods?.[0];
      const routes = AUTH_STATE_REDIRECTS.needs_mfa_auth;

      if (firstMethod && firstMethod in routes) {
        return routes[firstMethod as keyof typeof routes];
      }

      // Default to email OTP if method not found
      return routes.email_otp;
    }

    case "needs_mfa_setup":
      return AUTH_STATE_REDIRECTS.needs_mfa_setup;

    case "needs_email_verify":
      return AUTH_STATE_REDIRECTS.needs_email_verify;

    default:
      return null;
  }
}
