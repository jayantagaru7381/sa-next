"use client";

import { useRouter } from "next/navigation";
import React, { useRef, type JSX, useState, type FormEvent, type KeyboardEvent } from "react";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { CODE_LENGTH } from "../../../../../utils/Constants";
import ProgressBar from "../../../../../components/common/ProgressBar";
import { handleTokenResponse } from "../../../../../utils/tokenManager";
import { useMfaVerifyRegisterMutation } from "../../../../../store/authApi";

const AuthenticatorMfaPageContent: React.FC = (): JSX.Element => {
  const [mfaVerifyRegister, { isLoading }] = useMfaVerifyRegisterMutation();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [showTooManyTries, setShowTooManyTries] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  const handleChange = (idx: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const verificationCode = code.join("");

    // Validate complete code before submission
    if (verificationCode.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    try {
      setError(null);
      const response = await mfaVerifyRegister({
        payload: JSON.stringify({
          code: verificationCode,
        }),
        mode: 'authenticator_app'
      },
      ).unwrap();

      if (response.result === "success" && (response.session_token || response.temp_token)) {
        const { shouldRedirect, redirectUrl } = await handleTokenResponse(
          response
        );
        if (shouldRedirect) {
          router.push(redirectUrl!);
          return;
        }
      }

      if (response.success || response.verified) {
        setError(null);
        setFailedAttempts(0);
        setShowTooManyTries(false);
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (verifyError) {
      console.error("Verification failed:", verifyError);

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      // Clear the OTP code after wrong verification
      setCode(Array(CODE_LENGTH).fill(""));

      if (newFailedAttempts >= 4) {
        setShowTooManyTries(true);
        setError(null);
      } else {
        setError("Verification failed. Please check the code provided and try again.");
      }
    }
  };

  const handleCloseLoginError = () => {
    setError(null);
  };

  const handleContactSupport = () => {
    // TODO: Implement contact support functionality
    console.log("Contact support clicked");
  };

  return (
    <Box
      sx={{
        maxWidth: 420,
        height: "auto",
        borderRadius: 2,
        background: "#FFF",
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      <Box sx={{ padding: "24px 24px 16px 24px", textAlign: "center" }}>
        <Typography variant="h6" align="center" fontWeight={700} mb={1.5} height={30}>
          Enter the code
        </Typography>
        <Typography variant="body2" align="center" height={44}>
          Please enter the code that you see in your authenticator app, in below box.
        </Typography>
      </Box>
      <Box sx={{ px: 3, pb: 2 }}>
        <ProgressBar currentStep={3} totalSteps={3} />
      </Box>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {error && (
            <Box sx={{ px: 3 }}>
              <Alert
                severity="error"
                sx={{ fontSize: "0.875rem", width: "100%" }}
                onClose={handleCloseLoginError}
              >
                {error}
              </Alert>
            </Box>
          )}
          {showTooManyTries && (
            <Box sx={{ px: 3 }}>
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
            </Box>
          )}
          <Box display="flex" justifyContent="center" gap={2} sx={{ pb: 3 }}>
            {code.map((digit, idx) => (
              <TextField
                key={idx}
                variant="outlined"
                size="small"
                value={digit}
                inputRef={(el) => (inputsRef.current[idx] = el)}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
                disabled={isLoading}
                InputProps={{
                  sx: {
                    height: 48.7,
                    p: 0,
                    minWidth: 48.7,
                    maxWidth: 48.7,
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
                    width: 48.7,
                    height: 48.7,
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
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="right"
          alignItems="center"
          sx={{ p: 2.5 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => router.push("/mfa/register/authenticatormfa/qrcode")}
            disabled={isLoading}
            sx={{
              minWidth: 69,
              minHeight: 48,
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(145, 158, 171, 0.32)",
              color: "#1C252E",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              "&:hover": {
                border: "1px solid rgba(145, 158, 171, 0.48)",
                backgroundColor: "rgba(145, 158, 171, 0.04)",
              },
            }}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            sx={{ fontWeight: "bold", minWidth: 140, height: 48 }}
          >
            {isLoading ? "Verifying..." : "Complete (3/3)"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AuthenticatorMfaPageContent