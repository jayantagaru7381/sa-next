'use client';
import type { JSX } from 'react';

import type { SearchInputProps } from '../../../../types/dataTable/headerSection/headerSection';

import React, { useCallback } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

const SearchInput: React.FC<SearchInputProps> = ({
    placeholder,
    value,
    onSearchChange,
    loading = false
}): JSX.Element => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange?.(e.target.value);
    }, [onSearchChange]);

    const handleClear = useCallback(() => {
        onSearchChange?.('');
    }, [onSearchChange]);

    const hasValue = value && value.length > 0;

    return (
        <Box sx={{ flex: 1, position: 'relative', height: '100%', '@media (max-width: 600px)': { minWidth: '100%' } }}>
            <Box
                component="input"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                sx={{
                    width: '100%',
                    height: '100%',
                    padding: '8px 12px 8px 40px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:focus': {
                        outline: 'none',
                        borderColor: 'primary.main',
                    },
                    '&:hover': {
                        borderColor: 'primary.main',
                    },
                }}
            />
            <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <SearchIcon fontSize="small" color="action" />
            </Box>
            {loading ? (
                <Box sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <CircularProgress size={16} color="primary" />
                </Box>
            ) : hasValue ? (
                <Box
                    onClick={handleClear}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                >
                    <CloseIcon fontSize="small" color="action" />
                </Box>
            ) : null}
        </Box>
    );
};

export default SearchInput;
