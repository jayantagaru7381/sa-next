import { memo } from "react";

import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

// ----------------------------------------------------------------------

function AlertInfoIcon({ sx, ...other }: SvgIconProps) {
  return (
    <SvgIcon
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      sx={[
        (theme) => ({
          fill: theme.vars?.palette?.info?.main ?? "#17A2B8", // fallback color
          width: 20,
          height: 20,
          flexShrink: 0,
          aspectRatio: "1 / 1",
          color: theme.vars?.palette?.info?.main ?? "#17A2B8",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10ZM10 15.75C10.1989 15.75 10.3897 15.671 10.5303 15.5303C10.671 15.3897 10.75 15.1989 10.75 15V9C10.75 8.80109 10.671 8.61032 10.5303 8.46967C10.3897 8.32902 10.1989 8.25 10 8.25C9.80109 8.25 9.61032 8.32902 9.46967 8.46967C9.32902 8.61032 9.25 8.80109 9.25 9V15C9.25 15.414 9.586 15.75 10 15.75ZM10 5C10.2652 5 10.5196 5.10536 10.7071 5.29289C10.8946 5.48043 11 5.73478 11 6C11 6.26522 10.8946 6.51957 10.7071 6.70711C10.5196 6.89464 10.2652 7 10 7C9.73478 7 9.48043 6.89464 9.29289 6.70711C9.10536 6.51957 9 6.26522 9 6C9 5.73478 9.10536 5.48043 9.29289 5.29289C9.48043 5.10536 9.73478 5 10 5Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
}

export default memo(AlertInfoIcon);
