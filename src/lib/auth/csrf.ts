/**
 * CSRF validation utilities for double-submit cookie pattern
 * Backend sets csrf cookie, frontend echoes in X-CSRF-Token header
 */

import type { NextRequest } from "next/server";

/**
 * Validate CSRF token using double-submit cookie pattern
 * For state-changing methods (POST, PUT, PATCH, DELETE):
 * - Read CSRF token from non-HttpOnly csrf cookie
 * - Compare with X-CSRF-Token header
 *
 * @param request - The incoming request
 * @returns true if CSRF validation passes, false otherwise
 */
export function validateCSRF(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // Only validate CSRF for state-changing methods
  const statefulMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!statefulMethods.includes(method)) {
    return true; // GET, HEAD, OPTIONS don't need CSRF validation
  }

  // Get CSRF token from cookie (set by backend)
  const csrfCookie = request.cookies.get("csrf");
  const csrfCookieValue = csrfCookie?.value;

  // Get CSRF token from header (sent by frontend)
  const csrfHeader = request.headers.get("X-CSRF-Token") || request.headers.get("x-csrf-token");

  // Both must be present
  if (!csrfCookieValue || !csrfHeader) {
    console.warn(`[CSRF] Validation failed: ${method} ${request.nextUrl.pathname}`, {
      hasCookie: !!csrfCookieValue,
      hasHeader: !!csrfHeader,
    });
    return false;
  }

  // Tokens must match (constant-time comparison would be ideal in production)
  const tokensMatch = csrfCookieValue === csrfHeader;

  if (!tokensMatch) {
    console.warn(`[CSRF] Token mismatch: ${method} ${request.nextUrl.pathname}`, {
      cookieLength: csrfCookieValue.length,
      headerLength: csrfHeader.length,
    });
  }

  return tokensMatch;
}

/**
 * Check if a method requires CSRF validation
 */
export function requiresCSRF(method: string): boolean {
  const statefulMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return statefulMethods.includes(method.toUpperCase());
}
