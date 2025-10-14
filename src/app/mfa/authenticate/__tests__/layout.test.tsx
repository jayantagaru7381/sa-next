import React from "react";

import Layout from "../layout";
import { render, screen } from "../../../../test-utils";

// Mock next/image to render a simple <img> for deterministic tests
jest.mock("next/image", () => (props: any) => {
  const { src, alt, width, height, className } = props;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
});

// Mock the components used in the layout
jest.mock("../../../../components/auth/Header", () => () => (
  <div data-testid="header">Header Component</div>
));

jest.mock(
  "../../../../components/layout/AuthLayout",
  () =>
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="auth-layout">
        <div data-testid="header">Header Component</div>
        {children}
      </div>
    )
);

describe("Authenticate Layout", () => {
  it("renders the layout with header and children", () => {
    const testChild = <div data-testid="test-child">Test Child</div>;

    render(<Layout>{testChild}</Layout>);

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("displays the correct title and description", () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );

    expect(screen.getByText("Multi-Factor Authentication")).toBeInTheDocument();
    expect(screen.getByText("Please enter the code:")).toBeInTheDocument();
  });

  it("renders the SA One Source logo with expected attributes", () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );

    const logo = screen.getByAltText("SA One Source") as HTMLImageElement;
    expect(logo).toBeInTheDocument();
    expect(logo.getAttribute("src")).toContain("fullprimary.svg");
    expect(logo).toHaveAttribute("alt", "SA One Source");
    expect(logo).toHaveAttribute("width", "170");
    expect(logo).toHaveAttribute("height", "60");
  });

  it("applies correct styling classes to the main container", () => {
    const testChild = <div data-testid="test-child">Test Child</div>;

    render(<Layout>{testChild}</Layout>);

    // Find the container with the Tailwind classes by looking for the div that contains the test child
    const childElem = screen.getByTestId("test-child");
    const container = childElem.parentElement; // The direct parent should have the classes
    expect(container).toBeTruthy();
    // assert the container includes these tailwind classes
    expect(container).toHaveClass("w-[420px]");
    expect(container).toHaveClass("py-4");
  });

  it("renders children in the correct container", () => {
    const testChild = <div data-testid="test-child-2">Test Child Content</div>;

    render(<Layout>{testChild}</Layout>);

    const childContainer = screen.getByTestId("test-child-2").closest("div");
    expect(childContainer).toBeInTheDocument();
  });

  it("has different title than register layout", () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );

    expect(screen.getByText("Multi-Factor Authentication")).toBeInTheDocument();
    expect(screen.queryByText("Set Up Multi-Factor Authentication")).not.toBeInTheDocument();
  });

  it("has different description than register layout", () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );

    expect(screen.getByText("Please enter the code:")).toBeInTheDocument();
    expect(screen.queryByText(/This is required for your first login/)).not.toBeInTheDocument();
  });
});
