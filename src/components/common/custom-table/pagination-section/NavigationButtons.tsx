'use client';

import type { JSX } from 'react';

import type { NavigationButtonsProps } from '../../../../types/dataTable/pagination/pagination';

import React from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}): JSX.Element => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
            size="small"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                '&.Mui-disabled': {
                    opacity: 0.3,
                }
            }}
        >
            <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton
            size="small"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                '&.Mui-disabled': {
                    opacity: 0.3,
                }
            }}
        >
            <ChevronRightIcon fontSize="small" />
        </IconButton>
    </Box>
);

export default NavigationButtons;