"use client";

import React from "react";

import { Box, List, Paper, IconButton, ListItemIcon, ListItemText, ListItemButton } from "@mui/material";

const Sidebar: React.FC<{ collapsed?: boolean; onToggle?: () => void }> = ({ collapsed = false, onToggle }) => {
    const groups = [
        {
            key: 'overview', items: [
                { key: 'app', label: 'App', icon: '🏠' },
                { key: 'ecom', label: 'E‑commerce', icon: '🛒' },
            ]
        },
        {
            key: 'management', items: [
                { key: 'users', label: 'Users', icon: '👥', selected: true },
                { key: 'product', label: 'Product', icon: '📦' },
                { key: 'invoice', label: 'Invoice', icon: '🧾' },
            ]
        }
    ];

    return (
        <Paper sx={{ width: collapsed ? 84 : " 280px", p: 1, borderRadius: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }} elevation={0}>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', py: 1, px: 1.5, position: 'relative' }}>
                    <img src="/singleprimary.svg" alt="SA" style={{ width: 36, height: 36 }} />
                    <IconButton size="small" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} sx={{ position: 'absolute', right: -20, top: 4 }}>
                        <Box component="span" sx={{ fontSize: 14 }}>{collapsed ? '◀' : '▶'}</Box>
                    </IconButton>
                </Box>

                {groups.map((group) => (
                    <Box key={group.key} sx={{ mt: 1, mb: 1 }}>
                        <List dense sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {group.items.map((it) => (
                                <ListItemButton
                                    key={it.key}
                                    selected={Boolean(it.selected)}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        py: 1.25,
                                        borderRadius: 1.5,
                                        position: 'relative',
                                        '&.Mui-selected': {
                                            bgcolor: (t) => `${t.palette.action.selected}`,
                                        }
                                    }}
                                >
                                    {it.selected && (
                                        <Box sx={{ position: 'absolute', left: -8, height: '60%', width: 4, bgcolor: 'primary.main', borderRadius: 1 }} />
                                    )}
                                    <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                                        <Box component="span" sx={{ fontSize: 18 }}>{it.icon}</Box>
                                    </ListItemIcon>
                                    <ListItemText sx={{ display: collapsed ? 'none' : (it.selected ? 'block' : 'none'), mt: 0.5 }} primary={it.label} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ bgcolor: 'background.default', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 12, color: 'text.secondary' }}>Invite</Box>
            </Box>
        </Paper>
    );
};

export default Sidebar;
