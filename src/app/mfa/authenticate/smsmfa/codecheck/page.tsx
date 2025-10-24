"use client";

import styles from './page.module.css';

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  useRef,
  type JSX,
  Suspense,
  useState,
  useEffect,
  useCallback,
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
import { formatTime } from "../../../../../utils/helper";
import { useAuthMfaMutation, useMfaVerifyMutation } from "../../../../../store/authApi";
import { CODE_LENGTH, STORAGE_KEYS, TIMER_CONFIG } from "../../../../../utils/Constants";
import { useTimer, useResendTimer, useLocalStorageState, useTempTokenRoute } from "../../../../../hooks/auth/index";

const SMSMfaPageContent: React.FC = (): JSX.Element => {
  // Protect route - requires needs_mfa_auth state
  const isAuthorized = useTempTokenRoute("needs_mfa_auth");
  const [authMfa, { isLoading: isAuthMfaLoading }] = useAuthMfaMutation();
  const [mfaVerify, { isLoading: isMfaVerifyLoading }] = useMfaVerifyMutation();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone") || "+32 873642374";
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [showTooManyTries, setShowTooManyTries] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasRequestedOnLoadRef = useRef(false);
  const router = useRouter();

  // Custom hooks for timer management
  const mainTimer = useTimer(
    TIMER_CONFIG.SMS_MFA_EXPIRY_TIME,
    STORAGE_KEYS.SMS_MFA_TIMESTAMP
  );
  const resendTimer = useResendTimer(STORAGE_KEYS.SMS_MFA_RESEND_TIMER);
  const localStorageState = useLocalStorageState(
    STORAGE_KEYS.SMS_MFA_INITIAL_REQUEST,
    STORAGE_KEYS.SMS_MFA_PAGE_LOADS
  );

  const initiatePhoneMfa = useCallback(async (resend: boolean = false) => {
    if (resend) resendTimer.startResendTimer();
    try {
      hasRequestedOnLoadRef.current = true;
      const response = await authMfa({
        payload: JSON.stringify({
          phone: phoneNumber,
        }),
        mode: 'phone',
      }).unwrap();
      // Store the dynamic message from API response
      if (response.message) {
        setApiMessage(response.message);
      }

      setError(null); // Clear any previous errors
      mainTimer.saveTimestamp();
      mainTimer.startTimer(TIMER_CONFIG.SMS_MFA_EXPIRY_TIME);
      resendTimer.startResendTimer();
      localStorageState.markInitialRequestAsMade();
      localStorageState.clearPageLoadCount();
    } catch (initError) {
      console.error("Error initiating phone MFA:", initError);
      setError("Failed to send verification SMS. Please try again.");
      if (resend) resendTimer.stopResendTimer();
    }
  }, [phoneNumber, mainTimer, resendTimer, localStorageState, authMfa]);
  useEffect(() => {
    const remainingTime = mainTimer.getRemainingTime();
    const remainingResendTime = resendTimer.getRemainingResendTime();
    const pageLoadCount = localStorageState.getPageLoadCount();

    localStorageState.incrementPageLoadCount();

    if (remainingTime > 0) {
      mainTimer.startTimer(remainingTime);
    } else {
      if (pageLoadCount === 1) {
        localStorageState.clearInitialRequestFlag();
      }
    }

    if (remainingResendTime > 0) {
      resendTimer.setResendTimerValue(remainingResendTime);
    }

    if (
      !hasRequestedOnLoadRef.current &&
      phoneNumber &&
      !localStorageState.hasInitialRequestBeenMade()
    ) {
      initiatePhoneMfa(false);
    }
  }, []);

  useEffect(() => {
    if (mainTimer.timer === 0) {
      setError("Code expired. Please request a new one.");
      localStorageState.clearInitialRequestFlag();
      localStorageState.clearPageLoadCount();
    }
  }, [mainTimer.timer, localStorageState]);

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
    e.preventDefault();

    const otpCode = code.join("");
    if (otpCode.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    try {
      setError(null);

      const response = await mfaVerify({
        payload: JSON.stringify({
          code: otpCode,
          phone: phoneNumber,
        }),
        mode: 'phone'
      },
      ).unwrap();

      // Verification successful - redirect to dashboard
      if (response.success || response.verified || response.result === "success") {
        setError(null);
        setFailedAttempts(0);
        setShowTooManyTries(false);

        // Clear timers and storage
        mainTimer.clearTimestamp();
        resendTimer.stopResendTimer();
        localStorageState.clearInitialRequestFlag();
        localStorageState.clearPageLoadCount();

        // Redirect to MFA registration selection to continue setup
        router.push("/dashboard");
      } else {
        // Handle verification failure from API response
        throw new Error(response.message || response.detail || "Verification failed");
      }
    } catch (verifyError) {
      console.error("Phone MFA verification error:", verifyError);

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
            : "Verification failed"
        );
      }
    }
  };

  const handleResend = async () => {
    setCode(Array(CODE_LENGTH).fill(""));
    setFailedAttempts(0);
    setShowTooManyTries(false);
    await initiatePhoneMfa(true);
  };

  const handleCloseLoginError = () => {
    setError(null);
  };

  const handleContactSupport = () => {
    // TODO: Implement contact support functionality
    console.log("Contact support clicked");
  };

  console.log("API Message:", resendTimer.resendTimer);
  return (
    <Box
      className={styles.container}
      sx={{
        bgcolor: "background.paper",
      }}
    >
      {isAuthMfaLoading ? (
        <Box className={styles.skeletonContainer}>
          <Skeleton variant="text" width="85%" height={20} className={styles.skeletonText} />
          <Skeleton variant="text" width="70%" height={20} className={styles.skeletonText} />
        </Box>
      ) : (
        <>
          <Typography variant="h6" align="center" className={styles.title}>
            Please check your messages!
          </Typography>
          <Typography variant="body2" align="center" className={styles.messageText}>
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
        <Stack className={styles.formStack}>
          {error && (
            <Alert severity="error" className={styles.errorAlert} onClose={handleCloseLoginError}>
              {error}
            </Alert>
          )}

          {showTooManyTries && (
            <Alert
              severity="error"
              className={styles.tooManyTriesAlert}
              sx={{
                background: "var(--background-paper, #FFF)",
                color: "#333333",
                border: "1px solid #FFEDED",
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
              <Box className={styles.tooManyTriesContent}>
                <Typography
                  className={styles.tooManyTriesText}
                  sx={{
                    color: "#1C252E",
                  }}
                >
                  Too many failed tries
                </Typography>
              </Box>
              <Button
                onClick={handleContactSupport}
                className={styles.contactSupportButton}
                sx={{
                  backgroundColor: "rgba(255, 86, 48, 0.16)",
                  color: "#B02B37",
                  borderColor: "transparent",
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

          <Box
            className={styles.timerBox}
            sx={{
              bgcolor: "rgba(255, 152, 0, 0.16)",
              color: "#FF9800",
            }}
          >
            <Typography component="span" className={styles.timerLabel}>
              Code expires in
            </Typography>
            <Typography component="span" className={styles.timerValue}>
              {formatTime(mainTimer.timer)}
            </Typography>
          </Box>

          <Box className={styles.inputContainer}>
            {code.map((digit, idx) => (
              <TextField
                key={idx}
                variant="outlined"
                size="small"
                value={digit}
                inputRef={(el) => (inputsRef.current[idx] = el)}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
                disabled={isMfaVerifyLoading || isAuthMfaLoading}
                className={styles.inputField}
                sx={{
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
                  className: styles.inputProps,
                  style: {
                    color: "#1C252E",
                  },
                  "aria-label": `Digit ${idx + 1}`,
                }}
                error={!!error}
              />
            ))}
          </Box>

          <Stack className={styles.buttonStack}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isMfaVerifyLoading || isAuthMfaLoading || code?.includes("") || mainTimer.timer === 0}
              disableRipple
              className={styles.verifyButton}
            >
              {isMfaVerifyLoading ? "Verifying..." : "Verify"}
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={handleResend}
              disabled={resendTimer.resendTimer > 0 || isMfaVerifyLoading || isAuthMfaLoading}
              disableRipple
              startIcon={
                <StartIcon
                  sx={{ color: (resendTimer.resendTimer > 0 || isMfaVerifyLoading || isAuthMfaLoading) ? "action.disabled" : "inherit" }}
                />
              }
              className={styles.resendButton}
              sx={{
                color: "text.primary",
              }}
            >
              {isAuthMfaLoading
                ? "Sending..."
                : resendTimer.resendTimer > 0
                  ? `Resend in ${formatTime(resendTimer.resendTimer)}`
                  : "Resend code"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}

const SMSMfaPage: React.FC = (): JSX.Element => (
  <Suspense
    fallback={
      <Box
        className={styles.suspenseFallback}
        sx={{
          bgcolor: "background.paper",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    }
  >
    <SMSMfaPageContent />
  </Suspense>
)
export default SMSMfaPage