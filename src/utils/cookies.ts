/**
 * Cookie utilities for authentication debugging
 *
 * IMPORTANT: Auth cookies (sess, temp_sess, csrf) are httpOnly and CANNOT be
 * deleted from the frontend. Only the backend can manage these cookies.
 *
 * Cookie Management Flow:
 * - sess: Full session cookie (set after successful login/MFA)
 * - temp_sess: Temporary JWT token for intermediate auth flows (email verification, MFA setup/auth)
 * - csrf: CSRF protection token
 *
 * The backend middleware ensures only ONE of sess OR temp_sess exists at a time:
 * - If sess exists, temp_sess is ignored
 * - temp_sess has a "purpose" field that controls which routes are accessible
 * - Login/logout endpoints clear both cookies on the backend
 */

/**
 * Get all readable cookies from document.cookie
 * Note: httpOnly cookies (sess, temp_sess) will NOT appear here
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof window === "undefined") return {};

  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      cookies[name] = value || '';
    }
    return cookies;
  }, {} as Record<string, string>);
};

/**
 * Check if a specific readable cookie exists
 * Note: httpOnly cookies (sess, temp_sess) cannot be detected this way
 */
export const hasCookie = (cookieName: string): boolean => {
  if (typeof window === "undefined") return false;
  return document.cookie.split(';').some(cookie =>
    cookie.trim().startsWith(`${cookieName}=`)
  );
};

/**
 * Check if CSRF token exists (this is NOT httpOnly, so we can read it)
 */
export const hasCsrfToken = (): boolean => hasCookie('csrf');

/**
 * Get CSRF token value for header injection
 */
export const getCsrfToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf='));

  return csrfCookie ? csrfCookie.split('=')[1] : null;
};

/**
 * Get a specific cookie value
 */
export const getCookie = (cookieName: string): string | null => {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`));

  return cookie ? cookie.split('=')[1] : null;
};

/**
 * Get auth_state cookie value
 * Possible values: "authenticated", "needs_mfa_auth", "needs_mfa_setup", "needs_email_verify"
 */
export const getAuthState = (): string | null => getCookie('auth_state');

/**
 * Check if user is fully authenticated
 */
export const isAuthenticated = (): boolean => getAuthState() === 'authenticated';

/**
 * Log current cookie state for debugging
 * Note: httpOnly cookies won't be visible here
 */
export const debugCookies = (): void => {
  if (typeof window === "undefined") return;

  const cookies = getAllCookies();
  console.log('[Cookie Debug] Readable cookies:', {
    all: cookies,
    hasCsrf: hasCookie('csrf'),
    authState: getAuthState(),
    note: 'httpOnly cookies (sess, temp_sess) are not visible to JavaScript'
  });
};
