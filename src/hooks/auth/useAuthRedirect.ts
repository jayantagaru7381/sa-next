/**
 * useAuthRedirect Hook
 *
 * Redirects authenticated users away from auth pages (login, register, etc.)
 * This handles CLIENT-SIDE navigation. Server-side handled by middleware.
 *
 * Usage: Call at the top of any auth page component
 * Example: useAuthRedirect();
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "../../utils/cookies";
import { DEFAULT_AUTHENTICATED_ROUTE } from "../../lib/auth/route-policies";

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is fully authenticated
    if (isAuthenticated()) {
      console.log("[useAuthRedirect] User is authenticated, redirecting to dashboard");
      // Redirect to dashboard
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    }
  }, [router]);
}
