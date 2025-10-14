"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full h-[4.5rem] px-3 mx-auto select-none bg-[#F4F6F8]">
      <div className="flex items-center justify-center h-full">
        {/* Wrap the Image with a Link for navigation */}
        <Link href="/">
          <Image
            src="/singleprimary.svg"
            alt="Source Advisors logo"
            width={40}
            height={24}
            draggable={false}
            className="h-6 w-auto"
          />
        </Link>
      </div>
      <div className="flex items-center justify-center h-full space-x-2 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200">
        <Image
          src="/contactsupport.svg"
          alt="Contact support"
          width={16}
          draggable={false}
          height={16}
          className="flex-shrink-0"
        />
        <span className="text-sm font-bold leading-none">Contact support</span>
      </div>
    </header>
  );
}
