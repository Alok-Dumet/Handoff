'use client';

import React from 'react';
import { Box, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { ContentBanner, VehicleCard } from '@handoff/ui';
import { useAemContent, useVehicles } from '@handoff/hooks';
import { useJourney } from '@/context/JourneyContext';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const router = useRouter();
  const { content, isLoading: contentLoading } = useAemContent('vehicle-upgrade');
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { selectedVehicleId, setSelectedVehicleId } = useJourney();

  const handleConfirm = () => {
    router.push('/journey/receipt');
  };

  return (
    <Box>
      {contentLoading ? (
        <CircularProgress />
      ) : (
        content && (
          <ContentBanner
            title={content.title}
            body={content.body}
            ctaLabel={content.ctaLabel}
            imageUrl={content.imageUrl}
          />
        )
      )}

      <Typography variant="h5" sx={{ mb: 3 }}>
        Choose Your Vehicle
      </Typography>

      {vehiclesLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {vehicles?.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <VehicleCard
                name={vehicle.name}
                class={vehicle.class}
                pricePerDay={vehicle.pricePerDay}
                features={vehicle.features}
                imageUrl={`https://via.placeholder.com/400x200?text=${encodeURIComponent(vehicle.name)}`}
                isSelected={selectedVehicleId === vehicle.id}
                onSelect={() => setSelectedVehicleId(vehicle.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleConfirm}
          disabled={!selectedVehicleId}
        >
          Confirm Upgrade
        </Button>
      </Box>
    </Box>
  );
}
