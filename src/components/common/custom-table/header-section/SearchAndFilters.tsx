'use client';
import type { JSX } from 'react';

import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import SearchInput from './SearchInput';
import FilterSelect from './FilterSelect';

interface SearchAndFiltersProps {
    showSearch: boolean;
    showFilters: boolean;
    searchPlaceholder: string;
    localSearch: string;
    onSearchChange: (value: string) => void;
    searchLoading: boolean;
    filters: any[];
    filterValues: Record<string, any>;
    onFilterChange?: (key: string, value: any) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
    showSearch,
    showFilters,
    searchPlaceholder,
    localSearch,
    onSearchChange,
    searchLoading,
    filters,
    filterValues,
    onFilterChange,
}): JSX.Element => {
    const theme = useTheme();

    const filterComponents = useMemo(() =>
        filters.map((filter) => (
            <FilterSelect
                key={filter.key}
                filter={filter}
                value={filterValues[filter.key]}
                onFilterChange={onFilterChange}
            />
        )), [filters, filterValues, onFilterChange]
    );

    if (!showSearch && !showFilters) {
        return <></>;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'stretch',
                height: '56px',
                '@media (max-width: 600px)': {
                    flexDirection: 'column',
                    gap: 1.5,
                },
            }}
        >
            {showSearch && (
                <SearchInput
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onSearchChange={onSearchChange}
                    theme={theme}
                    loading={searchLoading}
                />
            )}

            {showFilters && filterComponents}
        </Box>
    );
};

export default SearchAndFilters;
