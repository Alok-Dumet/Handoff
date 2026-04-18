'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { ContentBanner } from '@handoff/ui';
import { useAemContent } from '@handoff/hooks';
import { useJourney } from '@/context/JourneyContext';
import { useRouter } from 'next/navigation';

export default function PreCheckinPage() {
  const router = useRouter();
  const { content, isLoading: contentLoading } = useAemContent('pre-checkin');
  const { formData, setCheckinFormData, setSessionToken } = useJourney();

  const [form, setForm] = useState({
    fullName: formData.fullName || '',
    dateOfBirth: formData.dateOfBirth || '',
    documentNumber: formData.documentNumber || '',
    emailConfirmation: formData.emailConfirmation || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const bffUrl = process.env.NEXT_PUBLIC_BFF_URL;
      const res = await fetch(`${bffUrl}/api/auth/session`, { method: 'POST' });
      const data = await res.json();

      setCheckinFormData(form);
      setSessionToken(data.token);
      router.push('/journey/biometric');
    } catch {
      setSubmitting(false);
    }
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
        Pre Check-In Details
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 500 }}>
        <TextField
          label="Full Name"
          value={form.fullName}
          onChange={handleChange('fullName')}
          required
          fullWidth
        />
        <TextField
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={handleChange('dateOfBirth')}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Passport / Driving Licence Number"
          value={form.documentNumber}
          onChange={handleChange('documentNumber')}
          required
          fullWidth
        />
        <TextField
          label="Email Confirmation"
          type="email"
          value={form.emailConfirmation}
          onChange={handleChange('emailConfirmation')}
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="secondary"
          size="large"
          disabled={submitting}
          sx={{ mt: 1 }}
        >
          {submitting ? 'Submitting...' : 'Continue to Biometric'}
        </Button>
      </Box>
    </Box>
  );
}
