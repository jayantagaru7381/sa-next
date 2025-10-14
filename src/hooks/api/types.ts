import type { ApiResponse } from "src/lib/api/client";

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Generic API request log entry
export interface ApiRequestLog {
  id: string;
  timestamp: string;
  method: HttpMethod;
  endpoint: string;
  status: number;
  success: boolean;
  duration: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  error?: string;
  size?: number;
  // Additional context for different features
  context?: Record<string, any>;
}

// API hook states
export interface ApiState<T = any> {
  data?: T;
  error?: string;
  loading: boolean;
  called: boolean;
  response?: ApiResponse<T>;
}

// Query-specific state (for GET requests)
export interface ApiQueryState<T = any> extends ApiState<T> {
  refetch: () => Promise<ApiResponse<T>>;
  isFetching: boolean;
  lastFetched?: Date;
}

// Mutation-specific state (for POST/PUT/DELETE)
export interface ApiMutationState<T = any> extends ApiState<T> {
  execute: (
    endpoint: string,
    body?: any,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
  reset: () => void;
}

// Options for API calls
export interface ApiCallOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  skipLogging?: boolean;
  timeout?: number;
  retries?: number;
  // Context for logging
  context?: Record<string, any>;
}

// Health check specific types
export interface HealthCheckResult {
  isConnected: boolean | null;
  connectionDetails: ConnectionDetails | null;
  lastChecked?: Date;
}

export interface ConnectionDetails {
  baseUrl: string;
  environment: string;
  timestamp: string;
  latency?: number;
  error?: string;
  version?: string;
  status?: "healthy" | "degraded" | "unhealthy";
}

// Logging configuration
export interface ApiLoggingConfig {
  maxLogs?: number;
  enableConsoleLogging?: boolean;
  logFilter?: (log: ApiRequestLog) => boolean;
  logTransformer?: (log: ApiRequestLog) => ApiRequestLog;
}

// API hook configuration
export interface ApiHookConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  logging?: ApiLoggingConfig;
  retries?: number;
  timeout?: number;
}

// Cache configuration for queries
export interface ApiCacheConfig {
  enabled?: boolean;
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}
