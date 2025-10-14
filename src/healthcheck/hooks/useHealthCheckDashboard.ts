"use client";

import { useCallback } from "react";

import { useApi, useApiLogs, useHealthCheck } from "src/hooks/api";

// This demonstrates how to compose the general API hooks for healthcheck-specific functionality
export const useHealthCheckDashboard = () => {
  // Use the general logging hook
  const logs = useApiLogs({
    maxLogs: 100,
    enableConsoleLogging: true,
  });

  // Use the general API hook with logging integration
  const api = useApi({
    onLog: logs.addLog,
  });

  // Use the general health check hook
  const healthCheck = useHealthCheck({
    endpoint: "/health/live",
    interval: 30000, // Check every 30 seconds
    onLog: logs.addLog,
  });

  // Create a general API caller function that components can use
  const makeAPICall = useCallback(
    async (
      endpoint: string,
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
      body?: any,
      customHeaders?: Record<string, string>,
    ) => {
      const options = {
        headers: customHeaders,
        context: { healthCheckDashboard: true },
      };

      switch (method) {
        case "GET":
          return await api.get(endpoint, options);
        case "POST":
          return await api.post(endpoint, body, options);
        case "PUT":
          return await api.put(endpoint, body, options);
        case "DELETE":
          return await api.delete(endpoint, options);
        case "PATCH":
          return await api.patch(endpoint, body, options);
        default:
          return await api.call(endpoint, { ...options, method }, body);
      }
    },
    [api],
  );

  return {
    // Logging functionality
    logs: logs.logs,
    addLog: logs.addLog,
    clearLogs: logs.clearLogs,
    getLogStats: logs.getLogStats,

    // Health check functionality
    isConnected: healthCheck.isConnected,
    connectionDetails: healthCheck.connectionDetails,
    checkHealth: healthCheck.checkHealth,

    // API calling functionality
    makeAPICall,

    // Direct access to the API client for advanced usage
    api,
  };
};
