import React from 'react';

import Page from '../page';
import { render, screen, mockPush, fireEvent } from '../../../../../test-utils';

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
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

// Mock the ProgressBar component
jest.mock('../../../../../components/common/ProgressBar', () => ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div data-testid="progress-bar">Step {currentStep} of {totalSteps}</div>
));

describe('Register Authenticator MFA Page - Download Step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the authenticator download page', () => {
    render(<Page />);
    
    expect(screen.getByText('Download authenticator app')).toBeInTheDocument();
    expect(screen.getByText(/Download and set up an app like Google Authenticator/)).toBeInTheDocument();
  });

  it('displays the progress bar with correct step', () => {
    render(<Page />);
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveTextContent('Step 1 of 3');
  });

  it('renders the return to methods link', () => {
    render(<Page />);
    
    const returnLink = screen.getByText('Return to methods');
    expect(returnLink).toBeInTheDocument();
    expect(returnLink.closest('a')).toHaveAttribute('href', '/mfa');
  });

  it('renders the next button', () => {
    render(<Page />);
    
    const nextButton = screen.getByText('Next (1/3)');
    expect(nextButton).toBeInTheDocument();
  });

  it('navigates to QR code page when next button is clicked', () => {
    render(<Page />);
    
    const nextButton = screen.getByText('Next (1/3)');
    fireEvent.click(nextButton);
    
    expect(mockPush).toHaveBeenCalledWith('/mfa/register/authenticatormfa/qrcode');
  });

  it('displays the left arrow icon in return link', () => {
    render(<Page />);
    
    expect(screen.getByTestId('left-arrow-icon')).toBeInTheDocument();
  });

  it('has correct button styling', () => {
    render(<Page />);
    
    const nextButton = screen.getByText('Next (1/3)');
    expect(nextButton).toHaveStyle({
      fontWeight: '700', // MUI bold = 700
      minWidth: '120px',
      height: '48px',
    });
  });

  it('renders all required text content', () => {
    render(<Page />);
    
    expect(screen.getByText('Download authenticator app')).toBeInTheDocument();
    expect(screen.getByText(/Download and set up an app like Google Authenticator, Microsoft Authenticator, or Authy/)).toBeInTheDocument();
    expect(screen.getByText('Return to methods')).toBeInTheDocument();
    expect(screen.getByText('Next (1/3)')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Page />);
    
    const nextButton = screen.getByText('Next (1/3)');
    expect(nextButton).toHaveAttribute('type', 'button');
  });

  it('renders the component without errors', () => {
    expect(() => render(<Page />)).not.toThrow();
  });
});
