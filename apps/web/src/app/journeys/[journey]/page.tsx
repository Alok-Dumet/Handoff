import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import type { JourneyType } from "@handoff/contracts";

const journeyPages = {
  "pre-check-in": {
    label: "Pre-check-in",
    heading: "Confirm trip details",
    body: "Review driver and pickup details before arrival so the counter handoff is faster.",
  },
  biometric: {
    label: "Biometric verification",
    heading: "Verify identity",
    body: "Complete identity verification before pickup to reduce manual checks at the branch.",
  },
  "e-receipt": {
    label: "E-receipt",
    heading: "Review receipt",
    body: "Review rental charges, taxes, and receipt delivery preferences for this reservation.",
  },
  "vehicle-upgrade": {
    label: "Vehicle upgrade",
    heading: "Review upgrade options",
    body: "Compare eligible vehicle upgrades and choose whether to keep or change your reservation class.",
  },
} satisfies Record<JourneyType, { label: string; heading: string; body: string }>;

type JourneyPageParams = {
  journey: string;
};

export function generateStaticParams() {
  return Object.keys(journeyPages).map((journey) => ({ journey }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<JourneyPageParams>;
}) {
  const { journey } = await params;

  if (!isJourneyType(journey)) {
    return {};
  }

  return {
    title: journeyPages[journey].label,
  };
}

export default async function JourneyPage({
  params,
}: {
  params: Promise<JourneyPageParams>;
}) {
  const { journey } = await params;

  if (!isJourneyType(journey)) {
    notFound();
  }

  const page = journeyPages[journey];

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="overline" color="primary.main">
            {page.label}
          </Typography>
          <Typography variant="h4" component="h1">
            {page.heading}
          </Typography>
          <Typography color="text.secondary">{page.body}</Typography>
          <Button href="/" variant="contained">
            Back to vehicles
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function isJourneyType(value: string): value is JourneyType {
  return value in journeyPages;
}
