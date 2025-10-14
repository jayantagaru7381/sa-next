import React from "react";
import { useRouter } from "next/navigation";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import ResetPasswordPage from "./page";
import { useResetPasswordMutation } from "../../../store/authApi";

// Mock icons to avoid MUI theme access during tests
jest.mock("../../../assets/icons", () => ({
  EyeIcon: () => <span data-testid="eye-icon">Eye</span>,
  EyeOffIcon: () => <span data-testid="eye-off-icon">EyeOff</span>,
  LeftArrowIcon: () => <span data-testid="left-arrow">Left</span>,
}));

jest.mock("../../../store/authApi", () => ({
  useResetPasswordMutation: jest.fn(),
}));
// declare a holder for the router mock so jest.mock factory can reference it
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? "testtoken" : key === "jti" ? "testjti" : null),
  }),
}));

describe("ResetPasswordPage", () => {
  let mockResetPassword: jest.Mock;
  let mockRouterPush: jest.Mock;
  const getPasswordInput = () =>
    (document.querySelector('input[name="password"]') as HTMLInputElement)!;
  const getConfirmInput = () =>
    (document.querySelector('input[name="confirmPassword"]') as HTMLInputElement)!;
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPassword = jest.fn();
    mockRouterPush = jest.fn();
    (useResetPasswordMutation as jest.Mock).mockReturnValue([
      mockResetPassword,
      { isLoading: false },
    ]);
    // Reset the router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it("disables Reset Password button if requirements are not met", async () => {
    render(<ResetPasswordPage />);
    const passwordInput = getPasswordInput();
    fireEvent.change(passwordInput, { target: { value: "short" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).toBeDisabled();
    });
  });

  it("shows error if passwords do not match", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "DifferentPassword123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(await screen.findByText(/passwords (do not match|must match)/i)).toBeInTheDocument();
  });

  it("shows error if password is too short", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "Short1!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "Short1!" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(await screen.findByText(/at least 12 characters/i)).toBeInTheDocument();
  });

  it("enables Reset Password button when all requirements are met", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled();
    });
  });

  it("shows API error message on failed request", async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: "API error" } }),
    });
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => expect(mockResetPassword).toHaveBeenCalled());
    expect(await screen.findByText(/API error|Something went wrong/i)).toBeInTheDocument();
  });

  it("shows loading state when submitting", async () => {
    (useResetPasswordMutation as jest.Mock).mockReturnValue([
      mockResetPassword,
      { isLoading: true },
    ]);
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    expect(screen.getByRole("button", { name: /reset password/i })).toBeDisabled();
  });

  it("redirects to index page on success", async () => {
    mockResetPassword.mockReturnValue({ unwrap: () => Promise.resolve() });
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?successMessage=passwordSuccess");
    });
  });
});
