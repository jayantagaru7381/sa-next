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
  // return an object with get() to mimic ReadonlyURLSearchParams
  useSearchParams: () => ({
    get: (k: string) => (k === 'temp' ? 'test-token' : null),
  }),
}));

// Mock the ProgressBar component
jest.mock('../../../../../../components/common/ProgressBar', () => ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div data-testid="progress-bar">Step {currentStep} of {totalSteps}</div>
));

// Mock the token manager
jest.mock('../../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  handleTokenResponse: jest.fn(() => Promise.resolve({ shouldRedirect: false, redirectUrl: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Register Authenticator MFA Verification Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the authenticator verification page', () => {
    render(<Page />);
    
    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    expect(screen.getByText(/Please enter the code that you see in your authenticator app/)).toBeInTheDocument();
  });

  it('displays the progress bar with correct step', () => {
    render(<Page />);
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveTextContent('Step 3 of 3');
  });

  it('renders 6 digit input fields', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly', async () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue('1'));
  });

  it('only accepts numeric input', async () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: 'a' } });
    await waitFor(() => expect(inputFields[0]).toHaveValue(''));
  });

  it('moves to next input when digit is entered', async () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    await waitFor(() => {
      expect(inputFields[1]).toHaveFocus();
    });
  });

  it('handles backspace navigation', async () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    // put a value in first input so focusing/backspacing logic can be tested
    fireEvent.change(inputFields[1], { target: { value: '2' } });
    await waitFor(() => expect(inputFields[1]).toHaveValue('2'));

    // Clear the value first, then test backspace
    fireEvent.change(inputFields[1], { target: { value: '' } });
    // Fire keyDown for Backspace
    fireEvent.keyDown(inputFields[1], { key: 'Backspace' });
    await waitFor(() => {
      expect(inputFields[0]).toHaveFocus();
    });
  });

  it('validates complete code before submission', async () => {
    render(<Page />);
    
    const verifyButton = screen.getByText('Complete (3/3)');
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });
  });

  it('submits verification code successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, result: 'success' }),
    });

    render(<Page />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });
    
    const verifyButton = screen.getByText('Complete (3/3)');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mfa/register/authenticator_app/verify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ 
            code: '123456'
          }),
        })
      );
    });
  });

  it('handles verification error', async () => {
    // Ensure mocks are completely reset
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Set up the mock to reject
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Verification failed'));

    render(<Page />);

    // Wait for component to be ready
    await waitFor(() => {
      expect(screen.getByText('Complete (3/3)')).toBeInTheDocument();
    });

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });
    
    const verifyButton = screen.getByText('Complete (3/3)');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please check the code provided and try again.')).toBeInTheDocument();
    });
  });

  it('handles token response with redirect', async () => {
    const { handleTokenResponse } = await import('../../../../../../utils/tokenManager');
    const mockHandleTokenResponse = handleTokenResponse as jest.MockedFunction<typeof handleTokenResponse>;
    mockHandleTokenResponse.mockResolvedValueOnce({
      shouldRedirect: true,
      redirectUrl: '/custom-redirect'
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        result: 'success',
        session_token: 'test-session-token'
      }),
    });

    render(<Page />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });
    
    const verifyButton = screen.getByText('Complete (3/3)');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
    });
  });

  it('renders the return to methods link (Back button exists)', () => {
    render(<Page />);
    
    const returnLink = screen.getByText('Back');
    expect(returnLink).toBeInTheDocument();
    expect(returnLink.closest('button')).toBeInTheDocument();
  });

  it('applies correct styling to input fields', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach(field => {
      expect(field).toHaveStyle({
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: '600',
      });
    });
  });

  it('shows error styling when validation fails', async () => {
    render(<Page />);
    
    const verifyButton = screen.getByText('Complete (3/3)');
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      const inputFields = screen.getAllByRole('textbox');
      inputFields.forEach(field => {
        // MUI sets aria-invalid when TextField error prop is true
        expect(field).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  it('renders without errors', () => {
    expect(() => render(<Page />)).not.toThrow();
  });
});
