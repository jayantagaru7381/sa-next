"use client";

import type { FormEvent, ChangeEvent } from "react";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LoadingButton } from "@mui/lab";
import { Alert, Paper, Stack, Button, TextField, FormControl } from "@mui/material";

import { LeftArrowIcon } from "../../../assets/icons";
import AuthLayout from "../../../components/layout/AuthLayout";
import { useForgotPasswordMutation } from "../../../store/authApi";
import AuthSALogoBranding from "../../../components/auth/AuthSALogoBranding";

const internalDomains =
  process.env.NEXT_PUBLIC_INTERNAL_DOMAINS?.split(",").map((d) => d.trim().toLowerCase()) ?? [];

const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL; // "DEV", "UAT", or "PROD"

function ForgotPasswordPageInner() {
  const searchParams = useSearchParams();
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();
  const [fpError, setFpError] = useState<string | null>(null);
  const userEmail = searchParams.get("email") || "";
  const [fpEmail, setFpEmail] = useState<string | null>(userEmail ?? "");

  const fpInputHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const sanitizedLowerEmail = event.target.value?.replace(/\s+/g, "")?.toLowerCase();
    setFpEmail(sanitizedLowerEmail);
    setFpError(null);
  };

  const fpFormSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFpError(null);
    if (!fpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)) {
      setFpError("Please enter a valid email address.");
      return;
    }

    const emailDomain = fpEmail.split("@")[1]?.toLowerCase() || "";
    const domainIsNotAllowed = internalDomains.includes(emailDomain);

    if (domainIsNotAllowed && (envLabel === "PROD" || envLabel === "UAT")) {
      setFpError(`Email from ${emailDomain} is not allowed. Please use SSO login.`);
      return;
    }

    try {
      await forgotPassword({ email: fpEmail }).unwrap();
    } catch (error: any) {
      if (error?.response && error?.response?.data && error?.response?.data?.message) {
        setFpError(error?.response?.data?.message);
      } else {
        setFpError("Something went wrong. Please try again.");
      }
    }
  };
  return (
    <AuthLayout>
      <AuthSALogoBranding />
      <section
        className="text-center mb-5 bg-white py-5  px-3 max-w-[420px] w-[420px] min-h-[300px] shadow-sm select-none "
        style={{
          borderRadius: "16px",
        }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">
          {isSuccess ? "Please check your email!" : "Forgot Your Password?"}
        </h1>

        <p className="text-sm text-gray-500">
          {isSuccess ? (
            <span>
              If <b>{fpEmail}</b> is associated with an account, you will receive a password reset
              link shortly.
            </span>
          ) : (
            "Enter the email associated with your account to receive a password reset link."
          )}
        </p>
        {isSuccess && (
          <p className="text-sm text-gray-500 mt-5">
            Didn&apos;t receive the email? Check your spam folder or try resending.
          </p>
        )}
        <Paper
          component="section"
          sx={{
            p: "24px 0 0 0",
            gap: "40px",
            borderRadius: 2,
            backgroundColor: "background.paper",
            width: "100%",
            mx: "auto",
          }}
        >
          <Stack component="form" spacing={3} onSubmit={fpFormSubmitHandler} sx={{ width: "100%" }}>
            {fpError && (
              <Alert severity="error" sx={{ fontSize: "0.875rem", width: "100%" }}>
                {fpError}
              </Alert>
            )}
            {!isSuccess && (
              <>
                <FormControl fullWidth error={!!fpError}>
                  <TextField
                    name="fp-email"
                    label="Email address"
                    variant="outlined"
                    value={fpEmail}
                    onChange={fpInputHandler}
                    error={!!fpError}
                    autoComplete="email"
                    fullWidth
                  />
                </FormControl>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  loading={isLoading}
                  loadingPosition="start"
                  type="submit"
                  sx={{
                    fontWeight: "bold",
                    minHeight: 48,
                    px: "1rem",
                    py: "0.5rem",
                  }}
                >
                  Send Reset Link
                </LoadingButton>
              </>
            )}
            <Button
              variant="text"
              startIcon={
                <LeftArrowIcon
                  width={16}
                  height={16}
                  sx={{ color: isLoading ? "text.disabled" : "inherit" }}
                />
              }
              fullWidth
              sx={{ textTransform: "none", fontWeight: 500 }}
              href="/login"
              disabled={isLoading}
            >
              &nbsp; Return to login
            </Button>
          </Stack>
        </Paper>
      </section>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}

// npm test -- --coverage
