'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useCustomer } from '@handoff/hooks';
import { useJourney } from '@/context/JourneyContext';
import { useRouter } from 'next/navigation';

export default function BiometricPage() {
  const router = useRouter();
  const { customer, isLoading } = useCustomer('cust-001');
  const { setBiometricConsented } = useJourney();

  const handleConsent = (consented: boolean) => {
    setBiometricConsented(consented);
    router.push('/journey/upgrade');
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Biometric Consent
      </Typography>

      {customer && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Welcome, <strong>{customer.name}</strong>. Loyalty tier:{' '}
          <strong>{customer.loyaltyTier}</strong>
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }} elevation={0}>
        <Typography variant="h6" gutterBottom>
          Biometric Data Usage Consent
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          In accordance with GDPR Article 9, we request your explicit consent to process
          your biometric data for identity verification purposes at the vehicle collection
          point. This data will be:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            Used solely for identity verification during vehicle pick-up
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            Encrypted and stored securely for the duration of your rental period
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            Permanently deleted within 24 hours of vehicle return
          </Typography>
          <Typography component="li" variant="body2">
            Not shared with any third parties
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          You may decline this consent without affecting your booking. If declined,
          standard ID verification will be performed at the counter.
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={() => handleConsent(true)}
        >
          I Consent
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => handleConsent(false)}
        >
          Skip for Now
        </Button>
      </Box>
    </Box>
  );
}
