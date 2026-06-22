"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import type { AuthSession, CustomerProfile } from "@handoff/contracts";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function AccountClient({
  bffSession,
  customerProfile,
}: {
  bffSession: AuthSession;
  customerProfile: CustomerProfile;
}) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Skeleton height={48} width={180} />
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Skeleton variant="circular" width={64} height={64} />
              <Skeleton height={32} width="60%" />
              <Skeleton height={24} width="80%" />
              <Skeleton height={40} width={220} />
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  if (!isSignedIn) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Account
          </Typography>
          <Alert severity="info">
            Sign in to manage your rental profile, reservations, and post-booking
            journey.
          </Alert>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Customer profile</Typography>
              <Typography color="text.secondary">
                Your account connects reservation details, rental status, and
                journey actions across HandOff.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button href="/sign-in" variant="contained">
                  Sign in
                </Button>
                <Button href="/sign-up" variant="outlined">
                  Register
                </Button>
                <Button href="/reservations" variant="outlined">
                  View reservations
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  const emailAddress =
    user.primaryEmailAddress?.emailAddress ??
    bffSession.email ??
    customerProfile.email;
  const displayName =
    user.fullName ?? user.username ?? bffSession.displayName ?? emailAddress;
  const phoneNumber = user.primaryPhoneNumber?.phoneNumber ?? "No phone on file";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Account
        </Typography>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
            >
              <Avatar
                alt={displayName}
                src={user.imageUrl}
                sx={{ height: 72, width: 72 }}
              />
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6">{displayName}</Typography>
                <Typography color="text.secondary">{emailAddress}</Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={bffSession.provider === "clerk" ? "Clerk verified" : "Clerk pending"}
                    color={bffSession.provider === "clerk" ? "success" : "default"}
                    size="small"
                  />
                  <Chip label={`${customerProfile.loyaltyTier} loyalty`} size="small" />
                </Stack>
              </Stack>
              <UserButton />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1">Contact details</Typography>
              <Typography color="text.secondary">Email: {emailAddress}</Typography>
              <Typography color="text.secondary">Phone: {phoneNumber}</Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle1">Rental account</Typography>
              <Typography color="text.secondary">
                BFF customer id: {customerProfile.id}
              </Typography>
              <Typography color="text.secondary">Platform: HandOff</Typography>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Button href="/reservations" variant="outlined">
                View reservations
              </Button>
              <Button href="/rental" variant="outlined">
                Current rental
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
