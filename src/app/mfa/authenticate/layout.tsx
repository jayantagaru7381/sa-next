import { type ReactNode } from "react";

import AuthLayout from "src/components/layout/AuthLayout";
import AuthSALogoBranding from "src/components/auth/AuthSALogoBranding";

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
            Multi-Factor Authentication
          </h1>
          <p className="text-[14px] text-gray-500 w-[420px] text-center">Please enter the code:</p>
        </section>
        {children}
      </div>
    </AuthLayout>
  );
}
