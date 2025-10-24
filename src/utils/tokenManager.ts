/**
 * @deprecated This file is deprecated. Authentication now uses httpOnly cookies exclusively.
 * All auth state is managed by the backend via cookies (sess, temp_sess, csrf).
 * Tokens are no longer stored in localStorage or sessionStorage.
 *
 * Cookie-based authentication flow:
 * - Backend sets httpOnly cookies on successful auth
 * - Middleware automatically includes cookies in all requests
 * - No client-side token management required
 *
 * These functions remain for backwards compatibility with tests only.
 */

export interface TokenResponse {
  session_token?: string | null;
  temp_token?: string | null;
  user_id?: number;
  redirect_url?: string | null;
  result?: string;
  message?: string;
}

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 * Clears legacy token storage (for logout cleanup only)
 */
export const clearAllTokens = (): void => {
  if (typeof window === "undefined") return;

  // Clear session storage
  sessionStorage.removeItem("tempToken");

  // Clear local storage
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tempToken");

  // Clear any other auth-related items
  Object.keys(localStorage).forEach(
    (key) =>
      (key.includes("token") || key.includes("auth") || key.includes("user")) &&
      localStorage.removeItem(key)
  );

  console.log("Legacy token storage cleared");
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 * Kept for backwards compatibility with tests
 */
export const handleTokenResponse = async (
  data: TokenResponse
): Promise<{ shouldRedirect: boolean; redirectUrl?: string }> => {
  console.warn("handleTokenResponse is deprecated - auth now uses httpOnly cookies");
  const shouldRedirect = !!(data.redirect_url);
  const redirectUrl = data.redirect_url || "/dashboard";
  return { shouldRedirect, redirectUrl };
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const storeTempToken = (token: string): void => {
  console.warn("storeTempToken is deprecated - auth now uses httpOnly cookies");
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const getTempToken = (): string | null => {
  console.warn("getTempToken is deprecated - auth now uses httpOnly cookies");
  return null;
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const clearTempToken = (): void => {
  console.warn("clearTempToken is deprecated - auth now uses httpOnly cookies");
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const storeSessionToken = async (sessionToken: string, apiBase: string): Promise<void> => {
  console.warn("storeSessionToken is deprecated - auth now uses httpOnly cookies");
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const clearSessionToken = (): void => {
  console.warn("clearSessionToken is deprecated - auth now uses httpOnly cookies");
};

/**
 * @deprecated No longer needed - auth uses httpOnly cookies
 */
export const createApiHeaders = (
  includeTempToken: boolean = false,
  includeSessionToken: boolean = false,
  customTempToken?: string
): HeadersInit => {
  console.warn("createApiHeaders is deprecated - auth now uses httpOnly cookies");
  return {
    "Content-Type": "application/json",
  };
};
