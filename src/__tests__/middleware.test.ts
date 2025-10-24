import type { NextRequest } from "next/server";

// Mock Next.js server BEFORE importing middleware
jest.mock("next/server", () => {
  // Define MockNextResponse inside the mock factory
  class MockNextResponse {
    constructor(
      public body: any,
      public init?: ResponseInit
    ) {}

    static next = jest.fn(() => ({ type: "next" }));
    static redirect = jest.fn((url: URL) => ({ type: "redirect", url: url.toString() }));
  }

  return {
    NextResponse: MockNextResponse,
  };
});

// Mock CSRF validation
jest.mock("../lib/auth/csrf");

// Mock route policies
jest.mock("../lib/auth/route-policies");

// NOW import middleware and NextResponse after mocks are set up
import { NextResponse } from "next/server";

import * as csrf from "../lib/auth/csrf";
import { middleware } from "../middleware";
import * as routePolicies from "../lib/auth/route-policies";

// Mock console.log
const mockLog = jest.spyOn(console, "log").mockImplementation();

describe("Middleware", () => {
  const createMockRequest = (
    pathname: string,
    method: string = "GET",
    cookies: Record<string, string> = {},
    searchParams: Record<string, string> = {}
  ): NextRequest => {
    const url = `http://localhost:3000${pathname}`;
    const urlObj = new URL(url);

    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });

    return {
      method,
      nextUrl: {
        pathname,
        href: url,
        searchParams: urlObj.searchParams,
      },
      url: urlObj.toString(),
      cookies: {
        get: jest.fn((name: string) => {
          if (cookies[name]) {
            return { value: cookies[name], name };
          }
          return undefined;
        }),
      },
      headers: {
        get: jest.fn(),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLog.mockClear();

    // Default mocks
    (csrf.validateCSRF as jest.Mock).mockReturnValue(true);
    (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(false);
    (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "none" });
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  describe("Static assets", () => {
    it("should skip middleware for _next paths", () => {
      const request = createMockRequest("/_next/static/chunk.js");

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(csrf.validateCSRF).not.toHaveBeenCalled();
    });

    it("should skip middleware for static paths", () => {
      const request = createMockRequest("/static/image.png");

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should skip middleware for file extensions", () => {
      const request = createMockRequest("/favicon.ico");

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should skip middleware for image files", () => {
      const request = createMockRequest("/logo.svg");

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("CSRF validation", () => {
    it("should validate CSRF for POST requests", () => {
      const request = createMockRequest("/api/test", "POST");
      (csrf.validateCSRF as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(csrf.validateCSRF).toHaveBeenCalledWith(request);
    });

    it("should return 419 when CSRF validation fails", () => {
      const request = createMockRequest("/api/test", "POST");
      (csrf.validateCSRF as jest.Mock).mockReturnValue(false);

      const response = middleware(request);

      expect(response).toEqual(
        new NextResponse(
          JSON.stringify({
            error: "CSRF validation failed",
            code: "CSRF_INVALID",
          }),
          {
            status: 419,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );
    });

    it("should validate CSRF for DELETE requests", () => {
      const request = createMockRequest("/api/test", "DELETE");
      (csrf.validateCSRF as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(csrf.validateCSRF).toHaveBeenCalledWith(request);
    });

    it("should validate CSRF for PUT requests", () => {
      const request = createMockRequest("/api/test", "PUT");
      (csrf.validateCSRF as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(csrf.validateCSRF).toHaveBeenCalledWith(request);
    });

    it("should allow GET requests without CSRF", () => {
      const request = createMockRequest("/dashboard", "GET");
      (csrf.validateCSRF as jest.Mock).mockReturnValue(true);
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });

      middleware(request);

      expect(csrf.validateCSRF).toHaveBeenCalledWith(request);
    });
  });

  describe("Public routes", () => {
    it("should allow access to public routes", () => {
      const request = createMockRequest("/healthcheck");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "none" });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should allow access to forgot-password", () => {
      const request = createMockRequest("/forgot-password");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "none" });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Authenticated users on auth routes", () => {
    it("should redirect authenticated users from login page", () => {
      const request = createMockRequest("/login", "GET", { auth_state: "authenticated" });
      (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(true);
      (routePolicies.getAuthenticatedRedirect as jest.Mock).mockReturnValue("/dashboard");

      middleware(request);

      expect(routePolicies.getAuthenticatedRedirect).toHaveBeenCalledWith("/login");
      expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/dashboard", request.url));
    });

    it("should redirect authenticated users from MFA setup pages", () => {
      const request = createMockRequest("/mfa/register", "GET", { auth_state: "authenticated" });
      (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(true);
      (routePolicies.getAuthenticatedRedirect as jest.Mock).mockReturnValue("/dashboard");

      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should not redirect authenticated users from OAuth callbacks with code", () => {
      const request = createMockRequest(
        "/auth/sso/entra/callback",
        "GET",
        { auth_state: "authenticated" },
        { code: "auth_code_123", state: "state_456" }
      );
      (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("should not redirect from callback with only code param", () => {
      const request = createMockRequest(
        "/auth/sso/entra/callback",
        "GET",
        { auth_state: "authenticated" },
        { code: "auth_code" }
      );
      (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should not redirect from callback with only state param", () => {
      const request = createMockRequest(
        "/auth/sso/entra/callback",
        "GET",
        { auth_state: "authenticated" },
        { state: "state_123" }
      );
      (routePolicies.isAuthRoute as jest.Mock).mockReturnValue(true);

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Protected routes (session required)", () => {
    it("should redirect to MFA when auth_state is needs_mfa_auth", () => {
      const request = createMockRequest("/dashboard", "GET", {
        auth_state: "needs_mfa_auth",
        enrolled_methods: "totp,email_otp",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/authenticatormfa/authverifycode"
      );

      middleware(request);

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", [
        "totp",
        "email_otp",
      ]);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/mfa/authenticate/authenticatormfa/authverifycode", request.url)
      );
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("Incomplete auth flow detected: needs_mfa_auth")
      );
    });

    it("should redirect to MFA setup when auth_state is needs_mfa_setup", () => {
      const request = createMockRequest("/dashboard", "GET", { auth_state: "needs_mfa_setup" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/mfa/register");

      middleware(request);

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_setup", undefined);
      expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/mfa/register", request.url));
    });

    it("should redirect to email verification when auth_state is needs_email_verify", () => {
      const request = createMockRequest("/dashboard", "GET", {
        auth_state: "needs_email_verify",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/auth/verify-email");

      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/auth/verify-email", request.url)
      );
    });

    it("should redirect to login when no session cookie", () => {
      const request = createMockRequest("/dashboard");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login?next=%2Fdashboard");

      middleware(request);

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/dashboard");
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/login?next=%2Fdashboard", request.url)
      );
      expect(mockLog).toHaveBeenCalledWith(
        "[Middleware] No session cookie found, redirecting to login"
      );
    });

    it("should allow access with valid session and authenticated state", () => {
      const request = createMockRequest("/dashboard", "GET", {
        sess: "session_token",
        auth_state: "authenticated",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("should allow access with session even without auth_state", () => {
      const request = createMockRequest("/dashboard", "GET", { sess: "session_token" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Temp token routes", () => {
    it("should allow access to temp token routes", () => {
      const request = createMockRequest("/mfa/register");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({
        auth: "temp",
        purpose: "2fa_setup",
      });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should allow access to MFA auth routes", () => {
      const request = createMockRequest("/mfa/authenticate/emailmfa");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({
        auth: "temp",
        purpose: "2fa_auth",
      });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should allow access to email verification routes", () => {
      const request = createMockRequest("/auth/verify-email");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({
        auth: "temp",
        purpose: "email_verify",
      });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should allow access to password reset routes", () => {
      const request = createMockRequest("/reset-password");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({
        auth: "temp",
        purpose: "password_reset",
      });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Enrolled methods handling", () => {
    it("should parse enrolled_methods from cookie", () => {
      const request = createMockRequest("/dashboard", "GET", {
        auth_state: "needs_mfa_auth",
        enrolled_methods: "phone_otp,email_otp",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/smsmfa/codecheck"
      );

      middleware(request);

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", [
        "phone_otp",
        "email_otp",
      ]);
    });

    it("should handle missing enrolled_methods cookie", () => {
      const request = createMockRequest("/dashboard", "GET", { auth_state: "needs_mfa_auth" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/emailmfa"
      );

      middleware(request);

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", undefined);
    });

    it("should handle single enrolled method", () => {
      const request = createMockRequest("/dashboard", "GET", {
        auth_state: "needs_mfa_auth",
        enrolled_methods: "totp",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/authenticatormfa/authverifycode"
      );

      middleware(request);

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", ["totp"]);
    });
  });

  describe("Logging", () => {
    it("should log request details", () => {
      const request = createMockRequest("/dashboard", "GET", {
        sess: "token",
        auth_state: "authenticated",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });

      middleware(request);

      expect(mockLog).toHaveBeenCalledWith(
        "[Middleware] GET /dashboard",
        expect.objectContaining({
          hasSession: true,
          authState: "authenticated",
          policyAuth: "session",
        })
      );
    });

    it("should log when no session is found", () => {
      const request = createMockRequest("/dashboard");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      middleware(request);

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("No session cookie found"));
    });

    it("should log incomplete auth flows", () => {
      const request = createMockRequest("/dashboard", "GET", { auth_state: "needs_mfa_setup" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/mfa/register");

      middleware(request);

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("Incomplete auth flow detected: needs_mfa_setup")
      );
    });
  });

  describe("Priority order", () => {
    it("should check auth_state before session presence", () => {
      const request = createMockRequest("/dashboard", "GET", {
        sess: "session_token",
        auth_state: "needs_mfa_setup",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/mfa/register");

      middleware(request);

      // Should redirect to MFA setup, not allow access
      expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/mfa/register", request.url));
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("should not redirect when getAuthStateRedirect returns null", () => {
      const request = createMockRequest("/dashboard", "GET", { auth_state: "unknown_state" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      middleware(request);

      // Should redirect to login (no session), not stay on page
      expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/login", request.url));
    });
  });

  describe("Edge cases", () => {
    it("should handle empty auth_state cookie", () => {
      const request = createMockRequest("/dashboard", "GET", { auth_state: "" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should handle routes with query parameters", () => {
      const request = createMockRequest("/dashboard", "GET", {}, { tab: "settings" });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      middleware(request);

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle POST requests to protected routes", () => {
      const request = createMockRequest("/dashboard", "POST", {
        sess: "token",
        auth_state: "authenticated",
      });
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });

      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should handle default policy when route not matched", () => {
      const request = createMockRequest("/unknown-route");
      (routePolicies.getRoutePolicy as jest.Mock).mockReturnValue({ auth: "session" });
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });
});
