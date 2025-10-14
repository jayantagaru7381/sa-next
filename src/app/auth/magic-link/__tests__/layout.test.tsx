import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import MagicLinkLayout from "../layout";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  // Filter out props that the real <img> doesn't accept (like boolean `priority`) to avoid
  // React DOM warnings in tests. Keep the rest of the props so tests can assert src/alt/width/height.
  default: jest.fn((props: any) => {
    const { priority, ...rest } = props || {};
    // Reference priority to avoid unused variable lint error in test environment
    void priority;
    return React.createElement("img", rest);
  }),
}));

// Mock Header component
jest.mock("../../../../components/auth/Header", () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header Component</div>,
}));

// Mock AuthLayout component
jest.mock("../../../../components/layout/AuthLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">
      <div data-testid="header">Header Component</div>
      {children}
    </div>
  ),
}));

describe("MagicLinkLayout", () => {
  it("renders children correctly", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders AuthLayout wrapper", () => {
    const testContent = <div>Test Content</div>;

    render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
  });

  it("renders Header component", () => {
    const testContent = <div>Test Content</div>;

    render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders logo image with correct attributes", () => {
    const testContent = <div>Test Content</div>;

    render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    const logoImage = screen.getByAltText("SA One Source");
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute("src", "/fullprimary.svg");
    expect(logoImage).toHaveAttribute("width", "170");
    expect(logoImage).toHaveAttribute("height", "60");
  });

  it("applies correct styling classes", () => {
    const testContent = <div>Test Content</div>;

    const { container } = render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    const mainDiv = container.querySelector(".max-w-md.w-full.py-3");
    expect(mainDiv).toBeInTheDocument();

    const section = container.querySelector("section.text-center.mb-5");
    expect(section).toBeInTheDocument();

    const logoContainer = container.querySelector(".mb-3.flex.justify-center");
    expect(logoContainer).toBeInTheDocument();
  });

  it("maintains proper structure hierarchy", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    const { container } = render(<MagicLinkLayout>{testContent}</MagicLinkLayout>);

    // Check that AuthLayout contains Header and main div
    const authLayout = screen.getByTestId("auth-layout");
    expect(authLayout).toContainElement(screen.getByTestId("header"));

    // Check that main div contains section and children
    const mainDiv = container.querySelector(".max-w-md.w-full.py-3");
    expect(mainDiv).toContainElement(screen.getByTestId("test-content"));
  });

  it("handles multiple children correctly", () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(<MagicLinkLayout>{multipleChildren}</MagicLinkLayout>);

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByTestId("child-3")).toBeInTheDocument();
  });

  it("renders without crashing when children is null", () => {
    render(<MagicLinkLayout>{null}</MagicLinkLayout>);

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders without crashing when children is undefined", () => {
    render(<MagicLinkLayout>{undefined}</MagicLinkLayout>);

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });
});
