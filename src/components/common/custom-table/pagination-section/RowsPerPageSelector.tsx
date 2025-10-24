'use client';

import type { JSX } from 'react';

import type { RowsPerPageSelectorProps } from '../../../../types/dataTable/pagination/pagination';

import { useTheme } from "@emotion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const RowsPerPageSelector: React.FC<RowsPerPageSelectorProps> = ({
    itemsPerPage,
    rowsPerPageOptions,
    onItemsPerPageChange,
}): JSX.Element => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
                variant="body2"
                sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                }}
            >
                Rows per page:
            </Typography>
            <Select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                size="small"
                sx={{ minWidth: 60 }}
            >
                {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </Select>
        </Box>
    );
};

export default RowsPerPageSelector;