import { memo } from "react";

import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

// ----------------------------------------------------------------------

function StartIcon({ sx, ...other }: SvgIconProps) {
  return (
    <SvgIcon
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      sx={[
        (theme) => ({
          color: theme.vars.palette.text.primary,
          width: 24,
          height: 24,
          aspectRatio: "1/1",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <rect opacity="0.4" width="0.01" height="0.01" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.40203 6.66315C3.14203 4.32915 5.54503 2.61515 7.66803 3.62115L19.612 9.27915C21.9 10.3621 21.9 13.6181 19.612 14.7011L7.66803 20.3602C5.54503 21.3662 3.14303 19.6521 3.40203 17.3181L3.88203 12.9901H12C12.2652 12.9901 12.5196 12.8848 12.7071 12.6973C12.8947 12.5097 13 12.2554 13 11.9901C13 11.7249 12.8947 11.4706 12.7071 11.283C12.5196 11.0955 12.2652 10.9901 12 10.9901H3.88303L3.40303 6.66315H3.40203Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
}

export default memo(StartIcon);
