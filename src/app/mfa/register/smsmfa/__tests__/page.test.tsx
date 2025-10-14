import React from "react";

import Page from "../page";
import { render, screen, mockPush, fireEvent } from "../../../../../test-utils";

// Mock the router
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock the icons
jest.mock("../../../../../assets/icons", () => ({
  LeftArrowIcon: () => <div data-testid="left-arrow-icon">Left Arrow Icon</div>,
}));

describe("Register SMS MFA Page - Phone Entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the phone number entry page", () => {
    render(<Page />);

    expect(screen.getByText("Provide your phone number")).toBeInTheDocument();
    expect(screen.getByText(/Please enter your mobile phone number/)).toBeInTheDocument();
  });

  it("renders phone input field with correct attributes", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute("type", "tel");
    expect(phoneInput).toHaveAttribute("placeholder", "+1 234567890");
    expect(phoneInput).toHaveAttribute("inputMode", "tel");
    expect(phoneInput).toHaveAttribute("maxLength", "20");
  });

  it("handles phone number input correctly", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });

    expect(phoneInput).toHaveValue("+1234567890");
  });

  it("sanitizes non-numeric characters except + and spaces", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+1abc234def567" } });

    expect(phoneInput).toHaveValue("+1234567");
  });

  it("adds + prefix if not present", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    expect(phoneInput).toHaveValue("+1234567890");
  });

  it("shows error for empty phone number", () => {
    render(<Page />);

    const submitButton = screen.getByText("Receive code");
    fireEvent.click(submitButton);

    expect(screen.getByText("Please enter a phone number.")).toBeInTheDocument();
  });

  it("shows error for invalid phone number format", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+123" } });

    const submitButton = screen.getByText("Receive code");
    fireEvent.click(submitButton);

    // The phone number '+123' is too short (less than 8 characters), so it should show the "too short" error
    expect(
      screen.getByText("Phone number is too short. Please include country code.")
    ).toBeInTheDocument();
  });

  it("validates phone number with proper format", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });

    const submitButton = screen.getByText("Receive code");
    fireEvent.click(submitButton);

    expect(screen.queryByText(/Please enter a valid phone number/)).not.toBeInTheDocument();
  });

  it("navigates to code check page with valid phone number", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });

    const submitButton = screen.getByText("Receive code");
    fireEvent.click(submitButton);

    expect(mockPush).toHaveBeenCalledWith("/mfa/register/smsmfa/codecheck?phone=%2B1234567890");
  });

  it("clears error when valid input is entered", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    const submitButton = screen.getByText("Receive code");

    // First, trigger an error
    fireEvent.click(submitButton);
    expect(screen.getByText("Please enter a phone number.")).toBeInTheDocument();

    // Then enter valid input
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });
    expect(screen.queryByText("Please enter a phone number.")).not.toBeInTheDocument();
  });

  it("renders return to methods link", () => {
    render(<Page />);

    const returnLink = screen.getByText("Return to methods");
    expect(returnLink).toBeInTheDocument();
    expect(returnLink.closest("a")).toHaveAttribute("href", "/mfa/register");
  });

  it("applies correct styling to input field", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    const inputContainer = phoneInput.closest(".MuiOutlinedInput-root");

    expect(inputContainer).toHaveClass("MuiOutlinedInput-root");
  });

  it("shows error styling when validation fails", () => {
    render(<Page />);

    const phoneInput = screen.getByLabelText("Phone");
    const submitButton = screen.getByText("Receive code");

    fireEvent.click(submitButton);

    expect(phoneInput).toHaveAttribute("aria-invalid", "true");
  });
});
