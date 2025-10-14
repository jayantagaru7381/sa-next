import { type ReactNode } from "react";

import AuthSALogoBranding from "src/components/auth/AuthSALogoBranding";

import AuthLayout from "../../../components/layout/AuthLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout>
      <div className="w-[420px] py-4">
        <section className="text-center mb-5">
          <AuthSALogoBranding />
          <h1
            className="mb-1.5"
            style={{
              color: "#1C252E",
              height: "30px",
              fontSize: "20px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "30px",
            }}
          >
            Set Up Multi-Factor Authentication
          </h1>
          <p className="text-[14px] text-gray-500 w-[420px] text-center">
            This is required for your first login. Please select your preferred two-step
            verification method:
          </p>
        </section>
        {children}
      </div>
    </AuthLayout>
  );
}
