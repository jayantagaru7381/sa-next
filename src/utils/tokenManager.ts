/**
 * Token management utilities for handling session and temporary tokens
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
 * Stores session token and user profile data
 * @param sessionToken - The session token to store
 * @param apiBase - The API base URL for profile fetching
 */
export const storeSessionToken = async (sessionToken: string, apiBase: string): Promise<void> => {
  localStorage.setItem("sessionToken", sessionToken);
  console.log("Session token stored:", sessionToken);
  try {
    const profileRes = await fetch(`${apiBase}/auth/native/profile`, {
      method: "GET",
      headers: {
        "X-Session-Token": sessionToken,
      },
    });

    const profileData = await profileRes.json();

    if (profileRes.ok && profileData.user) {
      localStorage.setItem("userProfile", JSON.stringify(profileData.user));
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }
};

/**
 * Stores temporary token in sessionStorage for MFA flows
 * @param tempToken - The temporary token to store
 */
export const storeTempToken = (tempToken: string): void => {
  sessionStorage.setItem("tempToken", tempToken);
};

/**
 * Retrieves temporary token from sessionStorage
 * @returns The temporary token or null if not found
 */
export const getTempToken = (): string | null => sessionStorage.getItem("tempToken");

/**
 * Clears temporary token from sessionStorage
 */
export const clearTempToken = (): void => sessionStorage.removeItem("tempToken");

/**
 * Clears session token and user profile from localStorage
 */
export const clearSessionToken = (): void => {
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("userProfile");
  console.log("Session token and user profile cleared");
};

/**
 * Clears all authentication tokens and data from both localStorage and sessionStorage
 */
export const clearAllTokens = (): void => {
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

  console.log("All authentication tokens and data cleared");
};

/**
 * Handles token response from API calls
 * Stores session token, temp token, and handles redirects
 * @param data - The API response data containing tokens
 * @param apiBase - The API base URL
 * @returns Promise that resolves when token handling is complete
 */
export const handleTokenResponse = async (
  data: TokenResponse
): Promise<{ shouldRedirect: boolean; redirectUrl?: string }> => {
  // Store session token if present
  if (data.session_token) {
    await storeSessionToken(data.session_token, process.env.NEXT_PUBLIC_API_BASE!);
  } else {
    clearSessionToken();
  }

  if (data.temp_token) {
    storeTempToken(data.temp_token);
  } else {
    clearTempToken();
  }

  // Determine if we should redirect
  const shouldRedirect = !!(data.redirect_url || data.session_token);
  const redirectUrl = data.redirect_url || "/dashboard";

  return { shouldRedirect, redirectUrl };
};

/**
 * Creates headers object with appropriate tokens for API calls
 * @param includeTempToken - Whether to include temp token from storage
 * @param includeSessionToken - Whether to include session token from storage
 * @param customTempToken - Custom temp token to use instead of stored one
 * @returns Headers object with appropriate tokens
 */
export const createApiHeaders = (
  includeTempToken: boolean = false,
  includeSessionToken: boolean = false,
  customTempToken?: string
): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeTempToken) {
    const tempToken = customTempToken || getTempToken();
    if (tempToken) {
      headers["X-Temp-Token"] = tempToken;
    }
  }

  if (includeSessionToken) {
    const sessionToken = localStorage.getItem("sessionToken");
    if (sessionToken) {
      headers["X-Session-Token"] = sessionToken;
    }
  }

  return headers;
};
