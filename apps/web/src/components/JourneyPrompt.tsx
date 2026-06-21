"use client";

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { JourneyTarget } from "@handoff/contracts";
import { useJourneyRedirect } from "../hooks/useJourneyRedirect";

export default function JourneyPrompt({
  bookingId,
  journey,
}: {
  bookingId: string;
  journey: JourneyTarget;
}) {
  const { href, redirectToJourney } = useJourneyRedirect(journey);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: "primary.main",
        p: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary.main">
            Next step
          </Typography>
          <Typography variant="subtitle1" component="h3">
            {journey.label}
          </Typography>
          {journey.description ? (
            <Typography variant="body2" color="text.secondary">
              {journey.description}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            Booking {bookingId}
          </Typography>
        </Stack>
        <Button
          href={href}
          onClick={(event) => {
            event.preventDefault();
            redirectToJourney();
          }}
          variant="contained"
          size="small"
        >
          {journey.ctaLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
