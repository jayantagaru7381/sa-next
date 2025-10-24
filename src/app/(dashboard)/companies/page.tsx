"use client";

import type { TableAction, TableColumn } from '../../../types/dataTable/dataTable';

import React, { useState } from 'react';

import { alpha, styled } from '@mui/material/styles';
import {
  Box,
  Chip,
  Link,
  List,
  Button,
  Divider,
  ListItem,
  TextField,
  Typography,
  Breadcrumbs,
  ListItemText,
  InputAdornment,
  ListItemButton,
} from '@mui/material';

import DataTable from '../../../components/common/custom-table/data-table/DataTable';
import HeaderSection from '../../../components/common/custom-table/header-section/HeaderSection';
import PaginationSection from '../../../components/common/custom-table/pagination-section/PaginationSection';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '14px',
  height: 36,
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  margin: '2px 0',
  padding: '8px 12px',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: 6,
  height: 24,
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
  status: 'active' | 'invited' | 'pending';
  action: 'invite' | 'in_platform' | 'invited';
}

const CompaniesPage: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('acme-company');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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
      id: 'status',
      label: 'Status',
      sortable: true,
    },
  ];

  const actions: TableAction<User>[] = [
    {
      label: 'Invite user',
      onClick: (user: User) => console.log('Invite user:', user.id),
      variant: 'contained',
      show: (user: User) => user.status === 'active',
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
      status: 'active',
      action: 'invite',
    },
    {
      id: 'user-2',
      name: 'Jayvion Simon',
      email: 'nannie.abernathy70@yahoo.com',
      title: 'Salesperson',
      status: 'active',
      action: 'in_platform',
    },
    {
      id: 'user-3',
      name: 'Jayvion Simon',
      email: 'nannie.abernathy70@yahoo.com',
      title: 'Salesperson',
      status: 'active',
      action: 'invite',
    },
    {
      id: 'user-4',
      name: 'Jayvion Simon',
      email: 'nannie.abernathy70@yahoo.com',
      title: 'Salesperson',
      status: 'active',
      action: 'invited',
    },
    {
      id: 'user-5',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@acme.com',
      title: 'Marketing Manager',
      status: 'invited',
      action: 'invited',
    },
    {
      id: 'user-6',
      name: 'Mike Chen',
      email: 'mike.chen@acme.com',
      title: 'Developer',
      status: 'pending',
      action: 'invite',
    },
  ];

  const selectedCompany = companies.find(company => company.id === selectedCompanyId);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Create HeaderSection component
  const headerSectionComponent = (
    <HeaderSection
      title="Users"
      subtitle="Manage users and their access"
      searchPlaceholder="Search users..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
        setCurrentPage(0); // Reset to first page when filtering
      }}
      showSearch
      showFilters
      customContent={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small">
            Export
          </Button>
          <Button variant="contained" size="small">
            Add User
          </Button>
        </Box>
      }
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
    />
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' };
      case 'invited':
        return { bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' };
      default:
        return { bgcolor: alpha('#9e9e9e', 0.1), color: '#9e9e9e' };
    }
  };


  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
      {/* Company List Panel */}
      <Box
        sx={{
          width: 300,
          height: '100%',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '18px',
              color: 'text.primary',
              mb: 2,
            }}
          >
            Companies
          </Typography>

          {/* Search */}
          <StyledTextField
            fullWidth
            placeholder="Search..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </InputAdornment>
              ),
            }}
          />

          {/* Add Company Button */}
          <StyledButton
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => console.log('Add company clicked')}
          >
            Add companies
          </StyledButton>
        </Box>

        {/* Company Count */}
        <Box sx={{ px: 3, py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {filteredCompanies.length} COMPANIES
          </Typography>
        </Box>

        {/* Company List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense sx={{ px: 2, py: 1 }}>
            {filteredCompanies.map((company, index) => (
              <React.Fragment key={company.id}>
                <ListItem disablePadding>
                  <StyledListItemButton
                    selected={selectedCompanyId === company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                  >
                    <ListItemText
                      primary={company.name}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '14px',
                          fontWeight: selectedCompanyId === company.id ? 600 : 400,
                        },
                      }}
                    />
                  </StyledListItemButton>
                </ListItem>
                {index < filteredCompanies.length - 1 && (
                  <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Box>

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
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Box sx={{ mb: 3 }}>
              {/* Users Table */}
              <DataTable
                data={users}
                columns={columns}
                actions={actions}

                // Pass components as props
                headerSectionComponent={headerSectionComponent}
                paginationSectionComponent={paginationSectionComponent}

                // Control display with flags
                showDefaultHeader={false}      // Don't show default header
                showDefaultPagination={false}  // Don't show default pagination

                // Other props
                selectable
                pageSize={itemsPerPage}
                pagination={false}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CompaniesPage;