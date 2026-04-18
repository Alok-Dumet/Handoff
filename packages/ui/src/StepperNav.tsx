import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';

const STEPS = ['Pre Check-in', 'Biometric', 'Upgrade', 'E-Receipt'];

interface StepperNavProps {
  activeStep: number;
}

export function StepperNav({ activeStep }: StepperNavProps) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  return (
    <Stepper
      activeStep={activeStep}
      orientation={isMobile ? 'vertical' : 'horizontal'}
      sx={{ py: 3, px: 2 }}
    >
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
