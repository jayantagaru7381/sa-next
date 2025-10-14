import React from 'react';

import Page from '../page';
import { render, screen, waitFor, mockPush, fireEvent } from '../../../../../../test-utils';

// Mock the router
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
  useSearchParams: () => new URLSearchParams('phone=%2B1234567890'),
}));

// Mock the icons
jest.mock('../../../../../../assets/icons', () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
}));

// Mock the token manager
jest.mock('../../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  handleTokenResponse: jest.fn(() => Promise.resolve({ shouldRedirect: false, redirectUrl: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Register SMS MFA Code Check Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });


  it('initiates SMS MFA registration on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mfa/register/phone/initiate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({ phone_number: '+1234567890' }),
        })
      );
    });
  });

  it('handles SMS MFA initiation error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Failed to send verification SMS. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders 6 digit input fields', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      const inputFields = screen.getAllByRole('textbox');
      fireEvent.change(inputFields[0], { target: { value: '1' } });
      expect(inputFields[0]).toHaveValue('1');
    });
  });

  it('only accepts numeric input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      const inputFields = screen.getAllByRole('textbox');
      fireEvent.change(inputFields[0], { target: { value: 'a' } });
      expect(inputFields[0]).toHaveValue('');
    });
  });

  it('validates complete code before submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      const verifyButton = screen.getByText('Verify');
      fireEvent.click(verifyButton);
      
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });
  });

  it('handles resend code functionality', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<Page />);

    await waitFor(() => {
      const resendButton = screen.getByText('Resend code');
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + resend
    });
  });

  it('shows timer countdown for code expiration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Code expires in')).toBeInTheDocument();
      expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument(); // MM:SS format
    });
  });

  it('formats time correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      // The timer should show a formatted time like "10:00" for 600 seconds
      const timeElement = screen.getByText(/^\d{2}:\d{2}$/);
      expect(timeElement).toBeInTheDocument();
    });
  });



});
