"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IdentityVerificationStatus } from "@handoff/contracts";
import { journeyQueryKeys } from "../hooks/query-keys";
import {
  getIdentityVerificationWorkflow,
  startIdentityVerificationWorkflow,
  updateIdentityVerificationStatus,
} from "../lib/client-api";

const statusColor = {
  not_started: "default",
  handoff_created: "info",
  pending_review: "warning",
  verified: "success",
  failed: "error",
} as const;

export default function IdentityVerificationWorkflow({
  reservationId,
}: {
  reservationId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = journeyQueryKeys.identityVerification(reservationId);
  const query = useQuery({
    queryKey,
    queryFn: () => getIdentityVerificationWorkflow(reservationId),
  });
  const startMutation = useMutation({
    mutationFn: startIdentityVerificationWorkflow,
    onSuccess: (workflow) => queryClient.setQueryData(queryKey, workflow),
  });
  const statusMutation = useMutation({
    mutationFn: updateIdentityVerificationStatus,
    onSuccess: (workflow) => queryClient.setQueryData(queryKey, workflow),
  });

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }

  if (query.isError || !query.data) {
    return (
      <Alert severity="error">
        Identity verification could not be loaded for this reservation.
      </Alert>
    );
  }

  const workflow = query.data;
  const isBusy = startMutation.isPending || statusMutation.isPending;

  function updateStatus(status: Exclude<IdentityVerificationStatus, "not_started">) {
    statusMutation.mutate({ reservationId, status });
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip
          color={statusColor[workflow.status]}
          label={workflow.status.replaceAll("_", " ")}
        />
        <Chip label={workflow.provider} variant="outlined" />
      </Stack>

      <Typography color="text.secondary">{workflow.message}</Typography>

      {workflow.providerReference ? (
        <Typography variant="body2">
          Provider reference: {workflow.providerReference}
        </Typography>
      ) : null}

      {workflow.handoffUrl ? (
        <Alert severity="info">
          Provider handoff is ready:{" "}
          <Link href={workflow.handoffUrl} target="_blank" rel="noreferrer">
            open local provider handoff
          </Link>
        </Alert>
      ) : null}

      <Divider />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          disabled={isBusy || workflow.status !== "not_started"}
          onClick={() => startMutation.mutate({ reservationId })}
          variant="contained"
        >
          Start provider handoff
        </Button>
        <Button
          disabled={isBusy || workflow.status === "not_started"}
          onClick={() => updateStatus("pending_review")}
          variant="outlined"
        >
          Mark pending review
        </Button>
        <Button
          color="success"
          disabled={isBusy || workflow.status === "not_started"}
          onClick={() => updateStatus("verified")}
          variant="outlined"
        >
          Mark verified
        </Button>
        <Button
          color="error"
          disabled={isBusy || workflow.status === "not_started"}
          onClick={() => updateStatus("failed")}
          variant="outlined"
        >
          Mark failed
        </Button>
      </Stack>

      {startMutation.isError || statusMutation.isError ? (
        <Alert severity="error">
          Identity verification state could not be updated.
        </Alert>
      ) : null}
    </Stack>
  );
}
