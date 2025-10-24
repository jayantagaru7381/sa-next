'use client';

import type { JSX } from 'react';

import type {
    EmptyRowProps,
    DataTableProps,
    LoadingRowProps,
    StatusChipProps,
    ActionsCellProps,
    ActionButtonProps,
    CheckboxCellProps,
    MoreActionsCellProps,
    TableCellRendererProps,
} from '../../../../types/dataTable/dataTable';

import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import { alpha, useTheme } from '@mui/material/styles';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';


// Utility Functions
const getStatusColor = (status: string, theme: any) => {
    switch (status.toLowerCase()) {
        case 'active':
            return {
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main
            };
        case 'invited':
            return {
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main
            };
        case 'pending':
            return {
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main
            };
        case 'inactive':
            return {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main
            };
        default:
            return {
                bgcolor: alpha(theme.palette.grey[500], 0.1),
                color: theme.palette.grey[500]
            };
    }
};

// Sub-components
const StatusChip: React.FC<StatusChipProps> = ({ value, theme }) => (
    <Chip
        label={String(value)}
        size="small"
        sx={{
            borderRadius: theme.spacing(0.75),
            height: theme.spacing(3),
            fontSize: theme.typography.caption.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            ...getStatusColor(String(value), theme),
            textTransform: 'capitalize',
        }}
    />
);

const ActionButton: React.FC<ActionButtonProps<any>> = ({ action, row }) => {
    if (action.show && !action.show(row)) return null;

    if (action.render) {
        return <>{action.render(row)}</>;
    }

    return (
        <Button
            size="small"
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            onClick={() => action.onClick(row)}
            sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 'fontWeightMedium',
                fontSize: 'body2.fontSize',
                height: 4.5,
            }}
        >
            {action.label}
        </Button>
    );
};

const TableCellRenderer: React.FC<TableCellRendererProps<any>> = ({ column, row, theme }) => {
    const value = row[column.id as keyof typeof row];

    if (column.render) {
        return <>{column.render(value, row)}</>;
    }

    // Default rendering for status-like fields
    if (column.id === 'status' || column.label.toLowerCase().includes('status')) {
        return <StatusChip value={String(value)} theme={theme} />;
    }

    return <>{String(value)}</>;
};

