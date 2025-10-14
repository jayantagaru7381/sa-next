import React from 'react';

import AuthLayout from '../AuthLayout';
import { render, screen } from '../../../test-utils';

describe('AuthLayout', () => {
  it('should render children correctly', () => {
    render(
      <AuthLayout>
        <div data-testid="test-child">Test Content</div>
      </AuthLayout>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('should render multiple children correctly', () => {
    render(
      <AuthLayout>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
        <div data-testid="child-3">Third Child</div>
      </AuthLayout>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should maintain accessibility with proper main landmark', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });
});