import '@testing-library/jest-dom';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import MagicLink from '../MagicLink';

// Create a theme for testing
const theme = createTheme();

// Mock the StartIcon component to avoid theme issues
jest.mock('../../../assets/icons', () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
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

// Custom render function with theme provider
const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('MagicLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render and Email Handling', () => {
    it('renders with email from URL parameters', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'test@example.com';
        return null;
      });
      renderWithTheme(<MagicLink />);
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('renders with empty email field when no email in URL', () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithTheme(<MagicLink />);
      const emailInput = screen.getByLabelText('Email address');
      expect(emailInput).toHaveValue('');
    });

    it('updates email field when user types', () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithTheme(<MagicLink />);
      const emailInput = screen.getByLabelText('Email address');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      expect(emailInput).toHaveValue('new@example.com');
    });
  });

  describe('API Call on Page Load', () => {
    it('calls magic link request API on page load with email', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'test@example.com';
        return null;
      });
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
      renderWithTheme(<MagicLink />);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/magic_link/request'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com' })
          })
        );
      });
    });

    it('does not call API when no email is provided', async () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithTheme(<MagicLink />);
      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it('prevents multiple API calls on re-renders', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'test@example.com';
        return null;
      });
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
      const { rerender } = renderWithTheme(<MagicLink />);
      rerender(<ThemeProvider theme={theme}><MagicLink /></ThemeProvider>);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('starts timer on successful API call', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'email') return 'test@example.com';
        return null;
      });
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
      renderWithTheme(<MagicLink />);
      await waitFor(() => {
        expect(screen.getByText(/Link expires in/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to login page when return button is clicked', () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithTheme(<MagicLink />);
      const returnButton = screen.getByText('Return to login');
      fireEvent.click(returnButton);
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      mockSearchParams.get.mockReturnValue(null);
      renderWithTheme(<MagicLink />);
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });
  });
});
