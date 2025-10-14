"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect } from "react";
import PasswordStrengthBar from "react-password-strength-bar";

import { Button } from "@mui/material";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";

import { EyeIcon, EyeOffIcon } from "../../../assets/icons";
import AuthLayout from "../../../components/layout/AuthLayout";
import { useResetPasswordMutation } from "../../../store/authApi";
import { PASSWORD_STRENGTH_WORDS } from "../../../utils/passwordUtils";
import AuthSALogoBranding from "../../../components/auth/AuthSALogoBranding";
import { PasswordRequirements } from "../../../components/common/PasswordRequirements";
import { resetPasswordSchema, type ResetPasswordFormData } from "../../../types/resetPassword";

function ResetPasswordPageInner() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const jti = searchParams.get("jti");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    if (watchedConfirmPassword !== "") {
      trigger("confirmPassword");
    }
  }, [watchedPassword, trigger, watchedConfirmPassword]);
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
      console.log("error", error);
      if (error.data && error.data.message) {
        setApiError(error.data.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <AuthLayout>
      <AuthSALogoBranding />
      <section className="text-center mb-2 bg-white p-4 rounded-md max-w-[400px] w-[400px] shadow-sm select-none ">
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">Set New Password</h1>
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
                error={!!errors.password}
                autoComplete="new-password"
                required
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
                          {!showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <PasswordStrengthBar
                password={watchedPassword || ""}
                scoreWords={PASSWORD_STRENGTH_WORDS}
                style={{ marginBottom: "24px" }}
                scoreWordStyle={{
                  textAlign: "left",
                  fontSize: "0.75rem",
                }}
              />
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
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                autoComplete="new-password"
                required
                fullWidth
                placeholder="Re-enter your password"
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
        </Paper>
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
