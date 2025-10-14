"use client";

import type { VerifyPropsInterface } from "../../../types/verify";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";

import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";

import { EyeIcon, EyeOffIcon } from "../../../assets/icons";
import Verify from "../../../components/auth/Verify/Verify";
import AuthLayout from "../../../components/layout/AuthLayout";
import AuthSALogoBranding from "../../../components/auth/AuthSALogoBranding";
import { PasswordStrengthBar } from "../../../components/auth/PasswordStrengthBar";
import { PasswordRequirements } from "../../../components/common/PasswordRequirements";
import { resetPasswordSchema, type ResetPasswordFormData } from "../../../types/resetPassword";
import { useResetPasswordMutation, useValidatePasswordLinkMutation } from "../../../store/authApi";

function ResetPasswordPageInner() {
  const [validatePasswordLink, { data: validateData, isLoading: validateLoading, isUninitialized }] = useValidatePasswordLinkMutation();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const jti = searchParams.get("jti");

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
    trigger,
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  const validateLink = useCallback(async () => {
    await validatePasswordLink(JSON.stringify({ token, jti }))
  }, [token, jti, validatePasswordLink]);


  useEffect(() => {
    if (watchedConfirmPassword !== "") {
      trigger("confirmPassword");
    }
  }, [watchedPassword, trigger, watchedConfirmPassword]);

  useEffect(() => {
    try {
      if (token && jti) {
        validateLink();
      }
    } catch (e: any) {
      setApiError(e?.detail?.message);
    }

  }, [jti, token, validateLink]);
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !jti) {
      setApiError("Invalid or missing reset token.");
      return;
    }

    try {
      await resetPassword({
        new_password: data.password,
        token,
        jti,
      }).unwrap();

      setApiError(null);
      router.push(`/?successMessage=passwordSuccess`);
    } catch (error: any) {
      console.error("error", error);
      if (error?.data?.detail?.errors && error?.data?.detail?.errors?.length > 0) {
        setApiError(error?.data?.detail?.errors[0]?.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  const handleGoToLogin = () => router.push(`/`);

  const handleRequestLink = () => router.push("/forgot-password");

  const VerifyProps: VerifyPropsInterface = {
    isExpired: isUninitialized ? !isUninitialized : !validateLoading,
    handleRequestNewLink: handleRequestLink,
    requestButtonText: "Request new Reset Link",
    handleNagivate: handleGoToLogin,
    verifyHeading: "Verifying Reset Link",
    verifySubHeading: "Please wait while we verify Reset Link...",
    verifyDescription: "Verifying your Reset Link...",
    expiredHeading: "Link Expired or Invalid",
    expiredSubHeading: validateData?.message || "The password reset link is invalid or has expired.",
    navigateButtonText: "Go to login page",
  };
  return (
    <AuthLayout>
      <AuthSALogoBranding />
      <section className="text-center mb-2 bg-white p-4 rounded-md max-w-[420px] w-[420px] shadow-sm select-none ">
        {(validateLoading || !validateData?.valid) && <Verify {...VerifyProps} />}
        {validateData?.valid && <> <h1 className="text-xl font-bold text-gray-900 mb-1.5">Set New Password</h1>
          <p className="text-sm text-gray-500 mb-4">Create a strong password for your account.</p>
          {!apiError ? (
            <PasswordRequirements password={watchedPassword || ""} />
          ) : (
            <Alert severity="error" sx={{ fontSize: "0.875rem", width: "100%" }}>
              {apiError}
            </Alert>
          )}
          <Paper
            component="section"
            sx={{
              p: "40px 0",
              gap: "40px",
              borderRadius: 2,
              backgroundColor: "background.paper",
              maxWidth: 400,
              mx: "auto",
            }}
          >
            <Stack
              component="form"
              spacing={3}
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: "100%" }}
            >
              <FormControl fullWidth error={!!apiError}>
                <TextField
                  {...register("password", {
                    onChange: (e) => {
                      const noSpaces = e.target.value.replace(/\s/g, "");
                      setValue("password", noSpaces);
                      if (apiError) setApiError(null);
                    },
                  })}
                  name="password"
                  label="New password"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  fullWidth
                  sx={{ mb: 1 }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword((show) => !show)}
                            edge="end"
                          >
                            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <PasswordStrengthBar password={watchedPassword || ""} />
                <TextField
                  {...register("confirmPassword", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\s/g, "");
                      if (apiError) setApiError(null);
                    },
                  })}
                  name="confirmPassword"
                  label="Confirm new password"
                  variant="outlined"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  fullWidth
                  placeholder="Re-enter the password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword((show) => !show)}
                            edge="end"
                          >
                            {!showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                loading={isLoading}
                type="submit"
                sx={{
                  fontWeight: "bold",
                  minHeight: 48,
                  px: "1rem",
                  py: "0.5rem",
                }}
                disabled={!isValid || isLoading}
              >
                Reset Password
              </Button>
            </Stack>
          </Paper></>}
      </section>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
