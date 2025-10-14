import React from 'react';

import Header from '../Header';
import { render, screen } from '../../../test-utils';

describe('Header', () => {
  it('should render the Source Advisors logo', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    const logo = screen.getByAltText('Source Advisors logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/singleprimary.svg');
    expect(logo).toHaveAttribute('width', '40');
    expect(logo).toHaveAttribute('height', '24');
  });

  it('should render the contact support section', () => {
    render(<Header />);
    const contactSupportText = screen.getByText('Contact support');
    expect(contactSupportText).toBeInTheDocument();
    const contactSupportIcon = screen.getByAltText('Contact support');
    expect(contactSupportIcon).toBeInTheDocument();
    expect(contactSupportIcon).toHaveAttribute('src', '/contactsupport.svg');
    expect(contactSupportIcon).toHaveAttribute('width', '16');
    expect(contactSupportIcon).toHaveAttribute('height', '16');
    // Ensure icon and text are siblings in the same div
    expect(contactSupportIcon.parentElement).toBe(contactSupportText.parentElement);
  });

  it('should have proper structure', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    // The logo is inside a link in the first child div
    const logo = screen.getByAltText('Source Advisors logo');
    expect(logo.closest('a')).toBeInTheDocument();
    // The contact support section is a div containing icon and text
    const contactSupportText = screen.getByText('Contact support');
    const contactSupportIcon = screen.getByAltText('Contact support');
    expect(contactSupportText.parentElement).toBe(contactSupportIcon.parentElement);
  });

  it('should be accessible', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    const logo = screen.getByAltText('Source Advisors logo');
    expect(logo).toBeInTheDocument();
    const contactSupportIcon = screen.getByAltText('Contact support');
    expect(contactSupportIcon).toBeInTheDocument();
  });
});