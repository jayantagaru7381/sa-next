import React from 'react';

import Page from '../authverifycode/page';
import { render, screen, waitFor, mockPush, fireEvent } from '../../../../../test-utils';

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
  useSearchParams: () => new URLSearchParams('temp=test-token'),
}));

// Mock the token manager
jest.mock('../../../../../utils/tokenManager', () => ({
  createApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  handleTokenResponse: jest.fn(() => Promise.resolve({ shouldRedirect: false, redirectUrl: null })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Authenticate Authenticator MFA Verification Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the authenticator verification page', () => {
    render(<Page />);
    
    expect(screen.getByText('Enter the code')).toBeInTheDocument();
    expect(screen.getByText(/Please enter the code that you see in your authenticator app/)).toBeInTheDocument();
  });

  it('renders 6 digit input fields', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    expect(inputFields).toHaveLength(6);
  });

  it('handles digit input correctly', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    expect(inputFields[0]).toHaveValue('1');
  });

  it('only accepts numeric input', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: 'a' } });
    expect(inputFields[0]).toHaveValue('');
  });

  it('moves to next input when digit is entered', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[0], { target: { value: '1' } });
    // The focus should move to the next input
    expect(inputFields[1]).toHaveFocus();
  });

  it('handles backspace navigation', () => {
    render(<Page />);
    
    const inputFields = screen.getAllByRole('textbox');
    fireEvent.change(inputFields[1], { target: { value: '2' } });
    // Clear the input first, then test backspace
    fireEvent.change(inputFields[1], { target: { value: '' } });
    fireEvent.keyDown(inputFields[1], { key: 'Backspace' });
    // Should move focus to previous input
    expect(inputFields[0]).toHaveFocus();
  });

  it('validates complete code before submission', () => {
    render(<Page />);
    
    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);
    
    expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
  });

  it('navigates to dashboard on successful verification', async () => {
    // Clear any previous mocks to avoid interference
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, result: 'success' }),
    });

    render(<Page />);

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });
    
    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles token response with redirect', async () => {
    // Clear any previous mocks to avoid interference
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    const { handleTokenResponse } = await import('../../../../../utils/tokenManager');
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
    
    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
    });
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
    
    const verifyButton = screen.getByText('Complete');
    fireEvent.click(verifyButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code.')).toBeInTheDocument();
    });
    
    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach(field => {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('renders without errors', () => {
    expect(() => render(<Page />)).not.toThrow();
  });
});
