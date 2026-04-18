import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Button,
} from '@mui/material';

interface VehicleCardProps {
  name: string;
  class: string;
  pricePerDay: number;
  features: string[];
  imageUrl: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function VehicleCard({
  name,
  class: vehicleClass,
  pricePerDay,
  features,
  imageUrl,
  isSelected,
  onSelect,
}: VehicleCardProps) {
  return (
    <Card
      sx={{
        position: 'relative',
        border: isSelected ? '2px solid' : '2px solid transparent',
        borderColor: isSelected ? 'secondary.main' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(10, 22, 40, 0.15)',
          transform: 'translateY(-2px)',
        },
      }}
      onClick={onSelect}
    >
      {isSelected && (
        <Chip
          label="Selected"
          color="secondary"
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
        />
      )}
      <CardMedia
        component="img"
        height="160"
        image={imageUrl}
        alt={name}
        sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {name}
        </Typography>
        <Chip label={vehicleClass} size="small" sx={{ mb: 1 }} />
        <Typography variant="h5" color="secondary.main" sx={{ my: 1 }}>
          ${pricePerDay}
          <Typography component="span" variant="body2" color="text.secondary">
            /day
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {features.map((feature) => (
            <Chip key={feature} label={feature} size="small" variant="outlined" />
          ))}
        </Box>
        <Button
          variant={isSelected ? 'contained' : 'outlined'}
          color={isSelected ? 'secondary' : 'primary'}
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </CardContent>
    </Card>
  );
}
