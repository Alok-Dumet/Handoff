"use client";
import { useMemo, useState, type ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { BrandConfig } from "./brands";
import { createAppTheme } from "./theme";

// Client-side providers. TanStack Query is wired here for future interactive
// (client) components — initial server reads stay in Server Components.
// The QueryClient is created in state so it's stable across re-renders and
// not shared between requests on the server.
export default function Providers({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  const theme = useMemo(() => createAppTheme(brand.theme), [brand.theme]);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
