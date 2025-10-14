"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { LeftArrowIcon } from "src/assets/icons";

export default function SMSPhoneEntry() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const sanitizedValue = value.replace(/[^0-9+\s-]/g, "");

    let formattedValue = sanitizedValue;
    if (sanitizedValue && !sanitizedValue.startsWith("+")) {
      formattedValue = "+" + sanitizedValue.replace(/[^0-9]/g, "");
    }

    if (formattedValue.length <= 20) {
      setPhone(formattedValue);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const cleanPhone = phone.replace(/\s+/g, "");

    if (!cleanPhone) {
      setError("Please enter a phone number.");
      return;
    }

    if (!phoneRegex.test(cleanPhone)) {
      setError(
        "Please enter a valid phone number starting with + followed by country code and number."
      );
      return;
    }

    if (cleanPhone.length < 8) {
      setError("Phone number is too short. Please include country code.");
      return;
    }

    setError(null);
    router.push(`/mfa/register/smsmfa/codecheck?phone=${encodeURIComponent(cleanPhone)}`);
  };

  return (
    <Box
      sx={{
        maxWidth: 420,
        padding: "40px 24px",
        borderRadius: 3,
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" align="center" fontWeight={700} fontSize={20} mb={1.5} height={30}>
        Provide your phone number
      </Typography>
      <Typography variant="body2" align="center" fontWeight={400} fontSize={14} mb={3}>
        Please enter your mobile phone number. You will receive a verification code to set up
        Multi-Factor Authentication.
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          placeholder="+1 234567890"
          label="Phone"
          variant="outlined"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          error={!!error}
          helperText={error}
          inputProps={{
            inputMode: "tel",
            pattern: "[0-9+\\s-]*",
            maxLength: 20,
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              alignSelf: "stretch",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid rgba(145, 158, 171, 0.2)",
                borderRadius: "8px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                border: "1px solid #1976d2 !important",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                border: "1px solid #1976d2 !important",
                borderWidth: "1px !important",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#637381",
              "&.Mui-focused": {
                color: "#1976d2 !important",
              },
            },
            "& .MuiOutlinedInput-input": {
              color: "#1C252E",
              "&::placeholder": {
                color: "#637381",
                opacity: 1,
              },
            },
            "& .MuiFormHelperText-root": {
              color: "#d32f2f",
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ fontWeight: "bold", minHeight: 48 }}
        >
          Receive code
        </Button>
      </form>
      <Box textAlign="center" mt={3}>
        <Link
          href="/mfa/register"
          style={{
            textDecoration: "none",
            lineHeight: "22px",
            color: "#1C252E",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "center",
          }}
        >
          <LeftArrowIcon />
          Return to methods
        </Link>
      </Box>
    </Box>
  );
}
