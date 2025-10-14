import React from "react";
import { useRouter } from "next/navigation";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import ResetPasswordPage from "./page";
import { useResetPasswordMutation, useValidatePasswordLinkMutation } from "../../../store/authApi";

// Mock icons to avoid MUI theme access during tests
jest.mock("../../../assets/icons", () => ({
  EyeIcon: () => <span data-testid="eye-icon">Eye</span>,
  EyeOffIcon: () => <span data-testid="eye-off-icon">EyeOff</span>,
  LeftArrowIcon: () => <span data-testid="left-arrow">Left</span>,
}));

// Mock the Verify component
jest.mock("../../../components/auth/Verify/Verify", () => ({
  __esModule: true,
  default: ({ expiredHeading, handleRequestNewLink, handleNagivate }: any) => (
    <div data-testid="verify-component">
      <h1>{expiredHeading}</h1>
      <button onClick={handleRequestNewLink}>Request new Reset Link</button>
      <button onClick={handleNagivate}>Go to login page</button>
    </div>
  ),
}));

// Mock AuthLayout
jest.mock("../../../components/layout/AuthLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="auth-layout">{children}</div>,
}));

// Mock AuthSALogoBranding
jest.mock("../../../components/auth/AuthSALogoBranding", () => ({
  __esModule: true,
  default: () => <div data-testid="logo-branding">Logo</div>,
}));

// Mock PasswordStrengthBar
jest.mock("../../../components/auth/PasswordStrengthBar", () => ({
  PasswordStrengthBar: ({ password }: any) => (
    <div data-testid="password-strength-bar">Strength: {password.length}</div>
  ),
}));

// Mock PasswordRequirements
jest.mock("../../../components/common/PasswordRequirements", () => ({
  PasswordRequirements: ({ password }: any) => (
    <div data-testid="password-requirements">Requirements for: {password}</div>
  ),
}));

jest.mock("../../../store/authApi", () => ({
  useResetPasswordMutation: jest.fn(),
  useValidatePasswordLinkMutation: jest.fn(),
}));

let mockSearchParams = {
  get: (key: string) => (key === "token" ? "testtoken" : key === "jti" ? "testjti" : null),
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: () => mockSearchParams,
}));

