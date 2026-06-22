import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { getClerkRequestContext } from "../lib/server-auth";

export default async function Home() {
  const authContext = await getClerkRequestContext();
  const getStartedHref = authContext
    ? "/vehicles"
    : "/sign-up?redirectUrl=%2Fvehicles";

  return (
    <Box sx={{ minHeight: "calc(100dvh - 78px)", overflowX: "hidden" }}>
      <Container
        maxWidth="xl"
        sx={{
          minHeight: "calc(100dvh - 78px)",
          display: "grid",
          gridTemplateRows: "auto auto",
          alignContent: "center",
          py: { xs: 5, md: 7 },
        }}
      >
        <Stack
          spacing={3}
          sx={{
            maxWidth: 980,
            mx: "auto",
            textAlign: "center",
            animation: "handoff-rise 560ms ease both",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: {
                xs: "clamp(3rem, 16vw, 4.45rem)",
                md: "clamp(5.25rem, 8vw, 8.25rem)",
              },
            }}
          >
            The rental journey, handed off cleanly.
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: 720,
              mx: "auto",
              lineHeight: 1.45,
              textWrap: "balance",
            }}
          >
            HandOff manages vehicle search, booking, payment authorization,
            pre-check-in, receipts, and upgrade offers in one polished flow.
          </Typography>
          <Button
            href={getStartedHref}
            variant="contained"
            size="large"
            sx={{ alignSelf: "center", px: 4, py: 1.35 }}
        >
          Get started
        </Button>
      </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" },
            gridAutoRows: { xs: "auto", sm: 140 },
            gap: { xs: 1.5, sm: 2 },
            maxWidth: 1120,
            width: "100%",
            mx: "auto",
          }}
        >
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 260, sm: 480 },
              gridColumn: "1 / -1",
              overflow: "hidden",
              borderRadius: { xs: 5, md: 7 },
              boxShadow: "0 28px 90px rgba(0,0,0,0.34)",
            }}
          >
            <Image
              src="/car3.png"
              alt="HandOff rental vehicle"
              fill
              priority
              sizes="(max-width: 600px) 100vw, 1120px"
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
