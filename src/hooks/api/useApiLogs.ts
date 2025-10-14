"use client";

import type { ApiRequestLog, ApiLoggingConfig } from "./types";

import { useRef, useMemo, useState, useCallback } from "react";

interface UseApiLogsReturn {
  logs: ApiRequestLog[];
  addLog: (logEntry: Omit<ApiRequestLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
  removeLog: (id: string) => void;
  getLogsByEndpoint: (endpoint: string) => ApiRequestLog[];
  getLogsByMethod: (method: string) => ApiRequestLog[];
  getLogsByStatus: (status: number) => ApiRequestLog[];
  getSuccessfulLogs: () => ApiRequestLog[];
  getFailedLogs: () => ApiRequestLog[];
  getLogStats: () => {
    total: number;
    successful: number;
    failed: number;
    averageLatency: number;
    methods: Record<string, number>;
    endpoints: Record<string, number>;
  };
}

const DEFAULT_CONFIG: ApiLoggingConfig = {
  maxLogs: 100,
  enableConsoleLogging: process.env.NODE_ENV === "development",
};

export const useApiLogs = (config: ApiLoggingConfig = {}): UseApiLogsReturn => {
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );
  const [logs, setLogs] = useState<ApiRequestLog[]>([]);
  const logIdCounter = useRef(0);

  const addLog = useCallback(
    (logEntry: Omit<ApiRequestLog, "id" | "timestamp">) => {
      const newLog: ApiRequestLog = {
        ...logEntry,
        id: `${Date.now()}-${++logIdCounter.current}`,
        timestamp: new Date().toISOString(),
      };

      // Apply log filter if provided
      if (finalConfig.logFilter && !finalConfig.logFilter(newLog)) {
        return;
      }

      // Apply log transformer if provided
      const finalLog = finalConfig.logTransformer
        ? finalConfig.logTransformer(newLog)
        : newLog;

      // Console logging for debugging
      if (finalConfig.enableConsoleLogging) {
        const logMethod = finalLog.success ? console.log : console.error;
        logMethod(`🔗 API ${finalLog.method} ${finalLog.endpoint}`, {
          status: finalLog.status,
          duration: `${finalLog.duration}ms`,
          success: finalLog.success,
          ...(finalLog.error && { error: finalLog.error }),
        });
      }

      setLogs((prev) => {
        const updated = [finalLog, ...prev];
        // Apply max logs limit
        return updated.slice(0, finalConfig.maxLogs);
      });
    },
    [finalConfig],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const removeLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }, []);

  const getLogsByEndpoint = useCallback(
    (endpoint: string) => logs.filter((log) => log.endpoint === endpoint),
    [logs],
  );

  const getLogsByMethod = useCallback(
    (method: string) => logs.filter((log) => log.method === method),
    [logs],
  );

  const getLogsByStatus = useCallback(
    (status: number) => logs.filter((log) => log.status === status),
    [logs],
  );

  const getSuccessfulLogs = useCallback(
    () => logs.filter((log) => log.success),
    [logs],
  );

  const getFailedLogs = useCallback(
    () => logs.filter((log) => !log.success),
    [logs],
  );

  const getLogStats = useCallback(() => {
    const total = logs.length;
    const successful = logs.filter((log) => log.success).length;
    const failed = total - successful;

    const averageLatency =
      total > 0 ? logs.reduce((sum, log) => sum + log.duration, 0) / total : 0;

    const methods = logs.reduce(
      (acc, log) => {
        acc[log.method] = (acc[log.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const endpoints = logs.reduce(
      (acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      successful,
      failed,
      averageLatency: Math.round(averageLatency),
      methods,
      endpoints,
    };
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    removeLog,
    getLogsByEndpoint,
    getLogsByMethod,
    getLogsByStatus,
    getSuccessfulLogs,
    getFailedLogs,
    getLogStats,
  };
};
