"use client";

import type { ReactNode } from "react";

import Header from "../auth/Header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <section className="flex-1 flex flex-col bg-[#F4F6F8]">
        <main className="flex-1 flex flex-col items-center w-full justify-center pt-[4.5rem]">
          {children}
        </main>
      </section>
    </div>
  );
}
