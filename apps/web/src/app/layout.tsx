import type { Metadata } from "next";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { getBrandConfig } from "../brands";
import AppShell from "../components/AppShell";
import Providers from "../providers";

const brand = getBrandConfig(process.env.BRAND);

export const metadata: Metadata = {
  title: brand.metadata.title,
  description: brand.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers brand={brand}>
            <AppShell brand={brand}>{children}</AppShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
