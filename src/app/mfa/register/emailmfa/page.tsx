"use client";

import type { JSX, FormEvent, KeyboardEvent } from "react";

import { useRouter } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useTempTokenRoute } from "../../../../hooks";
import { CODE_LENGTH } from "../../../../utils/Constants";
import { StartIcon, LeftArrowIcon } from "../../../../assets/icons";
import { useAuthMfaRegisterMutation, useMfaVerifyRegisterMutation } from "../../../../store/authApi";

const EmailMfaPage: React.FC = (): JSX.Element => {
  // Protect route - requires needs_mfa_setup state
  const isAuthorized = useTempTokenRoute("needs_mfa_setup");
  const [authMfaRegister, { isLoading: isAuthMfaRegisterLoading }] = useAuthMfaRegisterMutation();
  const [mfaVerifyRegister, { isLoading: isMfaVerifyRegisterLoading }] = useMfaVerifyRegisterMutation();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [showTooManyTries, setShowTooManyTries] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasRequestedOnLoadRef = useRef(false);
  const router = useRouter();
  useEffect(() => {
    // Only initiate MFA if authorized (has correct auth_state cookie)
    if (!isAuthorized) {
      return;
    }

    // Prevent multiple calls using useRef
    if (hasRequestedOnLoadRef.current) {
      return;
    }

    const initiateEmailMfaRegistration = async () => {
      try {
        hasRequestedOnLoadRef.current = true; // Set immediately to prevent race conditions
        const response = await authMfaRegister({
          payload: JSON.stringify({}),
          mode: 'email'
        }).unwrap();

        if (response.message) {
          setApiMessage(response.message);
        }
        setTimer(60);
      } catch (initError) {
        console.error("Error initiating email MFA registration:", initError);
        setError("Failed to send verification email. Please try again.");
      }
    };

    initiateEmailMfaRegistration();
  }, [isAuthorized, authMfaRegister]);

  // Start a single interval on mount to decrement the timer every second.
  // This avoids re-creating intervals when `timer` changes which can lead to
  // multiple active intervals or unclean handles in tests.
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // clear the interval when it reaches zero
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);
    setError(null);
    if (value && idx < CODE_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<any>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }

    // Handle paste event
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard
        .readText()
        .then((text) => {
          const pastedDigits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
          if (pastedDigits.length > 0) {
            const newCode = [...code];
            for (let i = 0; i < pastedDigits.length && idx + i < CODE_LENGTH; i++) {
              newCode[idx + i] = pastedDigits[i];
            }
            setCode(newCode);
            setError(null);

            // Focus the next empty field or the last field
            const nextEmptyIdx = Math.min(idx + pastedDigits.length, CODE_LENGTH - 1);
            inputsRef.current[nextEmptyIdx]?.focus();
          }
        })
        .catch(() => {
          // Fallback if clipboard API fails
        });
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const otpCode = code.join("");
    if (otpCode.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setError(null);

      const response = await mfaVerifyRegister({
        payload: JSON.stringify({
          code: otpCode,
        }),
        mode: 'email'
      },
      ).unwrap();

      // Verification successful - redirect to dashboard
      if (response.success || response.verified || response.result === "success") {
        setError(null);
        setFailedAttempts(0);
        setShowTooManyTries(false);

        router.push("/dashboard");
      } else {
        throw new Error(response.message || response.detail || "Verification failed");
      }
    } catch (verifyError) {
      console.error("Email MFA registration verification error:", verifyError);

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      // Clear the OTP code after wrong verification
      setCode(Array(CODE_LENGTH).fill(""));

      if (newFailedAttempts >= 4) {
        setShowTooManyTries(true);
        setError(null);
      } else {
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Verification failed. Please check the code provided and try again."
        );
      }
    }
  };

  const handleResend = async () => {
    try {
      setError(null);
      const response = await authMfaRegister({
        payload: JSON.stringify({}),
        mode: 'email'
      }).unwrap();

      // Store the dynamic message from API response
      if (response.message) {
        setApiMessage(response.message);
      }

      setTimer(60);
    } catch (resendError) {
      console.error("Error resending email MFA registration:", resendError);
      setError("Failed to resend verification email. Please try again.");
    }
  };

  const handleCloseLoginError = () => {
    setError(null);
  };

  const handleContactSupport = () => {
    // TODO: Implement contact support functionality
  };
  return (
    <Box
      sx={{
        maxWidth: 420,
        width: 420,
        padding: "40px 24px",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      {isAuthMfaRegisterLoading ? (
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="85%" height={20} sx={{ mx: "auto", mb: 1 }} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mx: "auto" }} />
        </Box>
      ) : (
        <>
          <Typography variant="h6" align="center" fontWeight={700} height={30} mb={1.5}>
            Please check your messages!
          </Typography>
          <Typography variant="body2" align="center" mb={3}>
            {(apiMessage ?? "").split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < (apiMessage ?? "").split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </Typography>
        </>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
        {error && (
          <Alert severity="error" sx={{ fontSize: "0.875rem" }} onClose={handleCloseLoginError}>
            {error}
          </Alert>
        )}

        {showTooManyTries && (
          <Alert
            severity="error"
            sx={{
              fontSize: "0.875rem",
              background: "var(--background-paper, #FFF)",
              color: "#333333",
              border: "1px solid #FFEDED",
              borderRadius: "var(--snackbar-radius, 12px)",
              padding: "var(--snackbar-py, 4px) 0 var(--snackbar-py, 4px) var(--snackbar-pl, 4px)",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--snackbar-spacing, 12px)",
              boxShadow:
                "var(--z8-x, 0) var(--z8-y, 8px) var(--z8-blur, 16px) var(--z8-spread, 0) var(--shadow-16, rgba(145, 158, 171, 0.16))",
              "& .MuiAlert-icon": {
                backgroundColor: "rgba(255, 86, 48, 0.08)",
                color: "#DC3545",
                marginRight: "12px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                flexShrink: 0,
              },
              "& .MuiAlert-message": {
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 0,
                gap: "12px",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Typography
                sx={{
                  color: "#1C252E",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: 600,
                  lineHeight: "22px",
                  letterSpacing: "0",
                  flex: "1 0 0",
                }}
              >
                Too many failed tries
              </Typography>
            </Box>
            <Button
              onClick={handleContactSupport}
              sx={{
                backgroundColor: "rgba(255, 86, 48, 0.16)",
                color: "#B02B37",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "none",
                minWidth: "121px",
                minHeight: "30px",
                height: "30px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginRight: "12px",
                "&:hover": {
                  backgroundColor: "rgba(255, 86, 48, 0.24)",
                  borderColor: "transparent",
                },
              }}
            >
              Contact support
            </Button>
          </Alert>
        )}

        <Box display="flex" justifyContent="center" gap={2}>
          {code.map((digit, idx) => (
            <TextField
              key={idx}
              variant="outlined"
              size="small"
              value={digit}
              inputRef={(el) => (inputsRef.current[idx] = el)}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isMfaVerifyRegisterLoading || isAuthMfaRegisterLoading}
              InputProps={{
                sx: {
                  height: 48.664,
                  p: 0,
                  minWidth: 48.664,
                  maxWidth: 48.664,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: "1 0 0",
                  aspectRatio: "1/1",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "1px solid rgba(145, 158, 171, 0.2)",
                    borderRadius: "8px",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    border: "1px solid rgba(145, 158, 171, 0.4)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    border: "1px solid #1976d2 !important",
                    borderWidth: "1px !important",
                  },
                },
              }}
              inputProps={{
                maxLength: 1,
                style: {
                  width: 48.664,
                  height: 48.664,
                  textAlign: "center",
                  fontSize: 24,
                  borderRadius: 8,
                  padding: 0,
                  border: "none",
                  outline: "none",
                  color: "#1C252E",
                },
                "aria-label": `Digit ${idx + 1}`,
              }}
              error={!!error}
            />
          ))}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleVerify}
          fullWidth
          disabled={isMfaVerifyRegisterLoading || isAuthMfaRegisterLoading || code?.includes("")}
          sx={{ fontWeight: "bold", height: 48, textTransform: "none" }}
        >
          {isMfaVerifyRegisterLoading ? "Verifying..." : "Verify"}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={handleResend}
          startIcon={<StartIcon sx={{ color: isAuthMfaRegisterLoading ? "action.disabled" : "inherit" }} />}
          disabled={timer > 0 || isMfaVerifyRegisterLoading || isAuthMfaRegisterLoading}
          sx={{
            minHeight: 48,
            height: 48,
            fontWeight: 700,
            fontSize: 15,
            gap: 1,
          }}
        >
          {isAuthMfaRegisterLoading ? "Sending..." : timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
        </Button>
      </Box>
      <Typography
        variant="caption"
        display="block"
        align="center"
        sx={{ mt: 3, fontSize: 14, fontWeight: 400, color: "#637381", height: 44 }}
      >
        Didn&apos;t receive the email? Check your spam folder or try resending.
      </Typography>

      <Box textAlign="center" sx={{ mt: 3 }}>
        <Button
          onClick={() => router.push("/mfa/register")}
          disabled={isAuthMfaRegisterLoading}
          sx={{
            textDecoration: "none",
            lineHeight: "22px",
            color: "#1C252E",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            textTransform: "none",
            minWidth: "auto",
            minHeight: "22px !important",
            height: "22px !important",
            padding: "0 !important",
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <LeftArrowIcon sx={{ color: isAuthMfaRegisterLoading ? "action.disabled" : "inherit" }} />
          Return to methods
        </Button>
      </Box>
    </Box>
  );
}
export default EmailMfaPage