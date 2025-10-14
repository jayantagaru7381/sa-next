import React from 'react';

import { Box, LinearProgress } from '@mui/material';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  height?: number;
  borderRadius?: number;
  sx?: object;
}

export default function ProgressBar({ 
  currentStep, 
  totalSteps, 
  height = 2, 
  borderRadius = 1,
  sx = {}
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Box
      sx={{
        width: '100%',
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        backgroundColor: 'rgba(145, 158, 171, 0.2)',
        ...sx
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: '100%',
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(135deg, var(--primary-light, #70A5FF) 0%, var(--primary-main, #0067FF) 100%)',
            borderRadius: `${borderRadius}px`,
          }
        }}
      />
    </Box>
  );
}
