"use client";

import type { ApiResponse } from "src/lib/api/client";
import type {
  ApiQueryState,
  ApiRequestLog,
  ApiCallOptions,
  ApiCacheConfig,
} from "./types";

import { useRef, useState, useEffect, useCallback } from "react";

import { useApi } from "./useApi";

interface UseApiQueryConfig {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheConfig?: ApiCacheConfig;
  onLog?: (log: Omit<ApiRequestLog, "id" | "timestamp">) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useApiQuery = <T = any>(
  endpoint: string,
  options: ApiCallOptions = {},
  config: UseApiQueryConfig = {},
): ApiQueryState<T> => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 0,
    onLog,
    onSuccess,
    onError,
  } = config;

  const [state, setState] = useState<ApiQueryState<T>>({
    data: undefined,
    error: undefined,
    loading: false,
    called: false,
    isFetching: false,
    lastFetched: undefined,
    refetch: () => Promise.resolve({} as ApiResponse<T>),
  });

  const api = useApi({ onLog });
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeQuery = useCallback(
    async (force = false): Promise<ApiResponse<T>> => {
      // Don't execute if not enabled (unless forced)
      if (!enabled && !force) {
        return Promise.resolve({} as ApiResponse<T>);
      }

      // Check if data is still fresh
      if (
        !force &&
        state.lastFetched &&
        staleTime > 0 &&
        Date.now() - state.lastFetched.getTime() < staleTime
      ) {
        return Promise.resolve(state.response || ({} as ApiResponse<T>));
      }

      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        isFetching: true,
        called: true,
      }));

      try {
        const response = await api.get<T>(endpoint, {
          ...options,
          // Add abort signal if not already provided
          // signal: abortControllerRef.current.signal,
        });

        setState((prev) => ({
          ...prev,
          data: response.data,
          error: response.error,
          loading: false,
          isFetching: false,
          response,
          lastFetched: new Date(),
        }));

        if (response.ok && onSuccess) {
          onSuccess(response.data);
        } else if (!response.ok && onError) {
          onError(response.error || "Query failed");
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
          isFetching: false,
          lastFetched: new Date(),
        }));

        if (onError) {
          onError(errorMessage);
        }

        throw error;
      }
    },
    [
      enabled,
      endpoint,
      options,
      api,
      staleTime,
      state.lastFetched,
      state.response,
      onSuccess,
      onError,
    ],
  );

  // Set up refetch function
  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  // Update state with refetch function
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      refetch,
    }));
  }, [refetch]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [enabled, endpoint, executeQuery]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        executeQuery();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    return undefined;
  }, [refetchInterval, enabled, executeQuery]);

  // Set up window focus refetch
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleWindowFocus = () => executeQuery();
      window.addEventListener("focus", handleWindowFocus);

      return () => {
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
    return undefined;
  }, [refetchOnWindowFocus, enabled, executeQuery]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  return state;
};
