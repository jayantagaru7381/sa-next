// Mock authApi before any imports
const mockAuthMfaRegister = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
jest.mock('../../../../../../store/authApi', () => ({
  useAuthMfaRegisterMutation: () => [mockAuthMfaRegister, { isLoading: false }],
}));

import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import Page from '../page';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock the token manager
jest.mock('../../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
}));

// Mock the ProgressBar component
jest.mock('../../../../../../components/common/ProgressBar', () => ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div data-testid="progress-bar">Step {currentStep} of {totalSteps}</div>
));

// Mock react-qr-code
jest.mock('react-qr-code', () => ({ value, size }: { value: string; size: number }) => (
  <div data-testid="qr-code" data-value={value} data-size={size}>QR Code</div>
));

// Mock global fetch
global.fetch = jest.fn();

// Create a test store
const testStore = configureStore({
  reducer: {
    // Mock reducer for authApi
    authApi: (state = {}, action: any) => state,
    AuthSlice: (state = {}, action: any) => state,
  },
});

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Custom render function
const renderWithProviders = (ui: React.ReactElement) => render(
    <Provider store={testStore}>
      <ThemeProvider theme={testTheme}>
        {ui}
      </ThemeProvider>
    </Provider>
  );

describe('Authenticator QR Code Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        qr_code_url: 'otpauth://totp/test?secret=ABCD1234',
        manual_key: 'ABCD1234EFGH5678'
      }),
    });
  });

  it('renders the QR code setup page', () => {
    renderWithProviders(<Page />);

    expect(screen.getByText('Set up authenticator app')).toBeInTheDocument();
    expect(screen.getByText(/Scan this QR code with your authenticator app or enter the code manually/)).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('displays progress bar with correct step', () => {
    renderWithProviders(<Page />);

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderWithProviders(<Page />);

    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next (2/3)')).toBeInTheDocument();
  });

  it('handles back button click', () => {
    renderWithProviders(<Page />);

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa');
  });

  it('handles next button click', () => {
    renderWithProviders(<Page />);

    const nextButton = screen.getByText('Next (2/3)');
    fireEvent.click(nextButton);

    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa/authverifycode');
  });

  it('fetches QR code data on mount', async () => {
    const mockResponse = {
      qr_code_url: 'otpauth://totp/test?secret=ABCD1234',
      manual_key: 'ABCD1234EFGH5678'
    };

    // Mock the unwrap method to return the mock response
    mockAuthMfaRegister.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(mockResponse),
    });

    renderWithProviders(<Page />);

    await waitFor(() => {
      expect(mockAuthMfaRegister).toHaveBeenCalledWith({
        payload: '{}',
        mode: 'authenticator_app'
      });
    });
  });

  it('renders container with correct structure', () => {
    renderWithProviders(<Page />);

    // Just verify the container exists and has the main content
    expect(screen.getByText('Set up authenticator app')).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next (2/3)')).toBeInTheDocument();
  });
});