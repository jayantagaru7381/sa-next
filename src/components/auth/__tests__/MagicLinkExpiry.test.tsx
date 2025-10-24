import '@testing-library/jest-dom';

import React from 'react';
import { useRouter } from 'next/navigation';
import { render, screen, fireEvent } from '@testing-library/react';

import MagicLinkExpiry from '../MagicLinkExpiry';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

describe('MagicLinkExpiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders both buttons correctly', () => {
    render(<MagicLinkExpiry />);

    expect(screen.getByText('Request a new one-time link')).toBeInTheDocument();
    expect(screen.getByText('Go to login page')).toBeInTheDocument();
  });

  it('renders with email prop', () => {
    render(<MagicLinkExpiry email="test@example.com" />);

    expect(screen.getByText('Request a new one-time link')).toBeInTheDocument();
    expect(screen.getByText('Go to login page')).toBeInTheDocument();
  });

  it('navigates to magic-link page when "Request a new one-time link" is clicked without email', () => {
    render(<MagicLinkExpiry />);

    const requestButton = screen.getByText('Request a new one-time link');
    fireEvent.click(requestButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/magic-link');
  });

  it('navigates to magic-link page with email when "Request a new one-time link" is clicked with email', () => {
    const email = 'test@example.com';
    render(<MagicLinkExpiry email={email} />);

    const requestButton = screen.getByText('Request a new one-time link');
    fireEvent.click(requestButton);

    expect(mockRouter.push).toHaveBeenCalledWith(`/auth/magic-link?email=${encodeURIComponent(email)}`);
  });

  it('navigates to login page when "Go to login page" is clicked', () => {
    render(<MagicLinkExpiry />);

    const loginButton = screen.getByText('Go to login page');
    fireEvent.click(loginButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('handles null email prop correctly', () => {
    render(<MagicLinkExpiry email={null} />);

    const requestButton = screen.getByText('Request a new one-time link');
    fireEvent.click(requestButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/magic-link');
  });

  it('handles undefined email prop correctly', () => {
    render(<MagicLinkExpiry email={undefined} />);

    const requestButton = screen.getByText('Request a new one-time link');
    fireEvent.click(requestButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/magic-link');
  });

  it('encodes email properly in URL', () => {
    const email = 'test+user@example.com';
    render(<MagicLinkExpiry email={email} />);

    const requestButton = screen.getByText('Request a new one-time link');
    fireEvent.click(requestButton);

    expect(mockRouter.push).toHaveBeenCalledWith(`/auth/magic-link?email=${encodeURIComponent(email)}`);
  });

  it('has correct button styling and attributes', () => {
    render(<MagicLinkExpiry />);

    const requestButton = screen.getByText('Request a new one-time link');
    const loginButton = screen.getByText('Go to login page');

    // Check that buttons are rendered as buttons
    expect(requestButton.tagName).toBe('BUTTON');
    expect(loginButton.tagName).toBe('BUTTON');

    // Check that buttons have fullWidth prop (rendered as full width)
    expect(requestButton).toHaveClass('MuiButton-fullWidth');
    expect(loginButton).toHaveClass('MuiButton-fullWidth');
  });

  it('applies correct gap between buttons', () => {
    const { container } = render(<MagicLinkExpiry />);

    const buttonContainer = container.querySelector('div[style*="gap: 8px"]');
    expect(buttonContainer).toBeInTheDocument();
  });

  it('applies correct height to login button', () => {
    render(<MagicLinkExpiry />);

    const loginButton = screen.getByText('Go to login page');
    expect(loginButton).toHaveStyle('height: 48px');
  });
});
