"use client";

import React from 'react';

import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
} from '@mui/material';

const FilePage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
      File Management
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Document Storage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload and manage your documents and files.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              File Sharing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share files with team members and clients.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default FilePage;
