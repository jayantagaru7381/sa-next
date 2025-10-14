import type { ReactElement } from "react";
import type { RenderOptions } from "@testing-library/react";

import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { store } from "src/store/store";

// Setup default router mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();
const mockPrefetch = jest.fn();

// Simple theme for testing with CSS variables support
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      dark: "#115293",
      light: "#42a5f5",
      contrastText: "#fff",
    },
    secondary: {
      main: "#dc004e",
      dark: "#9a0036",
      light: "#e55370",
      contrastText: "#fff",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
    },
    background: {
      default: "#fff",
      paper: "#fff",
    },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </Provider>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Export router mocks for use in tests
export { mockPush, mockBack, mockReplace, mockForward, mockRefresh, mockPrefetch };

// Common test helpers
export const mockConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  });
};

// Mock form data for testing
export const mockLoginFormData = {
  email: "test@example.com",
  password: "validPassword123",
};

export const mockInvalidLoginFormData = {
  email: "invalid-email",
  password: "short",
};

// Custom matchers for better assertions
export const toHaveFormError = (element: HTMLElement, errorMessage: string) => {
  const helperText = element.querySelector(".MuiFormHelperText-root");
  return helperText && helperText.textContent?.includes(errorMessage);
};
