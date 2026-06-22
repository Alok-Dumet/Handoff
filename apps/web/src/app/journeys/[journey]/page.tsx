import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import type { JourneyType } from "@handoff/contracts";
import EReceiptWorkflow from "../../../components/EReceiptWorkflow";
import IdentityVerificationWorkflow from "../../../components/IdentityVerificationWorkflow";
import PreCheckInWorkflow from "../../../components/PreCheckInWorkflow";
import VehicleUpgradeWorkflow from "../../../components/VehicleUpgradeWorkflow";
import { requireSignedIn } from "../../../lib/server-auth";

const journeyTypes: JourneyType[] = [
  "pre-check-in",
  "biometric",
  "e-receipt",
  "vehicle-upgrade",
];

const journeyPageContent = {
  "pre-check-in": {
    label: "Pre-check-in",
    heading: "Confirm trip details",
    intro:
      "Review driver and pickup details before arrival so the counter handoff is faster.",
    body: "Verify the reservation details, update contact information, and make sure the pickup plan is correct before you arrive.",
    primaryActionLabel: "Complete pre-check-in",
  },
  biometric: {
    label: "Biometric verification",
    heading: "Verify identity",
    intro:
      "Complete identity verification before pickup to reduce manual checks at the branch.",
    body: "Use the provider handoff to finish identity verification, then return here to review the current state.",
    primaryActionLabel: "Start provider handoff",
  },
  "e-receipt": {
    label: "E-receipt",
    heading: "Review receipt",
    intro:
      "Review rental charges, taxes, and receipt delivery preferences for this reservation.",
    body: "The receipt reflects the current reservation pricing and can be sent by email or marked for download.",
    primaryActionLabel: "Update delivery preference",
  },
  "vehicle-upgrade": {
    label: "Vehicle upgrade",
    heading: "Review upgrade options",
    intro:
      "Compare eligible vehicle upgrades and choose whether to keep or change your reservation class.",
    body: "Select a higher-tier vehicle option to review the upgrade and confirm the new reservation class.",
    primaryActionLabel: "Choose upgrade",
  },
} satisfies Record<
  JourneyType,
  {
    label: string;
    heading: string;
    intro: string;
    body: string;
    primaryActionLabel: string;
  }
>;

type JourneyPageParams = {
  journey: string;
};

export function generateStaticParams() {
  return journeyTypes.map((journey) => ({ journey }));
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

  const page = journeyPageContent[journey];

  return {
    title: page.label,
  };
}

export default async function JourneyPage({
  params,
  searchParams,
}: {
  params: Promise<JourneyPageParams>;
  searchParams: Promise<{ reservationId?: string }>;
}) {
  const { journey } = await params;
  const { reservationId } = await searchParams;

  if (!isJourneyType(journey)) {
    notFound();
  }

  await requireSignedIn(
    reservationId
      ? `/journeys/${journey}?reservationId=${encodeURIComponent(reservationId)}`
      : `/journeys/${journey}`,
  );

  const page = journeyPageContent[journey];

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
          <Typography variant="button" color="text.secondary">
            {page.primaryActionLabel}
          </Typography>
          <Typography color="text.secondary">{page.intro}</Typography>
          <Typography>{page.body}</Typography>
          {journey === "pre-check-in" ? (
            <PreCheckInWorkflow
              reservationId={reservationId ?? "local-reservation"}
            />
          ) : journey === "biometric" ? (
            <IdentityVerificationWorkflow
              reservationId={reservationId ?? "local-reservation"}
            />
          ) : journey === "e-receipt" ? (
            <EReceiptWorkflow
              reservationId={reservationId ?? "local-reservation"}
            />
          ) : journey === "vehicle-upgrade" ? (
            <VehicleUpgradeWorkflow
              reservationId={reservationId ?? "local-reservation"}
            />
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
}

function isJourneyType(value: string): value is JourneyType {
  return journeyTypes.includes(value as JourneyType);
}
