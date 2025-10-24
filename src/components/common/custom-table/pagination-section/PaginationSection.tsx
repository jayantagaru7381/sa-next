'use client';

import type { JSX } from 'react';

import type { PaginationSectionProps } from '../../../../types/dataTable/pagination/pagination';

import React from 'react';

import Box from '@mui/material/Box';

import RowsPerPageSelector from './RowsPerPageSelector';
import PageInfo from './PageInfo';
import NavigationButtons from './NavigationButtons';

export const PaginationSection: React.FC<PaginationSectionProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    showRowsPerPage = true,
    showPageInfo = true,
    showNavigation = true,
    rowsPerPageOptions = [5, 10, 25, 50],
    customPagination,
    rowsPerPagePosition = 'left',
}) => {
    const startItem = currentPage * itemsPerPage + 1;
    const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

    if (customPagination) {
        return <>{customPagination}</>;
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                marginTop: 3,
                padding: 2,
                backgroundColor: 'grey.50',
                height: '56px',
                minHeight: '56px',
                gap: 2,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                '@media (max-width: 600px)': {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: 'auto',
                    minHeight: '56px',
                    gap: 1,
                },
            }}
        >
            {/* Left column */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>
                {showRowsPerPage && rowsPerPagePosition === 'left' && (
                    <RowsPerPageSelector
                        itemsPerPage={itemsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        onItemsPerPageChange={onItemsPerPageChange}
                    />
                )}
            </Box>

            {/* Center column */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                {rowsPerPagePosition === 'center' && showRowsPerPage && (
                    <RowsPerPageSelector
                        itemsPerPage={itemsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        onItemsPerPageChange={onItemsPerPageChange}
                    />
                )}
            </Box>

            {/* Right column */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                {showRowsPerPage && rowsPerPagePosition === 'right' && (
                    <RowsPerPageSelector
                        itemsPerPage={itemsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        onItemsPerPageChange={onItemsPerPageChange}
                    />
                )}

                {showPageInfo && (
                    <PageInfo
                        startItem={startItem}
                        endItem={endItem}
                        totalItems={totalItems}
                    />
                )}

                {showNavigation && (
                    <NavigationButtons
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                )}
            </Box>
        </Box>
    );
};

export default PaginationSection;