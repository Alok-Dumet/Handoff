"use client";

import { useMemo, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import type { BrandConfig } from "../brands";
import { createAppTheme } from "../theme";

export default function BrandThemeScope({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  const theme = useMemo(() => createAppTheme(brand.theme), [brand.theme]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
