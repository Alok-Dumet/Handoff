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
import { getAemJourneyPageContent } from "../../../lib/server-api";

const journeyTypes: JourneyType[] = [
  "pre-check-in",
  "biometric",
  "e-receipt",
  "vehicle-upgrade",
];

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

  const page = await getAemJourneyPageContent(journey);

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

  const page = await getAemJourneyPageContent(journey);

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
