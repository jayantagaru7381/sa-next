import { notFound } from "next/navigation";

import { HealthCheckDashboard } from "src/healthcheck";
import { canAccessDevelopmentFeatures } from "src/lib/environment";

export default function HealthCheckPage() {
  // Restrict access to development and QA environments only
  if (!canAccessDevelopmentFeatures()) {
    notFound();
  }

  return <HealthCheckDashboard />;
}

export const metadata = {
  title: "API Health Check Dashboard",
  description:
    "Comprehensive API testing and monitoring dashboard for FastAPI backend",
};
