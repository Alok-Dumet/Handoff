import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { BrandConfig } from "../brands";

const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Vehicles", href: "/vehicles" },
  { label: "Reservations", href: "/reservations" },
  { label: "Rental", href: "/rental" },
  { label: "Account", href: "/account" },
];

const journeyNav = [
  { label: "Pre-check-in", href: "/journeys/pre-check-in" },
  { label: "Receipt", href: "/journeys/e-receipt" },
  { label: "Upgrades", href: "/journeys/vehicle-upgrade" },
];

export default function AppShell({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar
          component={Container}
          maxWidth="lg"
          disableGutters
          sx={{ gap: 2, px: { xs: 2, sm: 3 } }}
        >
          <Box sx={{ minWidth: { xs: "auto", md: 180 } }}>
            <Typography variant="h6" component="p">
              {brand.shortName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rental operations
            </Typography>
          </Box>
          <Stack
            component="nav"
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{ flex: 1, flexWrap: "wrap" }}
          >
            {primaryNav.map((item) => (
              <Button key={item.href} href={item.href} size="small">
                {item.label}
              </Button>
            ))}
            {journeyNav.map((item) => (
              <Button key={item.href} href={item.href} size="small" color="secondary">
                {item.label}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button href="/sign-in" size="small" variant="outlined">
              Sign in
            </Button>
            <Button href="/sign-up" size="small" variant="contained">
              Register
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </Box>
  );
}
