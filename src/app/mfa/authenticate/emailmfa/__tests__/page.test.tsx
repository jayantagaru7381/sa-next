import React from 'react';

import Page from '../page';
import { act, render, screen, waitFor, mockPush, fireEvent } from '../../../../../test-utils';

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
}));

// Mock the icons
jest.mock('../../../../../assets/icons', () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

// Mock the token manager
jest.mock('../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  handleTokenResponse: jest.fn(() => Promise.resolve({ shouldRedirect: false, redirectUrl: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Authenticate Email MFA Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('initiates email MFA authentication on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mfa/authenticate/email/initiate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({}),
        })
      );
    });
  });

  it('handles email MFA initiation error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Failed to send verification email. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders 6 digit input fields after loading completes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue('1'));
  });

  it('only accepts numeric input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: 'a' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue(''));
  });

  it('moves to next input when digit is entered', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });

    await waitFor(() => {
      expect(inputFields[1]).toHaveFocus();
    });
  });

  it('handles backspace navigation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });
  });

  it('submits verification code successfully', async () => {
    // 1) initiate call  2) verify call
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, result: 'success' }),
      });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mfa/authenticate/email/verify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: '123456' }),
        })
      );
    });
  });

  it('handles verification error and shows message', async () => {
    // 1) initiate 2) verify (reject)
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockRejectedValueOnce(new Error('Verification failed'));

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Verification failed/)).toBeInTheDocument();
    });
  });

  it('handles resend code functionality (timer)', async () => {
    jest.useFakeTimers();

    // 1) initiate 2) resend
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
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    // Advance timer so that resend becomes available
    act(() => {
      jest.advanceTimersByTime(61000); // 61s
    });

    await waitFor(() => {
      // find button by its text when timer is 0
      const resendButton = screen.getByRole('button', { name: /Resend code/i });
      expect(resendButton).not.toBeDisabled();
    });

    // Click resend
    const resendButton = screen.getByRole('button', { name: /Resend code/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      // initial initiate + resend call
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('shows timer countdown for resend button while timer > 0', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByText(/Resend code in \d+s/)).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful verification', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, result: 'success' }),
      });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles token response with redirect', async () => {
    const { handleTokenResponse } = await import('../../../../../utils/tokenManager');
    const mockHandleTokenResponse = handleTokenResponse as jest.MockedFunction<typeof handleTokenResponse>;
    mockHandleTokenResponse.mockResolvedValueOnce({
      shouldRedirect: true,
      redirectUrl: '/custom-redirect'
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          result: 'success',
          session_token: 'test-session-token'
        }),
      });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
    });
  });
});
