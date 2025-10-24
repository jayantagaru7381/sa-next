"use client";

import type { JSX } from "react";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { LeftArrowIcon } from "src/assets/icons";

import ProgressBar from "src/components/common/ProgressBar";

import { useTempTokenRoute } from "../../../../hooks";

const AuthenticatorDownloadStep: React.FC = (): JSX.Element => {
  // Protect route - requires needs_mfa_setup state
  useTempTokenRoute("needs_mfa_setup");
  const router = useRouter();

  return (
    <Box sx={{
      maxWidth: 420,
      borderRadius: 2,
      bgcolor: "background.paper",
      boxShadow: 3,
    }}
    >
      <Box
        sx={{
          padding: "24px 24px 16px 24px",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" align="center" fontWeight={700} mb={1.5} height={30}>
          Download authenticator app
        </Typography>
        <Typography variant="body2" align="center">
          Download and set up an app like Google Authenticator, Microsoft Authenticator, or Authy.
        </Typography>
      </Box>
      <Box sx={{ px: 3, pb: 2 }}>
        <ProgressBar currentStep={1} totalSteps={3} />
      </Box>

      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ p: 2.5 }}>
        <Link href="/mfa" style={{
          textDecoration: "none",
          lineHeight: "22px",
          color: "#1C252E",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <LeftArrowIcon />
          Return to methods
        </Link>
        <Button
          variant="contained"
          color="primary"
          sx={{ fontWeight: "bold", minWidth: 120, height: 48 }}
          onClick={() => router.push("/mfa/register/authenticatormfa/qrcode")}
        >
          Next (1/3)
        </Button>
      </Stack>

    </Box>
  );
}
export default AuthenticatorDownloadStep