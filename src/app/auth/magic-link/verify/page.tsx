"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Box, Typography, CircularProgress } from "@mui/material";

import { handleTokenResponse } from "src/utils/tokenManager";

import MagicLinkExpiry from "src/components/auth/MagicLinkExpiry";

type LoginResponse = {
  detail: string | undefined;
  result:
  | "success"
  | "failure"
  | "mfa_setup_required"
  | "mfa_auth_required"
  | "email_verification_required";
  message?: string;
  temp_token?: string | null;
  session_token?: string | null;
  redirect_url?: string | null;
  user_id?: number;
  details?: {
    enrolled_methods?: string[];
  };
};

function MagicLinkVerifyContent() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") || "");

  useEffect(() => {
    const verifyMagicLink = async () => {
      try {
        // Extract token and jti from URL parameters
        const token = searchParams.get("token");
        const jti = searchParams.get("jti");

        if (!token || !jti) {
          setIsLoading(false);
          return;
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

        const response = await fetch(`${API_BASE}/auth/magic_link/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            jti,
          }),
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        // const data = await response.json();
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server. Please try again.");
        }

        const data: LoginResponse = JSON.parse(responseText);
        const { shouldRedirect, redirectUrl } = await handleTokenResponse(
          data,
        );

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

        if (shouldRedirect) {
          router.push(redirectUrl!);
        }
      } catch (err) {
        console.error("Magic link verification error:", err);
        setIsLoading(false);
      }
    };

    verifyMagicLink();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <section
        className="text-center bg-white rounded-md max-w-[420px] shadow-sm"
        style={{ padding: "40px 24px" }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">Verifying Magic Link</h1>
        <p className="text-sm text-gray-500 pb-5">Please wait while we verify your magic link...</p>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Verifying your magic link...
          </Typography>
        </Box>
      </section>
    );
  }

  return (
    <section
      className="text-center bg-white rounded-md max-w-[420px] shadow-sm"
      style={{ padding: "40px 24px" }}
    >
      <h1 className="text-xl font-bold text-gray-900 mb-1.5">Link Expired or Invalid</h1>
      <p className="text-sm text-gray-500 pb-5">
        The magic link you clicked has expired or no longer valid. For your security, magic links
        are single-use and time-sensitive.
      </p>
      <MagicLinkExpiry email={email} />
    </section>
  );
}

function Page() {
  return (
    <Suspense
      fallback={
        <section
          className="text-center bg-white rounded-md max-w-[420px] shadow-sm"
          style={{ padding: "40px 24px" }}
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1.5">Loading...</h1>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 2,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </section>
      }
    >
      <MagicLinkVerifyContent />
    </Suspense>
  );
}

export default Page;
