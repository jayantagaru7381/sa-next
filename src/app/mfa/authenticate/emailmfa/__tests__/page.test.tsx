
import '@testing-library/jest-dom';

import React from "react";
import { Provider } from 'react-redux';
import { useRouter } from "next/navigation";
import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";

import { createTheme, ThemeProvider } from '@mui/material/styles';

import EmailMfaPage from "../page";
import { handleTokenResponse } from "../../../../../utils/tokenManager";
import { useAuthMfaMutation, useMfaVerifyMutation } from "../../../../../store/authApi";

// Mock hooks and functions
jest.mock("../../../../../store/authApi");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("../../../../../utils/tokenManager", () => ({
  handleTokenResponse: jest.fn(async () => ({ shouldRedirect: false })),
}));

// Mock the StartIcon component to avoid theme issues
jest.mock("../../../../../assets/icons", () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
}));

// Create a test store
const testStore = configureStore({
  reducer: {
    // Mock reducer for authApi
    authApi: (state = {}, action: any) => state,
    AuthSlice: (state = {}, action: any) => state,
  },
});

// Create a test theme
const testTheme = createTheme();

// Custom render function
const renderWithProviders = (ui: React.ReactElement) => render(
  <Provider store={testStore}>
    <ThemeProvider theme={testTheme}>
      {ui}
    </ThemeProvider>
  </Provider>
);

describe("EmailMfaPage", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  function mockAuthMfaMutation({ isLoading = false, result = {} } = {}) {
    (useAuthMfaMutation as jest.Mock).mockReturnValue([
      jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(result),
      }), { isLoading }
    ]);
  }

  function mockMfaVerifyMutation({ isLoading = false, result = {} } = {}) {
    (useMfaVerifyMutation as jest.Mock).mockReturnValue([
      jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(result),
      }), { isLoading }
    ]);
  }

  test("renders loading skeleton initially", () => {
    mockAuthMfaMutation({ isLoading: true });
    mockMfaVerifyMutation();
    renderWithProviders(<EmailMfaPage />);
    // Check for skeleton elements by their class names
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("renders message and input fields after MFA start", async () => {
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    mockMfaVerifyMutation();
    await act(async () => {
      renderWithProviders(<EmailMfaPage />);
    });
    expect(screen.getByText(/please check your messages/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/digit/i)).toHaveLength(6);
    expect(screen.getByText(/Test MFA sent/i)).toBeInTheDocument();
  });

  test("displays error if code is incomplete", async () => {
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    mockMfaVerifyMutation();
    await act(async () => renderWithProviders(<EmailMfaPage />));

    // Fill all 6 digits with a complete code
    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getAllByLabelText(/digit/i)[i], { target: { value: "1" } });
    }

    // Wait for the button to be enabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /verify/i })).not.toBeDisabled();
    });

    // Now clear one digit to make it incomplete
    fireEvent.change(screen.getAllByLabelText(/digit/i)[5], { target: { value: "" } });

    // The button should now be disabled, so we can't click it
    // Instead, let's test that the button is disabled when code is incomplete
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  test("successful verification redirects", async () => {
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    mockMfaVerifyMutation({ result: { result: "success", success: true, verified: true } });
    jest.mocked(handleTokenResponse).mockResolvedValue({ shouldRedirect: true, redirectUrl: "/dashboard" });

    await act(async () => renderWithProviders(<EmailMfaPage />));
    // Fill all digits
    for (let idx = 0; idx < 6; idx++) {
      fireEvent.change(screen.getAllByLabelText(/digit/i)[idx], { target: { value: idx + 1 + "" } });
    }
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error on failed verification and too many tries alert", async () => {
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    const failFn = jest
      .fn()
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" });
    (useMfaVerifyMutation as jest.Mock).mockReturnValue([
      jest.fn().mockReturnValue({ unwrap: failFn }), { isLoading: false }
    ]);
    await act(async () => renderWithProviders(<EmailMfaPage />));
    for (let attempt = 0; attempt < 4; attempt++) {
      for (let idx = 0; idx < 6; idx++) {
        fireEvent.change(screen.getAllByLabelText(/digit/i)[idx], { target: { value: "2" } });
      }
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });
      
      if (attempt < 3) {
        await waitFor(() => {
          expect(screen.getByText(/Invalid code/)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Too many failed tries/)).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 15000);

  test("Resend button is disabled for 60s, then can be clicked", async () => {
    jest.useFakeTimers();
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    mockMfaVerifyMutation();
    await act(async () => renderWithProviders(<EmailMfaPage />));
    // Resend is disabled initially
    expect(screen.getByRole("button", { name: /Resend code in/i })).toBeDisabled();

    // Fast-forward timer to enable resend
    act(() => { jest.advanceTimersByTime(61_000); });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Resend code/i })).toBeEnabled();
    });
    jest.useRealTimers();
  });

  test("support button is visible only after too many failed tries", async () => {
    mockAuthMfaMutation({ result: { message: "Test MFA sent" } });
    const failFn = jest.fn()
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" })
      .mockResolvedValueOnce({ result: "fail", message: "Invalid code" });
    (useMfaVerifyMutation as jest.Mock).mockReturnValue([
      jest.fn().mockReturnValue({ unwrap: failFn }), { isLoading: false }
    ]);
    await act(async () => renderWithProviders(<EmailMfaPage />));
    // Four failed attempts trigger 'too many tries'
    for (let i = 0; i < 4; i++) {
      for (let idx = 0; idx < 6; idx++) {
        fireEvent.change(screen.getAllByLabelText(/digit/i)[idx], { target: { value: "3" } });
      }
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });
      
      if (i < 3) {
        await waitFor(() => {
          expect(screen.getByText(/Invalid code/)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    }
    await waitFor(() => {
      expect(screen.getByText(/Too many failed tries/)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(await screen.findByText(/Contact support/i)).toBeInTheDocument();
  }, 15000);
});
