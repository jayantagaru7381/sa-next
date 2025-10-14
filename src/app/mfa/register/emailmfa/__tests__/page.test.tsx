import React from 'react';

import EmailMfaPage from '../page';
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
}));

// Mock the icons
jest.mock('../../../../../assets/icons', () => ({
  StartIcon: () => <div data-testid="start-icon">Start Icon</div>,
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

// Mock token manager
jest.mock('../../../../../utils/tokenManager', () => ({
  handleTokenResponse: jest.fn().mockResolvedValue({ shouldRedirect: true, redirectUrl: '/dashboard' }),
}));

// Mock the correct hooks
const mockAuthMfaRegister = jest.fn();
const mockMfaVerifyRegister = jest.fn();
let mockIsAuthMfaRegisterLoading = false;

jest.mock('../../../../../store/authApi', () => {
  const originalModule = jest.requireActual('../../../../../store/authApi');
  return {
    ...originalModule,
    useAuthMfaRegisterMutation: () => [mockAuthMfaRegister, { isLoading: mockIsAuthMfaRegisterLoading }],
    useMfaVerifyRegisterMutation: () => [mockMfaVerifyRegister, { isLoading: false }],
  };
});

describe('Authenticate Email MFA Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthMfaRegister.mockClear();
    mockMfaVerifyRegister.mockClear();
    mockIsAuthMfaRegisterLoading = false;
  });

  // ... other tests ...

  it('shows "Sending..." during resend', async () => {
    mockAuthMfaRegister
      .mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue({ message: "Verification email sent successfully" }) })
      .mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue({ message: "Verification email resent successfully" }) });

    // Set loading state to true initially
    mockIsAuthMfaRegisterLoading = true;

    render(<EmailMfaPage />);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('submits verification code successfully', async () => {
    mockAuthMfaRegister.mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue({ message: "Verification email sent successfully" }) });
    mockMfaVerifyRegister.mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue({ result: "success" }) });

    render(<EmailMfaPage />);
    await waitFor(() => expect(screen.getByText('Please check your messages!')).toBeInTheDocument());

    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: (index + 1).toString() } });
    });

    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockMfaVerifyRegister).toHaveBeenCalledWith({
        mode: 'email',
        payload: JSON.stringify({ code: '123456' }),
      });
    });
  });
});