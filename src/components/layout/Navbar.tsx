"use client";

import { Box, Badge, AppBar, Avatar, Toolbar, InputBase, IconButton, Typography } from "@mui/material";

const MenuIconSvg = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
);

export default function Navbar({ onToggleSidebar, sidebarCollapsed }: { onToggleSidebar?: () => void; sidebarCollapsed?: boolean }) {
    return (
        <AppBar position="fixed" color="transparent" elevation={0} sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, background: 'transparent', width: `calc(100% - ${sidebarCollapsed ? 84 : 280}px)`, ml: `${sidebarCollapsed ? 84 : 280}px`, transition: 'width 200ms, margin 200ms' }}>
            <Toolbar sx={{ minHeight: 64, px: 3 }}>
                <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={onToggleSidebar}>
                    <MenuIconSvg />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                    <Box sx={{ width: 36, height: 36 }}>
                        <img src="/starticon.svg" alt="SA" width={36} height={36} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2">Acme Company</Typography>
                        <Typography variant="caption" color="text.secondary">External</Typography>
                    </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <InputBase placeholder="Search" sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderRadius: 1, width: 360 }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton aria-label="notifications">
                        <Badge badgeContent={1} color="error">�</Badge>
                    </IconButton>
                    <Avatar alt="User" src="/contactsupport.svg" sx={{ width: 36, height: 36, border: '2px solid #fff' }} />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
