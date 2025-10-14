"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

import { Box, Chip, Typography } from "@mui/material";

import { API_CONFIG } from "src/lib/api/config";

export const ClientOnlyApiUrl: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setApiUrl(API_CONFIG.baseURL);
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Chip size="small" label="Loading..." variant="outlined" color="info" />
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Icon
        icon="eva:link-2-fill"
        width={16}
        color="currentColor"
        style={{ opacity: 0.6 }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        fontFamily="monospace"
      >
        {apiUrl}
      </Typography>
    </Box>
  );
};
