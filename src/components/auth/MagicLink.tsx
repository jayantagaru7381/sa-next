"use client";

import type { JSX } from 'react';
import type { MagicLinkResponse } from '../../types/auth';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Alert, Button, TextField, Typography } from "@mui/material";

import { formatTime } from "../../utils/helper";
import { StartIcon, LeftArrowIcon } from '../../assets/icons';
import { TIMER_CONFIG, STORAGE_KEYS } from "../../utils/Constants";
import { useTimer, useResendTimer, useLocalStorageState } from '../../hooks/auth/index';

// API service
const magicLinkService = {
  requestMagicLink: async (email: string): Promise<MagicLinkResponse> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
    const response = await fetch(`${API_BASE}/auth/magic_link/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const responseData = await response.json().catch(() => ({} as any));
    const isRateLimited = response.ok && responseData?.detail === 'Rate limit exceeded';
    const ok = response.ok && !isRateLimited;
    const detail = responseData?.detail || responseData?.message;

    return { ok, detail };
  },
};

const MagicLink: React.FC = (): JSX.Element => {
  // State
  const [fpError, setFpError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const hasRequestedOnLoadRef = useRef(false);

  // Router and search params
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const [formData, setFormData] = useState(emailFromUrl);

  // Custom hooks
  const mainTimer = useTimer(TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME, STORAGE_KEYS.MAGIC_LINK_TIMESTAMP);
  const resendTimer = useResendTimer();
  const localStorageState = useLocalStorageState();
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(event.target.value);
  };

  const handleCloseLoginError = () => {
    setError(null);
  };

  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    resendTimer.startResendTimer();
    setIsLoading(true);

    try {
      const email = formData.trim();
      const { ok, detail } = await magicLinkService.requestMagicLink(email);

      if (!ok) {
        setError(detail || "Failed to send magic link. Please try again.");
        resendTimer.stopResendTimer();
        return;
      }
      setError(null);
      setFpError(null);
      mainTimer.saveTimestamp();
      mainTimer.resetTimer(TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME);
      localStorageState.markInitialRequestAsMade();
      localStorageState.clearPageLoadCount();
    } catch {
      setError("Failed to send magic link. Please try again.");
      resendTimer.stopResendTimer();
    } finally {
      setIsLoading(false);
    }
  };

  const makeInitialApiCall = useCallback(async () => {
    try {
      hasRequestedOnLoadRef.current = true;
      const { ok, detail } = await magicLinkService.requestMagicLink(emailFromUrl);

      if (!ok) {
        setError(detail || 'Failed to send magic link. Please try again.');
        return;
      }

      setError(null);
      setFpError(null);
      mainTimer.saveTimestamp();
      mainTimer.startTimer(TIMER_CONFIG.MAGIC_LINK_EXPIRY_TIME);
      resendTimer.startResendTimer();
      localStorageState.markInitialRequestAsMade();
      localStorageState.clearPageLoadCount();
    } catch {
      setError('Failed to send magic link. Please try again.');
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

    if (!hasRequestedOnLoadRef.current && emailFromUrl && !localStorageState.hasInitialRequestBeenMade()) {
      makeInitialApiCall();
    }
  }, [emailFromUrl, mainTimer, resendTimer, localStorageState, makeInitialApiCall]);

  useEffect(() => {
    if (mainTimer.timer === 0) {
      localStorageState.clearInitialRequestFlag();
      localStorageState.clearPageLoadCount();
    }
  }, [mainTimer.timer, localStorageState]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {fpError && (
        <Alert
          severity="error"
          sx={{ fontSize: '0.875rem' }}
          onClose={handleCloseLoginError}
        >
          {fpError}
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
        <Typography sx={{ fontWeight: 600 }}>
          Link expires in
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
          {formatTime(mainTimer.timer)}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={
          <StartIcon
            sx={{ color: resendTimer.resendTimer > 0 ? 'action.disabled' : 'inherit' }}
          />
        }
        disabled={resendTimer.resendTimer > 0 || isLoading}
        onClick={handleResendCode}
        sx={{
          minHeight: 48,
          height: 48,
          padding: "8px 16px",
        }}
      >
        {resendTimer.resendTimer > 0 ? `Resend in ${formatTime(resendTimer.resendTimer)}` : `Resend link`}
      </Button>

      <Typography
        variant="body2"
        sx={{
          fontSize: 14,
          fontWeight: 400,
          color: "#637381",
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        Didn&apos;t receive the email? Check your spam folder or try resending.
      </Typography>

      <Box textAlign="center">
        <Button
          onClick={() => router.push('/')}
          disabled={isLoading}
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
            }
          }}
        >
          <LeftArrowIcon sx={{ color: isLoading ? 'action.disabled' : 'inherit' }} />
          Return to login
        </Button>
      </Box>
    </Box>
  );
}

export default MagicLink;