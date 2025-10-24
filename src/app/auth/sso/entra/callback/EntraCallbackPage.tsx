"use client";

import type { JSX } from "react";
import type { LoginResponse } from "../../../../../types/auth";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Box, Alert, Button, Typography, CircularProgress } from "@mui/material";

import { useAuthEntraCallbackMutation } from "../../../../../store/authApi";

const EntraCallbackPage: React.FC = (): JSX.Element => {
  const [authEntraCallback] = useAuthEntraCallbackMutation();
  const sp = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const err = sp.get("error");
      const errDesc = sp.get("error_description");
      if (err) {
        setError(`${err}: ${decodeURIComponent(errDesc ?? "") || "Authentication failed"}`);
        return;
      }

      const code = sp.get("code");
      const state = sp.get("state") || undefined;
      const session_state = sp.get("session_state") || undefined;

      if (!code) {
        setError("Missing authorization code.");
        return;
      }

      try {
        const res = await authEntraCallback(
          JSON.stringify({ code, state, session_state })
        ).unwrap();

        const data: LoginResponse = res;

        // Handle different auth flow responses
        if (data.result === "mfa_setup_required") {
          router.push(`/mfa/register`);
          return;
        }
        if (data.result === "mfa_auth_required") {
          const enrolled_methods = data.details?.enrolled_methods;
          if (enrolled_methods?.length === 1) {
            if (enrolled_methods[0] === "totp") {
              router.push(`/mfa/authenticate/authenticatormfa/authverifycode`);
            }
            if (enrolled_methods[0] === "phone_otp") {
              router.push(`/mfa/authenticate/smsmfa/codecheck`);
            }
            if (enrolled_methods[0] === "email_otp") {
              router.push(`/mfa/authenticate/emailmfa`);
            }
          }
          return;
        }

        if (data.result === "email_verification_required") {
          router.push(`/mfa/authenticate/emailmfa/codecheck`);
          return;
        }

        // Success - redirect to dashboard
        router.push("/dashboard");
      } catch (e: any) {
        setError(e?.message || "Authentication failed.");
      }
    })();
  }, [sp, router]);

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 440, mx: "auto", display: "grid", gap: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => router.replace("/login")}>
          Back to sign in
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Finalizing sign-in…
      </Typography>
    </Box>
  );
};
export default EntraCallbackPage;
