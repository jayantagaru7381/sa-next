"use client";

import React from 'react';

import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
} from '@mui/material';

const BookingPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
      Booking
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Schedule Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage appointments and schedule bookings for your services.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Calendar View
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your calendar and upcoming appointments.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default BookingPage;
