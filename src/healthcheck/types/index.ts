export interface HealthCheckLog {
  id: string;
  timestamp: string;
  method: string;
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
}

export interface ConnectionDetails {
  baseUrl: string;
  environment: string;
  timestamp: string;
  latency?: number;
  error?: string;
}

export interface SystemMetricsData {
  successRate: number;
  totalRequests: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  methodStats: Record<string, number>;
  errorRate: number;
}

export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  responses?: Record<string, any>;
  tags?: string[];
}

export type TabValue = "overview" | "endpoints" | "logs" | "schema" | "metrics";

export interface NotificationState {
  message: string;
  type: "info" | "success" | "warning" | "error";
  show: boolean;
}
