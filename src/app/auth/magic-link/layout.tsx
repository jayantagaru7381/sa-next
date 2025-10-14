import { type ReactNode } from "react";

import AuthSALogoBranding from "src/components/auth/AuthSALogoBranding";

import AuthLayout from "../../../components/layout/AuthLayout";

export default function MagicLinkLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout>
      <div className="max-w-md w-full py-3">
        <section className="text-center mb-5">
          <AuthSALogoBranding />
        </section>
        {children}
      </div>
    </AuthLayout>
  );
}
