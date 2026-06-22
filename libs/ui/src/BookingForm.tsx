import type { FormEvent } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { CreateBooking } from "@handoff/contracts";

export type BookingFormValues = Pick<
  CreateBooking,
  "customerName" | "customerEmail" | "startDate" | "endDate"
>;

export type BookingFormProps = {
  defaultStartDate: string;
  defaultEndDate: string;
  isSubmitting?: boolean;
  onSubmit: (values: BookingFormValues) => void;
};

export function BookingForm({
  defaultStartDate,
  defaultEndDate,
  isSubmitting = false,
  onSubmit,
}: BookingFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={1.5} sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          name="customerName"
          label="Name"
          size="small"
          required
          fullWidth
        />
        <TextField
          name="customerEmail"
          label="Email"
          type="email"
          size="small"
          required
          fullWidth
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 1fr) minmax(0, 1fr) auto",
          },
          gap: 1,
          alignItems: "stretch",
        }}
      >
        <TextField
          name="startDate"
          label="Start"
          type="date"
          defaultValue={defaultStartDate}
          size="small"
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          name="endDate"
          label="End"
          type="date"
          defaultValue={defaultEndDate}
          size="small"
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ minWidth: 128 }}
        >
          {isSubmitting ? "Reserving" : "Reserve"}
        </Button>
      </Box>
    </Stack>
  );
}
