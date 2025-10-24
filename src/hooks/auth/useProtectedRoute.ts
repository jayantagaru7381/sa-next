/**
 * useProtectedRoute Hook
 *
 * Redirects unauthenticated users to login or appropriate auth flow
 * This handles CLIENT-SIDE navigation. Server-side handled by middleware.
 *
 * Usage: Call at the top of any protected page component
 * Example: useProtectedRoute();
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getCookie, getAuthState } from "../../utils/cookies";
import {
  getLoginRedirect,
  getAuthStateRedirect,
} from "../../lib/auth/route-policies";

export function useProtectedRoute() {
  const router = useRouter();

  useEffect(() => {
    const authState = getAuthState();

    // No auth state = not logged in at all
    if (!authState) {
      console.log("[useProtectedRoute] No auth_state cookie, redirecting to login");
      const loginUrl = getLoginRedirect(window.location.pathname);
      router.replace(loginUrl);
      return;
    }

    // Has auth state but not fully authenticated
    if (authState !== "authenticated") {
      console.log(`[useProtectedRoute] Incomplete auth flow: ${authState}, redirecting`);

      // Try to get enrolled methods from cookie for needs_mfa_auth case
      const enrolledMethodsCookie = getCookie("enrolled_methods");
      const enrolledMethods = enrolledMethodsCookie
        ? enrolledMethodsCookie.split(",")
        : undefined;

      const redirectPath = getAuthStateRedirect(authState, enrolledMethods);

      if (redirectPath) {
        console.log(`[useProtectedRoute] Redirecting to ${redirectPath}`);
        router.replace(redirectPath);
      }
    }

    // If auth state is "authenticated", do nothing - user has full access
  }, [router]);
}
