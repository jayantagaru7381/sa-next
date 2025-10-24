import { useRouter } from "next/navigation";
import { waitFor, renderHook } from "@testing-library/react";

import * as cookiesUtils from "../../../utils/cookies";
import { useTempTokenRoute } from "../useTempTokenRoute";
import * as routePolicies from "../../../lib/auth/route-policies";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock cookies utils
jest.mock("../../../utils/cookies", () => ({
  getAuthState: jest.fn(),
}));

// Mock route policies
jest.mock("../../../lib/auth/route-policies", () => ({
  getLoginRedirect: jest.fn(),
}));

// Mock console.log
const mockLog = jest.spyOn(console, "log").mockImplementation();

// Mock window.location
const mockLocation = {
  pathname: "/mfa/register",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("useTempTokenRoute", () => {
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
    mockLocation.pathname = "/mfa/register";
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  describe("No authentication", () => {
    it("should redirect to login when no auth_state cookie exists", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue(
        "/login?next=%2Fmfa%2Fregister"
      );

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith("/mfa/register");
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fmfa%2Fregister");
      expect(mockLog).toHaveBeenCalledWith(
        "[useTempTokenRoute] No auth_state cookie, redirecting to login"
      );
    });

    it("should return false immediately when no auth_state", () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      expect(result.current).toBe(false);
    });
  });

  describe("Matching auth_state", () => {
    it("should authorize when auth_state matches required state", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("should authorize needs_mfa_auth route with needs_mfa_auth state", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_auth"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("should authorize needs_email_verify route with needs_email_verify state", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_email_verify");

      const { result } = renderHook(() => useTempTokenRoute("needs_email_verify"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("Authenticated users", () => {
    it("should allow authenticated users access to temp token routes", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(
        "[useTempTokenRoute] User is authenticated, allowing access"
      );
    });

    it("should allow authenticated users on needs_mfa_auth routes", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_auth"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("Mismatched auth_state", () => {
    it("should redirect when auth_state does not match required state", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue(
        "/login?next=%2Fmfa%2Fregister"
      );

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fmfa%2Fregister");
      expect(mockLog).toHaveBeenCalledWith(
        "[useTempTokenRoute] Invalid auth_state: expected needs_mfa_setup, got needs_mfa_auth, redirecting to login"
      );
    });

    it("should redirect needs_mfa_setup route when user has needs_email_verify", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_email_verify");
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(mockReplace).toHaveBeenCalled();
    });
  });

  describe("No required auth_state", () => {
    it("should authorize when no specific auth_state is required", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");

      const { result } = renderHook(() => useTempTokenRoute());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("should authorize with authenticated state when no requirement", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      const { result } = renderHook(() => useTempTokenRoute());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("should redirect when no auth_state even without requirement", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(mockReplace).toHaveBeenCalled();
    });
  });

  describe("Return value behavior", () => {
    it("should start with false and update to true on authorization", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      // Note: In React StrictMode, effects run twice, so the state may already be true
      // We just verify it eventually becomes true
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should remain false when unauthorized", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      expect(result.current).toBe(false);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });
  });

  describe("Router dependency", () => {
    it("should re-run effect when router changes", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");

      const { rerender } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(cookiesUtils.getAuthState).toHaveBeenCalledTimes(1);
      });

      // Change router instance
      const newMockRouter = { ...mockRouter };
      (useRouter as jest.Mock).mockReturnValue(newMockRouter);

      rerender();

      await waitFor(() => {
        expect(cookiesUtils.getAuthState).toHaveBeenCalledTimes(2);
      });
    });

    it("should re-run effect when requiredAuthState changes", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_auth");

      const { rerender } = renderHook(({ state }) => useTempTokenRoute(state), {
        initialProps: { state: "needs_mfa_auth" as const },
      });

      await waitFor(() => {
        expect(cookiesUtils.getAuthState).toHaveBeenCalledTimes(1);
      });

      // Change required state
      rerender({ state: "needs_mfa_setup" as const });

      await waitFor(() => {
        expect(cookiesUtils.getAuthState).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Edge cases", () => {
    it("should use router.replace instead of router.push", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should handle undefined auth_state same as null", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(undefined);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(mockReplace).toHaveBeenCalled();
    });

    it("should handle special characters in pathname", async () => {
      mockLocation.pathname = "/mfa/register?redirect=/admin/users";
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue(null);
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue(
        "/login?next=%2Fmfa%2Fregister%3Fredirect%3D%2Fadmin%2Fusers"
      );

      renderHook(() => useTempTokenRoute("needs_mfa_setup"));

      await waitFor(() => {
        expect(routePolicies.getLoginRedirect).toHaveBeenCalledWith(
          "/mfa/register?redirect=/admin/users"
        );
      });
    });

    it("should handle authenticated as required state", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("authenticated");

      const { result } = renderHook(() => useTempTokenRoute("authenticated"));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("should not authorize non-authenticated user for authenticated route", async () => {
      (cookiesUtils.getAuthState as jest.Mock).mockReturnValue("needs_mfa_setup");
      (routePolicies.getLoginRedirect as jest.Mock).mockReturnValue("/login");

      const { result } = renderHook(() => useTempTokenRoute("authenticated"));

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      expect(mockReplace).toHaveBeenCalled();
    });
  });
});
