import React from "react";

import Page from "../page";
import { render, screen, waitFor, mockPush, fireEvent } from "../../../../../test-utils";

// Mock the router
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock the icons
jest.mock("../../../../../assets/icons", () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

// Mock the token manager
jest.mock("../../../../../utils/tokenManager", () => ({
  createApiHeaders: jest.fn(() => ({ "Content-Type": "application/json" })),
  handleTokenResponse: jest.fn(() => Promise.resolve({ shouldRedirect: false, redirectUrl: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe("Register Email MFA Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("initiates email MFA registration on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/mfa/register/email/initiate"),
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Object),
          body: JSON.stringify({}),
        })
      );
    });
  });

  it("handles email MFA initiation error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<Page />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to send verification email. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("renders 6 digit input fields", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    expect(inputFields).toHaveLength(6);
  });

  it("handles digit input correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    fireEvent.change(inputFields[0], { target: { value: "1" } });
    expect(inputFields[0]).toHaveValue("1");
  });

  it("only accepts numeric input", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    fireEvent.change(inputFields[0], { target: { value: "a" } });
    expect(inputFields[0]).toHaveValue("");
  });

  it("moves to next input when digit is entered", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    fireEvent.change(inputFields[0], { target: { value: "1" } });

    // Wait for focus to move to the next input
    await waitFor(() => {
      expect(inputFields[1]).toHaveFocus();
    });
  });

  it("handles backspace navigation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    fireEvent.change(inputFields[1], { target: { value: "2" } });
    // Clear the value first, then test backspace
    fireEvent.change(inputFields[1], { target: { value: "" } });
    fireEvent.keyDown(inputFields[1], { key: "Backspace" });

    // Wait for focus to move to previous input
    await waitFor(() => {
      expect(inputFields[0]).toHaveFocus();
    });
  });

  it("validates complete code before submission", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const verifyButton = screen.getByText("Verify");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter the complete 6-digit code.")).toBeInTheDocument();
    });
  });

  it("submits verification code successfully", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, result: "success" }),
      });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText("Verify");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/mfa/register/email/verify"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: "123456" }),
        })
      );
    });
  });

  it("handles verification error", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockRejectedValueOnce(new Error("Verification failed"));

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole("textbox");
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText("Verify");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Verification failed")).toBeInTheDocument();
    });
  });

  it("handles resend code functionality", async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    // Fast-forward the timer to make resend button available
    jest.advanceTimersByTime(61000); // 61 seconds to ensure timer expires

    // Wait for resend button to be available
    await waitFor(() => {
      const resendButton = screen.getByText("Resend code");
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + resend
    });

    jest.useRealTimers();
  });

  it("shows timer countdown for resend button", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Resend code in \d+s/)).toBeInTheDocument();
    });
  });

  it("navigates back to methods page", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Please check your messages!")).toBeInTheDocument();
    });

    const backButton = screen.getByText("Return to methods");
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith("/mfa/register");
  });
});
