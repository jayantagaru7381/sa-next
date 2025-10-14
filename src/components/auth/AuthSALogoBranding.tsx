import React from "react";
import Image from "next/image";

function AuthSALogoBranding() {
  return (
    <div className="mb-3 flex justify-center">
      <Image
        src="/fullprimary.svg"
        alt="SA One Source"
        width={170}
        height={60}
        draggable={false}
        className="w-[170px] h-[60px] pointer-events-none select-none"
        priority
      />
    </div>
  );
}

export default AuthSALogoBranding;
