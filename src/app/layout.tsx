import "./global.css";

import type { Metadata } from "next";

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { themeConfig, ThemeProvider } from "src/theme";
import { ReduxProvider } from "src/store/ReduxProvider";

export const metadata: Metadata = {
  title: "Source Advisors",
  description: "Your unified platform for all services.",
  icons: {
    icon: "/singleprimary.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          defaultMode={themeConfig.defaultMode}
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
        />
         <ReduxProvider>
          <AppRouterCacheProvider options={{ key: "css", enableCssLayer: true }}>
            <ThemeProvider
              defaultMode={themeConfig.defaultMode}
              modeStorageKey={themeConfig.modeStorageKey}
            >
              {children}
            </ThemeProvider>
          </AppRouterCacheProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
