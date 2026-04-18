'use client';

import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ContentBanner } from '@handoff/ui';
import { useAemContent, useBooking, useVehicles } from '@handoff/hooks';
import { useJourney } from '@/context/JourneyContext';

export default function ReceiptPage() {
  const { content, isLoading: contentLoading } = useAemContent('e-receipt');
  const { booking } = useBooking('default');
  const { vehicles } = useVehicles();
  const { selectedVehicleId, formData, biometricConsented } = useJourney();

  const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId);

  const handlePrint = () => {
    window.print();
  };

  const maskedDocumentNumber = formData.documentNumber
    ? `••••${formData.documentNumber.slice(-4)}`
    : '-';

  return (
    <Box>
      {contentLoading ? (
        <CircularProgress />
      ) : (
        content && (
          <ContentBanner
            title={content.title}
            body={content.body}
            imageUrl={content.imageUrl}
          />
        )
      )}

      <Alert severity="success" sx={{ mb: 3 }}>
        Your check-in is complete! A confirmation email has been sent to{' '}
        <strong>{formData.emailConfirmation || 'your email address'}</strong>.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Typography variant="h6" gutterBottom>
          E-Receipt
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {booking && (
            <>
              <ReceiptRow label="Booking Reference" value={booking.bookingRef} />
              <ReceiptRow label="Customer" value={booking.customerName} />
              <ReceiptRow label="Pick-up Date" value={booking.pickupDate} />
              <ReceiptRow label="Return Date" value={booking.returnDate} />
              <ReceiptRow label="Location" value={booking.location} />
            </>
          )}

          <Divider sx={{ my: 1 }} />

          {selectedVehicle ? (
            <>
              <ReceiptRow label="Selected Vehicle" value={selectedVehicle.name} />
              <ReceiptRow label="Vehicle Class" value={selectedVehicle.class} />
              <ReceiptRow label="Price per Day" value={`$${selectedVehicle.pricePerDay}`} />
            </>
          ) : (
            <ReceiptRow label="Vehicle" value={booking?.vehicleClass || 'Original booking'} />
          )}

          <Divider sx={{ my: 1 }} />
          <ReceiptRow
            label="Biometric Consent"
            value={biometricConsented === true ? 'Granted' : biometricConsented === false ? 'Declined' : 'Not provided'}
          />
          <ReceiptRow label="Check-in Name" value={formData.fullName || '-'} />
          <ReceiptRow label="Document Number" value={maskedDocumentNumber} />
        </Box>
      </Paper>

      <Button variant="contained" color="primary" onClick={handlePrint}>
        Print Receipt
      </Button>
    </Box>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
