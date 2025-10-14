import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Environment = "development" | "qa" | "staging" | "production";

function getCurrentEnvironment(): Environment {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "production";

  switch (env.toLowerCase()) {
    case "development":
    case "dev":
      return "development";
    case "qa":
    case "test":
    case "testing":
      return "qa";
    case "staging":
    case "stage":
      return "staging";
    case "production":
    case "prod":
    default:
      return "production";
  }
}

function canAccessDevelopmentFeatures(): boolean {
  const env = getCurrentEnvironment();
  return env === "development" || env === "qa";
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect health check routes in production environments
  if (pathname.startsWith("/healthcheck")) {
    if (!canAccessDevelopmentFeatures()) {
      // Return 404 for production environments to hide the existence of this route
      return new NextResponse(null, { status: 404 });
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
