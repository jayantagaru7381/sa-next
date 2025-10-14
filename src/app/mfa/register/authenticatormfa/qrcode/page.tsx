"use client";

import type { JSX} from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Box, Stack, Button, Divider, Skeleton, Typography } from "@mui/material";

import ProgressBar from "src/components/common/ProgressBar";

import { useAuthMfaRegisterMutation } from "../../../../../store/authApi";

const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

const AuthenticatorSetupStep: React.FC = (): JSX.Element => {
  const [authMfaRegister, { isLoading }] = useAuthMfaRegisterMutation();
  const [uri, setUri] = useState("");
  const [secret, setSecret] = useState("");
  const router = useRouter();

  const formatSecret = (secretKey: string | undefined | null): string => {
    if (!secretKey || typeof secretKey !== "string") return "";
    return secretKey.replace(/(.{4})/g, "$1-").replace(/-$/, "");
  };
  const init = async () => {
    try {
      const response = await authMfaRegister({
        payload: JSON.stringify({}),
        mode: 'authenticator_app'
      }).unwrap()

      setUri(response?.qr_code_url || "");
      setSecret(response?.manual_key || "");

    } catch (err) {
      console.error("Failed to load QR code:", err);
      setUri("");
      setSecret("");
    }
  }
  useEffect(() => {
    init()
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 420,
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      <Box sx={{ padding: "24px 24px 16px 24px", textAlign: "center" }}>
        <Typography variant="h6" align="center" fontWeight={700} mb={1.5} height={30}>
          Set up authenticator app
        </Typography>
        <Typography variant="body2" align="center" height={66}>
          Scan this QR code with your authenticator app or enter the code manually.
        </Typography>
      </Box>
      <Box sx={{ mx: 3, mb: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
          <div
            style={{
              background:
                "linear-gradient(0deg, rgba(206,206,206,0.2) 0%, rgba(206,206,206,0.2) 100%), url('/qrbackground.png') lightgray 50% / cover no-repeat",
              padding: "16px",
              borderRadius: "16px",
              width: "200px",
              height: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isLoading ? (
              <Skeleton
                variant="rectangular"
                width={168}
                height={168}
                sx={{ borderRadius: 2 }}
                animation="wave"
              />
            ) : uri ? (
              <QRCode value={uri} size={168} />
            ) : /* Blank space when no QR code or API failed */
              null}
          </div>
        </Box>
        <Divider
          sx={{
            height: 22,
            minHeight: 22,
            maxHeight: 22,
            display: "flex",
            alignItems: "center",
            "&::before, &::after": {
              borderTopStyle: "dashed",
              borderColor: "divider",
              borderTopWidth: 1,
            },
            ".MuiDivider-wrapper": {
              px: 0,
              width: 40,
              minWidth: 40,
              textAlign: "center",
              lineHeight: "18px",
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0,
            },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "text.disabled",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.08em",
              lineHeight: "18px",
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0,
            }}
          >
            OR
          </Typography>
        </Divider>
        <Box
          sx={{
            bgcolor: "#f5f5f5",
            borderRadius: 1,
            padding: "16px 10px",
            textAlign: "center",
            alignSelf: "stretch",
            mt: 2,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLoading ? (
            <Skeleton variant="text" width="80%" height={24} animation="wave" />
          ) : secret ? (
            formatSecret(secret)
          ) : (
            /* Blank space when no secret or API failed */
            ""
          )}
        </Box>
      </Box>
      <Box sx={{ px: 3, pb: 2 }}>
        <ProgressBar currentStep={2} totalSteps={3} />
      </Box>

      <Stack direction="row" spacing={1} justifyContent="right" alignItems="center" sx={{ p: 2.5 }}>
        <Button
          variant="outlined"
          size="large"
          color="inherit"
          onClick={() => router.push("/mfa/register/authenticatormfa")}
          sx={{ minWidth: 100, height: 48 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/mfa/register/authenticatormfa/authverifycode")}
          sx={{ fontWeight: "bold", minWidth: 120, height: 48 }}
        >
          Next (2/3)
        </Button>
      </Stack>
    </Box>
  );
}
export default AuthenticatorSetupStep