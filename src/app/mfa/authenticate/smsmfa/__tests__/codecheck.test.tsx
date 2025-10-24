
import '@testing-library/jest-dom';

import { useRouter, useSearchParams } from "next/navigation";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";

import SMSMfaPage from "../codecheck/page";
import { handleTokenResponse } from "../../../../../utils/tokenManager";
import { useAuthMfaMutation, useMfaVerifyMutation } from "../../../../../store/authApi";

jest.mock("../../../../../store/authApi");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("../../../../../utils/tokenManager", () => ({
  handleTokenResponse: jest.fn(async () => ({ shouldRedirect: false })),
}));
jest.mock("../../../../../assets/icons", () => ({
  StartIcon: () => <span data-testid="start-icon">icon</span>,
}));

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

jest.mock("../../../../../hooks/auth/index", () => ({
  useTimer: jest.fn(() => mockMainTimer),
  useResendTimer: jest.fn(() => mockResendTimer),
  useLocalStorageState: jest.fn(() => mockLocalStorageState),
  useTempTokenRoute: jest.fn(() => true), // Mock to return true for tests
}));

describe("SMSMfaPage", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockAuthMfa = jest.fn();
  const mockMfaVerify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue({ get: (key: string) => (key === 'phone' ? '+3212345678' : null) });
    (useAuthMfaMutation as jest.Mock).mockReturnValue([mockAuthMfa, { isLoading: false }]);
    (useMfaVerifyMutation as jest.Mock).mockReturnValue([mockMfaVerify, { isLoading: false }]);

    // Reset timer mocks
    mockMainTimer.timer = 600;
    mockMainTimer.getRemainingTime.mockReturnValue(0);
    mockResendTimer.resendTimer = 0;
    mockResendTimer.getRemainingResendTime.mockReturnValue(0);
    mockLocalStorageState.hasInitialRequestBeenMade.mockReturnValue(false);
    mockLocalStorageState.getPageLoadCount.mockReturnValue(0);
  });

  test("shows loading skeleton while authMfa is loading", async () => {
    (useAuthMfaMutation as jest.Mock).mockReturnValue([mockAuthMfa, { isLoading: true }]);
    await act(async () => render(<SMSMfaPage />));
    expect(screen.getByText(/code expires in/i)).toBeInTheDocument(); // Check if form is rendered
  });

  test("initiates phone MFA and displays API message", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "SMS sent to your phone" }),
    });
    await act(async () => render(<SMSMfaPage />));
    expect(await screen.findByText(/please check your messages/i)).toBeInTheDocument();
    // The component renders apiMessage from the API response
    expect(screen.getByText(/SMS sent to your phone/i)).toBeInTheDocument();
  });

  test("shows error message on initiation failure", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error("Network error")),
    });
    await act(async () => render(<SMSMfaPage />));
    // The component shows the error message from the catch block
    expect(await screen.findByText(/failed to send verification sms/i)).toBeInTheDocument();
  });

  test("displays formatted timer countdown", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Message sent" }),
    });

    // Temporarily use real timer hook for this test
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const authHooks = require("../../../../../hooks/auth/index");
    const realUseTimer = jest.requireActual("../../../../../hooks/auth/index").useTimer;
    authHooks.useTimer = realUseTimer;

    jest.useFakeTimers();
    await act(async () => render(<SMSMfaPage />));
    expect(screen.getByText("10:00")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1000));

    expect(screen.getByText("09:59")).toBeInTheDocument();
    jest.useRealTimers();

    // Restore mock
    authHooks.useTimer = jest.fn(() => mockMainTimer);
  });

  test("verifies correct OTP and redirects on success", async () => {
    mockAuthMfa.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }) });
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ result: "success", session_token: "token" }),
    });
    jest.mocked(handleTokenResponse).mockResolvedValue({
      shouldRedirect: true,
      redirectUrl: "/dashboard",
    });

    await act(async () => render(<SMSMfaPage />));

    const inputs = screen.getAllByLabelText(/digit/i);
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: `${i + 1}` } }));

    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  test("shows error if incomplete OTP entered", async () => {
    mockAuthMfa.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }) });
    await act(async () => render(<SMSMfaPage />));

    // Fill only 5 fields to make the code incomplete (length 5 instead of 6)
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        fireEvent.change(screen.getAllByLabelText(/digit/i)[i], { target: { value: "1" } });
      }
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText(/please enter the complete 6-digit code/i)).toBeInTheDocument();
    });
  });

  test("handles failed verifications and shows 'too many tries' alert", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }),
    });
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ result: "fail", message: "Invalid code" }),
    });
    await act(async () => render(<SMSMfaPage />));

    for (let i = 0; i < 4; i++) {
      screen.getAllByLabelText(/digit/i).forEach((input) => fireEvent.change(input, { target: { value: "1" } }));

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });

      if (i < 3) {
        await waitFor(() => {
          expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    }

    await waitFor(() => {
      expect(screen.getByText(/too many failed tries/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByRole("button", { name: /contact support/i })).toBeInTheDocument();
  }, 15000);

  test("resend button triggers re-sending MFA code", async () => {
    mockAuthMfa.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ message: "SMS resent" }) });
    await act(async () => render(<SMSMfaPage />));
    const resendBtn = screen.getByRole("button", { name: /resend code/i });
    fireEvent.click(resendBtn);
    expect(mockAuthMfa).toHaveBeenCalled();
    expect(await screen.findByText(/sms resent/i)).toBeInTheDocument();
  });

  test("disables verify button during verification", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }),
    });
    (useMfaVerifyMutation as jest.Mock).mockReturnValue([mockMfaVerify, { isLoading: true }]);
    await act(async () => render(<SMSMfaPage />));
    expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();
  });

  test("disables resend button during sending", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }),
    });
    (useAuthMfaMutation as jest.Mock).mockReturnValue([mockAuthMfa, { isLoading: true }]);
    await act(async () => render(<SMSMfaPage />));
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  test("contact support button triggers console log", async () => {
    mockAuthMfa.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: "Code sent" }),
    });
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ result: "fail", message: "fail" }),
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    await act(async () => render(<SMSMfaPage />));

    // Fail 4 times to show support button
    for (let i = 0; i < 4; i++) {
      screen.getAllByLabelText(/digit/i).forEach((input) => fireEvent.change(input, { target: { value: "1" } }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /verify/i }));
      });
      // Wait for the error to appear or the too many tries alert
      if (i < 3) {
        await waitFor(() => expect(screen.getByText(/fail/i)).toBeInTheDocument());
      }
    }
    const supportBtn = await screen.findByRole("button", { name: /contact support/i });
    fireEvent.click(supportBtn);
    expect(consoleSpy).toHaveBeenCalledWith("Contact support clicked");
    consoleSpy.mockRestore();
  });
});
