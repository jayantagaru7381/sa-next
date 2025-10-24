import React from 'react';

export interface StatusChipProps {
    value: string;
    theme: any;
}

export interface ActionButtonProps<T> {
    action: TableAction<T>;
    row: T;
}

export interface TableCellRendererProps<T> {
    column: TableColumn<T>;
    row: T;
    theme: any;
}

export interface LoadingRowProps {
    colSpan: number;
    theme: any;
}

export interface EmptyRowProps {
    colSpan: number;
    emptyMessage: string;
    theme: any;
}

export interface CheckboxCellProps {
    rowId: string;
    selectedRows: string[];
    onSelectRow: (rowId: string, checked: boolean) => void;
    theme: any;
}

export interface ActionsCellProps<T> {
    actions: TableAction<T>[];
    row: T;
}

export interface MoreActionsCellProps {
    onMoreClick: (e: React.MouseEvent) => void;
    theme: any;
}
export interface TableColumn<T> {
    id: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
}

export interface TableAction<T> {
    label: string;
    onClick: (row: T) => void;
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    show?: (row: T) => boolean;
    render?: (row: T) => React.ReactNode;
}

export interface TableFilter {
    key: string;
    label: string;
    type: 'search' | 'select';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface TableHeaderSection {
    title: string;
    subtitle?: string;
    searchPlaceholder?: string;
    filters?: TableFilter[];
    showSearch?: boolean;
    showFilters?: boolean;
    customContent?: React.ReactNode;
}

export interface TablePaginationSection {
    showRowsPerPage?: boolean;
    showPageInfo?: boolean;
    showNavigation?: boolean;
    rowsPerPageOptions?: number[];
    customPagination?: React.ReactNode;
}

export interface DataTableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    filters?: TableFilter[];
    selectable?: boolean;
    pagination?: boolean;
    pageSize?: number;
    onRowClick?: (row: T) => void;
    onSelectionChange?: (selectedRows: T[]) => void;
    loading?: boolean;
    emptyMessage?: string;
    // Component-based sections
    headerSectionComponent?: React.ReactNode;
    paginationSectionComponent?: React.ReactNode;
    showDefaultPagination?: boolean;
}
