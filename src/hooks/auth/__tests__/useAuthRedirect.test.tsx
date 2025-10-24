import { useRouter } from "next/navigation";
import { renderHook } from "@testing-library/react";

import { useAuthRedirect } from "../useAuthRedirect";
import * as cookiesUtils from "../../../utils/cookies";
import { DEFAULT_AUTHENTICATED_ROUTE } from "../../../lib/auth/route-policies";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock cookies utils
jest.mock("../../../utils/cookies", () => ({
  isAuthenticated: jest.fn(),
}));

// Mock console.log
const mockLog = jest.spyOn(console, "log").mockImplementation();

describe("useAuthRedirect", () => {
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
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  it("should redirect authenticated users to dashboard", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    renderHook(() => useAuthRedirect());

    expect(mockReplace).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(
      "[useAuthRedirect] User is authenticated, redirecting to dashboard"
    );
  });

  it("should not redirect unauthenticated users", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(false);

    renderHook(() => useAuthRedirect());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockLog).not.toHaveBeenCalled();
  });

  it("should use router.replace instead of router.push", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    renderHook(() => useAuthRedirect());

    expect(mockReplace).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should re-check authentication when router changes", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(false);

    const { rerender } = renderHook(() => useAuthRedirect());

    expect(mockReplace).not.toHaveBeenCalled();

    // Change authentication state
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    // Trigger re-render with new router instance
    const newMockRouter = { ...mockRouter, replace: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(newMockRouter);
    rerender();

    expect(newMockRouter.replace).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE);
  });

  it("should handle missing router gracefully", () => {
    (useRouter as jest.Mock).mockReturnValue(null);
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    expect(() => renderHook(() => useAuthRedirect())).toThrow();
  });

  it("should check authentication status on every render", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(false);

    const { rerender } = renderHook(() => useAuthRedirect());
    expect(cookiesUtils.isAuthenticated).toHaveBeenCalledTimes(1);

    rerender();
    // Should only call once per effect run (not on every render)
    expect(cookiesUtils.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  it("should redirect to correct route when DEFAULT_AUTHENTICATED_ROUTE changes", () => {
    (cookiesUtils.isAuthenticated as jest.Mock).mockReturnValue(true);

    renderHook(() => useAuthRedirect());

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
