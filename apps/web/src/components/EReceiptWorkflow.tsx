"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { journeyQueryKeys } from "../hooks/query-keys";
import {
  getEReceiptWorkflow,
  updateEReceiptDeliveryPreference,
} from "../lib/client-api";

export default function EReceiptWorkflow({
  reservationId,
}: {
  reservationId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = journeyQueryKeys.eReceipt(reservationId);
  const query = useQuery({
    queryKey,
    queryFn: () => getEReceiptWorkflow(reservationId),
  });
  const mutation = useMutation({
    mutationFn: updateEReceiptDeliveryPreference,
    onSuccess: (workflow) => queryClient.setQueryData(queryKey, workflow),
  });

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }

  if (query.isError || !query.data) {
    return (
      <Alert severity="error">
        E-receipt could not be loaded for this reservation.
      </Alert>
    );
  }

  const workflow = mutation.data ?? query.data;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip label={workflow.status.replaceAll("_", " ")} />
        <Chip label={workflow.deliveryPreference} variant="outlined" />
      </Stack>

      <Typography color="text.secondary">{workflow.message}</Typography>

      <Stack spacing={1}>
        {workflow.lineItems.map((item) => (
          <Stack
            key={item.label}
            direction="row"
            sx={{ justifyContent: "space-between" }}
            spacing={2}
          >
            <Typography>{item.label}</Typography>
            <Typography>{formatCurrency(item.amountCents)}</Typography>
          </Stack>
        ))}
      </Stack>

      <Divider />

      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography color="text.secondary">Subtotal</Typography>
        <Typography>{formatCurrency(workflow.subtotalCents)}</Typography>
      </Stack>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography color="text.secondary">Taxes</Typography>
        <Typography>{formatCurrency(workflow.taxCents)}</Typography>
      </Stack>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 700 }}>Total</Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {formatCurrency(workflow.totalCents)}
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Receipt {workflow.receiptNumber} is being delivered to{" "}
        {workflow.deliveryEmail}.
      </Typography>

      {workflow.sentAt ? (
        <Typography variant="body2" color="text.secondary">
          Sent at {workflow.sentAt}
        </Typography>
      ) : null}

      {mutation.isError ? (
        <Alert severity="error">
          E-receipt delivery preference could not be updated.
        </Alert>
      ) : null}

      <ButtonGroup>
        <Button
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              reservationId,
              deliveryPreference: "email",
            })
          }
          variant={workflow.deliveryPreference === "email" ? "contained" : "outlined"}
        >
          Email receipt
        </Button>
        <Button
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              reservationId,
              deliveryPreference: "download",
            })
          }
          variant={
            workflow.deliveryPreference === "download" ? "contained" : "outlined"
          }
        >
          Download receipt
        </Button>
      </ButtonGroup>
    </Stack>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}
