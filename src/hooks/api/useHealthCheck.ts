"use client";

import type {
  ApiRequestLog,
  ConnectionDetails,
  HealthCheckResult,
} from "./types";

import { useRef, useState, useEffect, useCallback } from "react";

import { API_CONFIG } from "src/lib/api/config";

import { useApi } from "./useApi";

interface UseHealthCheckConfig {
  endpoint?: string;
  interval?: number; // Auto-check interval in milliseconds
  timeout?: number;
  onLog?: (log: Omit<ApiRequestLog, "id" | "timestamp">) => void;
  onStatusChange?: (isConnected: boolean | null) => void;
}

export const useHealthCheck = (
  config: UseHealthCheckConfig = {},
): HealthCheckResult & {
  checkHealth: () => Promise<void>;
  startAutoCheck: () => void;
  stopAutoCheck: () => void;
  isAutoChecking: boolean;
} => {
  const {
    endpoint = "/health/live",
    interval = 30000, // 30 seconds default
    timeout = 10000, // 10 seconds timeout
    onLog,
    onStatusChange,
  } = config;

  const [state, setState] = useState<HealthCheckResult>({
    isConnected: null,
    connectionDetails: null,
    lastChecked: undefined,
  });

  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const api = useApi({ onLog });

  const checkHealth = useCallback(async () => {
    const startTime = Date.now();

    try {
      const response = await api.get(endpoint, {
        timeout,
        context: { healthCheck: true },
      });

      const latency = Date.now() - startTime;
      const isConnected = response.ok;

      const connectionDetails: ConnectionDetails = {
        baseUrl: API_CONFIG.baseURL,
        environment: API_CONFIG.environment,
        timestamp: new Date().toISOString(),
        latency,
        status: isConnected
          ? "healthy"
          : response.status >= 500
            ? "unhealthy"
            : "degraded",
        ...(response.data && { version: response.data.version }),
        ...(!isConnected && {
          error: response.error || `HTTP ${response.status}`,
        }),
      };

      setState({
        isConnected,
        connectionDetails,
        lastChecked: new Date(),
      });

      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange(isConnected);
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";

      const connectionDetails: ConnectionDetails = {
        baseUrl: API_CONFIG.baseURL,
        environment: API_CONFIG.environment,
        timestamp: new Date().toISOString(),
        latency,
        error: errorMessage,
        status: "unhealthy",
      };

      setState({
        isConnected: false,
        connectionDetails,
        lastChecked: new Date(),
      });

      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange(false);
      }
    }
  }, [endpoint, timeout, api, onStatusChange]);

  const startAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsAutoChecking(true);

    // Initial check
    checkHealth();

    // Set up interval
    intervalRef.current = setInterval(checkHealth, interval);
  }, [checkHealth, interval]);

  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoChecking(false);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  return {
    ...state,
    checkHealth,
    startAutoCheck,
    stopAutoCheck,
    isAutoChecking,
  };
};
