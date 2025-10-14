// Legacy exports (deprecated - use src/hooks/api instead)
export { useApiLogs } from "./useApiLogs";
export { useApiConnection } from "./useApiConnection";

// Modern composed hooks using the general API hooks
export { useHealthCheckDashboard } from "./useHealthCheckDashboard";

// Re-export general API hooks for convenience
export {
  useApi,
  useApiQuery,
  useApiMutation,
  useHealthCheck,
  type ApiRequestLog,
  type HealthCheckResult,
  useApiLogs as useGeneralApiLogs,
} from "src/hooks/api";
