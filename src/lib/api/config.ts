// API Configuration
const getApiBaseUrl = () => {
  // For Azure SWA deployment (including preview environments),
  // use environment variable if set, otherwise default to local /api proxy
  if (
    process.env.BUILD_STATIC_EXPORT === "true" ||
    process.env.NODE_ENV === "production"
  ) {
    // Use environment variable if explicitly set (for direct Container Apps access)
    if (process.env.NEXT_PUBLIC_API_BASE) {
      return process.env.NEXT_PUBLIC_API_BASE;
    }
    // Default to /api for SWA proxy (though this won't work in preview environments)
    return "/api";
  }

  // In development, connect directly to local API or development server
  return (
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api" // Adjust port as needed for your Container Apps local dev
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

  // Add auth token if available (you'll implement this based on your auth method)
  // const token = getAuthToken();
  // if (token) {
  //   headers['Authorization'] = `Bearer ${token}`;
  // }

  return headers;
};
