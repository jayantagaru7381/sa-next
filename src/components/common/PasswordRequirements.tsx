import React from "react";

import Alert from "@mui/material/Alert";

import { getPasswordRequirements } from "../../utils/passwordUtils";

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  const requirements = getPasswordRequirements(password);

  return (
    <Alert severity="info" sx={{ fontSize: "0.875rem", textAlign: "left" }}>
      <p>Your password must include:</p>
      <ul>
        {requirements.map((req) => (
          <li
            key={req.label}
            style={{
              color: "#374151",
              fontWeight: req.met ? "bold" : "normal",
              fontSize: "14px",
            }}
          >
            {req.label}
          </li>
        ))}
      </ul>
    </Alert>
  );
};
