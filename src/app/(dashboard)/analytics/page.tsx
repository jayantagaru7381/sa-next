"use client";

import React from 'react';

import {
  Box,
  Card,
  Grid,
  Paper,
  Typography,
  CardContent,
} from '@mui/material';

const AnalyticsPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
      Analytics
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Performance Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View detailed analytics and performance metrics for your business operations.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Usage Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track user engagement and system usage patterns.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is where your analytics charts and data visualizations will be displayed.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default AnalyticsPage;
