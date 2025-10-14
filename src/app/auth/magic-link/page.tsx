"use client";

import React, { Suspense } from "react";

import MagicLink from "../../../components/auth/MagicLink";

function page() {
  return (
    <section
      draggable={false}
      className="text-center bg-white rounded-md max-w-[420px] shadow-sm select-none"
      style={{ padding: "40px 24px" }}
    >
      <h1 className="text-xl font-bold text-gray-900 mb-1.5">Please check your email</h1>
      <p className="text-sm text-gray-500 pb-5">
        We&apos;ve sent a secure one-time login link to your email address.
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <MagicLink />
      </Suspense>
    </section>
  );
}

export default page;
