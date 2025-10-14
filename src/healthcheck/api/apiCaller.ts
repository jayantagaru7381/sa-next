"use client";

import type { HealthCheckLog } from "../types";

import { apiClient } from "src/lib/api/client";

export const createApiCaller =
  (addLog: (logEntry: Omit<HealthCheckLog, "id" | "timestamp">) => void) =>
  async (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: any,
    customHeaders?: Record<string, string>,
  ) => {
    const startTime = Date.now();
    const requestHeaders = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    try {
      let response;
      const options = {
        headers: requestHeaders,
      };

      switch (method) {
        case "GET":
          response = await apiClient.get(endpoint, options);
          break;
        case "POST":
          response = await apiClient.post(endpoint, body, options);
          break;
        case "PUT":
          response = await apiClient.put(endpoint, body, options);
          break;
        case "DELETE":
          response = await apiClient.delete(endpoint, options);
          break;
        case "PATCH":
          response = await apiClient.patch(endpoint, body, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const duration = Date.now() - startTime;
      const responseSize = JSON.stringify(response.data || {}).length;

      addLog({
        method,
        endpoint,
        status: response.status,
        success: response.ok,
        duration,
        requestHeaders,
        requestBody: body,
        responseHeaders: {},
        responseBody: response.data,
        error: response.error,
        size: responseSize,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      addLog({
        method,
        endpoint,
        status: 0,
        success: false,
        duration,
        requestHeaders,
        requestBody: body,
        error: errorMessage,
        size: 0,
      });

      throw error;
    }
  };
