"use client";

import type { HealthCheckLog } from "../types";

import { useState, useCallback } from "react";

export const useApiLogs = () => {
  const [logs, setLogs] = useState<HealthCheckLog[]>([]);

  const addLog = useCallback(
    (logEntry: Omit<HealthCheckLog, "id" | "timestamp">) => {
      const newLog: HealthCheckLog = {
        ...logEntry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    [],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
};
