import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';

import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// Mock push function
const mockPush = jest.fn();

import EntraCallbackPage from '../../callback/EntraCallbackPage';
import { handleTokenResponse } from '../../../../../../utils/tokenManager';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock authApi
const mockAuthEntraCallback = jest.fn();
jest.mock('../../../../../../store/authApi', () => ({
  useAuthEntraCallbackMutation: () => [mockAuthEntraCallback, { isLoading: false }],
}));

// Set up the mock to return unwrap method
mockAuthEntraCallback.mockReturnValue({
  unwrap: jest.fn().mockResolvedValue({})
});

// Mock handleTokenResponse will be set up in the mock

// Create test store and theme
const testStore = configureStore({
  reducer: {
    authApi: (state = {}, action) => state,
    AuthSlice: (state = { user: null }, action) => state,
  },
});

const testTheme = createTheme();

// Custom render function with providers
const renderWithProviders = (ui: React.ReactElement) => render(
    <Provider store={testStore}>
      <ThemeProvider theme={testTheme}>
        {ui}
      </ThemeProvider>
    </Provider>
  );

// Mock Next.js navigation
const mockReplace = jest.fn();
const mockSearchParams = {
  get: jest.fn((key: string) => {
    if (key === 'code') return 'mockcode';
    if (key === 'returnTo') return '/dashboard';
    if (key === 'error') return null;
    if (key === 'error_description') return null;
    if (key === 'state') return 'mockstate';
    if (key === 'session_state') return 'mocksessionstate';
    return null;
  }),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
    push: mockPush,
  })),
  useSearchParams: jest.fn(() => mockSearchParams),
}));

// Mock the tokenManager module using module mocking
jest.mock('../../../../../../utils/tokenManager', () => ({
  handleTokenResponse: jest.fn(),
}));

describe('EntraCallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthEntraCallback.mockClear();
    // Reset the mock to return unwrap method
    mockAuthEntraCallback.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({})
    });
    // Reset the mock implementation
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'mockcode';
      if (key === 'returnTo') return '/dashboard';
      if (key === 'error') return null;
      if (key === 'error_description') return null;
      if (key === 'state') return 'mockstate';
      if (key === 'session_state') return 'mocksessionstate';
      return null;
    });
    // Mock handleTokenResponse to return default values
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });
  });

  it('redirects to dashboard route on success', async () => {
    // Mock search params to return code
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'mockcode';
      if (key === 'returnTo') return '/dashboard';
      return null;
    });

    // Mock the mutation to return a LoginResponse object
    mockAuthEntraCallback.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: 'success',
        redirect_url: '/dashboard',
      })
    });

    // Mock handleTokenResponse to return shouldRedirect: true
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: true,
      redirectUrl: '/dashboard'
    });

    renderWithProviders(<EntraCallbackPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to email verification if required', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'mockcode';
      if (key === 'returnTo') return '/dashboard';
      return null;
    });

    // Mock the mutation to return a LoginResponse object
    mockAuthEntraCallback.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: 'email_verification_required',
        user_id: 'user-123',
      })
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    renderWithProviders(<EntraCallbackPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/mfa/authenticate/emailmfa/codecheck');
    });
  });

  it('redirects to MFA flow if required', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'mockcode';
      if (key === 'returnTo') return '/dashboard';
      return null;
    });

    // Mock the mutation to return a LoginResponse object
    mockAuthEntraCallback.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: 'mfa_auth_required',
        details: { enrolled_methods: ['totp'] }
      })
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    renderWithProviders(<EntraCallbackPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/mfa/authenticate/authenticatormfa/authverifycode');
    });
  });

  it('redirects to MFA setup flow if required', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'code') return 'mockcode';
      if (key === 'returnTo') return '/dashboard';
      return null;
    });

    // Mock the mutation to return a LoginResponse object
    mockAuthEntraCallback.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        result: 'mfa_setup_required',
        user_id: 100,
        temp_token: 'temp-token',
      })
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    renderWithProviders(<EntraCallbackPage />);

    // Check if redirect was called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/mfa/register');
    });
  });

  it('shows missing authorization code error', async () => {
    mockSearchParams.get.mockImplementation((key: string) => null);
    renderWithProviders(<EntraCallbackPage />);
    await waitFor(() => {
      expect(screen.getByText('Missing authorization code.')).toBeInTheDocument();
    });
  });
});