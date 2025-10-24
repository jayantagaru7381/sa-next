/**
 * useTempTokenRoute Hook
 *
 * Protects routes that require temp_sess token (MFA flows, email verification, etc.)
 * This handles CLIENT-SIDE navigation. Server-side handled by middleware.
 *
 * Usage: Call at the top of temp token route components
 * Example: const isAuthorized = useTempTokenRoute("needs_mfa_auth");
 *
 * @param requiredAuthState - The auth_state value required for this route
 * @returns boolean - true if authorized, false if redirecting
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getAuthState } from "../../utils/cookies";
import { getLoginRedirect } from "../../lib/auth/route-policies";

type RequiredAuthState =
  | "needs_mfa_auth"
  | "needs_mfa_setup"
  | "needs_email_verify"
  | "authenticated"; // For routes that accept both temp and session

export function useTempTokenRoute(requiredAuthState?: RequiredAuthState | RequiredAuthState[]): boolean {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authState = getAuthState();

    // No auth_state cookie = not logged in at all
    if (!authState) {
      console.log("[useTempTokenRoute] No auth_state cookie, redirecting to login");
      const loginUrl = getLoginRedirect(window.location.pathname);
      router.replace(loginUrl);
      setIsAuthorized(false);
      return;
    }

    // If specific state is required, validate it matches
    if (requiredAuthState) {
      const allowedStates = Array.isArray(requiredAuthState) ? requiredAuthState : [requiredAuthState];
      
      // If user is fully authenticated, allow access to temp routes
      // (session takes priority over temp_sess as per backend middleware)
      // This is important for needs_mfa_setup which can have sess OR temp_sess
      if (authState === "authenticated") {
        console.log("[useTempTokenRoute] User is authenticated, allowing access");
        setIsAuthorized(true);
        return;
      }

      // Check if current auth state is in allowed states
      if (!allowedStates.includes(authState as RequiredAuthState)) {
        // User has wrong auth_state, redirect to login
        console.log(
          `[useTempTokenRoute] Invalid auth_state: expected one of ${allowedStates.join(', ')}, got ${authState}, redirecting to login`
        );
        const loginUrl = getLoginRedirect(window.location.pathname);
        router.replace(loginUrl);
        setIsAuthorized(false);
        return;
      }
    }

    // Auth state matches or no specific state required
    setIsAuthorized(true);
  }, [router, requiredAuthState]);

  return isAuthorized;
}
