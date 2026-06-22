import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SignUp } from "@clerk/nextjs";

type SignUpPageSearchParams = {
  redirectUrl?: string;
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SignUpPageSearchParams>;
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
            Create an account to start your journey.
          </Typography>
        </Stack>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl={redirectUrl ?? "/vehicles"}
        />
      </Stack>
    </Container>
  );
}
