"use client";

import type { JSX } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useRef, useState, useEffect, useCallback } from "react";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { formatTime } from "../../utils/helper";
import { useMagickLinkMutation } from '../../store/authApi';
import { StartIcon, LeftArrowIcon } from "../../assets/icons";
import { STORAGE_KEYS, TIMER_CONFIG } from "../../utils/Constants";
import { useTimer, useResendTimer, useLocalStorageState } from "../../hooks/auth/index";


const MagicLink: React.FC = (): JSX.Element => {
  const [magicklink, { isLoading: isMagicklinkLoading }] = useMagickLinkMutation();
  const [fpError, setFpError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const hasRequestedOnLoadRef = useRef(false);
  const hasSetupSuccessTimerRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  const successFlag = searchParams.get("success") === "true";
  const [formData, setFormData] = useState(emailFromUrl);

  // Custom hooks
  const mainTimer = useTimer(
    TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME,
    STORAGE_KEYS.MAGIC_LINK_TIMESTAMP
  );
  const resendTimer = useResendTimer();
  const localStorageState = useLocalStorageState();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = event.target.value?.replace(/\s+/g, "")?.toLowerCase();
    setFormData(sanitized);
    // Clear errors when user types
    if (error) setError(null);
    if (fpError) setFpError(null);
  };

  const handleCloseLoginError = () => {
    setError(null);
    setFpError(null);
  };

  const makeInitialApiCall = useCallback(async (resend: boolean) => {
    if (resend) resendTimer.startResendTimer();
    try {
      const email = resend ? formData.trim() : emailFromUrl;
      hasRequestedOnLoadRef.current = true;
      await magicklink({ email }).unwrap();
      setError(null);
      setFpError(null);
      mainTimer.saveTimestamp();
      mainTimer.startTimer(TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME);
      resendTimer.startResendTimer();
      localStorageState.markInitialRequestAsMade();
      localStorageState.clearPageLoadCount();
    } catch (err: any) {
      setError(err?.data?.detail || "Failed to send magic link. Please try again.");
      if (resend) resendTimer.stopResendTimer();
    }
  }, [emailFromUrl, mainTimer, localStorageState]);

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
      emailFromUrl &&
      !localStorageState.hasInitialRequestBeenMade() &&
      !successFlag
    ) {
      makeInitialApiCall(false);
    } else if (successFlag && !hasSetupSuccessTimerRef.current) {
      // If success flag is present and we haven't set up the timer yet, set up the timer and state without making API call
      hasSetupSuccessTimerRef.current = true;
      mainTimer.saveTimestamp();
      mainTimer.startTimer(TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME);
      resendTimer.startResendTimer();
      localStorageState.markInitialRequestAsMade();
      localStorageState.clearPageLoadCount();
    }
  }, []);

  useEffect(() => {
    if (mainTimer.timer === 0) {
      localStorageState.clearInitialRequestFlag();
      localStorageState.clearPageLoadCount();
    }
  }, [mainTimer.timer, localStorageState]);

  // Optional: Restore resend timer from storage on mount (if you want to persist resend cooldown)
  useEffect(() => {
    const remainingResendTime = resendTimer.getRemainingResendTime();
    if (remainingResendTime > 0) {
      resendTimer.setResendTimerValue(remainingResendTime);
    }
  }, [resendTimer]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {(fpError || error) && (
        <Alert severity="error" sx={{ fontSize: "0.875rem" }} onClose={handleCloseLoginError}>
          {fpError || error}
        </Alert>
      )}

      <TextField
        fullWidth
        name="email"
        label="Email address"
        variant="outlined"
        value={formData}
        onChange={handleInputChange}
        error={!!error}
        disabled={isMagicklinkLoading}
      />
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
        <Typography sx={{ fontWeight: 600 }}>Link expires in</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
          {formatTime(mainTimer.timer)}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={
          <StartIcon sx={{ color: resendTimer.resendTimer > 0 ? "action.disabled" : "inherit" }} />
        }
        disabled={resendTimer.resendTimer > 0 || isMagicklinkLoading || !formData.trim()}
        onClick={() => makeInitialApiCall(true)}
        sx={{ minHeight: 48, height: 48, padding: "8px 16px" }}
      >
        {resendTimer.resendTimer > 0
          ? `Resend in ${formatTime(resendTimer.resendTimer)}`
          : `Resend link`}
      </Button>

      <Typography
        variant="body2"
        sx={{
          fontSize: 14,
          fontWeight: 400,
          color: "#637381",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Didn&apos;t receive the email? Check your spam folder or try resending.
      </Typography>

      <Box textAlign="center">
        <Button
          onClick={() => router.push("/login")}
          disabled={isMagicklinkLoading}
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
          <LeftArrowIcon sx={{ color: isMagicklinkLoading ? "action.disabled" : "inherit" }} />
          Return to login
        </Button>
      </Box>
    </Box>
  );
};

export default MagicLink;
