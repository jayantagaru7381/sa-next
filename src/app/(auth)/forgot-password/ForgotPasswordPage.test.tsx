import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen, fireEvent } from "@testing-library/react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import ForgotPasswordPage from "./page";
import { useForgotPasswordMutation } from "../../../store/authApi";

// Set environment variables before any imports
process.env.NEXT_PUBLIC_INTERNAL_DOMAINS = "sourceadvisors.com,sourceadvisors.co.uk";
process.env.NEXT_PUBLIC_ENV_LABEL = "dev";

jest.mock("../../../store/authApi", () => ({
  useForgotPasswordMutation: jest.fn(),
}));

// Mock the components that might have dependencies
jest.mock(
  "../../../components/layout/AuthLayout",
  () =>
    function MockAuthLayout({ children }: { children: React.ReactNode }) {
      return <div>{children}</div>;
    }
);

jest.mock(
  "../../../components/auth/AuthSALogoBranding",
  () =>
    function MockAuthSALogoBranding() {
      return <div>Auth Logo</div>;
    }
);

// Create a minimal test store
const createTestStore = () =>
  configureStore({
    reducer: {
      authApi: (state = {}) => state,
      AuthSlice: (state = { userLoginInfo: {}, token: {}, tokenObj: {}, resetPassword: {} }) =>
        state,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
    devTools: false,
  });

// Create theme for testing
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

// Test wrapper with store and theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createTestStore()}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </Provider>
);

// Custom render function for this test
const customRender = (ui: React.ReactElement) => render(ui, { wrapper: TestWrapper });

describe("ForgotPasswordPage", () => {
  let mockForgotPassword: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.NEXT_PUBLIC_INTERNAL_DOMAINS = "sourceadvisors.com,sourceadvisors.co.uk";
    process.env.NEXT_PUBLIC_ENV_LABEL = "dev";

    mockForgotPassword = jest.fn();
    (useForgotPasswordMutation as jest.Mock).mockReturnValue([
      mockForgotPassword,
      { isLoading: false, isSuccess: false },
    ]);
  });

  it("shows error for invalid email", async () => {
    customRender(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalidemail" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("shows success message on valid email and successful request", async () => {
    mockForgotPassword.mockReturnValue({ unwrap: () => Promise.resolve() });
    (useForgotPasswordMutation as jest.Mock).mockReturnValue([
      mockForgotPassword,
      { isLoading: false, isSuccess: true },
    ]);
    customRender(<ForgotPasswordPage />);

    // When isSuccess is true, the form is not rendered, so we check the visible success copy
    expect(screen.getByText(/please check your email!/i)).toBeInTheDocument();
    // The page renders a sentence containing "If {email} is associated with an account..."
    // The email may be an empty <b> element, so normalize the text and assert the visible phrase exists
    expect(
      screen.getByText((content) =>
        content.replace(/\s+/g, " ").toLowerCase().includes(
          "you will receive a password reset link shortly."
        )
      )
    ).toBeInTheDocument();
  });

  it("shows API error message on failed request", async () => {
    mockForgotPassword.mockReturnValue({
      unwrap: () => Promise.reject({ response: { data: { message: "API error" } } }),
    });
    customRender(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@customdomain.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByText(/API error/i)).toBeInTheDocument();
  });

  it("shows return to login button", () => {
    customRender(<ForgotPasswordPage />);

    // Try to find the button by text content first
    const returnButton = screen.getByText(/return to login/i);
    expect(returnButton).toBeInTheDocument();

    // Verify it's clickable (it's an anchor tag styled as a button)
    expect(returnButton.tagName.toLowerCase()).toBe("a");
    expect(returnButton.getAttribute("href")).toBe("/");
  });
});
