import { SignedIn, SignedOut } from "@clerk/nextjs";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { BrandConfig } from "../brands";

const publicNav = [
  { label: "Home", href: "/" },
];

const authenticatedNav = [
  { label: "Vehicles", href: "/vehicles" },
  { label: "Reservations", href: "/reservations" },
  { label: "Rental", href: "/rental" },
  { label: "Account", href: "/account" },
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
            {publicNav.map((item) => (
              <Button key={item.href} href={item.href} size="small">
                {item.label}
              </Button>
            ))}
            <SignedIn>
              {authenticatedNav.map((item) => (
                <Button key={item.href} href={item.href} size="small">
                  {item.label}
                </Button>
              ))}
            </SignedIn>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SignedOut>
              <Button href="/sign-in" size="small" variant="outlined">
                Sign in
              </Button>
              <Button href="/sign-up" size="small" variant="contained">
                Register
              </Button>
            </SignedOut>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </Box>
  );
}
