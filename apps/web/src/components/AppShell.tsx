import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { getClerkRequestContext } from "../lib/server-auth";

const authenticatedNav = [
  { label: "Vehicles", href: "/vehicles" },
  { label: "Reservations", href: "/reservations" },
  { label: "Rental", href: "/rental" },
  { label: "Account", href: "/account" },
];

export default async function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const authContext = await getClerkRequestContext();
  const isSignedIn = Boolean(authContext);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(18px)",
          bgcolor: "rgba(9, 13, 18, 0.78)",
        }}
      >
        <Toolbar
          component={Container}
          maxWidth="xl"
          disableGutters
          sx={{
            minHeight: { xs: 72, md: 78 },
            gap: { xs: 1.5, md: 3 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            component="a"
            href={isSignedIn ? "/vehicles" : "/"}
            aria-label={isSignedIn ? "HandOff vehicles" : "HandOff home"}
            sx={{
              minWidth: { xs: "auto", md: 190 },
              color: "text.primary",
              textDecoration: "none",
              transition: "transform 180ms ease, color 180ms ease",
              "&:hover": {
                color: "primary.main",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Typography
              variant="h6"
              component="p"
              sx={{
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: "-0.06em",
                fontSize: { xs: "1.35rem", md: "1.6rem" },
              }}
            >
              HandOff
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Rental operations
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />
          <Stack
            component="nav"
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{
              flex: 1,
              flexWrap: "wrap",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {isSignedIn
              ? authenticatedNav.map((item) => (
                  <Button
                    key={item.href}
                    href={item.href}
                    size="small"
                    color="inherit"
                  >
                    {item.label}
                  </Button>
                ))
              : null}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {!isSignedIn ? (
              <>
                <Button href="/sign-in" size="small" variant="outlined">
                  Sign in
                </Button>
                <Button href="/sign-up" size="small" variant="contained">
                  Register
                </Button>
              </>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </Box>
  );
}
