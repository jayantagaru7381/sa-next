import {
  AUTH_STATE_REDIRECTS,
  DEFAULT_AUTHENTICATED_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  getAuthenticatedRedirect,
  getAuthStateRedirect,
  getLoginRedirect,
  getRoutePolicy,
  getUnauthorizedRedirect,
  isAuthRoute,
  ROUTE_POLICIES,
} from "../route-policies";

describe("Route Policies", () => {
  describe("ROUTE_POLICIES", () => {
    it("should have correct policy for root route", () => {
      expect(ROUTE_POLICIES["/"]).toEqual({
        auth: "none",
        redirectTo: DEFAULT_LOGIN_ROUTE,
      });
    });

    it("should have correct policy for login route", () => {
      expect(ROUTE_POLICIES["/login"]).toEqual({
        auth: "none",
        redirectTo: DEFAULT_AUTHENTICATED_ROUTE,
      });
    });

    it("should have correct policy for dashboard", () => {
      expect(ROUTE_POLICIES["/dashboard"]).toEqual({
        auth: "session",
      });
    });

    it("should have correct policy for MFA setup routes", () => {
      expect(ROUTE_POLICIES["/mfa/register"]).toEqual({
        auth: "temp",
        purpose: "2fa_setup",
        redirectTo: DEFAULT_AUTHENTICATED_ROUTE,
      });
    });

    it("should have correct policy for MFA auth routes", () => {
      expect(ROUTE_POLICIES["/mfa/authenticate/emailmfa"]).toEqual({
        auth: "temp",
        purpose: "2fa_auth",
      });
    });

    it("should have correct policy for admin routes", () => {
      expect(ROUTE_POLICIES["/admin"]).toEqual({
        auth: "session",
        roles: ["admin"],
      });
    });

    it("should have default policy for unmatched routes", () => {
      expect(ROUTE_POLICIES["*"]).toEqual({
        auth: "session",
      });
    });
  });

  describe("getRoutePolicy", () => {
    it("should return exact match policy", () => {
      const policy = getRoutePolicy("/dashboard");
      expect(policy).toEqual({ auth: "session" });
    });

    it("should normalize trailing slashes", () => {
      const policyWithSlash = getRoutePolicy("/dashboard/");
      const policyWithoutSlash = getRoutePolicy("/dashboard");
      expect(policyWithSlash).toEqual(policyWithoutSlash);
    });

    it("should handle root route correctly", () => {
      const policy = getRoutePolicy("/");
      expect(policy).toEqual({
        auth: "none",
        redirectTo: DEFAULT_LOGIN_ROUTE,
      });
    });

    it("should return default policy for unknown routes", () => {
      const policy = getRoutePolicy("/unknown-route");
      expect(policy).toEqual({ auth: "session" });
    });

    it("should match pattern for nested routes", () => {
      const policy = getRoutePolicy("/mfa/register/authenticatormfa");
      expect(policy).toEqual({ auth: "temp", purpose: "2fa_setup" });
    });

    it("should return most specific match for overlapping patterns", () => {
      const policy = getRoutePolicy("/admin/users");
      expect(policy).toEqual({
        auth: "session",
        roles: ["admin", "user_manager"],
      });
    });
  });

  describe("isAuthRoute", () => {
    it("should identify login route as auth route", () => {
      expect(isAuthRoute("/login")).toBe(true);
    });

    it("should identify MFA routes as auth routes", () => {
      expect(isAuthRoute("/mfa/register")).toBe(true);
      expect(isAuthRoute("/mfa/authenticate/emailmfa")).toBe(true);
    });

    it("should identify magic link routes as auth routes", () => {
      expect(isAuthRoute("/auth/magic-link")).toBe(true);
      expect(isAuthRoute("/auth/magic-link/verify")).toBe(true);
    });

    it("should identify password reset routes as auth routes", () => {
      expect(isAuthRoute("/forgot-password")).toBe(true);
      expect(isAuthRoute("/auth/reset-password")).toBe(true);
    });

    it("should not identify dashboard as auth route", () => {
      expect(isAuthRoute("/dashboard")).toBe(false);
    });

    it("should handle trailing slashes correctly", () => {
      expect(isAuthRoute("/login/")).toBe(true);
      expect(isAuthRoute("/dashboard/")).toBe(false);
    });

    it("should match nested auth routes", () => {
      expect(isAuthRoute("/auth/sso/entra/callback")).toBe(true);
    });
  });

  describe("getAuthenticatedRedirect", () => {
    it("should return dashboard for login route", () => {
      const redirect = getAuthenticatedRedirect("/login");
      expect(redirect).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    });

    it("should return custom redirect from policy", () => {
      const redirect = getAuthenticatedRedirect("/mfa/register");
      expect(redirect).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    });

    it("should return default authenticated route when no redirectTo", () => {
      const redirect = getAuthenticatedRedirect("/dashboard");
      expect(redirect).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    });

    it("should return login route for root", () => {
      const redirect = getAuthenticatedRedirect("/");
      expect(redirect).toBe(DEFAULT_LOGIN_ROUTE);
    });
  });

  describe("getLoginRedirect", () => {
    it("should return login route without next param for root", () => {
      const redirect = getLoginRedirect("/");
      expect(redirect).toBe(DEFAULT_LOGIN_ROUTE);
    });

    it("should return login route without next param for login itself", () => {
      const redirect = getLoginRedirect("/login");
      expect(redirect).toBe(DEFAULT_LOGIN_ROUTE);
    });

    it("should include next parameter for protected routes", () => {
      const redirect = getLoginRedirect("/dashboard");
      expect(redirect).toBe(`${DEFAULT_LOGIN_ROUTE}?next=%2Fdashboard`);
    });

    it("should include reason parameter when provided", () => {
      const redirect = getLoginRedirect("/dashboard", "session_expired");
      expect(redirect).toBe(`${DEFAULT_LOGIN_ROUTE}?next=%2Fdashboard&reason=session_expired`);
    });

    it("should handle complex paths", () => {
      const redirect = getLoginRedirect("/admin/users/123");
      expect(redirect).toBe(`${DEFAULT_LOGIN_ROUTE}?next=%2Fadmin%2Fusers%2F123`);
    });

    it("should only include reason when pathname doesn't qualify for next", () => {
      const redirect = getLoginRedirect("/", "expired");
      expect(redirect).toBe(`${DEFAULT_LOGIN_ROUTE}?reason=expired`);
    });
  });

  describe("getUnauthorizedRedirect", () => {
    it("should return unauthorized URL with reason and attempted path", () => {
      const redirect = getUnauthorizedRedirect("/admin");
      expect(redirect).toBe("/unauthorized?reason=insufficient_permissions&attempted=%2Fadmin");
    });

    it("should handle role_required reason", () => {
      const redirect = getUnauthorizedRedirect("/admin/users", "role_required");
      expect(redirect).toBe("/unauthorized?reason=role_required&attempted=%2Fadmin%2Fusers");
    });

    it("should handle expired_session reason", () => {
      const redirect = getUnauthorizedRedirect("/dashboard", "expired_session");
      expect(redirect).toBe("/unauthorized?reason=expired_session&attempted=%2Fdashboard");
    });

    it("should URL-encode special characters in path", () => {
      const redirect = getUnauthorizedRedirect("/path with spaces");
      expect(redirect).toContain("attempted=%2Fpath+with+spaces");
    });
  });

  describe("getAuthStateRedirect", () => {
    it("should return null for authenticated state", () => {
      const redirect = getAuthStateRedirect("authenticated");
      expect(redirect).toBeNull();
    });

    it("should return null for undefined auth state", () => {
      const redirect = getAuthStateRedirect(undefined);
      expect(redirect).toBeNull();
    });

    it("should return MFA setup route for needs_mfa_setup", () => {
      const redirect = getAuthStateRedirect("needs_mfa_setup");
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_setup);
    });

    it("should return email verify route for needs_email_verify", () => {
      const redirect = getAuthStateRedirect("needs_email_verify");
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_email_verify);
    });

    it("should return totp route for needs_mfa_auth with totp method", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth", ["totp"]);
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.totp);
    });

    it("should return phone_otp route for needs_mfa_auth with phone_otp method", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth", ["phone_otp"]);
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.phone_otp);
    });

    it("should return email_otp route for needs_mfa_auth with email_otp method", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth", ["email_otp"]);
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.email_otp);
    });

    it("should default to email_otp when no enrolled methods", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth");
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.email_otp);
    });

    it("should default to email_otp for unknown method", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth", ["unknown_method"]);
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.email_otp);
    });

    it("should use first method when multiple enrolled", () => {
      const redirect = getAuthStateRedirect("needs_mfa_auth", ["phone_otp", "totp", "email_otp"]);
      expect(redirect).toBe(AUTH_STATE_REDIRECTS.needs_mfa_auth.phone_otp);
    });

    it("should return null for unknown auth states", () => {
      const redirect = getAuthStateRedirect("unknown_state");
      expect(redirect).toBeNull();
    });
  });

  describe("AUTH_STATE_REDIRECTS", () => {
    it("should have correct structure", () => {
      expect(AUTH_STATE_REDIRECTS).toEqual({
        needs_mfa_auth: {
          totp: "/mfa/authenticate/authenticatormfa/authverifycode",
          phone_otp: "/mfa/authenticate/smsmfa/codecheck",
          email_otp: "/mfa/authenticate/emailmfa",
        },
        needs_mfa_setup: "/mfa/register",
        needs_email_verify: "/auth/verify-email",
        authenticated: null,
      });
    });
  });

  describe("Constants", () => {
    it("should have correct DEFAULT_AUTHENTICATED_ROUTE", () => {
      expect(DEFAULT_AUTHENTICATED_ROUTE).toBe("/dashboard");
    });

    it("should have correct DEFAULT_LOGIN_ROUTE", () => {
      expect(DEFAULT_LOGIN_ROUTE).toBe("/login");
    });
  });
});
