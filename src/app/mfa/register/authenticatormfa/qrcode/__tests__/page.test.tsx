import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

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
    render(<Page />);
    
    expect(screen.getByText('Set up authenticator app')).toBeInTheDocument();
    expect(screen.getByText(/Scan this QR code with your authenticator app or enter the code manually/)).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('displays progress bar with correct step', () => {
    render(<Page />);
    
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<Page />);
    
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next (2/3)')).toBeInTheDocument();
  });

  it('handles back button click', () => {
    render(<Page />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa');
  });

  it('handles next button click', () => {
    render(<Page />);
    
    const nextButton = screen.getByText('Next (2/3)');
    fireEvent.click(nextButton);
    
    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa/authverifycode');
  });

  it('fetches QR code data on mount', async () => {
    const mockResponse = {
      qr_code_url: 'otpauth://totp/test?secret=ABCD1234',
      manual_key: 'ABCD1234EFGH5678'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    render(<Page />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mfa/register/authenticator_app/initiate'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        })
      );
    });
  });

  it('renders container with correct structure', () => {
    render(<Page />);
    
    // Just verify the container exists and has the main content
    expect(screen.getByText('Set up authenticator app')).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next (2/3)')).toBeInTheDocument();
  });
});