"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Alert,
  Paper,
  Radio,
  Button,
  RadioGroup,
  Typography,
  FormControl,
} from "@mui/material";

import { SmsIcon, EmailIcon } from "../../../assets/icons";

export default function Page() {
  const [method, setMethod] = useState<string>("");
  const router = useRouter();

  const handleContinue = () => {
    if (method === "email") {
      router.push("/mfa/register/emailmfa");
    } else if (method === "sms") {
      router.push("/mfa/register/smsmfa");
    } else {
      router.push("/mfa/register/authenticatormfa");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, value: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMethod(value);
    }
  };

  const BLUE = "#0067FF";
  const GRAY_16 = "rgba(145, 158, 171, 0.16)";

  const getCardSx = (key: "sms" | "email" | "authenticator", selected: string) => {
    const isSelected = selected === key;
    return {
      borderRadius: "8px",
      border: "2px solid",
      borderColor: isSelected ? BLUE : "transparent",
      boxShadow: isSelected ? "none" : `inset 0 0 0 1px ${GRAY_16}`,
      transition: "border-color 200ms ease, box-shadow 200ms ease",
      cursor: "pointer",
    };
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <Paper elevation={3} sx={{ padding: "40px 24px", width: 420, borderRadius: 3, height: 550 }}>
        <FormControl component="fieldset" fullWidth>
          <legend className="sr-only">Select Multi-Factor Authentication Method</legend>
          <RadioGroup
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            sx={{ gap: 2 }}
            aria-label="Multi-factor authentication method selection"
          >
            <Box
              component="label"
              htmlFor="method-sms"
              role="radio"
              aria-checked={method === "sms"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, "sms")}
              sx={{
                ...getCardSx("sms", method),
                borderRadius: "8px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                cursor: "pointer",
                transition: "border 0.2s",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ height: 22 }}
              >
                <Box display="flex" alignItems="center">
                  <SmsIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Phone (SMS)
                  </Typography>
                </Box>
                <Radio value="sms" sx={{ ml: 1 }} inputProps={{ id: "method-sms" }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ height: 18 }}>
                Text message verification
              </Typography>
            </Box>

            <Box
              component="label"
              htmlFor="method-email"
              role="radio"
              aria-checked={method === "email"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, "email")}
              sx={{
                ...getCardSx("email", method),
                borderRadius: "8px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                cursor: "pointer",
                transition: "border 0.2s",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ height: 22 }}
              >
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Email OTP
                  </Typography>
                </Box>
                <Radio value="email" sx={{ ml: 1 }} inputProps={{ id: "method-email" }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ height: 18 }}>
                One-time passcode via email
              </Typography>
            </Box>

            <Box
              component="label"
              htmlFor="method-authenticator"
              role="radio"
              aria-checked={method === "authenticator"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, "authenticator")}
              sx={{
                ...getCardSx("authenticator", method),
                borderRadius: "8px",
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                cursor: "pointer",
                transition: "border 0.2s",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ height: 22 }}
              >
                <Box display="flex" alignItems="center">
                  <SmsIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Authenticator App
                  </Typography>
                </Box>
                <Radio
                  value="authenticator"
                  sx={{ ml: 1 }}
                  inputProps={{ id: "method-authenticator" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ height: 18 }}>
                Microsoft authenticator or another.
              </Typography>
            </Box>
          </RadioGroup>
        </FormControl>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 3, height: 48, fontWeight: 600, fontSize: "1rem", borderRadius: 1 }}
          onClick={handleContinue}
          disabled={!method}
          aria-describedby="mfa-info-alert"
        >
          Continue
        </Button>
        <Alert
          id="mfa-info-alert"
          severity="info"
          role="status"
          aria-live="polite"
          sx={{
            borderRadius: 1,
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 8px 8px 0",
            "& .MuiAlert-icon": {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: 0,
              marginRight: "8px",
              padding: "8px 12px 0 16px",
              width: 24,
              height: 24,
              flexShrink: 0,
            },
            "& .MuiAlert-message": {
              padding: "8px 8px 8px 0",
              flex: 1,
              minWidth: 0,
            },
          }}
        >
          <Typography
            variant="body2"
            fontWeight={400}
            fontSize={14}
            fontStyle="normal"
            sx={{
              margin: 0,
              lineHeight: "22px",
              wordWrap: "break-word",
              whiteSpace: "normal",
              overflowWrap: "break-word",
            }}
          >
            Account will be limited until MFA is complete
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}
