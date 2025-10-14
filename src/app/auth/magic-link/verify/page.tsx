"use client";

import type { JSX} from "react";
import type { VerifyPropsInterface } from "../../../../types/verify";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Box, Typography, CircularProgress } from "@mui/material";

import Verify from "../../../../components/auth/Verify/Verify";
import { handleTokenResponse } from "../../../../utils/tokenManager";
import { useMagicLinkExchangeMutation } from "../../../../store/authApi";

const MagicLinkVerifyPage: React.FC = (): JSX.Element => {
  const [magickLinkExchange] = useMagicLinkExchangeMutation();
  const [isMagicLinkExpired, setIsMagicLinkExpired] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") || "");


  const handleRequestNewLink = () => {
    // Navigate back to the magic link page to request a new link
    const url = email ? `/auth/magic-link?email=${encodeURIComponent(email)}` : '/auth/magic-link';
    router.push(url);
  };

  const handleGoToLogin = () => {
    // Navigate to the login page
    router.push('/');
  };
  const verifyMagicLink = async () => {
    try {
      // Extract token and jti from URL parameters
      const token = searchParams?.get("token");
      const jti = searchParams?.get("jti");

      if (!token || !jti) {
        setIsMagicLinkExpired(true);
        return;
      }
      const response = await magickLinkExchange({
        token,
        jti,
      }).unwrap();

      if (!response) {
        throw new Error("Empty response from server. Please try again.");
      }
      setIsMagicLinkExpired(false);
      const { shouldRedirect, redirectUrl } = await handleTokenResponse(
        response,
      );

      if (response.result === "mfa_setup_required") {
        router.push(`/mfa/register`);
        return;
      }
      if (response.result === "mfa_auth_required") {
        const enrolled_methods = response.details?.enrolled_methods;
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

      if (response.result === "email_verification_required") {
        router.push(`/mfa/authenticate/emailmfa/codecheck`);
        return;
      }

      if (shouldRedirect) {
        router.push(redirectUrl!);
      }
    } catch (err: any) {
      console.error("Magic link verification error:", err);
      setIsMagicLinkExpired(true);
    }
  };

  useEffect(() => {
    verifyMagicLink();
  }, [searchParams, router]);
  const VerifyProps: VerifyPropsInterface = {
    isExpired: isMagicLinkExpired,
    handleRequestNewLink,
    handleNagivate: handleGoToLogin,
    verifyHeading: "Verifying Magic Link",
    verifySubHeading: "Please wait while we verify your magic link...",
    verifyDescription: "Verifying your magic link...",
    requestButtonText: "Request a new one-time link",
    expiredHeading: "Link Expired or Invalid",
    expiredSubHeading: "The magic link you clicked has expired or no longer valid. For your security, magic links are single-use and time-sensitive.",
    navigateButtonText: "Go to login page",
  }
  return <Verify {...VerifyProps} />;
};

export default function Page() {
  return (
    <Suspense fallback={
      <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    }>
      <MagicLinkVerifyPage />
    </Suspense>
  );
}
