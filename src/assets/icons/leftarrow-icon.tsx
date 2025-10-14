import { memo } from "react";

import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

// ----------------------------------------------------------------------

function LeftArrowIcon({ sx, ...other }: SvgIconProps) {
  return (
    <SvgIcon
      fill="none"
      viewBox="0 0 16 17"
      xmlns="http://www.w3.org/2000/svg"
      sx={[
        (theme) => ({
          color: theme.vars.palette.text.primary, // #1C252E
          width: 16,
          height: 16,
          aspectRatio: "1/1",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <g clipPath="url(#clip0_222_1066)">
        <rect opacity="0.4" y="0.664062" width="0.01" height="0.01" fill="currentColor" />
        <path
          d="M9.21978 13.3303C9.01806 13.331 8.82687 13.2403 8.69978 13.0836L5.47978 9.08361C5.27757 8.83761 5.27757 8.48295 5.47978 8.23694L8.81312 4.23694C9.04876 3.95344 9.46961 3.91464 9.75312 4.15028C10.0366 4.38592 10.0754 4.80677 9.83978 5.09028L6.85978 8.66361L9.73978 12.2369C9.90625 12.4368 9.94132 12.7151 9.82961 12.95C9.71791 13.1849 9.47983 13.3333 9.21978 13.3303Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_222_1066">
          <rect width="16" height="16" fill="white" transform="translate(0 0.664062)" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}

export default memo(LeftArrowIcon);
