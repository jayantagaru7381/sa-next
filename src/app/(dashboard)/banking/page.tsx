"use client";

import React from 'react';

import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
} from '@mui/material';

const BankingPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
      Banking
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Account Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your account balances and recent transactions.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Payment Methods
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your payment methods and billing information.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Financial Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access detailed financial reports and statements.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default BankingPage;
