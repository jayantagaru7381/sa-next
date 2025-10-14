"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  useRef,
  useState,
  Suspense,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { StartIcon } from "../../../../../assets/icons";
import { createApiHeaders, handleTokenResponse } from "../../../../../utils/tokenManager";

function SMSMfaPageContent() {
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone");
  const CODE_LENGTH = 6;
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(600); // 10 minutes in seconds
  const [verifyCode, setVerifyCode] = useState<boolean>(true);
  const [showTooManyTries, setShowTooManyTries] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasRequestedOnLoadRef = useRef(false);
  const router = useRouter();

  // Initiate phone MFA registration on page load
  useEffect(() => {
    // Prevent multiple calls using useRef
    if (hasRequestedOnLoadRef.current || !phoneNumber) {
      return;
    }

    const initiatePhoneMfaRegistration = async () => {
      try {
        hasRequestedOnLoadRef.current = true; // Set immediately to prevent race conditions
        setIsLoading(true);
        const headers = createApiHeaders(true, true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/auth/mfa/register/phone/initiate`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              phone_number: phoneNumber,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to initiate phone MFA registration: ${response.status}`);
        }

        const data = await response.json();
        console.log("Phone MFA registration initiated:", data);

        // Store the dynamic message from API response
        if (data.message) {
          setApiMessage(data.message);
        }

        setTimer(600);
      } catch (initError) {
        console.error("Error initiating phone MFA registration:", initError);
        setError("Failed to send verification SMS. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initiatePhoneMfaRegistration();
  }, [phoneNumber]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [timer]);

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

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
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
    console.log("handleVerify");
    e.preventDefault();

    const otpCode = code.join("");
    if (otpCode.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setVerifyCode(false);

      const headers = createApiHeaders(true, true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/mfa/register/phone/verify`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            code: otpCode,
            phone_number: phoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle token response if verification is successful
      if (result.result === "success" && (result.session_token || result.temp_token)) {
        const { shouldRedirect, redirectUrl } = await handleTokenResponse(
          result
        );
        if (shouldRedirect) {
          router.push(redirectUrl!);
          return;
        }
      }
      // Check if verification was successful (for cases without tokens)
      if (result.success || result.verified || result.result === "success") {
        console.log("Email MFA registration verification successful:", result);

        // Clear any existing errors
        setError(null);
        setFailedAttempts(0);
        setShowTooManyTries(false);

        // Redirect to MFA registration selection to continue setup
        router.push("/dashboard");
      } else {
        // Handle verification failure from API response
        throw new Error(result.message || result.detail || "Verification failed");
      }
    } catch (verifyError) {
      console.error("Phone MFA registration verification error:", verifyError);

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

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
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError(null);

      const headers = createApiHeaders(true, true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/mfa/register/phone/initiate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            phone_number: phoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to resend SMS: ${response.status}`);
      }

      const data = await response.json();
      console.log("Phone MFA registration resent:", data);

      // Store the dynamic message from API response
      if (data.message) {
        setApiMessage(data.message);
      }

      setTimer(600);
    } catch (resendError) {
      console.error("Error resending phone MFA registration:", resendError);
      setError("Failed to resend verification SMS. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseLoginError = () => {
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleContactSupport = () => {
    // TODO: Implement contact support functionality
    console.log("Contact support clicked");
  };

  return (
    <Box
      sx={{
        maxWidth: 420,
        padding: "40px 24px",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      {isLoading ? (
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
      <form onSubmit={handleVerify}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" sx={{ fontSize: "0.875rem" }} onClose={handleCloseLoginError}>
              {error}
            </Alert>
          )}

          {showTooManyTries && (
            <Alert
              severity="error"
              sx={{
                position: "relative",
                zIndex: 0,
                pointerEvents: "auto",
                fontSize: "0.875rem",
                background: "var(--background-paper, #FFF)",
                color: "#333333",
                border: "1px solid #FFEDED",
                borderRadius: "var(--snackbar-radius, 12px)",
                padding:
                  "var(--snackbar-py, 4px) 0 var(--snackbar-py, 4px) var(--snackbar-pl, 4px)",
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

          {verifyCode && (
            <Box
              sx={{
                bgcolor: "rgba(255, 152, 0, 0.16)",
                color: "#FF9800",
                borderRadius: 2,
                height: 70,
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography component="span" sx={{ fontWeight: 600 }}>
                Code expires in
              </Typography>
              <Typography component="span" sx={{ fontWeight: 700, fontSize: 22 }}>
                {formatTime(timer)}
              </Typography>
            </Box>
          )}

          <Box
            display="flex"
            justifyContent="center"
            gap={2}
            sx={{ position: "relative", zIndex: 3 }}
          >
            {code.map((digit, idx) => (
              <TextField
                key={idx}
                variant="outlined"
                size="small"
                value={digit}
                inputRef={(el) => (inputsRef.current[idx] = el)}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
                disabled={isVerifying || isResending}
                sx={{
                  width: 48.664,
                  height: 48.664,
                  "& .MuiOutlinedInput-root": {
                    height: 48.664,
                    width: 48.664,
                    minWidth: 48.664,
                    maxWidth: 48.664,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "8px",
                    border: "1px solid rgba(145, 158, 171, 0.2)",
                    "&:hover": {
                      border: "1px solid rgba(145, 158, 171, 0.4)",
                    },
                    "&.Mui-focused": {
                      border: "1px solid #1976d2 !important",
                      boxShadow: "0 0 0 1px #1976d2 !important",
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
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    fontSize: 24,
                    fontWeight: 600,
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

          <Stack spacing={1}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isVerifying || isResending}
              disableRipple
              sx={{ fontWeight: "bold", height: 48 }}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={handleResend}
              disabled={isVerifying || isResending}
              disableRipple
              startIcon={<StartIcon />}
              sx={{
                minHeight: 44,
                height: 48,
                color: "text.primary",
                fontWeight: 700,
                fontSize: 15,
                mt: 1,
              }}
            >
              {isResending ? "Sending..." : "Resend code"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}

export default function SMSMfaPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            maxWidth: 420,
            padding: "40px 24px",
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      }
    >
      <SMSMfaPageContent />
    </Suspense>
  );
}
