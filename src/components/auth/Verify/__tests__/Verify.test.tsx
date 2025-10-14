import type { VerifyPropsInterface } from '../../../../types/verify';

import React from 'react';

import Verify from '../Verify';
import { render, screen } from '../../../../test-utils';

describe('Verify Component', () => {
  const mockHandleRequestNewLink = jest.fn();
  const mockHandleNavigate = jest.fn();

  const defaultProps: VerifyPropsInterface = {
    isExpired: false,
    handleRequestNewLink: mockHandleRequestNewLink,
    handleNagivate: mockHandleNavigate,
    verifyHeading: 'Verify Your Email',
    verifySubHeading: 'We sent a verification link',
    verifyDescription: 'Please wait while we verify your email...',
    requestButtonText: 'Request New Link',
    expiredHeading: 'Link Expired',
    expiredSubHeading: 'Your verification link has expired',
    navigateButtonText: 'Back to Login',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Verification State (isExpired = false)', () => {
    it('should render verification heading', () => {
      render(<Verify {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1, name: 'Verify Your Email' });
      expect(heading).toBeInTheDocument();
    });

    it('should render verification subheading', () => {
      render(<Verify {...defaultProps} />);
      const subHeading = screen.getByText('We sent a verification link');
      expect(subHeading).toBeInTheDocument();
    });

    it('should render loading spinner', () => {
      render(<Verify {...defaultProps} />);
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });

    it('should render verification description', () => {
      render(<Verify {...defaultProps} />);
      const description = screen.getByText('Please wait while we verify your email...');
      expect(description).toBeInTheDocument();
    });

    it('should not render expired state content', () => {
      render(<Verify {...defaultProps} />);
      expect(screen.queryByText('Link Expired')).not.toBeInTheDocument();
      expect(screen.queryByText('Request New Link')).not.toBeInTheDocument();
      expect(screen.queryByText('Back to Login')).not.toBeInTheDocument();
    });

    it('should not render buttons', () => {
      render(<Verify {...defaultProps} />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Expired State (isExpired = true)', () => {
    const expiredProps = { ...defaultProps, isExpired: true };

    it('should render expired heading', () => {
      render(<Verify {...expiredProps} />);
      const heading = screen.getByRole('heading', { name: 'Link Expired' });
      expect(heading).toBeInTheDocument();
    });

    it('should render expired subheading', () => {
      render(<Verify {...expiredProps} />);
      const subHeading = screen.getByText('Your verification link has expired');
      expect(subHeading).toBeInTheDocument();
    });

    it('should not render loading spinner', () => {
      render(<Verify {...expiredProps} />);
      const spinner = screen.queryByRole('progressbar');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not render verification content', () => {
      render(<Verify {...expiredProps} />);
      expect(screen.queryByText('Verify Your Email')).not.toBeInTheDocument();
      expect(screen.queryByText('We sent a verification link')).not.toBeInTheDocument();
      expect(screen.queryByText('Please wait while we verify your email...')).not.toBeInTheDocument();
    });

    it('should render request new link button', () => {
      render(<Verify {...expiredProps} />);
      const button = screen.getByRole('button', { name: 'Request New Link' });
      expect(button).toBeInTheDocument();
    });

    it('should render navigate button', () => {
      render(<Verify {...expiredProps} />);
      const button = screen.getByRole('button', { name: 'Back to Login' });
      expect(button).toBeInTheDocument();
    });

    it('should call handleRequestNewLink when request button is clicked', () => {
      render(<Verify {...expiredProps} />);
      const button = screen.getByRole('button', { name: 'Request New Link' });
      button.click();
      expect(mockHandleRequestNewLink).toHaveBeenCalledTimes(1);
    });

    it('should call handleNavigate when navigate button is clicked', () => {
      render(<Verify {...expiredProps} />);
      const button = screen.getByRole('button', { name: 'Back to Login' });
      button.click();
      expect(mockHandleNavigate).toHaveBeenCalledTimes(1);
    });

    it('should render both buttons', () => {
      render(<Verify {...expiredProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Verify {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible progress indicator', () => {
      render(<Verify {...defaultProps} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have accessible buttons in expired state', () => {
      const expiredProps = { ...defaultProps, isExpired: true };
      render(<Verify {...expiredProps} />);
      const primaryButton = screen.getByRole('button', { name: 'Request New Link' });
      const secondaryButton = screen.getByRole('button', { name: 'Back to Login' });
      expect(primaryButton).toBeInTheDocument();
      expect(secondaryButton).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render Paper component as container', () => {
      const { container } = render(<Verify {...defaultProps} />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });

    it('should have correct elevation', () => {
      const { container } = render(<Verify {...defaultProps} />);
      const paper = container.querySelector('.MuiPaper-elevation1');
      expect(paper).toBeInTheDocument();
    });

    it('should apply custom CSS module class', () => {
      const { container } = render(<Verify {...defaultProps} />);
      const verifyContainer = container.querySelector('[class*="verifyContainer"]');
      expect(verifyContainer).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    const expiredProps = { ...defaultProps, isExpired: true };

    it('should render primary button with contained variant', () => {
      const { container } = render(<Verify {...expiredProps} />);
      const containedButton = container.querySelector('.MuiButton-contained');
      expect(containedButton).toBeInTheDocument();
      expect(containedButton).toHaveTextContent('Request New Link');
    });

    it('should render secondary button with text variant', () => {
      const { container } = render(<Verify {...expiredProps} />);
      const textButton = container.querySelector('.MuiButton-text');
      expect(textButton).toBeInTheDocument();
      expect(textButton).toHaveTextContent('Back to Login');
    });
  });

  describe('Dynamic Content', () => {
    it('should render custom verification heading', () => {
      const customProps = {
        ...defaultProps,
        verifyHeading: 'Custom Verification Title',
      };
      render(<Verify {...customProps} />);
      expect(screen.getByText('Custom Verification Title')).toBeInTheDocument();
    });

    it('should render custom expired heading', () => {
      const customProps = {
        ...defaultProps,
        isExpired: true,
        expiredHeading: 'Custom Expired Title',
      };
      render(<Verify {...customProps} />);
      expect(screen.getByText('Custom Expired Title')).toBeInTheDocument();
    });

    it('should render custom button text', () => {
      const customProps = {
        ...defaultProps,
        isExpired: true,
        requestButtonText: 'Resend Email',
        navigateButtonText: 'Go Home',
      };
      render(<Verify {...customProps} />);
      expect(screen.getByRole('button', { name: 'Resend Email' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    const expiredProps = { ...defaultProps, isExpired: true };

    it('should not call handlers on render', () => {
      render(<Verify {...expiredProps} />);
      expect(mockHandleRequestNewLink).not.toHaveBeenCalled();
      expect(mockHandleNavigate).not.toHaveBeenCalled();
    });

    it('should call handler only once per click', () => {
      render(<Verify {...expiredProps} />);
      const button = screen.getByRole('button', { name: 'Request New Link' });
      button.click();
      button.click();
      expect(mockHandleRequestNewLink).toHaveBeenCalledTimes(2);
    });

    it('should call correct handler for each button', () => {
      render(<Verify {...expiredProps} />);
      const primaryButton = screen.getByRole('button', { name: 'Request New Link' });
      const secondaryButton = screen.getByRole('button', { name: 'Back to Login' });

      primaryButton.click();
      expect(mockHandleRequestNewLink).toHaveBeenCalledTimes(1);
      expect(mockHandleNavigate).not.toHaveBeenCalled();

      secondaryButton.click();
      expect(mockHandleNavigate).toHaveBeenCalledTimes(1);
      expect(mockHandleRequestNewLink).toHaveBeenCalledTimes(1);
    });
  });

  describe('Typography Components', () => {
    it('should use correct typography variants', () => {
      const { container } = render(<Verify {...defaultProps} />);
      const h5Typography = container.querySelector('.MuiTypography-h5');
      const body2Typography = container.querySelectorAll('.MuiTypography-body2');

      expect(h5Typography).toBeInTheDocument();
      expect(body2Typography.length).toBeGreaterThan(0);
    });

    it('should render semantic HTML elements', () => {
      render(<Verify {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string props gracefully', () => {
      const emptyProps = {
        ...defaultProps,
        verifyHeading: '',
        verifySubHeading: '',
        verifyDescription: '',
      };
      render(<Verify {...emptyProps} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longTextProps = {
        ...defaultProps,
        verifyHeading: 'This is a very long heading that might wrap to multiple lines in the UI',
        verifySubHeading: 'This is a very long subheading with lots of descriptive text that provides detailed information',
      };
      render(<Verify {...longTextProps} />);
      expect(screen.getByText(longTextProps.verifyHeading)).toBeInTheDocument();
      expect(screen.getByText(longTextProps.verifySubHeading)).toBeInTheDocument();
    });

    it('should toggle between states correctly', () => {
      const { rerender } = render(<Verify {...defaultProps} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(<Verify {...defaultProps} isExpired />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request New Link' })).toBeInTheDocument();
    });
  });
});
