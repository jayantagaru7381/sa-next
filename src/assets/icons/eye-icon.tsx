import type { SvgIconProps } from "@mui/material/SvgIcon";

import { memo } from "react";

import SvgIcon from "@mui/material/SvgIcon";

// ----------------------------------------------------------------------

function EyeIcon({ sx, ...other }: SvgIconProps) {
  return (
    <SvgIcon
      viewBox="0 0 24 25"
      xmlns="http://www.w3.org/2000/svg"
      sx={[
        (theme) => ({
          // Some tests render components without a ThemeProvider; theme.vars
          // may be undefined. Fall back to theme.palette if vars is missing,
          // and finally to 'currentColor' to avoid runtime errors in tests.
          color:
            (theme as any)?.vars?.palette?.text?.secondary ??
            (theme as any)?.palette?.text?.secondary ??
            'currentColor',
          width: 24,
          height: 24,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <g clipPath="url(#clip0_1235_1063)">
        <rect opacity="0.4" y="0.0444336" width="0.01" height="0.01" fill="currentColor" />
        <path d="M9.75 12.0444C9.75 11.4477 9.98705 10.8754 10.409 10.4534C10.831 10.0315 11.4033 9.79443 12 9.79443C12.5967 9.79443 13.169 10.0315 13.591 10.4534C14.0129 10.8754 14.25 11.4477 14.25 12.0444C14.25 12.6412 14.0129 13.2135 13.591 13.6354C13.169 14.0574 12.5967 14.2944 12 14.2944C11.4033 14.2944 10.831 14.0574 10.409 13.6354C9.98705 13.2135 9.75 12.6412 9.75 12.0444Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M2 12.0444C2 13.6844 2.425 14.2354 3.275 15.3404C4.972 17.5444 7.818 20.0444 12 20.0444C16.182 20.0444 19.028 17.5444 20.725 15.3404C21.575 14.2364 22 13.6834 22 12.0444C22 10.4044 21.575 9.85343 20.725 8.74843C19.028 6.54443 16.182 4.04443 12 4.04443C7.818 4.04443 4.972 6.54443 3.275 8.74843C2.425 9.85443 2 10.4054 2 12.0444ZM12 8.29443C11.0054 8.29443 10.0516 8.68952 9.34835 9.39278C8.64509 10.096 8.25 11.0499 8.25 12.0444C8.25 13.039 8.64509 13.9928 9.34835 14.6961C10.0516 15.3993 11.0054 15.7944 12 15.7944C12.9946 15.7944 13.9484 15.3993 14.6517 14.6961C15.3549 13.9928 15.75 13.039 15.75 12.0444C15.75 11.0499 15.3549 10.096 14.6517 9.39278C13.9484 8.68952 12.9946 8.29443 12 8.29443Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_1235_1063">
          <rect width="24" height="24" fill="white" transform="translate(0 0.0444336)" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}

export default memo(EyeIcon);
