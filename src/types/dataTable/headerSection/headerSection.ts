import React from 'react';

export interface TableFilter {
    key: string;
    label: string;
    type: 'search' | 'select';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface HeaderSectionProps {
    title: string;
    subtitle?: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: TableFilter[];
    filterValues?: Record<string, string | string[]>;
    onFilterChange?: (key: string, value: string | string[]) => void;
    showSearch?: boolean;
    showFilters?: boolean;
    customContent?: React.ReactNode;
    searchLoading?: boolean;
}

export interface SearchInputProps {
    placeholder: string;
    value: string;
    onSearchChange?: (value: string) => void;
    theme: any;
    loading?: boolean;
}

export interface FilterSelectProps {
    filter: TableFilter;
    value: string | string[];
    onFilterChange?: (key: string, value: string | string[]) => void;
}
