"use client";

import clsx from "clsx";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import AuthSALogoBranding from "src/components/auth/AuthSALogoBranding";

import LoginForm from "../components/auth/LoginForm";
import AuthLayout from "../components/layout/AuthLayout";

function PageInner() {
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("successMessage");

  return (
    <AuthLayout>
      <div
        className={clsx(
          "flex flex-col items-center justify-center min-h-full w-full",
          "max-w-4xl mx-auto px-4 py-4 transition-transform duration-300",
          "select-none",
          {
            "-translate-y-8": isPasswordMode,
          }
        )}
      >
        {/* Brand Section */}
        <section className="text-center mb-5">
          <AuthSALogoBranding />

          <h1 className="text-xl font-bold text-gray-900 mb-1.5">Welcome to Source Advisors</h1>

          <p className="text-sm text-gray-500">Your unified platform for all services.</p>
        </section>

        {/* Login Form */}
        <LoginForm
          showPasswordField={isPasswordMode}
          setShowPasswordField={setIsPasswordMode}
          successMessage={successMessage || undefined}
        />
      </div>
    </AuthLayout>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PageInner />
    </Suspense>
  );
}
