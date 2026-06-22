import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SignIn } from "@clerk/nextjs";

type SignInPageSearchParams = {
  redirectUrl?: string;
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SignInPageSearchParams>;
}) {
  const { redirectUrl } = await searchParams;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Stack spacing={1} sx={{ textAlign: "center", maxWidth: 640 }}>
          <Typography variant="overline" color="primary.main">
            HandOff
          </Typography>
          <Typography variant="h3" component="h1">
            Sign in to continue your rental journey.
          </Typography>
          <Typography color="text.secondary">
            Access vehicles, reservations, payments, and post-booking workflows
            from one account.
          </Typography>
        </Stack>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={redirectUrl ?? "/vehicles"}
        />
      </Stack>
    </Container>
  );
}
