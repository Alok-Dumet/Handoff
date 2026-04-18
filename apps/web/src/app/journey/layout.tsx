'use client';

import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import { StepperNav, BookingCard } from '@handoff/ui';
import { useBooking } from '@handoff/hooks';
import { JourneyProvider, useJourney } from '@/context/JourneyContext';
import { usePathname } from 'next/navigation';

const STEP_ROUTES = ['/journey/pre-checkin', '/journey/biometric', '/journey/upgrade', '/journey/receipt'];

function JourneyLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setCurrentStep } = useJourney();
  const { booking, isLoading } = useBooking('default');

  const activeStep = STEP_ROUTES.findIndex((route) => pathname.startsWith(route));
  const currentStepIndex = activeStep >= 0 ? activeStep : 0;

  React.useEffect(() => {
    setCurrentStep(currentStepIndex);
  }, [currentStepIndex, setCurrentStep]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ mb: 3, px: 2 }} elevation={0}>
        <StepperNav activeStep={currentStepIndex} />
      </Paper>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>{children}</Box>

        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          {!isLoading && booking && (
            <BookingCard
              bookingRef={booking.bookingRef}
              customerName={booking.customerName}
              vehicleClass={booking.vehicleClass}
              pickupDate={booking.pickupDate}
              returnDate={booking.returnDate}
              location={booking.location}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <JourneyProvider>
      <JourneyLayoutInner>{children}</JourneyLayoutInner>
    </JourneyProvider>
  );
}
