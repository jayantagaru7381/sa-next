"use client"

import type { MagicLinkExpiryProps } from "../../types/auth";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";



export default function MagicLinkExpiry({ email }: MagicLinkExpiryProps) {
    const router = useRouter();

    const handleRequestNewLink = () => {
        // Navigate back to the magic link page to request a new link
        const url = email ? `/auth/magic-link?email=${encodeURIComponent(email)}` : '/auth/magic-link';
        router.push(url);
    };

    const handleGoToLogin = () => {
        // Navigate to the login page
        router.push('/login');
    };

    return (
        <div className="text-center">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRequestNewLink}
                    sx={{
                        display: "flex",
                        width: "372px",
                        minWidth: "var(--button-min-width, 64px)",
                        minHeight: "var(--button-large-min-height, 48px)",
                        padding: "var(--button-large-py, 8px) var(--button-large-px, 16px)",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "var(--button-spacing, 8px)",
                        alignSelf: "stretch",
                        borderRadius: "var(--button-radius, 8px)",
                        backgroundColor: "var(--secondary-main, #FF9800)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "15px",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: "#e68900",
                        }
                    }}
                >
                    Request a new one-time link
                </Button>

                <Button
                    variant="text"
                    fullWidth
                    onClick={handleGoToLogin}
                    sx={{
                        color: "#1C252E",
                        fontWeight: 600,
                        fontSize: "15px",
                        borderRadius: "var(--button-radius, 8px)",
                        textTransform: "none",
                        height: "48px", // Set specific height as per Figma
                        padding: "8px 16px",
                        "&:hover": {
                            backgroundColor: "rgba(28, 37, 46, 0.04)",
                        }
                    }}
                >
                    Go to login page
                </Button>
            </div>
        </div>
    )
}