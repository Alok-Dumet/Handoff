import type { MouseEventHandler } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { JourneyTarget } from "@handoff/contracts";

export type JourneyPromptProps = {
  bookingId: string;
  journey: JourneyTarget;
  href?: string;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
};

export function JourneyPrompt({
  bookingId,
  journey,
  href = journey.path,
  onNavigate,
}: JourneyPromptProps) {
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
        <Button href={href} onClick={onNavigate} variant="contained" size="small">
          {journey.ctaLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
