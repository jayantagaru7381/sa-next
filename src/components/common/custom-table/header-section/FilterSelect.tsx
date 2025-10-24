import type { FilterSelectProps } from '../../../../types/dataTable/headerSection/headerSection';

import React, { useEffect, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';

const FilterSelect: React.FC<FilterSelectProps> = ({ filter, value, onFilterChange }) => {
    const [open, setOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>(() => {
        // Initialize with all options selected by default
        return filter.options?.map(opt => opt.value) || [];
    });

    // Initialize selected values from props
    useEffect(() => {
        if (value && Array.isArray(value)) {
            setSelectedValues(value);
        } else if (value) {
            setSelectedValues([value]);
        } else {
            // Default to all options selected (All statuses)
            const allValues = filter.options?.map(opt => opt.value) || [];
            setSelectedValues(allValues);
            // Notify parent of default selection
            if (onFilterChange && allValues.length > 0) {
                onFilterChange(filter.key, allValues);
            }
        }
    }, [value, filter.options, filter.key, onFilterChange]);

    const handleToggle = useCallback((optionValue: string) => {
        const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter(v => v !== optionValue)
            : [...selectedValues, optionValue];

        // If all options are unchecked, default to "All statuses" (all options selected)
        const finalValues = newValues.length === 0
            ? filter.options?.map(opt => opt.value) || []
            : newValues;

        setSelectedValues(finalValues);
        onFilterChange?.(filter.key, finalValues);
    }, [selectedValues, filter.key, onFilterChange, filter.options]);

    const handleSelectAll = useCallback(() => {
        const allValues = filter.options?.map(opt => opt.value) || [];
        setSelectedValues(allValues);
        onFilterChange?.(filter.key, allValues);
    }, [filter.options, filter.key, onFilterChange]);

    const handleReset = useCallback(() => {
        // Reset should select all statuses (not clear all)
        const allValues = filter.options?.map(opt => opt.value) || [];
        setSelectedValues(allValues);
        onFilterChange?.(filter.key, allValues);
    }, [filter.options, filter.key, onFilterChange]);

    const getDisplayText = useCallback(() => {
        // If all options are selected or no options are selected, show "All statuses"
        if (selectedValues.length === 0 || selectedValues.length === filter.options?.length) {
            return 'All statuses';
        }

        // Display exact names of selected options
        const selectedLabels = selectedValues
            .map(value => filter.options?.find(opt => opt.value === value)?.label)
            .filter(Boolean);

        return selectedLabels.join(', ');
    }, [selectedValues, filter.options]);

    return (
        <FormControl
            size="small"
            variant="outlined"
            sx={{
                flex: 0.5,
                minWidth: 120,
                height: '100%',
                '@media (max-width: 600px)': {
                    minWidth: '100%',
                },
            }}
        >
            <InputLabel>{filter.label}</InputLabel>
            <Select
                value={selectedValues}
                label={filter.label}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                displayEmpty
                renderValue={() => getDisplayText()}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            marginTop: 1, // Adds gap between button and menu
                        },
                    },
                }}
                sx={{
                    height: '100%',
                    '& .MuiSelect-select': {
                        padding: '8px 12px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                    },
                }}
            >
                {filter.options?.map((option) => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                        onClick={() => handleToggle(option.value)}
                        sx={{
                            padding: '3px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 'auto',
                            fontSize: '14px',
                            fontWeight: 400,
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <Checkbox
                            checked={selectedValues.includes(option.value)}
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        {option.label}
                    </MenuItem>
                ))}

                <Box sx={{ borderTop: '1px dashed', borderColor: 'grey.300', my: 0.5 }} />

                <MenuItem
                    sx={{
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 'auto',
                        fontSize: '14px',
                        fontWeight: 400,
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                >
                    <Box
                        onClick={handleSelectAll}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            flex: 1,
                            fontWeight: 400,
                        }}
                    >
                        <Checkbox
                            checked={selectedValues.length === filter.options?.length && selectedValues.length > 0}
                            size="small"
                        />
                        All statuses
                    </Box>

                    <Box
                        onClick={selectedValues.length === filter.options?.length ? undefined : handleReset}
                        sx={{
                            color: selectedValues.length === filter.options?.length ? 'text.disabled' : 'text.primary',
                            cursor: selectedValues.length === filter.options?.length ? 'default' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 700,
                            opacity: selectedValues.length === filter.options?.length ? 0.5 : 1,
                            padding: '4px 8px',
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: selectedValues.length === filter.options?.length ? 'transparent' : 'action.hover',
                                color: selectedValues.length === filter.options?.length ? 'text.disabled' : 'text.primary',
                            },
                        }}
                    >
                        Reset
                    </Box>
                </MenuItem>
            </Select>
        </FormControl>
    );
};

export default FilterSelect;
