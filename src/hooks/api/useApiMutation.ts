"use client";

import type { ApiResponse } from "src/lib/api/client";
import type {
  HttpMethod,
  ApiRequestLog,
  ApiCallOptions,
  ApiMutationState,
} from "./types";

import { useState, useCallback } from "react";

import { useApi } from "./useApi";

interface UseApiMutationConfig {
  onLog?: (log: Omit<ApiRequestLog, "id" | "timestamp">) => void;
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: string, variables: any) => void;
  onSettled?: (data: any, error: string | undefined, variables: any) => void;
}

export const useApiMutation = <T = any, V = any>(
  method: HttpMethod = "POST",
  config: UseApiMutationConfig = {},
): ApiMutationState<T> => {
  const { onLog, onSuccess, onError, onSettled } = config;

  const [state, setState] = useState<
    Omit<ApiMutationState<T>, "execute" | "reset">
  >({
    data: undefined,
    error: undefined,
    loading: false,
    called: false,
    response: undefined,
  });

  const api = useApi({ onLog });

  const execute = useCallback(
    async (
      endpoint: string,
      body?: V,
      options: ApiCallOptions = {},
    ): Promise<ApiResponse<T>> => {
      setState((prev) => ({
        ...prev,
        loading: true,
        called: true,
        error: undefined,
      }));

      try {
        let response: ApiResponse<T>;

        // Use the appropriate HTTP method
        const finalOptions = { ...options, method };

        switch (method) {
          case "POST":
            response = await api.post<T>(endpoint, body, finalOptions);
            break;
          case "PUT":
            response = await api.put<T>(endpoint, body, finalOptions);
            break;
          case "PATCH":
            response = await api.patch<T>(endpoint, body, finalOptions);
            break;
          case "DELETE":
            response = await api.delete<T>(endpoint, finalOptions);
            break;
          default:
            response = await api.call<T>(endpoint, finalOptions, body);
            break;
        }

        setState((prev) => ({
          ...prev,
          data: response.data,
          error: response.error,
          loading: false,
          response,
        }));

        // Call success callback
        if (response.ok && onSuccess) {
          onSuccess(response.data, body);
        } else if (!response.ok && onError) {
          onError(response.error || "Mutation failed", body);
        }

        // Call settled callback (always called)
        if (onSettled) {
          onSettled(response.data, response.error, body);
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        if (onError) {
          onError(errorMessage, body);
        }

        if (onSettled) {
          onSettled(undefined, errorMessage, body);
        }

        throw error;
      }
    },
    [api, method, onSuccess, onError, onSettled],
  );

  const reset = useCallback(() => {
    setState({
      data: undefined,
      error: undefined,
      loading: false,
      called: false,
      response: undefined,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
