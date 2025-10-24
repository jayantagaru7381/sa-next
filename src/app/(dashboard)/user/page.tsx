"use client";


import React, { useState } from 'react';

import { TableAction, TableColumn } from '../../../types/dataTable/dataTable';
import { alpha, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

// Import theme colors
import { success, grey, secondary } from '../../../theme';
import { colors } from '../../../theme/tokens';

import HeaderSection from 'src/components/common/custom-table/header-section/HeaderSection';
import PaginationSection from 'src/components/common/custom-table/pagination-section/PaginationSection';

import DataTable from '../../../components/common/custom-table/data-table/DataTable';

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '14px',
    height: 36,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    borderRadius: 6,
    fontSize: '12px',
    fontWeight: 600,
}));

interface Company {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    type: string;
    owner: string;
    location: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    title: string;
    status: 'active' | 'invited' | 'pending' | 'Deactivated' | 'Not invited';
    action: 'invite' | 'in_platform' | 'invited';
    access: 'Admin' | 'User' | 'Viewer' | 'Manager';
}

const UserPage: React.FC = () => {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('acme-company');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
    // Filter configuration
    const filters = [
        {
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: 'active', label: 'Active' },
                { value: 'Not invited', label: 'Not invited' },
                { value: 'Deactivated', label: 'Deactivated' },
                { value: 'invited', label: 'Invited' },
                { value: 'pending', label: 'Pending' },
            ],
        },
    ];

    // Table configuration
    const columns: TableColumn<User>[] = [
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            render: (value: any, row: User) => (
                <Box>
                    <Typography variant="body2" fontWeight={500}>
                        {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.email}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'title',
            label: 'Title',
            sortable: true,
        },
        {
            id: 'access',
            label: 'Access',
            sortable: true,
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
        }
    ];

    const actions: TableAction<User>[] = [
        {
            label: 'Invite user',
            onClick: (user: User) => {
                console.log('Button type: Not invited, User ID:', user.id);
                return { buttonType: 'Not invited', userId: user.id };
            },
            variant: 'contained',
            show: (user: User) => user.status === 'Not invited',
        },
        {
            label: 'Activate',
            onClick: (user: User) => {
                console.log('Button type: Deactivated, User ID:', user.id);
                return { buttonType: 'Deactivated', userId: user.id };
            },
            variant: 'contained',
            show: (user: User) => user.status === 'Deactivated',
        },
    ];

    // Mock data
    const companies: Company[] = [
        {
            id: 'acme-company',
            name: 'Acme company',
            status: 'active',
            type: 'CPA firm',
            owner: 'John Smith',
            location: 'New York, NY',
        },
        {
            id: 'beta-solutions',
            name: 'Beta Solutions',
            status: 'active',
            type: 'Tech company',
            owner: 'Jane Doe',
            location: 'San Francisco, CA',
        },
        {
            id: 'gamma-industries',
            name: 'Gamma Industries',
            status: 'active',
            type: 'Manufacturing',
            owner: 'Bob Johnson',
            location: 'Chicago, IL',
        },
        {
            id: 'delta-enterprises',
            name: 'Delta Enterprises',
            status: 'inactive',
            type: 'Consulting',
            owner: 'Alice Brown',
            location: 'Boston, MA',
        },
        {
            id: 'echo-systems',
            name: 'Echo Systems',
            status: 'active',
            type: 'Software',
            owner: 'Charlie Wilson',
            location: 'Seattle, WA',
        },
    ];

    const users: User[] = [
        {
            id: 'user-1',
            name: 'Jayvion Simon',
            email: 'nannie.abernathy70@yahoo.com',
            title: 'Salesperson',
            status: 'Not invited',
            action: 'invite',
            access: 'User',
        },
        {
            id: 'user-2',
            name: 'Jayvion Simon',
            email: 'nannie.abernathy70@yahoo.com',
            title: 'Salesperson',
            status: 'active',
            action: 'in_platform',
            access: 'Manager',
        },
        {
            id: 'user-3',
            name: 'Jayvion Simon',
            email: 'nannie.abernathy70@yahoo.com',
            title: 'Salesperson',
            status: 'active',
            action: 'invite',
            access: 'User',
        },
        {
            id: 'user-4',
            name: 'Jayvion Simon',
            email: 'nannie.abernathy70@yahoo.com',
            title: 'Salesperson',
            status: 'Deactivated',
            action: 'invited',
            access: 'Viewer',
        },
        {
            id: 'user-5',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@acme.com',
            title: 'Marketing Manager',
            status: 'invited',
            action: 'invited',
            access: 'Admin',
        },
        {
            id: 'user-6',
            name: 'Mike Chen',
            email: 'mike.chen@acme.com',
            title: 'Developer',
            status: 'pending',
            action: 'invite',
            access: 'User',
        },
        {
            id: 'user-7',
            name: 'Jayanta Garu',
            email: 'jayanta.garu@acme.com',
            title: 'Developer',
            status: 'pending',
            action: 'invite',
            access: 'User',
        },
    ];

    const selectedCompany = companies.find(company => company.id === selectedCompanyId);

    // Filter users based on search and status
    const filteredUsers = users?.filter(user => {
        const matchesSearch = user?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
            user?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
            user?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase());

        const matchesStatus = !filterValues.status ||
            (Array.isArray(filterValues.status) ? filterValues.status.length === 0 : filterValues.status === '') ||
            (Array.isArray(filterValues.status) ? filterValues.status.includes(user.status) : user.status === filterValues.status);

        return matchesSearch && matchesStatus;
    });

    // Calculate pagination values
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    // Get paginated data
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Create HeaderSection component
    const headerSectionComponent = (
        <HeaderSection
            title="Users"
            subtitle="Manage users and their access"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(key, value) => {
                console.log('key', key);
                console.log('value', value);
                setFilterValues(prev => ({ ...prev, [key]: value }));
                setCurrentPage(0); // Reset to first page when filtering
            }}
            showSearch
            showFilters
            searchLoading={false}
        />
    );

    // Create PaginationSection component
    const paginationSectionComponent = (
        <PaginationSection
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(0); // Reset to first page when changing items per page
            }}
            showRowsPerPage
            showPageInfo
            showNavigation
            rowsPerPageOptions={[5, 10, 25, 50]}
            rowsPerPagePosition="right"
        />
    );
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return { bgcolor: alpha(success.main, 0.1), color: success.main, height: 20 };
            case 'invited':
                return { bgcolor: colors.secondary.invitedBackground, color: secondary.main, height: 20 };
            case 'Not invited':
            case 'Deactivated':
                return { bgcolor: alpha(grey[200], 0.3), color: grey[600], height: 20 };
            default:
                return { bgcolor: alpha(grey[400], 0.1), color: grey[400], height: 20 };
        }
    };


    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>

            {/* Company Details Panel */}
            {selectedCompany && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Breadcrumbs */}
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Breadcrumbs separator="›" sx={{ mb: 2 }}>
                            <Link color="text.secondary" href="#" underline="hover">
                                Dashboard
                            </Link>
                            <Link color="text.secondary" href="#" underline="hover">
                                Management
                            </Link>
                            <Typography color="text.primary">{selectedCompany.name}</Typography>
                        </Breadcrumbs>

                        {/* Company Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                    {selectedCompany.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <StyledChip
                                        label={selectedCompany.status}
                                        sx={{
                                            ...getStatusColor(selectedCompany.status),
                                            textTransform: 'capitalize',
                                        }}
                                    />
                                    <StyledChip
                                        label={selectedCompany.type}
                                        variant="outlined"
                                        sx={{
                                            borderColor: 'divider',
                                            color: 'text.secondary',
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Account owner: <Link href="#" onClick={() => console.log('Contact owner')}>{selectedCompany.owner}</Link>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Location: {selectedCompany.location}
                                    </Typography>
                                </Box>
                            </Box>
                            <StyledButton
                                variant="outlined"
                                color="error"
                                startIcon={
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M3 6H5H21"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                }
                                onClick={() => console.log('Deactivate company:', selectedCompany.id)}
                            >
                                Deactivate company
                            </StyledButton>
                        </Box>

                        {/* Tabs */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            {[
                                { id: 'users', label: 'Users', icon: '👤' },
                                { id: 'preferences', label: 'Preferences', icon: '⚙️' },
                                { id: 'activity', label: 'Activity / History', icon: '🕐', badge: 1 },
                                { id: 'tab4', label: 'Tab 4', icon: '📄' },
                            ].map((tab) => (
                                <Box
                                    key={tab.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: 'pointer',
                                        borderBottom: tab.id === 'users' ? 2 : 1,
                                        borderColor: tab.id === 'users' ? 'primary.main' : 'transparent',
                                        pb: 1,
                                        px: 1,
                                    }}
                                >
                                    <Typography sx={{ fontSize: '16px' }}>{tab.icon}</Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: tab.id === 'users' ? 600 : 400,
                                            color: tab.id === 'users' ? 'primary.main' : 'text.secondary',
                                        }}
                                    >
                                        {tab.label}
                                    </Typography>
                                    {tab.badge && (
                                        <StyledChip
                                            label={tab.badge}
                                            size="small"
                                            sx={{
                                                height: 16,
                                                minWidth: 16,
                                                fontSize: '10px',
                                                bgcolor: 'error.main',
                                                color: 'white',
                                            }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Users Tab Content */}
                    <Box sx={{ flex: 1, mt: 2, mr: 2, ml: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: `0px 2px 8px ${alpha(grey[900], 0.1)}` }}>
                        {/* Fixed Header Section */}
                        <Box sx={{ flexShrink: 0 }}>
                            {headerSectionComponent}
                        </Box>

                        {/* Scrollable Table Content */}
                        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <DataTable
                                data={paginatedUsers}
                                columns={columns}
                                actions={actions}
                                selectable
                            />
                        </Box>

                        {/* Fixed Pagination Section */}
                        <Box sx={{ flexShrink: 0 }}>
                            {paginationSectionComponent}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default UserPage;