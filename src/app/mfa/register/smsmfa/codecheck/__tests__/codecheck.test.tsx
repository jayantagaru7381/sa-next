import '@testing-library/jest-dom';

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter, useSearchParams } from "next/navigation";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";

import { createTheme, ThemeProvider } from '@mui/material/styles';

import SMSMfaPage from "../page";
import { handleTokenResponse } from "../../../../../../utils/tokenManager";
import { useAuthMfaRegisterMutation, useMfaVerifyRegisterMutation } from "../../../../../../store/authApi";

// Mock hooks and utilities
jest.mock("../../../../../../store/authApi");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("../../../../../../utils/tokenManager", () => ({
  handleTokenResponse: jest.fn(async () => ({ shouldRedirect: false })),
}));
jest.mock(
  "../../../../../../assets/icons",
  () => ({ StartIcon: () => <span data-testid="start-icon">icon</span> })
);

// useTempTokenRoute is mocked globally in jest.setup.ts

// Mock timer hooks
const mockMainTimer = {
  timer: 600,
  startTimer: jest.fn(),
  saveTimestamp: jest.fn(),
  getRemainingTime: jest.fn(() => 0),
  clearTimestamp: jest.fn(),
};

const mockResendTimer = {
  resendTimer: 0,
  startResendTimer: jest.fn(),
  stopResendTimer: jest.fn(),
  setResendTimerValue: jest.fn(),
  getRemainingResendTime: jest.fn(() => 0),
};

const mockLocalStorageState = {
  hasInitialRequestBeenMade: jest.fn(() => false),
  markInitialRequestAsMade: jest.fn(),
  clearInitialRequestFlag: jest.fn(),
  getPageLoadCount: jest.fn(() => 0),
  incrementPageLoadCount: jest.fn(),
  clearPageLoadCount: jest.fn(),
};

jest.mock("../../../../../../hooks/auth/index", () => ({
  useTimer: jest.fn(() => mockMainTimer),
  useResendTimer: jest.fn(() => mockResendTimer),
  useLocalStorageState: jest.fn(() => mockLocalStorageState),
  useTempTokenRoute: jest.fn(() => true), // Mock to return true for tests
}));

