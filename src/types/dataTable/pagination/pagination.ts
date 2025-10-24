import React from 'react';

export interface PaginationSectionProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    showRowsPerPage?: boolean;
    showPageInfo?: boolean;
    showNavigation?: boolean;
    rowsPerPageOptions?: number[];
    customPagination?: React.ReactNode;
    rowsPerPagePosition?: 'left' | 'right' | 'center';
}

export interface RowsPerPageSelectorProps {
    itemsPerPage: number;
    rowsPerPageOptions: number[];
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

export interface PageInfoProps {
    startItem: number;
    endItem: number;
    totalItems: number;
}

export interface NavigationButtonsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
