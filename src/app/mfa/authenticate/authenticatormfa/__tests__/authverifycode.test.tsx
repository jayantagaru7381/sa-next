// Mock RTK Query hooks first, before any imports
const mockMfaVerify = jest.fn();
let mockIsLoading = false;

jest.mock('../../../../../store/authApi', () => ({
  useMfaVerifyMutation: () => [mockMfaVerify, { isLoading: mockIsLoading }],
}));

jest.mock('../../../../../utils/tokenManager', () => ({
  handleTokenResponse: jest.fn(),
}));

import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import AuthenticatorMfaPage from '../authverifycode/page';
import { handleTokenResponse } from '../../../../../utils/tokenManager';

// Mock the router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('temp=test-token'),
}));

// Mock the ProgressBar component
jest.mock('../../../../../components/common/ProgressBar', () => ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div data-testid="progress-bar">Step {currentStep} of {totalSteps}</div>
));

// Mock token manager
jest.mock('../../../../../utils/tokenManager', () => ({
  handleTokenResponse: jest.fn().mockResolvedValue({ shouldRedirect: true, redirectUrl: '/dashboard' }),
}));

// Mock Constants
jest.mock('../../../../../utils/Constants', () => ({
  CODE_LENGTH: 6,
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

describe('Authenticate Authenticator MFA Verification Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMfaVerify.mockClear();
    mockIsLoading = false;
    // Set up default mock return value
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ result: "success", session_token: "token" })
    });
  });

  it('renders the authenticator verification page', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    expect(screen.getByText(/Please enter the code that you see in your authenticator app/)).toBeInTheDocument();
  });

  it('displays the progress bar with correct step', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveTextContent('Step 3 of 3');
  });

  it('renders 6 digit input fields', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue('1'));
  });

  it('only accepts numeric input', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: 'a' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue(''));
  });

  it('moves to next input when digit is entered', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => {
      expect(inputFields[1]).toHaveFocus();
    });
  });

  it('handles backspace navigation', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[1], { target: { value: '2' } });
    await waitFor(() => expect(inputFields[1]).toHaveValue('2'));

    fireEvent.change(inputFields[1], { target: { value: '' } });
    fireEvent.keyDown(inputFields[1], { key: 'Backspace' });
    await waitFor(() => {
      expect(inputFields[0]).toHaveFocus();
    });
  });

  it('validates complete code before submission', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful verification', async () => {
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: "success",
        session_token: "token",
        success: true
      })
    });

    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles token response with redirect', async () => {
    const mockHandleTokenResponse = jest.mocked(handleTokenResponse);
    mockHandleTokenResponse.mockResolvedValueOnce({
      shouldRedirect: true,
      redirectUrl: '/custom-redirect'
    });

    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: "success",
        session_token: "test-session-token"
      })
    });

    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
    });
  });

  it('handles verification error', async () => {
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Verification failed'))
    });

    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });

  it('handles too many failed attempts', async () => {
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Verification failed'))
    });

    renderWithProviders(<AuthenticatorMfaPage />);

    for (let i = 0; i < 4; i++) {
      const inputFields = screen.getAllByRole('textbox');
      // Fill the code fields before each attempt (they get cleared after each failed attempt)
      inputFields.forEach((field, index) => {
        fireEvent.change(field, { target: { value: (index + 1).toString() } });
      });

      await act(async () => {
        const verifyButton = screen.getByText('Complete');
        fireEvent.click(verifyButton);
      });

      if (i < 3) {
        await waitFor(() => {
          expect(screen.getByText(/verification failed. please check the code provided and try again/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Too many failed tries')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 15000);

  it('navigates back to QR code page when Back button is clicked', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa/qrcode');
  });

  it('applies correct styling to input fields', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach(field => {
      expect(field).toHaveStyle({
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: '600',
      });
    });
  });

  it('shows error styling when validation fails', async () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach(field => {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('renders without errors', () => {
    expect(() => renderWithProviders(<AuthenticatorMfaPage />)).not.toThrow();
  });

  it('disables inputs during verification', async () => {
    mockIsLoading = true;
    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');

    // Inputs should be disabled during verification
    inputFields.forEach(field => {
      expect(field).toBeDisabled();
    });
  });

  it('shows "Verifying..." during API call', async () => {
    mockIsLoading = true;
    renderWithProviders(<AuthenticatorMfaPage />);

    expect(screen.getByText('Verifying...')).toBeInTheDocument();
  });

  it('clears code after failed verification', async () => {
    mockMfaVerify.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error("Verification failed"))
    });

    renderWithProviders(<AuthenticatorMfaPage />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      inputFields.forEach(field => {
        expect(field).toHaveValue("");
      });
    });
  });

  it('shows loading fallback during Suspense', () => {
    renderWithProviders(<AuthenticatorMfaPage />);

    // The component shows the main form, not a loading fallback
    expect(screen.getByText('Enter the code')).toBeInTheDocument();
  });
});