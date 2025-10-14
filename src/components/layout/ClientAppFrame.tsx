"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { Box } from "@mui/material";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function isAuthPath(pathname: string | null) {
    if (!pathname) return false;
    // treat top-level auth and mfa routes as auth screens
    return pathname.startsWith("/auth") || pathname.startsWith("/mfa") || pathname === "/" || pathname.startsWith("/auth/") || pathname.startsWith("/(auth)");
}

export default function ClientAppFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideLayout = isAuthPath(pathname);
    const [collapsed, setCollapsed] = React.useState(false);

    const toggleCollapsed = React.useCallback(() => setCollapsed((s) => !s), []);

    if (hideLayout) return <>{children}</>;

    const sidebarWidth = collapsed ? 84 : " 280px"; // compact vs expanded

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar onToggleSidebar={toggleCollapsed} sidebarCollapsed={collapsed} />
            <Box sx={{ width: sidebarWidth, mt: '64px', ml: 3, height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}>
                <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
            </Box>
            <Box component="main" sx={{ flex: 1, mt: 8, p: 3, transition: 'margin 200ms', ml: 0 }}>
                {children}
            </Box>
        </Box>
    );
}
