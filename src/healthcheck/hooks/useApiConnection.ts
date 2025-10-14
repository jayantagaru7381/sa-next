"use client";

import type { ConnectionDetails } from "../types";

import { useState, useCallback } from "react";

import { API_CONFIG } from "src/lib/api/config";

export const useApiConnection = (
  makeAPICall: (
    endpoint: string,
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    body?: any,
    customHeaders?: Record<string, string>,
  ) => Promise<any>,
) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const response = await makeAPICall("/health/live");
      setIsConnected(response.ok);

      setConnectionDetails({
        baseUrl: API_CONFIG.baseURL,
        environment: API_CONFIG.environment,
        timestamp: new Date().toISOString(),
        latency: 0,
      });
    } catch (error) {
      setIsConnected(false);
      setConnectionDetails({
        baseUrl: API_CONFIG.baseURL,
        environment: API_CONFIG.environment,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  }, [makeAPICall]);

  return {
    isConnected,
    connectionDetails,
    checkConnection,
  };
};
