import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Chip,
} from '@mui/material';

interface BookingCardProps {
  bookingRef: string;
  customerName: string;
  vehicleClass: string;
  pickupDate: string;
  returnDate: string;
  location: string;
}

export function BookingCard({
  bookingRef,
  customerName,
  vehicleClass,
  pickupDate,
  returnDate,
  location,
}: BookingCardProps) {
  return (
    <Card sx={{ minWidth: 260 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            Booking Summary
          </Typography>
          <Chip label={bookingRef} size="small" color="secondary" />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <InfoRow label="Customer" value={customerName} />
          <InfoRow label="Vehicle Class" value={vehicleClass} />
          <InfoRow label="Pick-up" value={pickupDate} />
          <InfoRow label="Return" value={returnDate} />
          <InfoRow label="Location" value={location} />
        </Box>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
