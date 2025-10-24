'use client';

import type { JSX } from 'react';

import type { PageInfoProps } from '../../../../types/dataTable/pagination/pagination';
import { useTheme } from "@emotion/react";
import { Typography } from "@mui/material";

const PageInfo: React.FC<PageInfoProps> = ({ startItem, endItem, totalItems }): JSX.Element => {
    const theme = useTheme();

    return (
        <Typography
            variant="body2"
            sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500
            }}
        >
            {startItem}-{endItem} of {totalItems}
        </Typography>
    );
};

export default PageInfo;