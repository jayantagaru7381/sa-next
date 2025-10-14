import "@testing-library/jest-dom";

import React from "react";

import MagicLinkPage from "../page";
import { render, screen } from "../../../../test-utils";

// Mock MagicLink component
jest.mock("../../../../components/auth/MagicLink", () => ({
  __esModule: true,
  default: () => <div data-testid="magic-link-component">Magic Link Component</div>,
}));

describe("MagicLinkPage", () => {
  it("renders correctly", () => {
    render(<MagicLinkPage />);

    expect(screen.getByTestId("magic-link-component")).toBeInTheDocument();
    expect(screen.getByText("Please check your email")).toBeInTheDocument();
  });

  it("renders the main heading", () => {
    render(<MagicLinkPage />);

    expect(screen.getByText("Please check your email")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<MagicLinkPage />);

    expect(
      screen.getByText("We've sent a secure one-time login link to your email address.")
    ).toBeInTheDocument();
  });

  it("applies correct styling to the main section", () => {
    const { container } = render(<MagicLinkPage />);

    const section = container.querySelector("section");
    expect(section).toHaveClass(
      "text-center",
      "bg-white",
      "rounded-md",
      "max-w-[420px]",
      "shadow-sm"
    );
    expect(section).toHaveStyle("padding: 40px 24px");
  });

  it("applies correct styling to the heading", () => {
    const { container } = render(<MagicLinkPage />);

    const heading = container.querySelector("h1");
    expect(heading).toHaveClass("text-xl", "font-bold", "text-gray-900", "mb-1.5");
  });

  it("applies correct styling to the description paragraph", () => {
    const { container } = render(<MagicLinkPage />);

    const paragraph = container.querySelector("p");
    expect(paragraph).toHaveClass("text-sm", "text-gray-500", "pb-5");
  });

  it("renders MagicLink component", () => {
    render(<MagicLinkPage />);

    const magicLinkComponent = screen.getByTestId("magic-link-component");
    expect(magicLinkComponent).toBeInTheDocument();
    expect(magicLinkComponent).toHaveTextContent("Magic Link Component");
  });

  it("maintains proper structure hierarchy", () => {
    const { container } = render(<MagicLinkPage />);

    // Check that section contains heading, paragraph, and MagicLink component
    const section = container.querySelector("section");
    expect(section).toContainElement(screen.getByText("Please check your email"));
    expect(section).toContainElement(
      screen.getByText("We've sent a secure one-time login link to your email address.")
    );
    expect(section).toContainElement(screen.getByTestId("magic-link-component"));
  });

  it("has proper semantic structure", () => {
    const { container } = render(<MagicLinkPage />);

    // Check for proper heading hierarchy
    const heading = container.querySelector("h1");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Please check your email");

    // Check for paragraph element
    const paragraph = container.querySelector("p");
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent(
      "We've sent a secure one-time login link to your email address."
    );
  });

  it("renders without crashing", () => {
    expect(() => render(<MagicLinkPage />)).not.toThrow();
  });

  it("has consistent styling with design system", () => {
    const { container } = render(<MagicLinkPage />);

    const section = container.querySelector("section");

    // Check for consistent spacing and sizing
    expect(section).toHaveClass("max-w-[420px]"); // Max width constraint
    expect(section).toHaveClass("shadow-sm"); // Subtle shadow
    expect(section).toHaveClass("rounded-md"); // Rounded corners
    expect(section).toHaveClass("bg-white"); // White background
    expect(section).toHaveClass("text-center"); // Centered text
  });
});
