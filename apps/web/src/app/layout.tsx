import type { Metadata } from "next";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import AppShell from "../components/AppShell";
import Providers from "../providers";

export const metadata: Metadata = {
  title: "HandOff",
  description:
    "Car rental platform for vehicle search, booking, and post-confirmation customer journeys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AppRouterCacheProvider>
            <Providers>
              <AppShell>{children}</AppShell>
            </Providers>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