const LoadingRow: React.FC<LoadingRowProps> = ({ colSpan, theme }) => (
    <TableRow
        sx={{
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-in-out',
            minHeight: '76px',
            borderBottom: `2px dashed ${theme.palette.divider}`,
            '&:hover': {
                backgroundColor: `${alpha(theme.palette.success.light, 0.2)} !important`,
            }
        }}
    >
        <TableCell
            colSpan={colSpan}
            sx={{
                padding: theme.spacing(1.5),
                borderBottom: `1px solid ${theme.palette.divider}`,
                fontSize: theme.typography.body2.fontSize,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:first-of-type': {
                    paddingLeft: theme.spacing(3),
                },
                '&:last-of-type': {
                    paddingRight: theme.spacing(3),
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Loading...
                </Typography>
            </Box>
        </TableCell>
    </TableRow>
);

const EmptyRow: React.FC<EmptyRowProps> = ({ colSpan, emptyMessage, theme }) => (
    <TableRow
        sx={{
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-in-out',
            minHeight: '76px',
            borderBottom: `2px dashed ${theme.palette.divider}`,
            '&:hover': {
                backgroundColor: `${alpha(theme.palette.success.light, 0.2)} !important`,
            }
        }}
    >
        <TableCell
            colSpan={colSpan}
            sx={{
                padding: theme.spacing(1.5),
                borderBottom: `1px solid ${theme.palette.divider}`,
                fontSize: theme.typography.body2.fontSize,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:first-of-type': {
                    paddingLeft: theme.spacing(3),
                },
                '&:last-of-type': {
                    paddingRight: theme.spacing(3),
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {emptyMessage}
                </Typography>
            </Box>
        </TableCell>
    </TableRow>
);

const CheckboxCell: React.FC<CheckboxCellProps> = ({ rowId, selectedRows, onSelectRow, theme }) => (
    <TableCell
        sx={{
            width: '60px',
            minWidth: '60px',
            padding: theme.spacing(1.5),
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontSize: theme.typography.body2.fontSize,
            overflow: 'visible',
            whiteSpace: 'nowrap',
            '&:first-of-type': {
                paddingLeft: theme.spacing(3),
            },
            '&:last-of-type': {
                paddingRight: theme.spacing(3),
            },
        }}
    >
        <Checkbox
            checked={selectedRows.includes(rowId)}
            onChange={(e) => {
                e.stopPropagation();
                onSelectRow(rowId, e.target.checked);
            }}
            size="small"
            sx={{
                width: '17px',
                height: '17px',
                padding: 0,
                color: theme.palette.success.main,
                '&.Mui-checked': {
                    color: theme.palette.success.main,
                },
                '& .MuiSvgIcon-root': {
                    fontSize: '17px',
                },
            }}
        />
    </TableCell>
);

const ActionsCell: React.FC<ActionsCellProps<any>> = ({ actions, row }) => {
    const theme = useTheme();

    return (
        <TableCell
            sx={{
                padding: theme.spacing(1, 1.5),
                borderBottom: `1px solid ${theme.palette.divider}`,
                textAlign: 'right',
                width: theme.spacing(15),
                minWidth: theme.spacing(15),
                overflow: 'visible',
                whiteSpace: 'nowrap',
                '&:last-of-type': {
                    paddingRight: theme.spacing(3),
                },
            }}
        >
            <Box sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                alignItems: 'center'
            }}>
                {actions.map((action, index) => (
                    <Box key={index}>
                        <ActionButton action={action} row={row} />
                    </Box>
                ))}
            </Box>
        </TableCell>
    );
};

const MoreActionsCell: React.FC<MoreActionsCellProps> = ({ onMoreClick, theme }) => (
    <TableCell
        sx={{
            width: '50px',
            minWidth: '50px',
            textAlign: 'center',
            padding: theme.spacing(1.5),
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontSize: theme.typography.body2.fontSize,
            overflow: 'visible',
            whiteSpace: 'nowrap',
            '&:first-of-type': {
                paddingLeft: theme.spacing(3),
            },
            '&:last-of-type': {
                paddingRight: theme.spacing(3),
            },
        }}
    >
        <IconButton
            size="small"
            onClick={onMoreClick}
            sx={{
                '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                }
            }}
        >
            <MoreVertIcon fontSize="small" />
        </IconButton>
    </TableCell>
);

// Main Component
const DataTable = <T extends { id: string }>({
    data,
    columns,
    actions = [],
    selectable = false,
    pagination = true,
    onRowClick,
    onSelectionChange,
    loading = false,
    emptyMessage = 'No data available',
}: DataTableProps<T>): JSX.Element => {
    const theme = useTheme();
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortField) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortField as keyof T];
            const bValue = b[sortField as keyof T];

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;
        // For now, return all data since pagination is handled externally
        return sortedData;
    }, [sortedData, pagination]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectRow = (rowId: string, checked: boolean) => {
        let newSelected: string[];
        if (checked) {
            newSelected = [...selectedRows, rowId];
        } else {
            newSelected = selectedRows.filter((id) => id !== rowId);
        }
        setSelectedRows(newSelected);

        const selectedRowsData = data.filter((row) => newSelected.includes(row.id));
        onSelectionChange?.(selectedRowsData);
    };

    const handleMoreClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Add menu functionality here
    };

    const colSpan = columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0) + 1;

    return (
        <Box>
            {/* Table */}
            <TableContainer
                sx={{
                    boxShadow: 'none',
                    overflowX: 'auto',
                    width: '100%',
                    '& .MuiTable-root': {
                        minWidth: 650,
                        tableLayout: 'fixed',
                        width: '100%',
                        '@media (max-width: 900px)': {
                            minWidth: 500,
                        },
                        '@media (max-width: 600px)': {
                            minWidth: 400,
                        },
                    },
                }}
            >
                <Table>
                    <TableHead
                        sx={{
                            backgroundColor: theme.palette.grey[50],
                            '& .MuiTableCell-root': {
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                padding: theme.spacing(2, 1.5),
                                fontWeight: theme.typography.fontWeightMedium,
                                fontSize: theme.typography.body2.fontSize,
                                color: theme.palette.text.primary,
                                textTransform: 'none',
                                letterSpacing: theme.spacing(0.0625),
                            },
                        }}
                    >
                        <TableRow>
                            {selectable && (
                                <TableCell sx={{ width: '60px', minWidth: '60px' }}>
                                    {/* No select all checkbox - just empty header for individual checkboxes */}
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.align || 'left'}
                                    sx={{
                                        width: column.width || 'auto',
                                        fontWeight: 'fontWeightMedium',
                                        fontSize: 'body2.fontSize',
                                        color: 'text.primary',
                                        textTransform: 'none',
                                        letterSpacing: 0.0625,
                                        borderBottom: `2px solid ${theme.palette.divider}`,
                                        padding: theme.spacing(2, 1.5),
                                    }}
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={sortField === column.id}
                                            direction={sortField === column.id ? sortDirection : 'asc'}
                                            onClick={() => handleSort(String(column.id))}
                                            sx={{
                                                '& .MuiTableSortLabel-icon': {
                                                    fontSize: '16px',
                                                },
                                            }}
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    ) : (
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {column.label}
                                        </Typography>
                                    )}
                                </TableCell>
                            ))}
                            {actions.length > 0 && (
                                <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }} />
                            )}
                            <TableCell sx={{ width: '50px', minWidth: '50px' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <LoadingRow colSpan={colSpan} theme={theme} />
                        ) : paginatedData.length === 0 ? (
                            <EmptyRow colSpan={colSpan} emptyMessage={emptyMessage} theme={theme} />
                        ) : (
                            paginatedData.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => onRowClick?.(row)}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        backgroundColor: selectedRows.includes(row.id)
                                            ? `${alpha(theme.palette.success.light, 0.2)}`
                                            : 'transparent',
                                        transition: 'background-color 0.2s ease-in-out',
                                        minHeight: '76px',
                                        borderBottom: `2px dashed ${theme.palette.divider}`,
                                        '&:hover': {
                                            backgroundColor: `${alpha(theme.palette.success.light, 0.2)} !important`,
                                        }
                                    }}
                                >
                                    {selectable && (
                                        <CheckboxCell
                                            rowId={row.id}
                                            selectedRows={selectedRows}
                                            onSelectRow={handleSelectRow}
                                            theme={theme}
                                        />
                                    )}
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.id)}
                                            align={column.align || 'left'}
                                            sx={{
                                                padding: theme.spacing(1.5),
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                fontSize: theme.typography.body2.fontSize,
                                                // Only apply ellipsis to text content, not interactive elements
                                                ...(column.id !== 'status' && column.id !== 'actions' && {
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }),
                                                '&:first-of-type': {
                                                    paddingLeft: theme.spacing(3),
                                                },
                                                '&:last-of-type': {
                                                    paddingRight: theme.spacing(3),
                                                },
                                            }}
                                        >
                                            <TableCellRenderer
                                                column={column}
                                                row={row}
                                                theme={theme}
                                            />
                                        </TableCell>
                                    ))}
                                    {actions.length > 0 && (
                                        <ActionsCell actions={actions} row={row} />
                                    )}
                                    <MoreActionsCell
                                        onMoreClick={handleMoreClick}
                                        theme={theme}
                                    />
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default DataTable;