describe("ResetPasswordPage", () => {
  let mockResetPassword: jest.Mock;
  let mockValidatePasswordLink: jest.Mock;
  let mockRouterPush: jest.Mock;
  const getPasswordInput = () =>
    document.querySelector('input[name="password"]') as HTMLInputElement;
  const getConfirmInput = () =>
    document.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPassword = jest.fn();
    mockValidatePasswordLink = jest.fn();
    mockRouterPush = jest.fn();
    
    // Reset search params to default
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "testtoken" : key === "jti" ? "testjti" : null),
    };

    (useResetPasswordMutation as jest.Mock).mockReturnValue([
      mockResetPassword,
      { isLoading: false },
    ]);
    (useValidatePasswordLinkMutation as jest.Mock).mockReturnValue([
      mockValidatePasswordLink,
      { data: { valid: true }, isLoading: false, isUninitialized: false },
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

  it("disables button if passwords do not match", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "DifferentPassword123!" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).toBeDisabled();
    });
  });

  it("disables button if password is too short", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "Short1!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "Short1!" } });
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /reset password/i });
      expect(button).toBeDisabled();
    });
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

  it("shows verify component when link is invalid", async () => {
    (useValidatePasswordLinkMutation as jest.Mock).mockReturnValue([
      mockValidatePasswordLink,
      { data: { valid: false, message: "Link expired" }, isLoading: false, isUninitialized: false },
    ]);
    render(<ResetPasswordPage />);
    await waitFor(() => {
      expect(screen.getByTestId("verify-component")).toBeInTheDocument();
    });
  });

  it("shows verify component when link is loading", async () => {
    (useValidatePasswordLinkMutation as jest.Mock).mockReturnValue([
      mockValidatePasswordLink,
      { data: undefined, isLoading: true, isUninitialized: false },
    ]);
    render(<ResetPasswordPage />);
    await waitFor(() => {
      expect(screen.getByTestId("verify-component")).toBeInTheDocument();
    });
  });

  it("validates link on mount when token and jti are present", async () => {
    render(<ResetPasswordPage />);
    await waitFor(() => {
      expect(mockValidatePasswordLink).toHaveBeenCalledWith(
        JSON.stringify({ token: "testtoken", jti: "testjti" })
      );
    });
  });

  it("handles navigation to forgot password page", async () => {
    (useValidatePasswordLinkMutation as jest.Mock).mockReturnValue([
      mockValidatePasswordLink,
      { data: { valid: false }, isLoading: false, isUninitialized: false },
    ]);
    render(<ResetPasswordPage />);
    await waitFor(() => {
      const requestButton = screen.getByText("Request new Reset Link");
      fireEvent.click(requestButton);
      expect(mockRouterPush).toHaveBeenCalledWith("/forgot-password");
    });
  });

  it("handles navigation to login page", async () => {
    (useValidatePasswordLinkMutation as jest.Mock).mockReturnValue([
      mockValidatePasswordLink,
      { data: { valid: false }, isLoading: false, isUninitialized: false },
    ]);
    render(<ResetPasswordPage />);
    await waitFor(() => {
      const loginButton = screen.getByText("Go to login page");
      fireEvent.click(loginButton);
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });

  it("toggles password visibility", async () => {
    render(<ResetPasswordPage />);
    const passwordInput = getPasswordInput();
    expect(passwordInput?.type).toBe("password");
    
    const toggleButton = screen.getAllByLabelText(/toggle password visibility/i)[0];
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(passwordInput?.type).toBe("text");
    });
  });

  it("toggles confirm password visibility", async () => {
    render(<ResetPasswordPage />);
    const confirmInput = getConfirmInput();
    expect(confirmInput?.type).toBe("password");
    
    const toggleButton = screen.getAllByLabelText(/toggle confirm password visibility/i)[0];
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(confirmInput?.type).toBe("text");
    });
  });

  it("removes spaces from password input", async () => {
    render(<ResetPasswordPage />);
    const passwordInput = getPasswordInput();
    fireEvent.change(passwordInput, { target: { value: "Valid Pass word 123!" } });
    await waitFor(() => {
      expect(passwordInput.value).toBe("ValidPassword123!");
    });
  });

  it("removes spaces from confirm password input", async () => {
    render(<ResetPasswordPage />);
    const confirmInput = getConfirmInput();
    fireEvent.change(confirmInput, { target: { value: "Valid Pass word 123!" } });
    await waitFor(() => {
      expect(confirmInput.value).toBe("ValidPassword123!");
    });
  });

  it("clears API error when password changes", async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: "API error" } }),
    });
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/API error|Something went wrong/i)).toBeInTheDocument();
    });

    // Change password to clear error
    fireEvent.change(getPasswordInput(), { target: { value: "NewPassword123!" } });
    
    await waitFor(() => {
      expect(screen.queryByText(/API error|Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  it("handles API error with detailed error structure", async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.reject({
        data: {
          detail: {
            errors: [{ message: "Password is too weak" }]
          }
        }
      }),
    });
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/Password is too weak/i)).toBeInTheDocument();
    });
  });

  it("shows generic error message for unexpected errors", async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.reject(new Error("Unexpected error")),
    });
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  it("handles missing token scenario", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "jti" ? "testjti" : null),
    };
    
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled();
    });
    
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid or missing reset token/i)).toBeInTheDocument();
    });
  });

  it("handles missing jti scenario", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "testtoken" : null),
    };
    
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    
    render(<ResetPasswordPage />);
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled();
    });
    
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid or missing reset token/i)).toBeInTheDocument();
    });
  });

  it("calls resetPassword with correct parameters", async () => {
    mockResetPassword.mockReturnValue({ unwrap: () => Promise.resolve() });
    render(<ResetPasswordPage />);
    
    fireEvent.change(getPasswordInput(), { target: { value: "ValidPassword123!" } });
    fireEvent.change(getConfirmInput(), { target: { value: "ValidPassword123!" } });
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled();
    });
    
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        new_password: "ValidPassword123!",
        token: "testtoken",
        jti: "testjti",
      });
    });
  });
});
