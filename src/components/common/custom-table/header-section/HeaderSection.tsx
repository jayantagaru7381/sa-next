'use client';
import type { JSX } from 'react';

import type { HeaderSectionProps } from '../../../../types/dataTable/headerSection/headerSection';

import React, { useEffect, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import useDebounce from '../../../../hooks/common/useDebounce';

import TitleSection from './TitleSection';
import SearchAndFilters from './SearchAndFilters';

const HeaderSection: React.FC<HeaderSectionProps> = ({
    title,
    subtitle,
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange,
    filters = [],
    filterValues = {},
    onFilterChange,
    showSearch = true,
    showFilters = true,
    customContent,
    searchLoading = false,
}): JSX.Element => {
    const [localSearch, setLocalSearch] = useState<string>(searchValue);
    const debouncedSearch = useDebounce(localSearch, 300);

    const handleSearchChange = useCallback((value: string) => {
        setLocalSearch(value);
    }, []);

    useEffect(() => {
        setLocalSearch(searchValue);
    }, [searchValue]);

    useEffect(() => {
        if (onSearchChange) {
            onSearchChange(debouncedSearch);
        }
    }, [debouncedSearch, onSearchChange]);

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '24px',
            '@media (max-width: 600px)': {
                gap: 1.5,
            }
        }}>
            <Box sx={{ flex: '0 0 50%' }}>
                <TitleSection
                    title={title}
                    subtitle={subtitle}
                    customContent={customContent}
                />
            </Box>

            <Box sx={{ flex: '0 0 50%' }}>
                <SearchAndFilters
                    showSearch={showSearch}
                    showFilters={showFilters}
                    searchPlaceholder={searchPlaceholder}
                    localSearch={localSearch}
                    onSearchChange={handleSearchChange}
                    searchLoading={searchLoading}
                    filters={filters}
                    filterValues={filterValues}
                    onFilterChange={onFilterChange}
                />
            </Box>
        </Box>
    );
};

export default HeaderSection;