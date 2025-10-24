// API Configuration
const getApiBaseUrl = () => {
  // For Azure App Service deployment, use environment variable if set
  if (
    process.env.BUILD_FOR_CONTAINER === "true" ||
    process.env.NODE_ENV === "production"
  ) {
    // Use environment variable if explicitly set (for direct API access)
    if (process.env.NEXT_PUBLIC_API_BASE) {
      return process.env.NEXT_PUBLIC_API_BASE;
    }
    // Default to /api for API proxy
    return "/api";
  }

  // In development, connect directly to local API or development server
  return (
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8083/api"
  );
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true",
  enableApiLogging: process.env.NEXT_PUBLIC_ENABLE_API_LOGGING === "true",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health check endpoint
  health: "/health",

  // Add your API endpoints here as they're documented in Swagger
  // Example:
  // users: '/users',
  // auth: {
  //   login: '/auth/login',
  //   logout: '/auth/logout',
  //   refresh: '/auth/refresh',
  // },
};

// Request headers
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add CSRF token from cookie if available
  if (typeof window !== "undefined") {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf='))
      ?.split('=')[1];
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return headers;
};
