import Image from "next/image";
import { type ReactNode } from "react";

import AuthLayout from "src/components/layout/AuthLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout>
      <div className="w-[420px] py-4">
        <section className="text-center mb-5">
          <div className="mb-3 flex justify-center">
            <Image
              src="/fullprimary.svg"
              alt="SA One Source"
              width={170}
              height={60}
              className="w-[170px] h-[60px]"
              priority
            />
          </div>
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
