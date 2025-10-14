import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { mockPush } from 'src/test-utils';

import EntraCallbackPage from '../../callback/EntraCallbackPage';
import { handleTokenResponse } from '../../../../../../utils/tokenManager';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock handleTokenResponse will be set up in the mock

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

    // Simulate success backend response
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({
        result: 'success',
        redirect_url: '/dashboard',
      }),
    });

    // Mock handleTokenResponse to return shouldRedirect: true
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: true,
      redirectUrl: '/dashboard'
    });

    render(<EntraCallbackPage />);
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

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({
        result: 'email_verification_required',
        user_id: 'user-123',
      }),
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    render(<EntraCallbackPage />);
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

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({
        result: 'mfa_auth_required',
        details: { enrolled_methods: ['totp'] }
      }),
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    render(<EntraCallbackPage />);
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

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({
        result: 'mfa_setup_required',
        user_id: 100,
        temp_token: 'temp-token',
      }),
    });

    // Mock handleTokenResponse to return shouldRedirect: false so component handles the redirect
    (handleTokenResponse as jest.Mock).mockResolvedValue({
      shouldRedirect: false,
      redirectUrl: null
    });

    render(<EntraCallbackPage />);
    
    // First check if fetch was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Then check if redirect was called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/mfa/register');
    });
  });

  it('shows missing authorization code error', async () => {
    mockSearchParams.get.mockImplementation((key: string) => null);
    render(<EntraCallbackPage />);
    await waitFor(() => {
      expect(screen.getByText('Missing authorization code.')).toBeInTheDocument();
    });
  });
});