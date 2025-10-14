"use client";

import type { JSX } from 'react';

import {
    Box,
    Button,
    Skeleton,
    Typography
} from '@mui/material';


const MagicLinkSkeleton: React.FC = (): JSX.Element => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            bgcolor: 'background.paper',
        }}
    >

        {/* Email Field */}
        <Box>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ mt: 0.5, borderRadius: 1 }} />
        </Box>

        {/* Expiry Timer Box */}
        <Box
            sx={{
                bgcolor: "rgba(255, 152, 0, 0.16)",
                color: "#FF9800",
                borderRadius: 2,
                height: 70,
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
            }}
        >
            <Typography sx={{ fontWeight: 600 }}>
                <Skeleton width={100} height={20} />
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 22 }}>
                <Skeleton width={60} height={30} />
            </Typography>
        </Box>

        {/* Resend Button */}
        <Button
            variant="outlined"
            color="inherit"
            fullWidth
            startIcon={<Skeleton width={20} />}
            disabled
            sx={{
                minHeight: 48,
                height: 48,
                padding: "8px 16px",
            }}
        >
            <Skeleton width={80} height={20} />
        </Button>

        {/* Info Text */}
        <Typography
            variant="body2"
            sx={{
                fontSize: 14,
                fontWeight: 400,
                color: "#637381",
                textAlign: 'center',
                lineHeight: 1.4,
            }}
        >
            <Skeleton width="90%" height={20} />
            <Skeleton width="70%" height={20} />
        </Typography>

        {/* Return to Login */}
        <Box textAlign="center">
            <Button
                disabled
                sx={{
                    textDecoration: "none",
                    lineHeight: "22px",
                    color: "#1C252E",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textTransform: "none",
                    minWidth: "auto",
                    minHeight: "22px !important",
                    height: "22px !important",
                    padding: "0 !important",
                    "&:hover": { backgroundColor: "transparent" },
                }}
            >
                <Skeleton width={20} />
                <Skeleton width={80} height={20} />
            </Button>
        </Box>
    </Box>
);

export default MagicLinkSkeleton;