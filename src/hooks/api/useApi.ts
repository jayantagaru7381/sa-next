"use client";

import type { ApiRequestLog, ApiCallOptions } from "./types";

import { useCallback } from "react";

import { apiClient, type ApiResponse } from "src/lib/api/client";

interface UseApiReturn {
  call: <T = any>(
    endpoint: string,
    options?: ApiCallOptions,
    body?: any,
  ) => Promise<ApiResponse<T>>;
  get: <T = any>(
    endpoint: string,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
  post: <T = any>(
    endpoint: string,
    body?: any,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
  put: <T = any>(
    endpoint: string,
    body?: any,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
  patch: <T = any>(
    endpoint: string,
    body?: any,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
  delete: <T = any>(
    endpoint: string,
    options?: ApiCallOptions,
  ) => Promise<ApiResponse<T>>;
}

interface UseApiConfig {
  onLog?: (log: Omit<ApiRequestLog, "id" | "timestamp">) => void;
  defaultOptions?: ApiCallOptions;
}

export const useApi = (config: UseApiConfig = {}): UseApiReturn => {
  const { onLog, defaultOptions = {} } = config;

  const call = useCallback(
    async <T = any>(
      endpoint: string,
      options: ApiCallOptions = {},
      body?: any,
    ): Promise<ApiResponse<T>> => {
      const startTime = Date.now();
      const finalOptions = { ...defaultOptions, ...options };
      const method = finalOptions.method || "GET";

      const requestHeaders = {
        "Content-Type": "application/json",
        ...finalOptions.headers,
      };

      try {
        let response: ApiResponse<T>;
        const clientOptions = {
          headers: requestHeaders,
        };

        // Call appropriate method on apiClient
        switch (method) {
          case "GET":
            response = await apiClient.get<T>(endpoint, clientOptions);
            break;
          case "POST":
            response = await apiClient.post<T>(endpoint, body, clientOptions);
            break;
          case "PUT":
            response = await apiClient.put<T>(endpoint, body, clientOptions);
            break;
          case "PATCH":
            response = await apiClient.patch<T>(endpoint, body, clientOptions);
            break;
          case "DELETE":
            response = await apiClient.delete<T>(endpoint, clientOptions);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        const duration = Date.now() - startTime;
        const responseSize = response.data
          ? JSON.stringify(response.data).length
          : 0;

        // Log the API call if logging is enabled
        if (onLog && !finalOptions.skipLogging) {
          onLog({
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
            context: finalOptions.context,
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log the error if logging is enabled
        if (onLog && !finalOptions.skipLogging) {
          onLog({
            method,
            endpoint,
            status: 0,
            success: false,
            duration,
            requestHeaders,
            requestBody: body,
            error: errorMessage,
            size: 0,
            context: finalOptions.context,
          });
        }

        // Re-throw the error to maintain error handling flow
        throw error;
      }
    },
    [onLog, defaultOptions],
  );

  // Convenience methods for each HTTP method
  const get = useCallback(
    <T = any>(endpoint: string, options?: ApiCallOptions) =>
      call<T>(endpoint, { ...options, method: "GET" }),
    [call],
  );

  const post = useCallback(
    <T = any>(endpoint: string, body?: any, options?: ApiCallOptions) =>
      call<T>(endpoint, { ...options, method: "POST" }, body),
    [call],
  );

  const put = useCallback(
    <T = any>(endpoint: string, body?: any, options?: ApiCallOptions) =>
      call<T>(endpoint, { ...options, method: "PUT" }, body),
    [call],
  );

  const patch = useCallback(
    <T = any>(endpoint: string, body?: any, options?: ApiCallOptions) =>
      call<T>(endpoint, { ...options, method: "PATCH" }, body),
    [call],
  );

  const deleteMethod = useCallback(
    <T = any>(endpoint: string, options?: ApiCallOptions) =>
      call<T>(endpoint, { ...options, method: "DELETE" }),
    [call],
  );

  return {
    call,
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
  };
};
