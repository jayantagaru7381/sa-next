import '@testing-library/jest-dom';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { render, screen, waitFor } from '@testing-library/react';

import MagicLinkVerifyPage from '../page';
import { handleTokenResponse } from '../../../../../utils/tokenManager';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthLayout component
jest.mock('../../../../../components/layout/AuthLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-layout">{children}</div>,
}));

// Mock MagicLinkExpiry component
jest.mock('../../../../../components/auth/MagicLinkExpiry', () => ({
  __esModule: true,
  default: ({ email }: { email?: string | null }) => <div data-testid="magic-link-expiry" data-email={email || ''}>Magic Link Expiry Component</div>,
}));

// Mock handleTokenResponse utility
jest.mock('../../../../../utils/tokenManager', () => ({
  handleTokenResponse: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

describe('MagicLinkVerifyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (fetch as jest.Mock).mockClear();
    (handleTokenResponse as jest.Mock).mockClear();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MagicLinkVerifyPage />);

      expect(screen.getByText('Verifying Magic Link')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we verify your magic link...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows loading spinner and text', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<MagicLinkVerifyPage />);

      expect(screen.getByText('Verifying your magic link...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Missing Parameters', () => {
    it('shows expiry component when token is missing', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows expiry component when jti is missing', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows expiry component when both token and jti are missing', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'test@example.com';
        return null;
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      });
    });
  });

  describe('API Call', () => {
    it('calls magic link exchange API with correct parameters', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'success' }))
      });

      (handleTokenResponse as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: true,
        redirectUrl: '/dashboard'
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/magic_link/exchange'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: 'test-token',
              jti: 'test-jti'
            })
          })
        );
      });
    });

    it('handles API response failure', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      });
    });

    it('handles empty response from server', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      });
    });
  });

  describe('Response Handling', () => {
    it('redirects to dashboard on success', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'success' }))
      });

      (handleTokenResponse as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: true,
        redirectUrl: '/dashboard'
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('redirects to MFA setup when required', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'mfa_setup_required' }))
      });

      ((handleTokenResponse as jest.Mock) as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: false,
        redirectUrl: null
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/mfa/register');
      }, { timeout: 3000 });
    });

    it('redirects to TOTP MFA when required', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          result: 'mfa_auth_required', 
          details: { enrolled_methods: ['totp'] } 
        }))
      });

      ((handleTokenResponse as jest.Mock) as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: false,
        redirectUrl: null
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/mfa/authenticate/authenticatormfa/authverifycode');
      }, { timeout: 3000 });
    });

    it('redirects to SMS MFA when required', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          result: 'mfa_auth_required', 
          details: { enrolled_methods: ['phone_otp'] } 
        }))
      });

      ((handleTokenResponse as jest.Mock) as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: false,
        redirectUrl: null
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/mfa/authenticate/smsmfa/codecheck');
      }, { timeout: 3000 });
    });

    it('redirects to Email MFA when required', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          result: 'mfa_auth_required', 
          details: { enrolled_methods: ['email_otp'] } 
        }))
      });

      ((handleTokenResponse as jest.Mock) as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: false,
        redirectUrl: null
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/mfa/authenticate/emailmfa');
      }, { timeout: 3000 });
    });

    it('redirects to email verification when required', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'email_verification_required' }))
      });

      ((handleTokenResponse as jest.Mock) as jest.Mock).mockResolvedValueOnce({
        shouldRedirect: false,
        redirectUrl: null
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/mfa/authenticate/emailmfa/codecheck');
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      });
    });

    it('handles JSON parsing errors', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('invalid json')
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByTestId('magic-link-expiry')).toBeInTheDocument();
      });
    });
  });

  describe('Email Handling', () => {
    it('passes email to MagicLinkExpiry component', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return 'test@example.com';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        const expiryComponent = screen.getByTestId('magic-link-expiry');
        expect(expiryComponent).toHaveAttribute('data-email', 'test@example.com');
      });
    });

    it('handles encoded email correctly', async () => {
      const encodedEmail = 'test%2Buser%40example.com';
      const decodedEmail = 'test+user@example.com';
      
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        if (key === 'email') return encodedEmail;
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        const expiryComponent = screen.getByTestId('magic-link-expiry');
        expect(expiryComponent).toHaveAttribute('data-email', decodedEmail);
      });
    });
  });

  describe('UI Elements', () => {
    it('renders correct headings and text', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Expired or Invalid')).toBeInTheDocument();
        expect(screen.getByText(/The magic link you clicked has expired or no longer valid/)).toBeInTheDocument();
        expect(screen.getByText(/For your security, magic links are single-use and time-sensitive/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('applies correct styling classes', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token';
        if (key === 'jti') return 'test-jti';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      const { container } = render(<MagicLinkVerifyPage />);

      await waitFor(() => {
        const section = container.querySelector('section');
        expect(section).toHaveClass('text-center', 'bg-white', 'rounded-md', 'max-w-[420px]', 'shadow-sm');
        expect(section).toHaveStyle('padding: 40px 24px');
      });
    });
  });
});
