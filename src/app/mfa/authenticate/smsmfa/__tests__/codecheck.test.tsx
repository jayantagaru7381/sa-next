import React from 'react';

import Page from '../codecheck/page';
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

// Mock environment variable
process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000/api';

// Create a mock URLSearchParams that properly handles the phone parameter
const mockSearchParams = {
  get: jest.fn((key: string) => {
    if (key === 'phone') return '+1234567890';
    return null;
  }),
  has: jest.fn(),
  getAll: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
  size: 1,
  [Symbol.iterator]: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock the icons
jest.mock('../../../../../assets/icons', () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
}));

// Mock the token manager
jest.mock('../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Authenticate SMS MFA Code Check Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('handles SMS MFA initiation error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Failed to send verification SMS. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders 6 digit input fields after loading completes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);

    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly and moves focus', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue('1'));
    await waitFor(() => expect(inputFields[1]).toHaveFocus());
  });

  it('only accepts numeric input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: 'a' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue(''));
  });

  it('handles backspace navigation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[1], { target: { value: '2' } });
    await waitFor(() => expect(inputFields[1]).toHaveValue('2'));

    // simulate clearing and backspace
    fireEvent.change(inputFields[1], { target: { value: '' } });
    fireEvent.keyDown(inputFields[1], { key: 'Backspace' });

    await waitFor(() => {
      expect(inputFields[0]).toHaveFocus();
    });
  });

  it('validates complete code before submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const verifyButton = screen.getByText('Verify');
    // In strict mode the button should be disabled when inputs are incomplete
    expect(verifyButton).toBeDisabled();
  });

  it('navigates to dashboard on successful verification', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');

    await act(async () => {
      inputFields.forEach((field, index) => {
        fireEvent.change(field, { target: { value: (index + 1).toString() } });
      });

      const verifyButton = screen.getByText('Verify');
      fireEvent.click(verifyButton);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows timer countdown for code expiration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    // Wait for the timer to be displayed
    await waitFor(() => {
      expect(screen.getByText('Code expires in')).toBeInTheDocument();
    });

    // Check for timer format (MM:SS)
    const timeEl = screen.getByText(/^\d{2}:\d{2}$/);
    expect(timeEl).toBeInTheDocument();
  });

  it('handles contact support click after too many tries', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
        }),
      })
      .mockRejectedValue(new Error('Verification failed'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    for (let i = 0; i < 4; i++) {
      const inputFields = screen.getAllByRole('textbox');
      const verifyButton = screen.getByText('Verify');

      await act(async () => {
        // Only fill inputs if they're empty (first attempt) or if we need to clear them
        if (i === 0 || (inputFields[0] as HTMLInputElement).value === '') {
          inputFields.forEach((field, index) => {
            fireEvent.change(field, { target: { value: (index + 1).toString() } });
          });
        }

        fireEvent.click(verifyButton);
      });

      if (i < 3) {
        await waitFor(() => expect(screen.getByText(/Verification failed/)).toBeInTheDocument());
      }
    }

    await waitFor(() => expect(screen.getByText('Too many failed tries')).toBeInTheDocument());

    const contactSupportButton = screen.getByText('Contact support');

    await act(async () => {
      fireEvent.click(contactSupportButton);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Contact support clicked');
    consoleSpy.mockRestore();
  });

  it('formats time correctly for initial 600s', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
      }),
    });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    // Wait for timer to be displayed and check initial format
    await waitFor(() => {
      expect(screen.getByText('Code expires in')).toBeInTheDocument();
    });

    // initial timer is 10:00 -> should match MM:SS
    const timeEl = screen.getByText(/^\d{2}:\d{2}$/);
    expect(timeEl).toBeInTheDocument();
    expect(timeEl.textContent).toBe('10:00');
  });

  it('enables resend after advancing timer (fake timers)', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: "We've sent a 6-digit confirmation code to the phone number +1234567890. Please enter the code in below box to log in."
        }),
      });

    render(<Page />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    // Wait for timer to be displayed first
    await waitFor(() => {
      expect(screen.getByText('Code expires in')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(601000); // 601 seconds -> timer should be 0
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Resend code/i });
      expect(resendButton).not.toBeDisabled();
    });

    jest.useRealTimers();
  });
});
