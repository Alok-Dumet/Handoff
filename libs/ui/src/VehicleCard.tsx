"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { VehicleSummary } from "@handoff/contracts";

export type VehicleCardProps = {
  vehicle: VehicleSummary;
  actions?: ReactNode;
};

/**
 * Dark-theme vehicle card. The header is an intentional abstract treatment
 * (gradient + large class watermark) rather than a placeholder photo blob,
 * so it reads as designed rather than as a missing image.
 */
export function VehicleCard({ vehicle, actions }: VehicleCardProps) {
  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha("#f4f7f3", 0.12),
        backgroundColor: alpha("#101821", 0.85),
        backgroundImage:
          "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
        boxShadow: `0 22px 60px ${alpha("#000000", 0.32)}`,
        transition:
          "transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: alpha(theme.palette.primary.main, 0.4),
          boxShadow: `0 30px 80px ${alpha("#000000", 0.45)}`,
        },
      })}
    >
      {/* Header band: gradient wash + large class watermark */}
      <Box
        sx={(theme) => ({
          position: "relative",
          height: 112,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          px: 2.5,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.3,
          )}, ${alpha(theme.palette.secondary.main, 0.12)})`,
          borderBottom: "1px solid",
          borderColor: alpha("#f4f7f3", 0.08),
        })}
      >
        <Typography
          aria-hidden
          sx={{
            position: "absolute",
            right: 0,
            bottom: -16,
            fontSize: "4.25rem",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            textTransform: "uppercase",
            color: alpha("#f4f7f3", 0.08),
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {vehicle.class}
        </Typography>
        <Typography
          variant="overline"
          sx={{
            position: "relative",
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "primary.main",
          }}
        >
          {vehicle.class}
        </Typography>
      </Box>

      <Stack spacing={2} sx={{ p: 2.5, flex: 1 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Typography variant="h6" component="h2" sx={{ minWidth: 0 }}>
            {vehicle.title}
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="primary"
            sx={{ whiteSpace: "nowrap", flexShrink: 0, lineHeight: 1.3 }}
          >
            {vehicle.priceLabel}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ color: "text.secondary" }}>
          <SpecItem label="Transmission" value={vehicle.transmission} />
          <SpecItem label="Seats" value={`${vehicle.seats}`} />
        </Stack>

        {actions ? <Box sx={{ mt: "auto", pt: 0.5 }}>{actions}</Box> : null}
      </Stack>
    </Box>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "text.secondary",
          opacity: 0.7,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "text.primary",
          textTransform: "capitalize",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
