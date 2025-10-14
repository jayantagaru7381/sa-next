import React from "react";

import LinearProgress from "@mui/material/LinearProgress";

// Add this helper function
const containsWeakPatterns = (password: string): boolean => {
  const passwordLower = password.toLowerCase();
  const weakPatterns = [
    /(.)\1{4,}/, // 5 or more repeated characters
    /(01234|12345|23456|34567|45678|56789)/, // Sequential digits
    /(abcde|bcdef|cdefg|defgh|efghi|fghij|ghijk|hijkl|ijklm|jklmn|klmno|lmnop|mnopq|nopqr|opqrs|pqrst|qrstu|rstuv|stuvw|tuvwx|uvwxy|vwxyz)/, // Sequential letters
    /(qwerty|asdfgh|zxcvbn|qwertyui|asdfghjk)/, // Keyboard patterns
  ];
  return weakPatterns.some((pattern) => pattern.test(passwordLower));
};

type LinearProgressColor =
  | "inherit"
  | "error"
  | "success"
  | "info"
  | "warning"
  | "primary"
  | "secondary";

const getStrength = (
  password: string
): { label: string; color: LinearProgressColor; score: number } => {
  if (!password) return { label: "", color: "primary", score: 0 };

  // Individual rule checks
  const isLongEnough = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const noSpaces = !/\s/.test(password);
  const noWeakPattern = !containsWeakPatterns(password);

  // Count how many rules are satisfied (excluding weak pattern)
  const score =
    Number(isLongEnough) +
    Number(hasUpper) +
    Number(hasDigit) +
    Number(hasSpecial) +
    Number(noSpaces);

  // If any rule fails or weak pattern is found, not strong
  if (!isLongEnough || !hasUpper || !hasDigit || !hasSpecial || !noSpaces || !noWeakPattern) {
    if (!noWeakPattern) {
      return { label: "Very Weak (common pattern)", color: "error", score: 1 };
    }
    if (score <= 2) return { label: "Very Weak", color: "error", score };
    if (score === 3) return { label: "Weak", color: "warning", score };
    return { label: "Weak", color: "warning", score };
  }

  // All rules passed
  return { label: "Strong", color: "success", score: 5 };
};

export const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { label, color, score } = getStrength(password);

  return (
    <div style={{ marginBottom: 24, textAlign: "left" }}>
      <div
        style={{
          height: 4,
          borderRadius: 5,
          background: "#eee",
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        <LinearProgress
          variant="determinate"
          color={color}
          value={(score / 5) * 100}
          sx={{
            "& .MuiLinearProgress-bar": {
              backgroundColor: color,
              opacity: 1,
            },
            // backgroundColor: `${color}40`,
          }}
        />
      </div>
      <span
        style={{
          color: "#637381",
          fontSize: "0.75rem",
          textAlign: "left",
        }}
      >
        {label}
      </span>
    </div>
  );
};
