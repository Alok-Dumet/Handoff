"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { journeyQueryKeys } from "../hooks/query-keys";
import {
  confirmVehicleUpgradeWorkflow,
  getVehicleUpgradeWorkflow,
  selectVehicleUpgradeWorkflow,
} from "../lib/client-api";

const statusColor = {
  not_started: "default",
  reviewing: "info",
  confirmed: "success",
} as const;

export default function VehicleUpgradeWorkflow({
  reservationId,
}: {
  reservationId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = journeyQueryKeys.vehicleUpgrade(reservationId);
  const query = useQuery({
    queryKey,
    queryFn: () => getVehicleUpgradeWorkflow(reservationId),
  });
  const selectMutation = useMutation({
    mutationFn: selectVehicleUpgradeWorkflow,
    onSuccess: (workflow) => queryClient.setQueryData(queryKey, workflow),
  });
  const confirmMutation = useMutation({
    mutationFn: () => confirmVehicleUpgradeWorkflow(reservationId),
    onSuccess: (workflow) => queryClient.setQueryData(queryKey, workflow),
  });

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }

  if (query.isError || !query.data) {
    return (
      <Alert severity="error">
        Vehicle upgrade options could not be loaded for this reservation.
      </Alert>
    );
  }

  const workflow = confirmMutation.data ?? selectMutation.data ?? query.data;
  const selectedVehicleId =
    workflow.selectedVehicleId ?? workflow.selectedOffer?.vehicleId;
  const isBusy = selectMutation.isPending || confirmMutation.isPending;

  function handleSelect(vehicleId: string) {
    selectMutation.mutate({ reservationId, vehicleId });
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip
          color={statusColor[workflow.status]}
          label={workflow.status.replaceAll("_", " ")}
        />
        <Chip label={workflow.currentVehicle.class} variant="outlined" />
        <Chip label={workflow.currentVehicle.transmission} variant="outlined" />
      </Stack>

      <Typography color="text.secondary">{workflow.message}</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Current vehicle
          </Typography>
          <Typography variant="h6">{workflow.currentVehicle.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {workflow.currentVehicle.class} class,{" "}
            {workflow.currentVehicle.seats} seats,{" "}
            {formatCurrency(workflow.currentVehicle.pricePerDay)}/day
          </Typography>
        </Stack>
      </Paper>

      <Divider />

      <Stack spacing={1}>
        <Typography variant="h6">Upgrade options</Typography>
        {workflow.offers.map((offer) => {
          const isSelected = selectedVehicleId === offer.vehicleId;

          return (
            <Paper key={offer.vehicleId} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ justifyContent: "space-between" }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1">{offer.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.class} class, {offer.transmission}, {offer.seats} seats
                    </Typography>
                  </Stack>
                  <Stack spacing={0.25} sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}>
                    <Typography variant="subtitle1">
                      {formatCurrency(offer.pricePerDay)}/day
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.deltaLabel}
                    </Typography>
                  </Stack>
                </Stack>
                <Button
                  disabled={isBusy}
                  onClick={() => handleSelect(offer.vehicleId)}
                  variant={isSelected ? "contained" : "outlined"}
                >
                  {isSelected ? "Selected" : "Choose upgrade"}
                </Button>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {workflow.selectedOffer ? (
        <Alert severity="info">
          Selected upgrade: {workflow.selectedOffer.title}.
        </Alert>
      ) : null}

      <Button
        disabled={isBusy || !workflow.selectedOffer || workflow.status === "confirmed"}
        onClick={() => confirmMutation.mutate()}
        variant="contained"
      >
        {workflow.status === "confirmed" ? "Upgrade confirmed" : "Confirm upgrade"}
      </Button>

      {workflow.confirmedAt ? (
        <Typography variant="body2" color="text.secondary">
          Confirmed at {workflow.confirmedAt}
        </Typography>
      ) : null}

      {selectMutation.isError || confirmMutation.isError ? (
        <Alert severity="error">
          Vehicle upgrade state could not be updated.
        </Alert>
      ) : null}
    </Stack>
  );
}

function formatCurrency(amountPerDay: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountPerDay);
}
