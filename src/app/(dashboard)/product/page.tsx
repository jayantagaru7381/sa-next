"use client";

import React from 'react';

import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
} from '@mui/material';

const ProductPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
      Product Management
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Product Catalog
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your product inventory and catalog.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pricing & Plans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure pricing plans and product offerings.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default ProductPage;
