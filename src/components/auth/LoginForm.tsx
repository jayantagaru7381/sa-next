"use client";

import type { LoginFormData, LoginFormErrors } from "./validateLoginForm";
import type { LoginRequest, LoginResponse, LoginFormProps } from "../../types/auth";

import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { visuallyHidden } from "@mui/utils";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Box,
  Alert,
  Paper,
  Stack,
  Button,
  Divider,
  TextField,
  IconButton,
  Typography,
  FormControl,
  FormHelperText,
  InputAdornment,
} from "@mui/material";

import { validateLoginForm } from "./validateLoginForm";
import { handleTokenResponse } from "../../utils/tokenManager";
import { useLazyLoginQuery, useNativeLoginMutation } from "../../store/authApi";
import { EyeIcon, DangerIcon, EyeOffIcon, ShieldIcon } from "../../assets/icons";

export default function LoginForm({
  showPasswordField,
  setShowPasswordField,
  successMessage,
}: LoginFormProps) {
  const [login, { isLoading: ssoLoading }] = useLazyLoginQuery();
  const [nativeLogin, { isLoading: nativeLoginLoading, error: nativeLoginError }] =
    useNativeLoginMutation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginFormData) => ({ ...prev, [name]: value }));
  };

  const handlePasswordVisibilityToggle = () => {
    setShowPassword((prev) => !prev);
  };

  const handleOneTimeLinkClick = async () => {
    const email = formData.email.trim();

    // Validate email before proceeding
    const validationErrors = validateLoginForm({
      ...formData,
      showPasswordField,
    });

    // Set email validation errors if any
    if (validationErrors.email) {
      setErrors(validationErrors);
      return;
    }

    // Clear any existing errors
    setErrors({});

    // Then redirect to magic link page with email
    router.push(`/auth/magic-link?email=${encodeURIComponent(email)}`);
  };
  const handleMicrosoftLogin = async () => {
    try {
      const res = await login({}).unwrap();
      const { redirect_url } = await res;
      if (!redirect_url) throw new Error("Missing redirect_url from backend");
      window.location.assign(redirect_url);
    } catch (e) {
      // Log the error and return. Don't throw here so tests and callers aren't
      // interrupted by a navigation failure. A UX surface (toast/snackbar)
      // should be shown to the user instead (TODO).
      console.error(e);
      return;
    }
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // TODO: Implement forgot password functionality
    router.push("/forgot-password");
  };

  const handleCloseLoginError = () => {
    setErrors((prev) => ({ ...prev, login: undefined }));
  };

  // Exported for test coverage
  const handleEnrolledRoutes = (response: LoginResponse) => {
    const { result, details = {} } = response;
    const { enrolled_methods: enrolledMethods = [] } = details;

    switch (result) {
      case "mfa_setup_required": {
        router.push("/mfa/register");
        break;
      }

      case "mfa_auth_required": {
        const firstMethod = enrolledMethods[0];
        const routeMap: Record<string, string> = {
          totp: "/mfa/authenticate/authenticatormfa/authverifycode",
          phone_otp: "/mfa/authenticate/smsmfa/codecheck",
          email_otp: "/mfa/authenticate/emailmfa",
        };
        const route = routeMap[firstMethod];
        if (route) router.push(route);
        break;
      }

      case "email_verification_required": {
        router.push("/mfa/authenticate/emailmfa/codecheck");
        break;
      }

      default: {
        // Handle unexpected result values
        console.warn("Unexpected login result:", result);
        break;
      }
    }
  };
  const submitLoginForm = async () => {
    const validationErrors = validateLoginForm({
      ...formData,
      showPasswordField,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setErrors({});
    try {
      const payload: LoginRequest = {
        username: formData.email.trim(),
        password: formData.password.trim(),
      };
      const res: LoginResponse = await nativeLogin(JSON.stringify(payload)).unwrap();

      const { shouldRedirect, redirectUrl } = await handleTokenResponse(res);
      if (!res?.result) return;
      handleEnrolledRoutes(res);
      // Final fallback redirect
      if (shouldRedirect) {
        router.push(redirectUrl!);
      }
    } catch (error: any) {
      setErrors({
        login: error?.data?.detail
          ? error?.data?.detail
          : "Login failed. Please check your credentials and try again.",
      });
    }
  };

  const handlePrimaryButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!showPasswordField) {
      setShowPasswordField(true);
      setErrors({});
    } else {
      submitLoginForm();
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitLoginForm();
  };

  const renderForgotPasswordLink = () => {
    if (!showPasswordField) return null;

    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          className="self-stretch text-right justify-start text-text-primary text-sm font-normal leading-snug cursor-pointer hover:underline"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </div>
      </Box>
    );
  };

  const renderPasswordField = () => {
    if (!showPasswordField) return null;

    return (
      <FormControl fullWidth error={!!errors.password}>
        <TextField
          fullWidth
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          variant="outlined"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleInputChange}
          error={!!errors.password}
          aria-describedby="password-visibility-description"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={handlePasswordVisibilityToggle}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        {errors.password && (
          <FormHelperText>
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <DangerIcon width={14} height={15} />
              {errors.password}
            </Box>
          </FormHelperText>
        )}
        <Box sx={visuallyHidden} component="span" id="password-visibility-description">
          {showPassword
            ? "Password is visible. Click the eye icon to hide it."
            : "Password is hidden. Click the eye icon to show it."}
        </Box>
      </FormControl>
    );
  };

  const getPrimaryButtonText = () => (showPasswordField ? "Sign in" : "Sign in with password");

  return (
    <Paper
      component="section"
      sx={{
        width: 420,
        maxWidth: 420,
        padding: "var(--spacing-5, 40px) var(--spacing-3, 24px)",
        gap: "var(--spacing-5, 40px)",
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Stack component="form" spacing={3} onSubmit={handleFormSubmit}>
        {errors.login && (
          <Alert severity="error" sx={{ fontSize: "0.875rem" }} onClose={handleCloseLoginError}>
            {errors.login}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ fontSize: "0.875rem", textAlign: "left" }}>
            Your password has been successfully reset. can now use your new password to access your
            account.
          </Alert>
        )}

        <FormControl fullWidth error={!!errors.email}>
          <TextField
            fullWidth
            name="email"
            label="Email address"
            variant="outlined"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
          />
          {errors.email && (
            <FormHelperText>
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <DangerIcon width={14} height={15} />
                {errors.email}
              </Box>
            </FormHelperText>
          )}
        </FormControl>

        {showPasswordField && (
          <Stack spacing={1.5}>
            {renderForgotPasswordLink()}
            {renderPasswordField()}
          </Stack>
        )}

        <Stack spacing={1} sx={{ width: "100%" }}>
          {!showPasswordField && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ShieldIcon sx={{ width: 24, height: 24 }} />}
              onClick={handleOneTimeLinkClick}
              sx={{
                backgroundColor: "background.paper",
                borderColor: "divider",
                fontSize: "0.875rem",
                fontWeight: "bold",
                minHeight: 48,
                px: "1rem",
                py: "0.5rem",
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderColor: "divider",
                },
              }}
            >
              Receive a one‑time link
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={ssoLoading || nativeLoginLoading}
            startIcon={nativeLoginLoading ? <CircularProgress size={20} /> : undefined}
            onClick={handlePrimaryButtonClick}
            sx={{
              fontWeight: "bold",
              minHeight: 48,
              px: "1rem",
              py: "0.5rem",
            }}
          >
            {getPrimaryButtonText()}
          </Button>
        </Stack>
        <Divider
          sx={{
            "&::before, &::after": {
              borderTopStyle: "dashed",
              borderColor: "divider",
              borderTopWidth: 1,
            },
            ".MuiDivider-wrapper": {
              px: 0,
              width: 40,
              minWidth: 40,
              textAlign: "center",
              lineHeight: "18px",
            },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "text.disabled",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.08em",
              lineHeight: "18px",
            }}
          >
            OR
          </Typography>
        </Divider>

        <Button
          variant="soft"
          color="secondary"
          fullWidth
          size="large"
          startIcon={<Image src="/starticon.svg" alt="" width={24} height={24} />}
          onClick={handleMicrosoftLogin}
          disabled={ssoLoading || nativeLoginLoading}
        >
          {ssoLoading ? "Redirecting…" : "Continue With Microsoft"}
        </Button>
      </Stack>
    </Paper>
  );
}
