import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface ContentBannerProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

export function ContentBanner({
  title,
  body,
  ctaLabel,
  ctaUrl,
  imageUrl,
}: ContentBannerProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        gap: 3,
        p: 4,
        mb: 3,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          sx={{
            width: { xs: '100%', md: 200 },
            height: { xs: 160, md: 140 },
            objectFit: 'cover',
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main' }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ mb: ctaLabel ? 2 : 0, opacity: 0.9 }}>
          {body}
        </Typography>
        {ctaLabel && ctaUrl && (
          <Button
            variant="contained"
            color="secondary"
            href={ctaUrl}
            sx={{ mt: 1 }}
          >
            {ctaLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
