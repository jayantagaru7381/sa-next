'use client';
import type { JSX } from 'react';
import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface TitleSectionProps {
    title: string;
    subtitle?: string;
    customContent?: React.ReactNode;
}

const TitleSection: React.FC<TitleSectionProps> = ({ title, subtitle, customContent }): JSX.Element => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.text.primary
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {customContent}
        </Box>
    );
};

export default TitleSection;
