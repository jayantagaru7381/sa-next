import { API_CONFIG, getDefaultHeaders } from "./config";

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Logging utility
const logApiCall = (
  method: string,
  url: string,
  options?: any,
  response?: any,
) => {
  if (API_CONFIG.enableApiLogging) {
    console.group(`🔗 API ${method}: ${url}`);
    console.log("Request:", options);
    if (response) {
      console.log("Response:", response);
    }
    console.groupEnd();
  }
};

// Error handler
const handleApiError = (error: any): ApiError => {
  if (API_CONFIG.enableDebug) {
    console.error("API Error:", error);
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: (error as any).status,
      details: (error as any).details,
    };
  }

  return {
    message: "An unexpected error occurred",
    details: error,
  };
};

// Base fetch wrapper with error handling
async function fetchWrapper<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const fullUrl = `${API_CONFIG.baseURL}${url}`;

  try {
    const defaultOptions: RequestInit = {
      headers: getDefaultHeaders(),
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    logApiCall(options.method || "GET", fullUrl, mergedOptions);

    const response = await fetch(fullUrl, mergedOptions);

    let data: T | undefined;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      data = text as unknown as T;
    }

    const apiResponse: ApiResponse<T> = {
      data: response.ok ? data : undefined,
      error: !response.ok
        ? (data as any)?.detail || response.statusText
        : undefined,
      status: response.status,
      ok: response.ok,
    };

    logApiCall(options.method || "GET", fullUrl, mergedOptions, apiResponse);

    return apiResponse;
  } catch (error) {
    const apiError = handleApiError(error);
    return {
      error: apiError.message,
      status: apiError.status || 500,
      ok: false,
    };
  }
}

// Enhanced API Client with authentication support
class ApiClient {
  private authToken: string | null = null;

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Get authentication token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Create authenticated request options
  private createAuthenticatedOptions(options: RequestInit = {}): RequestInit {
    const headers = { ...options.headers };

    if (this.authToken) {
      (headers as any).Authorization = `Bearer ${this.authToken}`;
    }

    return {
      ...options,
      headers,
    };
  }

  // GET request
  get<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({ ...options, method: "GET" }),
    );
  }

  // POST request
  post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({
        ...options,
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  }

  // PUT request
  put<T = any>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({
        ...options,
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  }

  // PATCH request
  patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({
        ...options,
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  }

  // DELETE request
  delete<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({ ...options, method: "DELETE" }),
    );
  }

  // Convenience method for authenticated requests
  withAuth(token: string) {
    const authenticatedClient = new ApiClient();
    authenticatedClient.setAuthToken(token);
    return authenticatedClient;
  }

  // Upload file
  async upload<T = any>(
    url: string,
    file: File,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    return fetchWrapper<T>(
      url,
      this.createAuthenticatedOptions({
        ...options,
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
          ...((options?.headers as any) || {}),
          "Content-Type": undefined,
        },
      }),
    );
  }

  // Download file
  async download(url: string, options?: RequestInit): Promise<Blob> {
    const fullUrl = `${API_CONFIG.baseURL}${url}`;
    const response = await fetch(
      fullUrl,
      this.createAuthenticatedOptions(options),
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
