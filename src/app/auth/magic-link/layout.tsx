import Image from "next/image";
import { type ReactNode } from "react";

import AuthLayout from "../../../components/layout/AuthLayout";

export default function MagicLinkLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout>
      <div className="max-w-md w-full py-3">
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
        </section>
        {children}
      </div>
    </AuthLayout>
  );
}