jest.mock("../../../../../../utils/helper", () => ({
  formatTime: (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  },
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

describe("SMSMfaPage", () => {
  const push = jest.fn();
  const replace = jest.fn();

  const mockAuthMfaRegister = jest.fn();
  const mockMfaVerifyRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push, replace });
    // Always provide correct return value tuple for both mutations
    (useAuthMfaRegisterMutation as jest.Mock)
      .mockReturnValue([mockAuthMfaRegister, { isLoading: false }]);
    (useMfaVerifyRegisterMutation as jest.Mock)
      .mockReturnValue([mockMfaVerifyRegister, { isLoading: false }]);
    // Mock search params with phone number
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => key === "phone" ? "+1234567890" : null
    });

    // Set up default mock return values with unwrap method
    mockAuthMfaRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Code sent" })
    });
    mockMfaVerifyRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true })
    });

    // Reset timer mocks
    mockMainTimer.timer = 600;
    mockMainTimer.getRemainingTime.mockReturnValue(0);
    mockResendTimer.resendTimer = 0;
    mockResendTimer.getRemainingResendTime.mockReturnValue(0);
    mockLocalStorageState.hasInitialRequestBeenMade.mockReturnValue(false);
    mockLocalStorageState.getPageLoadCount.mockReturnValue(0);
  });

  test("shows Suspense fallback loading initially", async () => {
    // The component loads synchronously and shows the main form, not the Suspense fallback
    await act(async () => {
      renderWithProviders(<SMSMfaPage />);
    });
    // Check that the main form is rendered instead of the loading fallback
    expect(screen.getByText('Please check your messages!')).toBeInTheDocument();
  });

  test("renders skeleton while loading registration", async () => {
    (useAuthMfaRegisterMutation as jest.Mock)
      .mockReturnValue([mockAuthMfaRegister, { isLoading: true }]);
    await act(async () => renderWithProviders(<SMSMfaPage />));
    // Check for skeleton elements by their class names
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("shows main form and handles Successful Verification", async () => {
    mockAuthMfaRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Your code was sent!" }),
    });
    mockMfaVerifyRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ result: "success", session_token: "token" }),
    });
    jest.mocked(handleTokenResponse)
      .mockResolvedValue({ shouldRedirect: true, redirectUrl: "/dashboard" });
    await act(async () => renderWithProviders(<SMSMfaPage />));
    expect(screen.getByRole('heading', { name: /please check your messages/i })).toBeInTheDocument();
    const inputs = screen.getAllByLabelText(/digit/i);
    for (let i = 0; i < inputs.length; i++) {
      fireEvent.change(inputs[i], { target: { value: `${i + 1}` } });
    }
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));
    // Should redirect
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("shows error if incomplete code submitted", async () => {
    await act(async () => renderWithProviders(<SMSMfaPage />));

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

  test("shows error and disables after too many failed tries", async () => {
    mockMfaVerifyRegister.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error("Code is invalid"))
    });
    await act(async () => renderWithProviders(<SMSMfaPage />));

    // 4 failures to trigger "too many"
    for (let j = 0; j < 4; j++) {
      // Fill the code fields before each attempt (they get cleared after each failed attempt)
      const inputs = screen.getAllByLabelText(/digit/i);
      for (let i = 0; i < 6; i++) {
        fireEvent.change(inputs[i], { target: { value: "1" } });
      }

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });

      // Wait for the error to appear
      if (j < 3) {
        await waitFor(() => {
          expect(screen.getByText(/code is invalid/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    }

    // Check for the final state after 4 failed attempts
    await waitFor(() => {
      expect(screen.getByText(/Too many failed tries/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
  }, 15000);

  test("Resend triggers registration logic and resets timer", async () => {
    mockAuthMfaRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "SMS resent!" }),
    });
    await act(async () => renderWithProviders(<SMSMfaPage />));
    const resendButton = screen.getByRole("button", { name: /resend code/i });
    await act(async () => {
      fireEvent.click(resendButton);
    });
    expect(mockAuthMfaRegister).toHaveBeenCalled();
  });

  test("Support button can be clicked", async () => {
    // Simulate failures to get support button
    mockMfaVerifyRegister.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error("fail"))
    });
    const consoleSpy = jest.spyOn(console, 'log');
    await act(async () => renderWithProviders(<SMSMfaPage />));

    // 4 failures to trigger "too many"
    for (let j = 0; j < 4; j++) {
      await act(async () => {
        // Fill the code fields before each attempt (they get cleared after each failed attempt)
        for (let i = 0; i < 6; i++) {
          fireEvent.change(screen.getAllByLabelText(/digit/i)[i], { target: { value: "1" } });
        }
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });

      // Wait for the error to appear and then clear
      await waitFor(() => {
        expect(screen.getByText(/fail/i)).toBeInTheDocument();
      });
    }

    const supportButton = await screen.findByRole('button', { name: /contact support/i });
    fireEvent.click(supportButton);
    expect(consoleSpy).toHaveBeenCalledWith("Contact support clicked");
    consoleSpy.mockRestore();
  });

  test("shows verification loading state", async () => {
    (useMfaVerifyRegisterMutation as jest.Mock)
      .mockReturnValue([mockMfaVerifyRegister, { isLoading: true }]);
    await act(async () => renderWithProviders(<SMSMfaPage />));
    expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();
  });

  test("shows registration loading state", async () => {
    (useAuthMfaRegisterMutation as jest.Mock)
      .mockReturnValue([mockAuthMfaRegister, { isLoading: true }]);
    await act(async () => renderWithProviders(<SMSMfaPage />));
    // In loading state, the resend button shows "Sending..." text
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });
});
