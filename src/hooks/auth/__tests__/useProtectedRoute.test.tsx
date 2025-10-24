import { useRouter } from "next/navigation";
import { renderHook } from "@testing-library/react";

import * as cookiesUtils from "../../../utils/cookies";
import { useProtectedRoute } from "../useProtectedRoute";
import * as routePolicies from "../../../lib/auth/route-policies";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock cookies utils
jest.mock("../../../utils/cookies", () => ({
  getAuthState: jest.fn(),
  getCookie: jest.fn(),
}));

// Mock route policies
jest.mock("../../../lib/auth/route-policies", () => ({
  getLoginRedirect: jest.fn(),
  getAuthStateRedirect: jest.fn(),
}));

// Mock console.log
const mockLog = jest.spyOn(console, "log").mockImplementation();

// Mock window.location
const mockLocation = {
  pathname: "/dashboard",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("useProtectedRoute", () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockLog.mockClear();
    mockLocation.pathname = "/dashboard";
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  describe("No authentication", () => {
    it("should redirect to login when no auth_state cookie exists", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login?next=%2Fdashboard");

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/dashboard");
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fdashboard");
      expect(mockLog).toHaveBeenCalledWith(
        "[useProtectedRoute] No auth_state cookie, redirecting to login"
      );
    });

    it("should use current pathname for login redirect", () => {
      mockLocation.pathname = "/admin/users";
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login?next=%2Fadmin%2Fusers");

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/admin/users");
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fadmin%2Fusers");
    });
  });

  describe("Authenticated users", () => {
    it("should not redirect when auth_state is authenticated", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      renderHook(() => useProtectedRoute());

      expect(mockReplace).not.toHaveBeenCalled();
      expect(routePolicies.getAuthStateRedirect).not.toHaveBeenCalled();
    });

    it("should not log anything when user is authenticated", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      renderHook(() => useProtectedRoute());

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe("Incomplete authentication flows", () => {
    it("should redirect to MFA setup when auth_state is needs_mfa_setup", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/mfa/register");

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_setup", undefined);
      expect(mockReplace).toHaveBeenCalledWith("/mfa/register");
      expect(mockLog).toHaveBeenCalledWith(
        "[useProtectedRoute] Incomplete auth flow: needs_mfa_setup, redirecting"
      );
      expect(mockLog).toHaveBeenCalledWith("[useProtectedRoute] Redirecting to /mfa/register");
    });

    it("should redirect to email verification when auth_state is needs_email_verify", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_email_verify");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/auth/verify-email");

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith(
        "needs_email_verify",
        undefined
      );
      expect(mockReplace).toHaveBeenCalledWith("/auth/verify-email");
    });

    it("should redirect to MFA auth with enrolled methods", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (cookiesUtils.getCookie as jest.Mock).mockReturnValue("totp,email_otp");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/authenticatormfa/authverifycode"
      );

      renderHook(() => useProtectedRoute());

      expect(cookiesUtils.getCookie).toHaveBeenCalledWith("enrolled_methods");
      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", [
        "totp",
        "email_otp",
      ]);
      expect(mockReplace).toHaveBeenCalledWith("/mfa/authenticate/authenticatormfa/authverifycode");
    });

    it("should handle needs_mfa_auth without enrolled_methods cookie", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (cookiesUtils.getCookie as jest.Mock).mockReturnValue(null);
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/emailmfa"
      );

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", undefined);
      expect(mockReplace).toHaveBeenCalledWith("/mfa/authenticate/emailmfa");
    });

    it("should handle empty enrolled_methods cookie", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (cookiesUtils.getCookie as jest.Mock).mockReturnValue("");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/emailmfa"
      );

      renderHook(() => useProtectedRoute());

      // Empty string doesn't get split (evaluates to falsy), so undefined is passed
      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", undefined);
    });

    it("should not redirect when getAuthStateRedirect returns null", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("unknown_state");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(null);

      renderHook(() => useProtectedRoute());

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(
        "[useProtectedRoute] Incomplete auth flow: unknown_state, redirecting"
      );
    });
  });

  describe("Router dependency", () => {
    it("should re-run effect when router changes", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue("/mfa/register");

      const { rerender } = renderHook(() => useProtectedRoute());

      expect(mockReplace).toHaveBeenCalledTimes(1);

      // Change router instance
      const newMockRouter = { ...mockRouter };
      (useRouter as jest.Mock).mockReturnValue(newMockRouter);

      rerender();

      expect(mockReplace).toHaveBeenCalledTimes(2);
    });

    it("should use router.replace instead of router.push", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      renderHook(() => useProtectedRoute());

      expect(mockReplace).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple enrolled methods correctly", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (cookiesUtils.getCookie as jest.Mock).mockReturnValue("totp,phone_otp,email_otp");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/authenticatormfa/authverifycode"
      );

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", [
        "totp",
        "phone_otp",
        "email_otp",
      ]);
    });

    it("should handle enrolled_methods with whitespace", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (cookiesUtils.getCookie as jest.Mock).mockReturnValue(" totp , email_otp ");
      (routePolicies.getAuthStateRedirect as jest.Mock).mockReturnValue(
        "/mfa/authenticate/authenticatormfa/authverifycode"
      );

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getAuthStateRedirect).toHaveBeenCalledWith("needs_mfa_auth", [
        " totp ",
        " email_otp ",
      ]);
    });

    it("should handle undefined auth_state (same as null)", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(undefined);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      renderHook(() => useProtectedRoute());

      expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    it("should handle special characters in pathname", () => {
      mockLocation.pathname = "/admin/users/123?tab=settings";
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue(
        "/login?next=%2Fadmin%2Fusers%2F123%3Ftab%3Dsettings"
      );

      renderHook(() => useProtectedRoute());

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/admin/users/123?tab=settings");
    });
  });
});
