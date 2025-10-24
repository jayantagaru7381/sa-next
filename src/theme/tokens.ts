export const colors = {
  primary: {
    main: "#0067FF",
    hover: "#0056D2",
  },
  secondary: {
    main: "#F57C00",
    background: "rgba(255,152,0,0.16)",
    invitedBackground: "rgba(255,152,0,0.16)",
  },
  gray: {
    50: "#F4F6F8",
    200: "#E0E0E0",
    400: "#9E9E9E",
    500: "#757575",
    900: "#212121",
  },
  white: "#FFFFFF",
  error: "#F44336",
} as const;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "3rem", // 48px
} as const;

export const shadows = {
  card: "0px 4px 16px rgba(0, 0, 0, 0.12)",
  button: "0px 2px 4px rgba(0, 0, 0, 0.1)",
} as const;

export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
} as const;
