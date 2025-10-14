/**
 * Environment utility functions for controlling feature access
 */

export type Environment = "development" | "qa" | "uat" | "production";

export const getCurrentEnvironment = (): Environment => {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "production";

  // Map common environment names to our standard types
  switch (env.toLowerCase()) {
    case "development":
    case "dev":
      return "development";
    case "qa":
    case "test":
    case "testing":
      return "qa";
    case "staging":
    case "uat":
    case "stage":
      return "uat";
    case "production":
    case "prod":
    default:
      return "production";
  }
};

export const isDevelopmentEnvironment = (): boolean =>
  getCurrentEnvironment() === "development" || getCurrentEnvironment() === "qa";

export const isProductionEnvironment = (): boolean =>
  getCurrentEnvironment() === "production";

export const getAllowedEnvironments = (): Environment[] => [
  "development",
  "qa",
];

/**
 * Check if current environment allows access to development features
 * like health checks, debug tools, etc.
 */
export const canAccessDevelopmentFeatures = (): boolean =>
  isDevelopmentEnvironment();
